<?php
declare(strict_types=1);
// Actualizador del panel: baja la última versión publicada en el repo de NOVEX
// y la instala. Evita depender del FTP de Hostinger (que se bloquea seguido).
//
// Seguridad: solo con sesión de admin iniciada, solo descarga del repo fijo de
// abajo, y solo escribe los archivos de la lista blanca. Nada de rutas libres.
session_start();
require __DIR__ . '/lib.php';

if (!($_SESSION['ok'] ?? false)) { header('Location: index.php'); exit; }
if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_POST['csrf'] ?? ''))) {
  header('Location: index.php'); exit;
}

const ORIGEN = 'https://raw.githubusercontent.com/novex-gestion/JUMBALAY/main/panel/';
const ARCHIVOS = [                    // archivo en el repo => dónde se instala
  'admin-index.php'   => __DIR__ . '/index.php',
  'admin-lib.php'     => __DIR__ . '/lib.php',
  'admin-actualizar.php' => __DIR__ . '/actualizar.php',
  'api-productos.php' => __DIR__ . '/../api/productos.php',
  'raiz-index.php'    => __DIR__ . '/../index.php',
];

function bajar(string $url): ?string {
  if (function_exists('curl_init')) {
    $c = curl_init($url);
    curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_FOLLOWLOCATION => true]);
    $r = curl_exec($c);
    $estado = curl_getinfo($c, CURLINFO_HTTP_CODE);
    curl_close($c);
    return ($estado === 200 && is_string($r) && $r !== '') ? $r : null;
  }
  $r = @file_get_contents($url);
  return is_string($r) && $r !== '' ? $r : null;
}

$hechos = []; $fallos = [];
foreach (ARCHIVOS as $remoto => $destino) {
  $contenido = bajar(ORIGEN . $remoto . '?v=' . time());
  // Un PHP que no empieza con <?php es una descarga rota: no se instala.
  if ($contenido === null || strpos($contenido, '<' . '?php') !== 0) { $fallos[] = $remoto; continue; }
  $carpeta = dirname($destino);
  if (!is_dir($carpeta)) { $fallos[] = $remoto; continue; }
  if (is_file($destino)) @copy($destino, $destino . '.bak');   // respaldo por las dudas
  $tmp = $destino . '.tmp';
  if (file_put_contents($tmp, $contenido, LOCK_EX) === false || !rename($tmp, $destino)) {
    $fallos[] = $remoto; @unlink($tmp); continue;
  }
  $hechos[] = basename($destino);
}

$_SESSION['aviso_actualizacion'] = $fallos
  ? ('Se actualizaron ' . count($hechos) . ' archivos. No se pudieron: ' . implode(', ', $fallos))
  : ('Panel actualizado (' . count($hechos) . ' archivos). Ya tenés la última versión.');
header('Location: index.php');
exit;
