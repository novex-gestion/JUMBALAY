<?php
declare(strict_types=1);
// Núcleo del panel: leer y guardar el catálogo con seguridad.
const ARCHIVO   = __DIR__ . '/../api/data/productos.json';
const CLAVES    = __DIR__ . '/../api/data/panel.json';
const SUBIDAS   = __DIR__ . '/../uploads';
const URL_SUBIDAS = '/uploads/';

function catalogo(): array {
  if (!is_file(ARCHIVO)) return ['actualizado' => null, 'productos' => []];
  $d = json_decode((string)file_get_contents(ARCHIVO), true);
  return is_array($d) ? $d : ['actualizado' => null, 'productos' => []];
}

// Escritura atómica + copia de respaldo: si algo falla, el catálogo no se corrompe.
function guardar(array $data): bool {
  $data['actualizado'] = date('c');
  if (is_file(ARCHIVO)) @copy(ARCHIVO, ARCHIVO . '.bak');
  $tmp = ARCHIVO . '.tmp';
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) return false;
  if (file_put_contents($tmp, $json, LOCK_EX) === false) return false;
  return rename($tmp, ARCHIVO);
}

// Lee, modifica y guarda el catálogo bajo un mismo bloqueo. Evita que dos
// pedidos descuenten la misma orden o que una edición pise un descuento nuevo.
function actualizarCatalogo(callable $modificar): bool {
  $lock = fopen(ARCHIVO . '.lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX)) { if ($lock) fclose($lock); return false; }
  $actual = catalogo();
  $nuevo = $modificar($actual);
  $ok = is_array($nuevo) && guardar($nuevo);
  flock($lock, LOCK_UN);
  fclose($lock);
  return $ok;
}

function claves(): array {
  if (!is_file(CLAVES)) return [];
  $d = json_decode((string)file_get_contents(CLAVES), true);
  return is_array($d) ? $d : [];
}

function guardarClaves(array $c): bool {
  return file_put_contents(CLAVES, json_encode($c, JSON_PRETTY_PRINT), LOCK_EX) !== false;
}

function slug(string $t): string {
  $t = strtolower(trim($t));
  $t = strtr($t, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ñ'=>'n','ü'=>'u']);
  $t = preg_replace('/[^a-z0-9]+/', '-', $t) ?? '';
  return trim($t, '-') ?: ('producto-' . substr(bin2hex(random_bytes(3)), 0, 6));
}

function pesos(int $n): string { return '$' . number_format($n, 0, ',', '.'); }

// Subida de fotos y videos: solo archivos reales, renombrados, con tope de tamaño.
function subirFoto(array $archivo): ?string {
  if (($archivo["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) return null;
  $tmp = $archivo["tmp_name"] ?? "";
  if (!is_uploaded_file($tmp)) return null;
  $peso = (int)($archivo["size"] ?? 0);

  // ¿Es una imagen?
  $info = @getimagesize($tmp);
  if ($info !== false) {
    if ($peso > 6 * 1024 * 1024) return null;                       // 6 MB
    $ext = ["image/jpeg"=>"jpg", "image/png"=>"png", "image/webp"=>"webp"][$info["mime"]] ?? null;
    if ($ext === null) return null;
    return guardarSubida($tmp, "p", $ext);
  }

  // ¿Es un video?
  if ($peso > 30 * 1024 * 1024) return null;                        // 30 MB
  $mime = "";
  if (function_exists("finfo_open")) {
    $fi = finfo_open(FILEINFO_MIME_TYPE);
    $mime = (string)finfo_file($fi, $tmp);
    finfo_close($fi);
  }
  $ext = ["video/mp4"=>"mp4", "video/quicktime"=>"mp4", "video/webm"=>"webm"][$mime] ?? null;
  if ($ext === null) return null;
  return guardarSubida($tmp, "v", $ext);
}

function guardarSubida(string $tmp, string $prefijo, string $ext): ?string {
  if (!is_dir(SUBIDAS)) @mkdir(SUBIDAS, 0755, true);
  $nombre = $prefijo . "-" . date("Ymd") . "-" . bin2hex(random_bytes(4)) . "." . $ext;
  if (!move_uploaded_file($tmp, SUBIDAS . "/" . $nombre)) return null;
  return URL_SUBIDAS . $nombre;
}

// ¿Este archivo es un video?
function esVideo(string $url): bool {
  return (bool)preg_match("/\.(mp4|webm)$/i", $url);
}

// Los precios se escriben con puntos de miles ("8.974"): acá se limpian.
function plata($v): int {
  return max(0, (int)preg_replace('/\D/', '', (string)$v));
}
// Y así se muestran de vuelta en el panel.
function miles(int $n): string {
  return $n ? number_format($n, 0, ',', '.') : '';
}

// ===== Varias fotos por producto =====
// Normaliza el $_FILES de un <input multiple> y sube todas las que sean válidas.
function subirVarias(array $campo, int $tope = 6): array {
  $urls = [];
  if (!isset($campo['name'])) return $urls;
  $nombres = is_array($campo['name']) ? $campo['name'] : [$campo['name']];
  $cantidad = count($nombres);
  for ($i = 0; $i < $cantidad && count($urls) < $tope; $i++) {
    $archivo = [
      'name'     => is_array($campo['name'])     ? $campo['name'][$i]     : $campo['name'],
      'type'     => is_array($campo['type'])     ? $campo['type'][$i]     : $campo['type'],
      'tmp_name' => is_array($campo['tmp_name']) ? $campo['tmp_name'][$i] : $campo['tmp_name'],
      'error'    => is_array($campo['error'])    ? $campo['error'][$i]    : $campo['error'],
      'size'     => is_array($campo['size'])     ? $campo['size'][$i]     : $campo['size'],
    ];
    $url = subirFoto($archivo);
    if ($url) $urls[] = $url;
  }
  return $urls;
}

// Toda ficha tiene su lista de fotos; las viejas traían una sola en 'image'.
function fotosDe(array $p): array {
  $fotos = [];
  foreach (($p['images'] ?? []) as $f) { $f = trim((string)$f); if ($f !== '') $fotos[] = $f; }
  if (!$fotos && !empty($p['image'])) $fotos[] = (string)$p['image'];
  return array_values(array_unique($fotos));
}

// La primera foto es la portada: 'image' siempre la acompaña (compatibilidad).
function conFotos(array $p, array $fotos): array {
  $fotos = array_values(array_filter(array_unique($fotos)));
  $p['images'] = $fotos;
  $p['image'] = $fotos[0] ?? '';
  return $p;
}
