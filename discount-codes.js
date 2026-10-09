/* Server validates the code and recalculates every order; browser totals are a preview. */
const cnCoupon = (() => {
  let applied = null;
  const key = 'cn-discount-v1';
  try { const saved = JSON.parse(sessionStorage.getItem(key)); if (saved && Date.now()-saved.at<86400000) applied=saved; } catch (_) {}
  const save = () => { try { applied ? sessionStorage.setItem(key,JSON.stringify(applied)) : sessionStorage.removeItem(key); } catch (_) {} };
  const eligible = product => !product.couponExcluded && !product.promoSource && !product.promoUnits;
  const amount = lines => applied ? lines.reduce((sum,[i,q])=>sum+(eligible(CONFIG.products[i])?Math.round(CONFIG.products[i].price*applied.percent/100)*q:0),0) : 0;
  const subtotal = lines => lines.reduce((sum,[i,q])=>sum+CONFIG.products[i].price*q,0)-amount(lines);
  const unitPrice = product => product.price-(applied&&eligible(product) ? Math.round(product.price*applied.percent/100) : 0);
  function refresh() {
    const status=document.getElementById('coupon-status');
    if (!status || status.dataset.busy) return;
    const lines=[...cart.entries()].filter(([,q])=>q>0);
    const hasEligible=lines.some(([i])=>eligible(CONFIG.products[i]));
    status.textContent=applied ? (hasEligible ? `Código ${applied.code} aplicado: ${applied.percent}% en productos elegibles. No se acumula con promociones.` : `El código ${applied.code} no se aplica a las promociones.`) : '';
    document.getElementById('coupon-remove').hidden=!applied;
  }
  async function apply() {
    const input=document.getElementById('coupon-input'), status=document.getElementById('coupon-status'), button=document.getElementById('coupon-apply');
    const code=input.value.trim().toUpperCase();
    if(!code){status.textContent='Ingresá tu código.';return;}
    const items=[...cart.entries()].filter(([,q])=>q>0).map(([i,quantity])=>({id:CONFIG.products[i].id,quantity}));
    button.disabled=true;status.dataset.busy='1';status.textContent='Validando código…';
    try {
      const response=await fetch(new URL('validate-discount.php',CONFIG.ordersApi),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,items}),signal:AbortSignal.timeout(15000)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'No se pudo aplicar el código.');
      if(!Number.isInteger(data.percent)||data.percent<1||data.percent>30)throw new Error('Respuesta inválida. Intentá nuevamente.');
      applied={code:data.code,percent:data.percent,at:Date.now()};save();delete status.dataset.busy;renderCart();refresh();
    } catch(error) {
      applied=null;save();renderCart();delete status.dataset.busy;
      status.textContent=error.name==='TimeoutError'?'No pudimos verificar el código. Intentá nuevamente.':error.message;
      document.getElementById('coupon-remove').hidden=true;
    } finally {button.disabled=false;}
  }
  function mount() {
    const panel=document.getElementById('cart-panel'),link=document.getElementById('cart-checkout-link');
    if(!panel||!link)return;
    const box=document.createElement('section');box.id='coupon-box';
    box.innerHTML='<label for="coupon-input">¿Tenés un código de descuento?</label><div class="coupon-row"><input id="coupon-input" maxlength="24" autocomplete="off" autocapitalize="characters" placeholder="Ingresá tu código"><button id="coupon-apply" type="button">Aplicar</button></div><p id="coupon-status" role="status" aria-live="polite"></p><button id="coupon-remove" type="button" hidden>Quitar código</button><p class="coupon-note">Válido para productos y combos, no acumulable con promociones. No se aplica al envío. Un código por compra.</p>';
    const style=document.createElement('style');style.textContent='#coupon-box{margin:18px 0;padding:16px 0;border-top:1px solid #ded2bf;font:14px/1.5 Arial,sans-serif}#coupon-box label{display:block;font-weight:700;margin-bottom:8px}.coupon-row{display:flex;gap:8px}.coupon-row input{min-width:0;flex:1;width:100%;padding:11px;border:1px solid #b9bfac;border-radius:3px;font:inherit;text-transform:uppercase}.coupon-row button{padding:11px 16px;background:#465536;color:white;border:0;border-radius:3px;font-weight:700;cursor:pointer}#coupon-remove{background:none;border:0;text-decoration:underline;color:#7c302c;cursor:pointer;padding:0}.coupon-note{font-size:12px;color:#646951}#coupon-status{margin:8px 0;color:#465536}';document.head.appendChild(style);
    panel.insertBefore(box,link);box.querySelector('input').value=applied?.code||'';
    box.querySelector('#coupon-apply').addEventListener('click',apply);
    box.querySelector('input').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();apply();}});
    box.querySelector('#coupon-remove').addEventListener('click',()=>{applied=null;save();renderCart();refresh();});
    document.addEventListener('click',event=>{
      if(document.getElementById('coupon-status')?.dataset.busy && event.target.closest('#cart-checkout-link,#send-cart,#send-manual-payment,#coupon-remove')){
        event.preventDefault();event.stopImmediatePropagation();
        document.getElementById('coupon-status').textContent='Esperá un momento: estamos validando tu código.';
      }
    },true);
    const move=()=>{const summary=document.getElementById('checkout-summary');if(new URLSearchParams(location.search).get('checkout')==='1')summary.appendChild(box);else panel.insertBefore(box,link);refresh();};
    document.addEventListener('cn:cart-updated',move);move();
  }
  document.addEventListener('DOMContentLoaded',mount);
  return {amount,subtotal,unitPrice,code:()=>applied&&[...cart.entries()].some(([i,q])=>q>0&&eligible(CONFIG.products[i]))?applied.code:''};
})();
