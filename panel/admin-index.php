<?php
declare(strict_types=1);
session_start();
require __DIR__ . '/lib.php';

$claves = claves();
$aviso = ''; $error = '';

// ===== LOGIN =====
if (isset($_GET['salir'])) { session_destroy(); header('Location: index.php'); exit; }

if (!($_SESSION['ok'] ?? false)) {
  if (($_POST['accion'] ?? '') === 'entrar') {
    usleep(400000);                                   // freno anti fuerza bruta
    $hash = $claves['hash'] ?? '';
    if ($hash && password_verify((string)($_POST['clave'] ?? ''), $hash)) {
      session_regenerate_id(true);
      $_SESSION['ok'] = true;
      $_SESSION['csrf'] = bin2hex(random_bytes(16));
      header('Location: index.php'); exit;
    }
    $error = 'Contraseña incorrecta.';
  }
  ?><!doctype html>
  <html lang="es-AR"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Casa Natural · Panel</title>
  <style>
    :root{--ink:#21332b;--cream:#f7f1e7;--paper:#fffdf8;--wine:#742e2a;--line:#ded2bf;}
    *{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;
      background:var(--cream);color:var(--ink);font-family:Georgia,"Times New Roman",serif;padding:20px}
    .caja{width:min(400px,100%);padding:36px 28px;background:var(--paper);border:1px solid var(--line)}
    h1{margin:0 0 4px;font-size:2rem;font-weight:400;letter-spacing:-.03em}
    p.sub{margin:0 0 26px;color:var(--wine);font:700 .7rem Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}
    label{display:block;margin-bottom:8px;font:700 .72rem Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase}
    input{width:100%;padding:14px;border:1px solid var(--line);background:#fff;font:1rem Georgia,serif}
    button{width:100%;margin-top:16px;padding:15px;border:1px solid var(--ink);background:var(--ink);
      color:#fff;font:700 .78rem Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
    button:hover{background:var(--wine);border-color:var(--wine)}
    .err{margin:14px 0 0;padding:10px 12px;background:#f7e4e2;border-left:3px solid var(--wine);
      color:var(--wine);font:.85rem Arial,sans-serif}
  </style></head><body>
    <form class="caja" method="post">
      <h1>Casa Natural</h1>
      <p class="sub">Panel de productos</p>
      <input type="hidden" name="accion" value="entrar">
      <label for="c">Contraseña</label>
      <input id="c" name="clave" type="password" autofocus autocomplete="current-password">
      <?php if ($error): ?><p class="err"><?= htmlspecialchars($error) ?></p><?php endif; ?>
      <button type="submit">Entrar</button>
    </form>
  </body></html><?php
  exit;
}

// ===== YA ADENTRO =====
$csrf = $_SESSION['csrf'] ?? '';
if (!empty($_SESSION['aviso_actualizacion'])) { $aviso = (string)$_SESSION['aviso_actualizacion']; unset($_SESSION['aviso_actualizacion']); }
$data = catalogo();
$productos = $data['productos'] ?? [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!hash_equals($csrf, (string)($_POST['csrf'] ?? ''))) {
    $error = 'Sesión vencida, volvé a intentar.';
  } else {
    $accion = $_POST['accion'] ?? '';

    // --- Guardar la grilla: precio, precio tachado, stock y visible ---
    if ($accion === 'guardar') {
      foreach ($productos as $i => $p) {
        $id = (string)$p['id'];
        if (isset($_POST['precio'][$id]))  $productos[$i]['price']          = plata($_POST['precio'][$id]);
        if (isset($_POST['tachado'][$id])) $productos[$i]['referencePrice'] = plata($_POST['tachado'][$id]);
        if (isset($_POST['stock'][$id]))   $productos[$i]['stock']          = max(0, (int)$_POST['stock'][$id]);
        $productos[$i]['visible'] = isset($_POST['visible'][$id]);
      }
      $data['productos'] = $productos;
      if (guardar($data)) { $aviso = 'Cambios guardados. Ya se ven en la web.'; }
      else { $error = 'No se pudo guardar.'; }
    }

    // --- Editar textos y foto de un producto ---
    if ($accion === 'editar') {
      $id = (string)($_POST['id'] ?? '');
      foreach ($productos as $i => $p) {
        if ((string)$p['id'] !== $id) continue;
        $productos[$i]['name']        = trim((string)($_POST['name'] ?? $p['name']));
        $productos[$i]['description'] = trim((string)($_POST['description'] ?? $p['description']));
        $fotos = fotosDe($productos[$i]);
        $nuevas = subirVarias($_FILES['fotos'] ?? [], max(0, 6 - count($fotos)));
        if ($nuevas) { $productos[$i] = conFotos($productos[$i], array_merge($fotos, $nuevas)); }
        elseif (!empty($_FILES['fotos']['name'][0])) { $error = 'Las fotos no se pudieron subir. Tienen que ser JPG, PNG o WEBP y pesar menos de 6 MB cada una.'; }
      }
      if (!$error) {
        $data['productos'] = $productos;
        if (guardar($data)) { $aviso = 'Producto actualizado.'; }
        else { $error = 'No se pudo guardar.'; }
      }
    }

    // --- Producto nuevo ---
    if ($accion === 'nuevo') {
      $nombre = trim((string)($_POST['name'] ?? ''));
      if ($nombre === '') {
        $error = 'Poné un nombre.';
      } else {
        $id = slug($nombre);
        foreach ($productos as $p) { if ((string)$p['id'] === $id) { $id .= '-' . substr(bin2hex(random_bytes(2)), 0, 4); } }
        $nuevas = subirVarias($_FILES['fotos'] ?? []);
        $productos[] = [
          'id' => $id,
          'name' => $nombre,
          'description' => trim((string)($_POST['description'] ?? '')),
          'price' => plata($_POST['price'] ?? 0),
          'referencePrice' => plata($_POST['referencePrice'] ?? 0),
          'stock' => max(0, (int)($_POST['stock'] ?? 0)),
          'images' => $nuevas ?: ['assets/portada-casa-natural.png'],
          'image' => $nuevas[0] ?? 'assets/portada-casa-natural.png',
          'visible' => true,
          'orden' => count($productos) + 1,
        ];
        $data['productos'] = $productos;
        if (guardar($data)) { $aviso = 'Producto agregado.'; }
        else { $error = 'No se pudo guardar.'; }
      }
    }

    // --- Borrar una foto del producto ---
    if ($accion === 'foto_borrar') {
      $id = (string)($_POST['id'] ?? ''); $pos = (int)($_POST['pos'] ?? -1);
      foreach ($productos as $i => $p) {
        if ((string)$p['id'] !== $id) continue;
        $fotos = fotosDe($p);
        if (isset($fotos[$pos])) { unset($fotos[$pos]); $productos[$i] = conFotos($p, $fotos); }
      }
      $data['productos'] = $productos;
      if (guardar($data)) { $aviso = 'Foto quitada.'; } else { $error = 'No se pudo guardar.'; }
    }

    // --- Mover una foto un lugar (ordenar) ---
    if ($accion === 'foto_mover') {
      $id = (string)($_POST['id'] ?? ''); $pos = (int)($_POST['pos'] ?? -1); $dir = (int)($_POST['dir'] ?? 0);
      foreach ($productos as $i => $p) {
        if ((string)$p['id'] !== $id) continue;
        $fotos = fotosDe($p); $destino = $pos + $dir;
        if (isset($fotos[$pos]) && isset($fotos[$destino])) {
          $tmp = $fotos[$pos]; $fotos[$pos] = $fotos[$destino]; $fotos[$destino] = $tmp;
          $productos[$i] = conFotos($p, $fotos);
        }
      }
      $data['productos'] = $productos;
      if (guardar($data)) { $aviso = 'Orden actualizado.'; } else { $error = 'No se pudo guardar.'; }
    }

    // --- Poner una foto como portada (la primera) ---
    if ($accion === 'foto_portada') {
      $id = (string)($_POST['id'] ?? ''); $pos = (int)($_POST['pos'] ?? -1);
      foreach ($productos as $i => $p) {
        if ((string)$p['id'] !== $id) continue;
        $fotos = fotosDe($p);
        if (isset($fotos[$pos])) {
          $elegida = $fotos[$pos]; unset($fotos[$pos]);
          $productos[$i] = conFotos($p, array_merge([$elegida], $fotos));
        }
      }
      $data['productos'] = $productos;
      if (guardar($data)) { $aviso = 'Portada cambiada.'; } else { $error = 'No se pudo guardar.'; }
    }

    // --- Borrar ---
    if ($accion === 'borrar') {
      $id = (string)($_POST['id'] ?? '');
      $data['productos'] = array_values(array_filter($productos, fn($p) => (string)$p['id'] !== $id));
      if (guardar($data)) { $aviso = 'Producto borrado.'; }
      else { $error = 'No se pudo borrar.'; }
    }

    // --- Cambiar la contraseña del panel ---
    if ($accion === 'clave') {
      $nueva = (string)($_POST['nueva'] ?? '');
      if (strlen($nueva) < 6) {
        $error = 'La contraseña tiene que tener al menos 6 caracteres.';
      } else {
        $claves['hash'] = password_hash($nueva, PASSWORD_DEFAULT);
        if (guardarClaves($claves)) { $aviso = 'Contraseña cambiada.'; }
        else { $error = 'No se pudo cambiar.'; }
      }
    }
  }
  $data = catalogo();
  $productos = $data['productos'] ?? [];
}

$editando = null;
if (isset($_GET['editar'])) {
  foreach ($productos as $p) { if ((string)$p['id'] === $_GET['editar']) { $editando = $p; } }
}

function imgSrc(string $img): string {
  if (str_starts_with($img, 'http') || str_starts_with($img, '/')) return $img;
  return 'https://tucasaesnatural.com/' . $img;   // las fotos originales viven en la web
}
function e(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

$visibles = count(array_filter($productos, fn($p) => !empty($p['visible'])));
$agotados = count(array_filter($productos, fn($p) => (int)($p['stock'] ?? 0) <= 0));
?><!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Casa Natural · Panel de productos</title>
<style>
  :root{--ink:#21332b;--cream:#f7f1e7;--paper:#fffdf8;--olive:#65734a;--wine:#742e2a;--sand:#e8dbc5;--line:#ded2bf;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--cream);color:var(--ink);font-family:Georgia,"Times New Roman",serif;line-height:1.5}
  .wrap{width:min(1080px,calc(100% - 28px));margin:auto}
  header.top{background:var(--ink);color:#f8f4ea;padding:16px 0}
  header.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
  .marca{font-size:1.5rem;letter-spacing:-.04em}
  .salir{color:#f8f4ea;font:700 .7rem Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;
    border:1px solid rgba(255,255,255,.5);padding:8px 14px}
  .salir:hover{background:var(--wine);border-color:var(--wine)}
  h1{margin:28px 0 4px;font-weight:400;font-size:2.2rem;letter-spacing:-.04em}
  .sub{margin:0 0 22px;color:var(--wine);font:700 .7rem Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}
  .msg{margin:0 0 18px;padding:12px 14px;font:.9rem Arial,sans-serif;border-left:3px solid var(--olive);background:#eef0e5}
  .msg.err{border-color:var(--wine);background:#f7e4e2;color:var(--wine)}
  .grid{display:grid;gap:12px}
  .prod{display:grid;grid-template-columns:76px 1fr;gap:14px;padding:14px;background:var(--paper);border:1px solid var(--line)}
  .prod.oculto{opacity:.55;background:#f2ece1}
  .prod img{width:76px;height:76px;object-fit:contain;background:#fff;border:1px solid var(--line)}
  .mini{position:relative;display:block;width:76px}
  .mini b{position:absolute;right:-6px;bottom:-6px;min-width:20px;height:20px;display:grid;place-items:center;
    border-radius:50%;background:var(--wine);color:#fff;font:700 .62rem Arial,sans-serif}
  .galeria{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px}
  .gfoto{position:relative;margin:0;padding:8px;background:#fff;border:1px solid var(--line)}
  .gfoto img{display:block;width:100%;aspect-ratio:1/1;object-fit:contain}
  .gfoto .tag{position:absolute;top:6px;left:6px;padding:3px 7px;background:var(--olive);color:#fff;
    font:700 .58rem Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase}
  .gacc{position:absolute;top:6px;right:6px;display:flex;gap:4px}
  .gacc form{margin:0}
  .gacc button{width:26px;height:26px;display:grid;place-items:center;padding:0;border:1px solid var(--line);
    background:rgba(255,255,255,.94);color:var(--ink);font:1rem Georgia,serif;cursor:pointer;line-height:1}
  .gacc button:hover{background:var(--olive);color:#fff;border-color:var(--olive)}
  .gacc button.del:hover{background:var(--wine);border-color:var(--wine)}
  .gorden{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px}
  .gorden form{margin:0}
  .gorden span{min-width:20px;text-align:center;color:#6d655b;font:700 .7rem Arial,sans-serif}
  .gorden button{width:30px;height:26px;display:grid;place-items:center;padding:0;border:1px solid var(--line);
    background:#fff;color:var(--ink);font:1rem Georgia,serif;line-height:1;cursor:pointer}
  .gorden button:hover:not(:disabled){background:var(--olive);color:#fff;border-color:var(--olive)}
  .gorden button:disabled{opacity:.3;cursor:not-allowed}
  .prod h3{margin:0 0 2px;font-size:1.15rem;font-weight:400}
  .prod .desc{margin:0 0 10px;color:#6d655b;font:.8rem Arial,sans-serif}
  .campos{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
  .campo{display:flex;flex-direction:column;gap:4px}
  .campo span{font:700 .62rem Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6d655b}
  .campo input[type=number]{width:104px;padding:9px;border:1px solid var(--line);background:#fff;font:1rem Georgia,serif}
  .money{display:flex;align-items:center;border:1px solid var(--line);background:#fff}
  .money i{padding:0 2px 0 9px;font-style:normal;color:#6d655b;font:1rem Georgia,serif}
  .money input{width:96px;padding:9px 9px 9px 3px;border:0;background:transparent;font:1rem Georgia,serif;text-align:right}
  .money input:focus{outline:2px solid var(--olive);outline-offset:1px}
  .sw{display:flex;align-items:center;gap:7px;font:700 .68rem Arial,sans-serif;letter-spacing:.06em;
    text-transform:uppercase;cursor:pointer;padding:9px 12px;border:1px solid var(--line);background:#fff}
  .sw input{width:17px;height:17px;accent-color:var(--olive);cursor:pointer}
  .sw.off{color:var(--wine);border-color:var(--wine)}
  .acc{margin-left:auto;display:flex;gap:7px}
  .btn{display:inline-block;padding:10px 14px;border:1px solid var(--ink);background:var(--ink);color:#fff;
    font:700 .68rem Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .btn:hover{background:var(--wine);border-color:var(--wine)}
  .btn.light{background:transparent;color:var(--ink)}
  .btn.light:hover{background:var(--sand);color:var(--ink);border-color:var(--ink)}
  .btn.del{border-color:var(--wine);color:var(--wine);background:transparent}
  .btn.del:hover{background:var(--wine);color:#fff}
  .guardar{position:sticky;bottom:0;margin-top:18px;padding:14px 0 22px;background:linear-gradient(to top,var(--cream) 70%,transparent)}
  .guardar .btn{width:100%;padding:16px;font-size:.8rem}
  section.caja{margin:34px 0;padding:22px;background:var(--paper);border:1px solid var(--line)}
  section.caja h2{margin:0 0 4px;font-weight:400;font-size:1.5rem}
  section.caja p.ayuda{margin:0 0 16px;color:#6d655b;font:.85rem Arial,sans-serif}
  .fila{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end}
  .fila .campo{flex:1 1 180px}
  .fila input[type=text],.fila input[type=number],.fila input[type=file],.fila textarea{
    width:100%;padding:10px;border:1px solid var(--line);background:#fff;font:.95rem Georgia,serif}
  .stats{display:flex;gap:18px;flex-wrap:wrap;margin:0 0 20px;font:.8rem Arial,sans-serif;color:#6d655b}
  .stats b{color:var(--ink)}
  footer{padding:30px 0;text-align:center;font:.75rem Arial,sans-serif;color:#6d655b}
  @media(max-width:620px){
    .prod{grid-template-columns:56px 1fr;gap:10px;padding:11px}
    .prod img{width:56px;height:56px}
    .campo input[type=number]{width:84px}
    .acc{margin-left:0;width:100%}
    .acc .btn{flex:1;text-align:center}
  }
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <span class="marca">Casa Natural</span>
  <a class="salir" href="?salir=1">Salir</a>
</div></header>

<div class="wrap">
  <h1>Productos</h1>
  <p class="sub">Precios, stock y qué se muestra en la web</p>

  <?php if ($aviso): ?><p class="msg"><?= e($aviso) ?></p><?php endif; ?>
  <?php if ($error): ?><p class="msg err"><?= e($error) ?></p><?php endif; ?>

  <p class="stats">
    <span><b><?= count($productos) ?></b> productos</span>
    <span><b><?= $visibles ?></b> visibles en la web</span>
    <span><b><?= $agotados ?></b> sin stock</span>
  </p>

  <?php if ($editando): ?>
    <section class="caja">
      <h2>Editar: <?= e($editando['name']) ?></h2>
      <p class="ayuda">Cambiá el texto o la foto. Para precio y stock usá la lista de abajo.</p>
      <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <input type="hidden" name="accion" value="editar">
        <input type="hidden" name="id" value="<?= e($editando['id']) ?>">
        <div class="fila">
          <label class="campo"><span>Nombre</span>
            <input type="text" name="name" value="<?= e($editando['name']) ?>" required></label>
        </div>
        <div class="fila" style="margin-top:12px">
          <label class="campo"><span>Descripción</span>
            <input type="text" name="description" value="<?= e($editando['description']) ?>"></label>
        </div>
        <div class="fila" style="margin-top:12px">
          <label class="campo"><span>Sumar fotos (podés elegir varias · JPG, PNG o WEBP)</span>
            <input type="file" name="fotos[]" accept="image/jpeg,image/png,image/webp" multiple></label>
        </div>
        <div class="fila" style="margin-top:16px">
          <button class="btn" type="submit">Guardar cambios</button>
          <a class="btn light" href="index.php">Cancelar</a>
        </div>
      </form>

      <?php $galeria = fotosDe($editando); ?>
      <p class="campo__nombre" style="margin:22px 0 10px">Fotos y videos de este producto (<?= count($galeria) ?> de 6)</p>
      <div class="galeria">
        <?php foreach ($galeria as $pos => $foto): ?>
          <figure class="gfoto">
            <img src="<?= e(imgSrc($foto)) ?>" alt="">
            <?php if ($pos === 0): ?><span class="tag">Portada</span><?php endif; ?>
            <div class="gacc">
              <?php if ($pos !== 0): ?>
                <form method="post"><input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                  <input type="hidden" name="accion" value="foto_portada">
                  <input type="hidden" name="id" value="<?= e($editando['id']) ?>">
                  <input type="hidden" name="pos" value="<?= $pos ?>">
                  <button type="submit" title="Poner de portada">★</button></form>
              <?php endif; ?>
              <?php if (count($galeria) > 1): ?>
                <form method="post" onsubmit="return confirm('¿Quitar esta foto?')">
                  <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                  <input type="hidden" name="accion" value="foto_borrar">
                  <input type="hidden" name="id" value="<?= e($editando['id']) ?>">
                  <input type="hidden" name="pos" value="<?= $pos ?>">
                  <button type="submit" class="del" title="Quitar">×</button></form>
              <?php endif; ?>
            </div>
            <div class="gorden">
              <form method="post"><input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                <input type="hidden" name="accion" value="foto_mover">
                <input type="hidden" name="id" value="<?= e($editando['id']) ?>">
                <input type="hidden" name="pos" value="<?= $pos ?>">
                <input type="hidden" name="dir" value="-1">
                <button type="submit" title="Mover antes" <?= $pos === 0 ? 'disabled' : '' ?>>&lsaquo;</button></form>
              <span><?= $pos + 1 ?></span>
              <form method="post"><input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                <input type="hidden" name="accion" value="foto_mover">
                <input type="hidden" name="id" value="<?= e($editando['id']) ?>">
                <input type="hidden" name="pos" value="<?= $pos ?>">
                <input type="hidden" name="dir" value="1">
                <button type="submit" title="Mover después" <?= $pos === count($galeria) - 1 ? 'disabled' : '' ?>>&rsaquo;</button></form>
            </div>
          </figure>
        <?php endforeach; ?>
      </div>
      <p class="ayuda" style="margin-top:10px">La <b>portada</b> es la que se ve en el listado y la
      primera del carrusel. Tocá ★ para que una foto pase a ser la portada, y las flechas ‹ › de abajo para ordenarlas.</p>
    </section>
  <?php endif; ?>

  <form method="post">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <input type="hidden" name="accion" value="guardar">
    <div class="grid">
      <?php foreach ($productos as $p):
        $id = (string)$p['id']; $vis = !empty($p['visible']); $st = (int)($p['stock'] ?? 0); ?>
        <article class="prod <?= $vis ? '' : 'oculto' ?>">
          <?php $fot = fotosDe($p); ?>
          <span class="mini"><img src="<?= e(imgSrc((string)($fot[0] ?? ''))) ?>" alt=""><?php if (count($fot) > 1): ?><b><?= count($fot) ?></b><?php endif; ?></span>
          <div>
            <h3><?= e($p['name']) ?><?= $st <= 0 ? ' — <span style="color:#742e2a;font:700 .7rem Arial,sans-serif">SIN STOCK</span>' : '' ?></h3>
            <p class="desc"><?= e($p['description']) ?></p>
            <div class="campos">
              <label class="campo"><span>Precio</span>
                <span class="money"><i>$</i><input type="text" inputmode="numeric" class="plata" name="precio[<?= e($id) ?>]" value="<?= e(miles((int)$p['price'])) ?>"></span></label>
              <label class="campo"><span>Tachado</span>
                <span class="money"><i>$</i><input type="text" inputmode="numeric" class="plata" name="tachado[<?= e($id) ?>]" value="<?= e(miles((int)($p['referencePrice'] ?? 0))) ?>"></span></label>
              <label class="campo"><span>Stock</span>
                <input type="number" min="0" step="1" name="stock[<?= e($id) ?>]" value="<?= $st ?>"></label>
              <label class="sw <?= $vis ? '' : 'off' ?>">
                <input type="checkbox" name="visible[<?= e($id) ?>]" <?= $vis ? 'checked' : '' ?>>
                <?= $vis ? 'En la web' : 'Oculto' ?>
              </label>
              <span class="acc">
                <a class="btn light" href="?editar=<?= urlencode($id) ?>">Texto y foto</a>
              </span>
            </div>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
    <div class="guardar"><button class="btn" type="submit">Guardar todo</button></div>
  </form>

  <section class="caja">
    <h2>Agregar un producto</h2>
    <p class="ayuda">Se publica en la web apenas lo guardás.</p>
    <form method="post" enctype="multipart/form-data">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
      <input type="hidden" name="accion" value="nuevo">
      <div class="fila">
        <label class="campo"><span>Nombre</span><input type="text" name="name" required placeholder="Aceitunas rellenas"></label>
        <label class="campo"><span>Descripción</span><input type="text" name="description" placeholder="En salmuera · Frasco x 360 g."></label>
      </div>
      <div class="fila" style="margin-top:12px">
        <label class="campo"><span>Precio</span><span class="money"><i>$</i><input type="text" inputmode="numeric" class="plata" name="price" placeholder="0"></span></label>
        <label class="campo"><span>Precio tachado</span><span class="money"><i>$</i><input type="text" inputmode="numeric" class="plata" name="referencePrice" placeholder="0"></span></label>
        <label class="campo"><span>Stock</span><input type="number" min="0" name="stock" value="0"></label>
        <label class="campo"><span>Fotos (podés elegir varias)</span><input type="file" name="fotos[]" accept="image/jpeg,image/png,image/webp" multiple></label>
      </div>
      <div class="fila" style="margin-top:16px"><button class="btn" type="submit">Agregar producto</button></div>
    </form>
  </section>

  <section class="caja">
    <h2>Borrar un producto</h2>
    <p class="ayuda">Si solo querés sacarlo de la web por un tiempo, no lo borres: apagá el interruptor "En la web".</p>
    <form method="post" onsubmit="return confirm('¿Seguro que querés borrarlo? No se puede deshacer.')">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
      <input type="hidden" name="accion" value="borrar">
      <div class="fila">
        <label class="campo"><span>Producto</span>
          <select name="id" style="width:100%;padding:10px;border:1px solid var(--line);background:#fff;font:.95rem Georgia,serif">
            <?php foreach ($productos as $p): ?>
              <option value="<?= e($p['id']) ?>"><?= e($p['name']) ?></option>
            <?php endforeach; ?>
          </select></label>
        <button class="btn del" type="submit">Borrar</button>
      </div>
    </form>
  </section>

  <section class="caja">
    <h2>Actualizar el panel</h2>
    <p class="ayuda">Trae las mejoras nuevas del panel. No toca tus productos, precios ni fotos.</p>
    <form method="post" action="actualizar.php">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
      <button class="btn light" type="submit">Buscar actualizaciones</button>
    </form>
  </section>

  <section class="caja">
    <h2>Cambiar la contraseña</h2>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
      <input type="hidden" name="accion" value="clave">
      <div class="fila">
        <label class="campo"><span>Contraseña nueva</span>
          <input type="text" name="nueva" minlength="6" required placeholder="mínimo 6 caracteres"></label>
        <button class="btn light" type="submit">Cambiar</button>
      </div>
    </form>
  </section>

  <footer>Casa Natural · los cambios se ven en la web en menos de un minuto</footer>
</div>
<script>
  // Los precios se escriben con separador de miles, como se leen en el mostrador.
  document.addEventListener('input', e => {
    if (!e.target.classList.contains('plata')) return;
    const limpio = e.target.value.replace(/\D/g, '');
    e.target.value = limpio ? Number(limpio).toLocaleString('es-AR') : '';
  });
</script>
</body>
</html>
