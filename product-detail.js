/* Shared catalog and session cart contract. No order is sent from a product page. */
(() => {
  const id = document.body.dataset.productId;
  const key = 'casa-natural-cart-v1';
  const host = 'https://panel.tucasaesnatural.com';
  const $ = s => document.querySelector(s);
  if(['tucasaesnatural.com','www.tucasaesnatural.com'].includes(location.hostname)) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','1551619602829857');fbq('track','PageView');
  }
  const track = (event,p,q=1) => window.fbq?.('track',event,{content_ids:[p.id],content_name:p.name,content_type:'product',value:unitPrice(p)*q,currency:'ARS'});
  let product, catalog = [], quantity = 1;
  const unitPrice = p => {
    try { const c = JSON.parse(sessionStorage.getItem('cn-discount-v1')); if(c && Date.now()-c.at<86400000 && c.percent>0 && c.percent<=30)return p.price-Math.round(p.price*c.percent/100); } catch (_) {}
    return Number(p.price);
  };
  const reference = document.createElement('p');
  reference.className = 'reference-price'; reference.hidden = true;
  const discount = document.createElement('span');
  discount.className = 'discount-inline'; discount.hidden = true;
  const saving = document.createElement('p');
  saving.className = 'saving'; saving.hidden = true;
  $('#price').before(reference);
  $('#price').after(discount, saving);
  function readCart() {
    try {
    const data = JSON.parse(sessionStorage.getItem(key) || 'null');
    return data && Date.now() - data.at < 86400000 && Array.isArray(data.items)
      ? data.items.filter(x => x && typeof x.id === 'string' && Number.isInteger(x.quantity) && x.quantity > 0) : [];
    } catch (_) { return []; }
  }
  const money = value => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(value);
  const cartDialog = document.createElement('dialog');
  cartDialog.id='detail-cart';cartDialog.setAttribute('aria-labelledby','detail-cart-title');
  cartDialog.innerHTML='<div class="detail-cart-heading"><h2 id="detail-cart-title">Tu carrito</h2><button type="button" id="detail-cart-close" aria-label="Cerrar carrito">×</button></div><div id="detail-cart-lines"></div><p id="detail-cart-subtotal"></p><p class="detail-cart-note">El envío y los códigos de descuento se revisan antes de pagar.</p><a class="button" id="detail-cart-checkout" href="../../index.html?checkout=1">CONTINUAR AL PAGO</a><button type="button" id="detail-cart-continue">Seguir comprando</button>';
  document.body.append(cartDialog);
  const floatingCart=document.createElement('button');floatingCart.type='button';floatingCart.id='detail-cart-toggle';floatingCart.setAttribute('aria-controls',cartDialog.id);floatingCart.setAttribute('aria-haspopup','dialog');
  document.body.append(floatingCart);
  const headerCart=document.createElement('button');headerCart.type='button';headerCart.className='header-cart';headerCart.setAttribute('aria-haspopup','dialog');
  $('header a[href*="checkout=1"]').replaceWith(headerCart);
  const viewCart=document.createElement('button');viewCart.type='button';viewCart.className='button';viewCart.id='view-detail-cart';viewCart.textContent='VER CARRITO';
  $('#next').prepend(viewCart);
  function cartLines() { return readCart().map(x=>[catalog.findIndex(p=>p.id===x.id),x.quantity]).filter(([i])=>i>=0); }
  function renderCart() {
    const items=readCart();let total=0,complete=!!catalog.length;
    const count=items.reduce((n,x)=>n+x.quantity*(catalog.find(p=>p.id===x.id)?.promoUnits||1),0);
    floatingCart.textContent=`VER CARRITO · ${count}`;headerCart.textContent=`MI CARRITO (${count})`;
    $('#detail-cart-lines').replaceChildren();
    for(const item of items){
      const p=catalog.find(p=>p.id===item.id);const line=document.createElement('div');line.className='detail-cart-line';
      const name=document.createElement('strong');name.textContent=p?.name||item.id;
      const detail=document.createElement('p');const amount=p?unitPrice(p)*item.quantity:0;
      if(!p||!Number.isFinite(amount)||amount<=0)complete=false;
      total+=amount;
      detail.textContent=p?`${item.quantity} ${p.promoUnits?`promo(s) · ${item.quantity*p.promoUnits} frascos`:'unidad(es)'} · ${money(amount)}`:`${item.quantity} unidad(es) · Precio pendiente de verificar`;
      const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';remove.setAttribute('aria-label',`Quitar ${p?.name||item.id}`);
      remove.onclick=()=>{try{sessionStorage.setItem(key,JSON.stringify({at:Date.now(),items:readCart().filter(x=>x.id!==item.id)}));if(product)update();else renderCart();}catch(_){$('#detail-cart-subtotal').textContent='No pudimos actualizar el carrito. Intentá nuevamente.';}};
      line.append(name,detail,remove);$('#detail-cart-lines').append(line);
    }
    if(!items.length)$('#detail-cart-lines').textContent='Tu carrito está vacío. Elegí un producto para empezar.';
    $('#detail-cart-subtotal').textContent=items.length?(complete?`Subtotal de productos: ${money(total)}`:'El precio se confirmará al cargar el catálogo.'):'Subtotal: $0';
    $('#detail-cart-checkout').hidden=!items.length;
  }
  function openCart(){renderCart();cartDialog.showModal();$('#detail-cart-close').focus();window.CNAnalytics?.viewCart(cartLines(),catalog,unitPrice);}
  for(const button of [floatingCart,headerCart,viewCart])button.onclick=openCart;
  $('#detail-cart-close').onclick=$('#detail-cart-continue').onclick=()=>cartDialog.close();
  cartDialog.addEventListener('click',e=>{if(e.target===cartDialog){const r=cartDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)cartDialog.close();}});
  renderCart();
  function remaining() {
    const source = product.promoSource || product.id;
    const physical = catalog.find(p=>p.id===source);
    const used = readCart().reduce((n,x)=>{const p=catalog.find(p=>p.id===x.id);return n+(p && (p.promoSource||p.id)===source ? x.quantity*(p.promoUnits||1):0);},0);
    return Math.max(0,Math.floor(((physical?.stock||0)-used)/(product.promoUnits||1)));
  }
  function update() {
    const left = remaining(); quantity = Math.max(1, Math.min(quantity,left));
    $('#quantity').textContent = quantity; $('#minus').disabled = quantity <= 1 || !left;
    $('#plus').disabled = quantity >= left; $('#add').disabled = !left;
    $('#add').textContent = left ? (product.promoUnits?'AGREGAR PROMO AL CARRITO':'AGREGAR AL CARRITO') : product.stock ? 'TODO EL STOCK EN TU CARRITO' : 'SIN STOCK';
    $('#availability').textContent = product.stock ? 'Disponible · Precio y stock actualizados' : 'Temporalmente agotado';
    renderCart();
  }
  async function load() {
    reference.hidden = discount.hidden = saving.hidden = true;
    $('#retry').hidden = true; $('#add').disabled = $('#plus').disabled = $('#minus').disabled = true;
    try {
      const response = await fetch(host+'/api/productos.php',{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok) throw Error('catalog');
      const data = await response.json();
      if(!data.ok || !Array.isArray(data.productos))throw Error('catalog');
      catalog = cnPromoCatalog(data.productos);
      product = catalog.find(p=>p.promoSource===id) || catalog.find(p=>p.id===id);
      if(!product || !Number.isFinite(Number(product.price)) || Number(product.price)<=0 || !Number.isInteger(Number(product.stock)) || Number(product.stock)<0) throw Error('product');
      product.stock=Number(product.stock);
      $('h1').textContent=product.name;
      $('.purchase .eyebrow').textContent=product.promoUnits?'PRECIO POR PROMO DE 2 FRASCOS':'PRECIO POR UNIDAD';
      $('#price').textContent = new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(product.price);
      const listPrice = Number(product.referencePrice);
      if (Number.isFinite(listPrice) && listPrice > Number(product.price)) {
        const money = value => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(value);
        const struck = document.createElement('s');
        struck.textContent = money(listPrice); struck.setAttribute('aria-label','Precio de lista');
        reference.replaceChildren(struck);
        discount.textContent = `${Math.round((listPrice - Number(product.price)) / listPrice * 100)}% OFF`;
        if(product.promoUnits){discount.textContent='2×1';discount.style.cssText='background:#8B512F;color:white;padding:6px 12px;border-radius:6px';struck.setAttribute('aria-label','Precio de dos frascos sin promoción');}
        saving.textContent = `Ahorrás ${money(listPrice - Number(product.price))}`;
        reference.hidden = discount.hidden = saving.hidden = false;
      }
      $('#description').textContent = product.description;
      const photos=(product.images?.length?product.images:[product.image]).filter(x=>x&&!/\.(mp4|webm)(\?|$)/i.test(x)).map(x=>new URL(x,x.startsWith('/uploads/')?host:'https://tucasaesnatural.com/').href);
      $('#thumbnails').replaceChildren();
      photos.forEach((src,i)=>{const b=document.createElement('button'); b.type='button';b.setAttribute('aria-label',`Ver foto ${i+1}`);b.setAttribute('aria-pressed',String(i===0));const img=document.createElement('img');img.src=src;img.alt='';b.append(img);b.onclick=()=>{$('#product-image').src=src;$('#thumbnails').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};$('#thumbnails').append(b);});
      if(photos.length) $('#product-image').src=photos[0];
      const schema=JSON.parse($('#product-schema').textContent);schema.name=product.name;schema.sku=product.id;schema.description=product.description;schema.offers={'@type':'Offer',url:document.querySelector('[rel=canonical]').href,priceCurrency:'ARS',price:Number(product.price),availability:'https://schema.org/'+(product.stock?'InStock':'OutOfStock')};$('#product-schema').textContent=JSON.stringify(schema);
      update();
      window.CNAnalytics?.viewItem(product,unitPrice);
      track('ViewContent',product);
    } catch (_) {reference.hidden = discount.hidden = saving.hidden = true;$('#price').textContent='Precio no disponible';$('#availability').textContent='No pudimos verificar precio y stock. Reintentá antes de comprar.';$('#retry').hidden=false;$('#add').disabled=$('#plus').disabled=$('#minus').disabled=true;}
  }
  $('#minus').onclick=()=>{quantity--;update();};$('#plus').onclick=()=>{quantity++;update();};$('#retry').onclick=load;
  $('#add').onclick=()=>{
    try { if(!product || quantity>remaining()) {update();return;} const items=readCart();const existing=items.find(x=>x.id===product.id);if(existing)existing.quantity+=quantity;else items.push({id:product.id,quantity});sessionStorage.setItem(key,JSON.stringify({at:Date.now(),items}));$('#feedback').textContent=product.promoUnits?`Agregaste ${quantity} promo(s): ${quantity*product.promoUnits} frascos al carrito.`:`Agregaste ${quantity} unidad(es) al carrito.`;$('#next').hidden=false;window.CNAnalytics?.addToCart(product,quantity,unitPrice);track('AddToCart',product,quantity);update(); }
    catch(_){$('#feedback').textContent='No pudimos guardar el carrito en este navegador. Volvé a la colección para comprar.';}
  };
  document.querySelectorAll('a[href*="checkout=1"]').forEach(link=>link.addEventListener('click',()=>{
    const lines=readCart().map(x=>[catalog.findIndex(p=>p.id===x.id),x.quantity]).filter(([i])=>i>=0);
    window.CNAnalytics?.beginCheckout(lines,catalog,unitPrice);
  }));
  load();
})();
