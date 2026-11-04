/* Reuse Casa Natural's existing delivery controls and quote calculation. */
(()=>{
 const nav=document.querySelector('link[href*="navigation-menu.css"]');if(nav)nav.href='/navigation-menu.css?v=20261104-mobile44';
 function mount(){
  const panel=document.querySelector('#cart-panel'),preview=panel?.querySelector('.cart-shipping-preview');
  const pickup=document.querySelector('#pickup-personal'),fields=document.querySelector('#delivery-fields');
  const checkout=document.querySelector('#checkout-delivery');
  if(!preview||!pickup||!fields||!checkout||document.querySelector('#cart-shipping-controls'))return;
  const delivery=pickup.parentElement.parentElement,anchor=document.createComment('delivery controls');
  delivery.before(anchor);
  const holder=document.createElement('section');holder.id='cart-shipping-controls';
  const heading=document.createElement('h4');heading.textContent='Conocé el envío antes de continuar';
  const hint=document.createElement('p');hint.textContent='Elegí localidad y código postal. No necesitás ingresar tus datos personales para cotizar.';
  hint.style.cssText='font:13px/1.5 Arial,sans-serif';holder.append(heading,hint);
  const result=document.createElement('p');result.setAttribute('role','status');result.setAttribute('aria-live','polite');
  holder.append(result);preview.before(holder);
  const addressIds=['delivery-address','national-city','national-province'];
  const style=document.createElement('style');style.textContent='#cart-shipping-controls{margin:16px 0;padding:16px;border:1px solid #d8ccb9;border-radius:8px;background:#f8f5ee}#cart-shipping-controls h4{font:700 16px/1.4 Arial,sans-serif;margin:0 0 8px}#cart-shipping-controls [hidden]{display:none!important}#cart-shipping-controls select,#cart-shipping-controls input{box-sizing:border-box;max-width:100%}#cart-shipping-controls [role=status]{font:700 14px/1.5 Arial,sans-serif}';document.head.append(style);
  function sync(){
   const isCheckout=document.body.classList.contains('checkout-page-mode');
   holder.hidden=isCheckout;
   if(isCheckout){if(delivery.parentElement!==checkout)anchor.after(delivery);}
   else if(delivery.parentElement!==holder)result.before(delivery);
   for(const id of addressIds){const input=document.getElementById(id);if(!input)continue;input.hidden=!isCheckout;const label=input.previousElementSibling;if(label?.tagName==='LABEL')label.hidden=!isCheckout;}
   const hasItems=!!panel.querySelector('[data-remove-item]')||!!document.querySelector('#checkout-summary [data-remove-item]');
   holder.hidden=isCheckout||!hasItems;
   preview.hidden=hasItems;
   if(!isCheckout){const total=panel.querySelector('.cart-total');if(total&&total.nextElementSibling!==holder)total.after(holder);}
   const amount=document.getElementById('shipping-total')?.textContent.trim()||'';
   const status=document.getElementById('correo-quote-status')?.textContent.trim()||'';
   const local=pickup.checked||['Pilar','Del Viso','Derqui','Villa Rosa'].includes(document.getElementById('delivery-locality').value);
   result.textContent=local&&amount?'Envío: '+amount:status||(amount?'Envío: '+amount:'Elegí tu destino para calcular el envío.');
  }
  document.addEventListener('cn:cart-updated',sync);addEventListener('popstate',sync);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  const breakdown=document.getElementById('shipping-breakdown'),notice=document.getElementById('correo-quote-status');
  for(const node of [breakdown,notice])if(node)new MutationObserver(sync).observe(node,{childList:true,subtree:true,characterData:true});
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
