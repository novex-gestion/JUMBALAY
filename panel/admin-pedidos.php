<?php
declare(strict_types=1);
session_start(); require __DIR__ . '/lib.php';
if (!($_SESSION['ok'] ?? false)) { header('Location: index.php'); exit; }
if (!function_exists('e')) {
  function e($valor): string { return htmlspecialchars((string)$valor, ENT_QUOTES, 'UTF-8'); }
}
const ARCHIVO_PEDIDOS = __DIR__ . '/../api/data/pedidos.json';
const ESTADOS = ['nuevo'=>'Nuevo','preparado'=>'Preparado','enviado'=>'Enviado / listo para retirar','entregado'=>'Entregado','cancelado'=>'Cancelado'];
function leerPedidos(): array { $d=is_file(ARCHIVO_PEDIDOS)?json_decode((string)file_get_contents(ARCHIVO_PEDIDOS),true):[]; return is_array($d['pedidos']??null)?$d['pedidos']:[]; }
function dinero($n): string { return '$'.number_format((float)$n,0,',','.'); }
function pagoConfirmado(array $pedido): bool { return (bool)($pedido['pago_confirmado']??false) || ($pedido['estado']??'')==='pago_confirmado'; }
function estadoPedido(array $pedido): string { $estado=(string)($pedido['estado']??'nuevo'); return isset(ESTADOS[$estado])?$estado:'nuevo'; }
function guardarPedido(string $id,string $estado,string $notas): bool {
  $h=fopen(ARCHIVO_PEDIDOS,'c+'); if(!$h||!flock($h,LOCK_EX)) return false;
  rewind($h); $d=json_decode((string)stream_get_contents($h),true); if(!is_array($d)) $d=['version'=>1,'pedidos'=>[]]; $found=false;
  foreach($d['pedidos'] as &$p){if(($p['id']??'')===$id){if(($p['estado']??'')==='pago_confirmado')$p['pago_confirmado']=true;$p['estado']=$estado;$p['archivado']=$estado==='cancelado';$p['notas']=$notas;$p['actualizado_en']=date('c');$found=true;break;}} unset($p);
  $json=json_encode($d,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); $ok=$found&&$json!==false&&ftruncate($h,0)&&rewind($h)&&fwrite($h,$json)!==false&&fflush($h); flock($h,LOCK_UN);fclose($h); return $ok;
}
function puedeArchivar(array $pedido): bool { return !((bool)($pedido['archivado']??false)); }
function cantidadesPedido(array $pedido): array {
  $cantidades = [];
  foreach (($pedido['items'] ?? []) as $item) {
    $productoId = (string)($item['id'] ?? '');
    $cantidad = filter_var($item['cantidad'] ?? null, FILTER_VALIDATE_INT);
    if ($productoId === '' || $cantidad === false || $cantidad < 1) return [];
    $cantidades[$productoId] = ($cantidades[$productoId] ?? 0) + $cantidad;
  }
  return $cantidades;
}
function descontarStockPedido(string $id, string &$motivo): bool {
  $pedido = null;
  foreach (leerPedidos() as $p) if (($p['id'] ?? '') === $id) { $pedido = $p; break; }
  if (!$pedido || !empty($pedido['archivado']) || estadoPedido($pedido) === 'cancelado') {
    $motivo = 'La orden no está activa.'; return false;
  }
  $cantidades = cantidadesPedido($pedido);
  if (!$cantidades) { $motivo = 'La orden no tiene productos y cantidades válidos.'; return false; }
  return actualizarCatalogo(function (array $catalogo) use ($id, $cantidades, &$motivo) {
    if (isset($catalogo['stock_descontado_pedidos'][$id])) {
      $motivo = 'El stock de esta orden ya fue descontado.'; return false;
    }
    $porId = [];
    foreach (($catalogo['productos'] ?? []) as $i => $producto) $porId[(string)($producto['id'] ?? '')] = $i;
    foreach ($cantidades as $productoId => $cantidad) {
      if (!isset($porId[$productoId])) { $motivo = 'Hay un producto que ya no existe en el catálogo.'; return false; }
      if ((int)($catalogo['productos'][$porId[$productoId]]['stock'] ?? 0) < $cantidad) {
        $motivo = 'No hay stock suficiente de ' . ($catalogo['productos'][$porId[$productoId]]['name'] ?? $productoId) . '.';
        return false;
      }
    }
    foreach ($cantidades as $productoId => $cantidad) $catalogo['productos'][$porId[$productoId]]['stock'] -= $cantidad;
    $catalogo['stock_descontado_pedidos'][$id] = date('c');
    unset($catalogo['stock_reintegrado_pedidos'][$id]);
    return $catalogo;
  });
}
function reintegrarStockPedido(string $id, bool &$repuso, string &$motivo): bool {
  $repuso = false;
  $pedido = null;
  foreach (leerPedidos() as $p) if (($p['id'] ?? '') === $id) { $pedido = $p; break; }
  if (!$pedido || estadoPedido($pedido) !== 'cancelado') {
    $motivo = 'La orden no está cancelada.'; return false;
  }
  // Si nunca se descontó manualmente, cancelar no cambia el stock.
  if (!isset(catalogo()['stock_descontado_pedidos'][$id])) return true;
  $cantidades = cantidadesPedido($pedido);
  if (!$cantidades) { $motivo = 'No se puede reponer: faltan productos o cantidades válidos.'; return false; }
  return actualizarCatalogo(function (array $catalogo) use ($id, $cantidades, &$repuso, &$motivo) {
    if (!isset($catalogo['stock_descontado_pedidos'][$id])) return $catalogo;
    $porId = [];
    foreach (($catalogo['productos'] ?? []) as $i => $producto) $porId[(string)($producto['id'] ?? '')] = $i;
    foreach ($cantidades as $productoId => $cantidad) {
      if (!isset($porId[$productoId])) {
        $motivo = 'No se puede reponer: un producto ya no existe en el catálogo.'; return false;
      }
    }
    foreach ($cantidades as $productoId => $cantidad) $catalogo['productos'][$porId[$productoId]]['stock'] += $cantidad;
    unset($catalogo['stock_descontado_pedidos'][$id]);
    $catalogo['stock_reintegrado_pedidos'][$id] = date('c');
    $repuso = true;
    return $catalogo;
  });
}
function confirmarPago(string $id): bool {
  $h=fopen(ARCHIVO_PEDIDOS,'c+'); if(!$h||!flock($h,LOCK_EX)) return false;
  rewind($h); $d=json_decode((string)stream_get_contents($h),true); if(!is_array($d)) $d=['version'=>1,'pedidos'=>[]]; $found=false;
  foreach($d['pedidos'] as &$p){if(($p['id']??'')===$id){$p['pago_confirmado']=true;if(($p['estado']??'')==='pago_confirmado')$p['estado']='nuevo';$p['actualizado_en']=date('c');$found=true;break;}} unset($p);
  $json=json_encode($d,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); $ok=$found&&$json!==false&&ftruncate($h,0)&&rewind($h)&&fwrite($h,$json)!==false&&fflush($h); flock($h,LOCK_UN);fclose($h); return $ok;
}
function cambiarArchivado(string $id,bool $archivar): bool {
  $h=fopen(ARCHIVO_PEDIDOS,'c+'); if(!$h||!flock($h,LOCK_EX)) return false;
  rewind($h); $d=json_decode((string)stream_get_contents($h),true); if(!is_array($d)) $d=['version'=>1,'pedidos'=>[]]; $found=false;
  foreach($d['pedidos'] as &$p){if(($p['id']??'')===$id){$p['archivado']=$archivar;if(!$archivar&&estadoPedido($p)==='cancelado')$p['estado']='nuevo';$p['actualizado_en']=date('c');$found=true;break;}} unset($p);
  $json=json_encode($d,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); $ok=$found&&$json!==false&&ftruncate($h,0)&&rewind($h)&&fwrite($h,$json)!==false&&fflush($h); flock($h,LOCK_UN);fclose($h); return $ok;
}
$aviso='';$error='';$csrf=(string)($_SESSION['csrf']??'');
if($_SERVER['REQUEST_METHOD']==='POST'){
  if(!hash_equals($csrf,(string)($_POST['csrf']??''))) $error='Sesión vencida, volvé a intentar.';
  else {
    $id=(string)($_POST['id']??'');$accion=(string)($_POST['accion']??'guardar');
    if($accion==='descontar_stock'){
      $motivo='No se pudo actualizar el stock.';
      if(descontarStockPedido($id,$motivo)) $aviso='Stock descontado. El panel de productos y la web ya muestran las cantidades nuevas.';
      else $error=$motivo;
    }elseif($accion==='confirmar_pago'){
      if(confirmarPago($id)) $aviso='Pago confirmado.'; else $error='No se pudo confirmar el pago.';
    }elseif($accion==='archivar'||$accion==='restaurar'){
      if(cambiarArchivado($id,$accion==='archivar')) $aviso=$accion==='archivar'?'Pedido archivado.':'Pedido reactivado.';
      else $error='No se pudo cambiar el archivo del pedido.';
    }else{
      $estado=(string)($_POST['estado']??'');$notas=mb_substr(trim((string)($_POST['notas']??'')),0,500);
      if(!$id||!isset(ESTADOS[$estado])) $error='No se pudo actualizar el pedido.';
      elseif(!guardarPedido($id,$estado,$notas)) $error='No se pudo guardar el cambio.';
      elseif($estado==='cancelado'){
        $repuso=false;$motivo='No se pudo reponer el stock.';
        if(reintegrarStockPedido($id,$repuso,$motivo)) $aviso=$repuso?'Pedido cancelado y archivado. Stock repuesto automáticamente.':'Pedido cancelado y archivado. No había stock descontado para reponer.';
        else $error='Pedido cancelado y archivado, pero el stock NO se repuso: '.$motivo.' Abrí Órdenes archivadas y guardá nuevamente para reintentar.';
      }else $aviso='Pedido actualizado.';
    }
  }
}
$vista=(($_GET['vista']??'')==='archivadas')?'archivadas':'activas';$todos=leerPedidos();$catalogoActual=catalogo();$stockDescontado=$catalogoActual['stock_descontado_pedidos']??[];$stockReintegrado=$catalogoActual['stock_reintegrado_pedidos']??[];$estaArchivado=fn($p)=>(bool)($p['archivado']??false)||estadoPedido($p)==='cancelado';$pedidos=array_values(array_filter($todos,fn($p)=>$vista==='archivadas'?$estaArchivado($p):!$estaArchivado($p)));$conteo=[];foreach($pedidos as $p){$s=estadoPedido($p);$conteo[$s]=($conteo[$s]??0)+1;}$activas=count(array_filter($todos,fn($p)=>!$estaArchivado($p)));$archivadas=count($todos)-$activas;
?><!doctype html>
<html lang="es-AR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Casa Natural · Centro de pedidos</title>
<style>:root{--ink:#21332b;--cream:#f7f1e7;--paper:#fffdf8;--olive:#65734a;--wine:#742e2a;--line:#ded2bf}*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font-family:Georgia,serif}.wrap{width:min(1100px,calc(100% - 28px));margin:auto}header{padding:16px 0;background:var(--ink);color:#fff}header .wrap{display:flex;justify-content:space-between;align-items:center}.volver,.btn{border:1px solid currentColor;padding:9px 12px;background:transparent;color:inherit;text-decoration:none;font:700 .68rem Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}h1{margin:28px 0 4px;font-size:2.2rem;font-weight:400}.sub{margin:0 0 20px;color:var(--wine);font:700 .7rem Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}.stats{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.stats span{padding:9px 11px;background:var(--paper);border:1px solid var(--line);font:.8rem Arial,sans-serif}.pedido{margin:14px 0;padding:18px;background:var(--paper);border:1px solid var(--line)}.top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.id{color:var(--wine);font:700 .72rem Arial,sans-serif;letter-spacing:.08em}.estado-pago{display:inline-block;margin-top:8px;padding:6px 9px;border-radius:4px;background:#e5f0df;color:#38552d;font:700 .7rem Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}.meta{margin:7px 0;color:#625d55;font:.82rem Arial,sans-serif}.items{margin:14px 0;padding:12px;background:#f8f5ee;font:.88rem Arial,sans-serif}.items div{padding:5px 0;border-bottom:1px solid var(--line)}.items div:last-child{border:0}.total{font-size:1.25rem}.ahorro{color:var(--olive);font:700 .84rem Arial,sans-serif}form{display:grid;grid-template-columns:180px 1fr auto;gap:9px;align-items:start;margin-top:14px}select,textarea{width:100%;padding:9px;border:1px solid var(--line);background:#fff;font:.88rem Arial,sans-serif}textarea{min-height:42px;resize:vertical}.btn{background:var(--ink);color:#fff;border-color:var(--ink)}.msg{padding:12px;background:#eef0e5;font:.85rem Arial,sans-serif}.err{background:#f7e4e2;color:var(--wine)}.vacio{padding:24px;background:var(--paper);border:1px solid var(--line)}@media(max-width:700px){form{grid-template-columns:1fr}.top{display:block}}</style>
</head><body><header><div class="wrap"><strong>Casa Natural</strong><a class="volver" href="index.php">Volver al panel</a></div></header><main class="wrap"><h1>Centro de pedidos</h1><p class="sub">Ventas para preparar, entregar o retirar</p>
<?php if($aviso): ?><p class="msg"><?=e($aviso)?></p><?php endif; ?>
<?php if($error): ?><p class="msg err"><?=e($error)?></p><?php endif; ?>
<nav style="display:flex;gap:8px;margin:18px 0"><a class="btn <?=$vista==='activas'?'':'btn-sec'?>" href="pedidos.php">Órdenes activas (<?=$activas?>)</a><a class="btn <?=$vista==='archivadas'?'':'btn-sec'?>" href="pedidos.php?vista=archivadas">Órdenes archivadas (<?=$archivadas?>)</a></nav>
<div class="stats"><span>Total: <b><?=count($pedidos)?></b></span><?php foreach(ESTADOS as $clave=>$etiqueta): if(!empty($conteo[$clave])): ?><span><?=e($etiqueta)?>: <b><?=$conteo[$clave]?></b></span><?php endif; endforeach; ?></div>
<?php if(!$pedidos): ?><p class="vacio">Todavía no hay pedidos registrados.</p><?php endif; ?>
<?php foreach($pedidos as $p): $estado=estadoPedido($p); $cliente=is_array($p['cliente']??null)?$p['cliente']:[]; $nombreCliente=trim((string)($cliente['nombre']??'')); $telefonoCliente=preg_replace('/\D+/', '', (string)($cliente['telefono']??''))??''; $mensajeWhatsapp='Hola '.($nombreCliente?:'').', te escribimos de Casa Natural por tu pedido '.($p['id']??'').'. Total: '.dinero($p['total']??0).'. Te contactamos para coordinar la entrega o el retiro.'; ?>
<article class="pedido"><div class="top"><div><div class="id"><?=e($p['id']??'Pedido')?></div><?php if(pagoConfirmado($p)): ?><div class="estado-pago">✓ Pago confirmado</div><?php endif; ?><?php if(isset($stockDescontado[$p['id']??''])): ?><div class="estado-pago">✓ Stock descontado</div><?php endif; ?><?php if(isset($stockReintegrado[$p['id']??''])): ?><div class="estado-pago">✓ Stock reintegrado</div><?php endif; ?><div class="meta"><?=e(date('d/m/Y H:i',strtotime((string)($p['creado_en']??'now'))))?> · <?=e(($p['forma_pago']??'')==='mercado_pago'?'Mercado Pago':'Transferencia / efectivo')?></div><?php if($nombreCliente||$telefonoCliente): ?><div class="meta"><strong>Cliente:</strong> <?=e($nombreCliente?:'Sin nombre')?><?=$telefonoCliente?' · '.e($telefonoCliente):''?></div><?php endif; ?><div class="meta"><?=e($p['entrega']['modalidad']??'')?> · <?=e($p['entrega']['localidad']??'')?> · <?=e($p['entrega']['codigo_postal']??'')?> · <?=e($p['entrega']['direccion']??'')?></div></div><div><div class="total"><?=dinero($p['total']??0)?></div><?php if(($p['ahorro_total']??0)>0): ?><div class="ahorro">Ahorro: <?=dinero($p['ahorro_total'])?></div><?php endif; ?></div></div><div class="items"><?php foreach(($p['items']??[]) as $item): ?><div><?=e($item['nombre']??'')?> · <?=e($item['cantidad']??0)?> u. · <?=dinero($item['subtotal']??0)?></div><?php endforeach; ?></div>
<form method="post"><input type="hidden" name="csrf" value="<?=e($csrf)?>"><input type="hidden" name="id" value="<?=e($p['id']??'')?>"><select name="estado"><?php foreach(ESTADOS as $clave=>$etiqueta): ?><option value="<?=e($clave)?>" <?=$estado===$clave?'selected':''?>><?=e($etiqueta)?></option><?php endforeach; ?></select><textarea name="notas" placeholder="Notas internas"><?=e($p['notas']??'')?></textarea><button class="btn">Guardar</button><?php if(preg_match('/^\d{8,15}$/',$telefonoCliente)): ?><a class="btn" href="<?=e('https://wa.me/'.$telefonoCliente.'?text='.rawurlencode($mensajeWhatsapp))?>" target="_blank" rel="noopener">Enviar WhatsApp</a><?php endif; ?><?php if($vista==='activas'&&!pagoConfirmado($p)): ?><button class="btn" name="accion" value="confirmar_pago">Confirmar pago</button><?php endif; ?><?php if($vista==='activas'&&!isset($stockDescontado[$p['id']??''])): ?><button class="btn" name="accion" value="descontar_stock" onclick="return confirm('¿Descontar del stock las unidades de esta orden? Esta acción no se repite automáticamente.')">Descontar stock</button><?php endif; ?><?php if($vista==='activas'&&puedeArchivar($p)): ?><button class="btn" style="background:transparent;color:var(--wine);border-color:var(--wine)" name="accion" value="archivar">Archivar orden</button><?php endif; ?><?php if($vista==='archivadas'): ?><button class="btn" name="accion" value="restaurar">Reactivar orden</button><?php endif; ?></form></article>
<?php endforeach; ?></main></body></html>
