<?php
declare(strict_types=1);
// Merchant Center scheduled-fetch source. Read only from the same catalog as checkout.
header('Content-Type: text/tab-separated-values; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Content-Disposition: inline; filename="casa-natural-productos.tsv"');

$file = __DIR__ . '/data/productos.json';
$data = is_file($file) ? json_decode((string)file_get_contents($file), true) : null;
if (!is_array($data) || !is_array($data['productos'] ?? null)) {
  http_response_code(503);
  exit('Catalog unavailable');
}

// A catalog item is eligible only if its public landing page already exists.
$pages = array_fill_keys([
  'aceitunas-verdes-magna', 'aceitunas-negras-premium',
  'tomates-secos-mediterraneos', 'tomates-secos-patagonicos',
  'berenjenas-condimentadas', 'untable-fruta-frutos-bosque',
  'pepinitos-en-vinagre', 'pimientos-agridulces',
  'pasta-de-aceitunas-verdes', 'pasta-de-aceitunas-negras',
  'zanahorias-encurtidas-agridulces', 'tomates-triturados',
], true);

function cell(string $value): string {
  return trim((string)preg_replace('/[\t\r\n]+/u', ' ', $value));
}
function imageUrl(string $image): ?string {
  if (str_starts_with($image, '/uploads/') && preg_match('~^/uploads/[a-zA-Z0-9._-]+$~', $image)) {
    return 'https://panel.tucasaesnatural.com' . $image;
  }
  if (preg_match('~^assets/[a-zA-Z0-9._-]+$~', $image)) {
    return 'https://tucasaesnatural.com/' . $image;
  }
  return null;
}

$out = fopen('php://output', 'wb');
fputcsv($out, ['id', 'title', 'description', 'link', 'image_link', 'availability', 'price', 'condition', 'brand'], "\t");
foreach ($data['productos'] as $p) {
  if (!is_array($p) || empty($p['visible'])) continue;
  $id = (string)($p['id'] ?? '');
  $price = (int)($p['price'] ?? 0);
  $stock = (int)($p['stock'] ?? 0);
  $name = cell((string)($p['name'] ?? ''));
  $description = cell((string)($p['description'] ?? ''));
  $image = imageUrl((string)($p['image'] ?? ''));
  if (!isset($pages[$id]) || !$name || !$description || !$image || $price <= 0 || $stock < 0) continue;
  if ($id === 'pepinitos-en-vinagre' && $price === 10500) {
    $name = 'Pepinitos en vinagre Jumbalay 2x1 (2 frascos)';
    $description = 'Promoción de 2 frascos por $10.500. ' . $description;
    $stock = intdiv($stock, 2);
  } elseif ($id === 'aceitunas-verdes-magna') {
    $name = 'Aceitunas verdes Magna Jumbalay descarozadas 360 g';
  }
  fputcsv($out, [
    $id, $name, $description,
    'https://tucasaesnatural.com/productos/' . $id . '/',
    $image, $stock > 0 ? 'in_stock' : 'out_of_stock',
    $price . ' ARS', 'new', 'Jumbalay',
  ], "\t");
}
fclose($out);
