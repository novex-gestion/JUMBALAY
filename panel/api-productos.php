<?php
declare(strict_types=1);
// Endpoint público: la web pide acá los productos que tiene que mostrar.
// Fuente única: data/productos.json (el mismo archivo que usa el checkout
// para cobrar y que edita el panel). Así el precio que se ve = el que se cobra.
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=30');

$archivo = __DIR__ . '/data/productos.json';
if (!is_file($archivo)) {
  http_response_code(503);
  echo json_encode(['ok' => false, 'error' => 'catalogo']);
  exit;
}
$data = json_decode((string)file_get_contents($archivo), true);
$salida = [];
foreach (($data['productos'] ?? []) as $p) {
  if (empty($p['visible'])) continue;           // oculto desde el panel
  // Todas las fotos del producto (las viejas traían una sola).
  $fotos = [];
  foreach (($p['images'] ?? []) as $x) { $x = trim((string)$x); if ($x !== '') $fotos[] = $x; }
  if (!$fotos && !empty($p['image'])) $fotos[] = (string)$p['image'];
  $salida[] = [
    'id'             => (string)($p['id'] ?? ''),
    'name'           => (string)($p['name'] ?? ''),
    'description'    => (string)($p['description'] ?? ''),
    'price'          => (int)($p['price'] ?? 0),
    'referencePrice' => (int)($p['referencePrice'] ?? 0),
    'stock'          => (int)($p['stock'] ?? 0),
    'image'          => (string)($p['image'] ?? ''),
    'images'         => $fotos,
  ];
}
usort($salida, fn($a, $b) => 0);                 // ya viene ordenado del panel
echo json_encode([
  'ok' => true,
  'actualizado' => $data['actualizado'] ?? null,
  'productos' => $salida,
], JSON_UNESCAPED_UNICODE);
