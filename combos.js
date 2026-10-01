/* Bundles use existing product IDs; checkout and inventory remain server-validated. */
(() => {
  const comboPage = /\/combos\.html$/.test(location.pathname);
  document.documentElement.classList.add(comboPage ? 'catalog-combos' : 'catalog-selection');
  const definitions = [
    {id:'bruschetta',name:'La Bruschetta',description:'Tres sabores para tu próxima tostada.',note:'3 frascos · Pan no incluido.',items:['pasta-de-aceitunas-verdes','tomates-secos-mediterraneos','aceitunas-negras-premium']},
    {id:'amigos',name:'Mesa de Amigos',description:'Una selección para acompañar tu próxima picada.',note:'4 frascos para compartir.',items:['aceitunas-verdes-magna','berenjenas-condimentadas','pepinitos-en-vinagre','tomates-secos-mediterraneos']},
    {id:'regalo',name:'Quedá Bien',description:'Un detalle rico para llevar y compartir.',note:'4 frascos · Presentación de regalo no incluida.',items:['pasta-de-aceitunas-verdes','tomates-secos-mediterraneos','aceitunas-negras-premium','pimientos-agridulces']},
    {id:'completa',name:'La Mesa Completa',description:'Nuestra selección más completa de conservas y untables.',note:'7 frascos · Pan, quesos y accesorios no incluidos.',items:['aceitunas-verdes-magna','aceitunas-negras-premium','tomates-secos-mediterraneos','berenjenas-condimentadas','pepinitos-en-vinagre','pimientos-agridulces','pasta-de-aceitunas-verdes']}
  ];
  const style = document.createElement('style');
  style.textContent = `#combos{scroll-margin-top:100px;background:#eeeede;padding:56px 0}.combo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.combo-card{background:#fffdf8;border:1px solid #d8d7c5;padding:24px;display:flex;flex-direction:column;min-width:0}.combo-card h3{font-size:30px;margin:0 0 10px}.combo-card p{line-height:1.5}.combo-photo{display:flex;align-items:end;justify-content:center;gap:4px;height:180px;background:white;margin:12px 0 18px}.combo-photo img{width:calc(100% / var(--count));min-width:0;height:100%;object-fit:contain}.combo-photo img.small-jar{height:77%}.combo-card ul{padding-left:20px;font:14px/1.6 Arial,sans-serif;margin:0 0 16px}.combo-note{font:12px/1.5 Arial,sans-serif;color:#626454}.combo-price{margin-top:auto;padding-top:16px;border-top:1px solid #e2dece}.combo-price del{color:#777;font:14px Arial,sans-serif}.combo-price strong{display:block;font:700 34px Arial,sans-serif;margin:8px 0}.combo-saving{color:#465536;font:700 18px Arial,sans-serif}.combo-saving small{font-size:13px}.combo-card .button{width:100%;margin-top:18px;cursor:pointer}.combo-card .button:disabled{opacity:.45;cursor:not-allowed}#combo-status{font:700 15px/1.5 Arial,sans-serif;color:#465536;min-height:24px}.combo-explainer{max-width:720px;font:14px/1.6 Arial,sans-serif;margin:14px 0 24px}@media(max-width:650px){.combo-grid{grid-template-columns:1fr}.combo-card{padding:20px}.combo-photo{height:150px}.combo-card h3{font-size:28px}.nav-main{flex-wrap:wrap}}`;
  document.head.append(style);
  const layoutStyle = document.createElement('style');
  layoutStyle.textContent = `
    .catalog-selection #combos,.catalog-combos #productos{display:none!important}
    .catalog-tabs{display:flex;gap:8px;max-width:1120px;margin:0 auto;padding:24px 20px 0}
    .catalog-tabs a{flex:1;text-align:center;padding:20px 12px;border:1px solid #465536;background:#faf7ef;color:#465536;font:700 15px Arial,sans-serif;letter-spacing:.06em;text-decoration:none;border-radius:8px 8px 0 0}
    .catalog-tabs a[aria-current=page]{background:#465536;color:white;border-bottom:4px solid #293422}
    .catalog-tabs a:hover{box-shadow:inset 0 0 0 2px #465536}
    .catalog-tabs a:focus-visible{outline:3px solid #9c463b;outline-offset:3px}
    .catalog-combos #combos{padding-top:32px}.combo-explainer{margin-bottom:12px}#combo-status:empty{display:none}
    .combo-photo{position:relative;display:block;isolation:isolate;overflow:hidden;height:270px;background:#f5f1e7;margin:12px 0 18px;border-radius:8px}
    .combo-photo:after{content:'';position:absolute;bottom:16px;left:14%;right:14%;height:18px;background:radial-gradient(ellipse,#b9b3a0,transparent 70%);z-index:-1}
    .combo-photo img,.combo-photo img.small-jar{position:absolute;bottom:18px;left:calc(50% + var(--x));width:auto;max-width:none;height:230px;object-fit:contain;transform:translateX(-50%);clip-path:inset(6% 24% 8% 24% round 18% 18% 14% 14%);z-index:var(--layer)}
    .combo-photo{background:#fff}.combo-photo img[alt*="Pasta"]{clip-path:inset(3% 4% 3% 4% round 12%)}.combo-photo img[alt*="Pimientos"]{clip-path:inset(3% 8% 3% 8% round 12%)}.combo-photo img[alt*="Tomates"]{clip-path:inset(6% 17% 8% 17% round 12%)}
    .combo-photo img.small-jar{height:190px;bottom:5px}
    .combo-photo.many img{width:auto;height:190px;bottom:50px}
    .combo-photo.many img.small-jar{height:157px;bottom:4px}
    @media(max-width:850px){.combo-grid{grid-template-columns:1fr}}
    @media(max-width:650px){.catalog-tabs{padding:18px 14px 0;gap:6px}.catalog-tabs a{font-size:12px;letter-spacing:.02em;padding:18px 8px}.combo-photo{height:230px}.combo-photo img{height:200px}.combo-photo img.small-jar{height:165px}.combo-photo.many img{height:165px}.combo-photo.many img.small-jar{height:140px}.nav-main{gap:12px}}
  `;
  document.head.append(layoutStyle);
  const tabs=document.createElement('nav');tabs.className='catalog-tabs';tabs.setAttribute('aria-label','Elegí cómo comprar');
  tabs.innerHTML=`<a href="combos.html" ${comboPage?'aria-current="page"':''}>COMBOS</a><a href="index.html#productos" ${!comboPage?'aria-current="page"':''}>COLECCIÓN PARA VOS</a>`;
  document.querySelector('#productos').before(tabs);
  const section = document.createElement('section');
  section.id = 'combos'; section.setAttribute('aria-labelledby','combos-title');
  section.innerHTML = '<div class="wrap"><p class="eyebrow">Elegí tu próximo encuentro</p><h2 id="combos-title">Combos</h2><p class="combo-explainer">Selecciones listas para sumar a tu carrito. Un frasco de cada producto, con los precios vigentes de la web. El ahorro se compara con el precio de lista; no es un descuento adicional por combo. Envío según tu localidad y el total de la compra.</p><p id="combo-status" role="status" aria-live="polite"></p><div class="combo-grid"></div></div>';
  document.querySelector('#productos').before(section);
  const nav = document.createElement('a'); nav.href='combos.html';nav.textContent='Combos';
  document.querySelector('.nav-main').prepend(nav);
  const commerceLink=document.createElement('a');
  commerceLink.href='comercios/';commerceLink.textContent='Soy un comercio';
  document.querySelector('.nav-main').append(commerceLink);
  document.querySelector('#comercios').style.scrollMarginTop='150px';
  document.querySelector('.nav-main a[href="#productos"]').href='index.html#productos';
  const collectionLink=document.querySelector('.nav-main a[href="index.html#productos"]');
  collectionLink.textContent='La colección';
  document.querySelector('.nav-main').prepend(collectionLink);
  document.querySelector('.brand').href='index.html';
  if(comboPage){document.title='Combos | Casa Natural';document.querySelector('link[rel="canonical"]')?.setAttribute('href','https://tucasaesnatural.com/combos.html');}
  function groupPhotos(entries){
    const def=definitions.find(d=>d.items.length===entries.length && d.items.every(id=>entries.some(e=>e.product.id===id)));
    return `<img class="combo-family" loading="lazy" decoding="async" width="1536" height="1024" style="display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:contain;margin:12px 0 18px" src="combo-${def.id}.jpg" alt="${safe(def.name)}: ${entries.map(e=>safe(e.product.name)).join(', ')}">`;
  }
  function resolve(def) { return def.items.map(id=>({index:CONFIG.products.findIndex(p=>p.id===id)})).map(({index})=>({index,product:CONFIG.products[index]})); }
  // Hero markup and critical styles are available in the initial HTML.
  const promo=document.querySelector('#inicio .combo-promos');
  let promoIndex=0;
  let promoTimer;
  function selectPromo(index){
    clearTimeout(promoTimer);
    const slides=[...promo.querySelectorAll('.promo-banner')];
    if(!slides.length)return;
    promoIndex=(index+slides.length)%slides.length;
    if(promoIndex!==0)promo.classList.add('hero-started');
    slides.forEach((slide,i)=>slide.hidden=i!==promoIndex);
    promo.querySelectorAll('[data-slide]').forEach((dot,i)=>dot.setAttribute('aria-current',String(i===promoIndex)));
    const video=promo.querySelector('video');
    const active=video&&!video.closest('.promo-banner').hidden;
    if(video){if(active&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden){video.play().catch(()=>{});}else video.pause();}
    if(!document.hidden)promoTimer=setTimeout(()=>selectPromo(promoIndex+1),5000);
  }
  promo.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;selectPromo(b.hasAttribute('data-slide')?Number(b.dataset.slide):promoIndex+Number(b.dataset.direction));});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(promoTimer);promo.querySelector('video')?.pause();}else selectPromo(promoIndex);});
  promo.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();selectPromo(promoIndex+(event.key==='ArrowRight'?1:-1));}});
  let touchStart=null;
  promo.addEventListener('touchstart',e=>{touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  promo.addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))selectPromo(promoIndex+(dx<0?1:-1));touchStart=null;},{passive:true});
  let initialAnchorHandled=false;
  function refreshPromos(){
    section.querySelectorAll('[data-combo-card]').forEach(card=>{
      card.id='combo-'+card.dataset.comboCard;
      const add=card.querySelector('[data-add-combo]');
      if(add&&!card.querySelector('[data-buy-combo]')){
        const buy=add.cloneNode(true);
        buy.dataset.buyCombo='true';buy.textContent=add.disabled?'Sin disponibilidad':'COMPRAR AHORA';
        buy.setAttribute('aria-label','Comprar '+card.querySelector('h3').textContent);
        const actions=document.createElement('div');actions.className='combo-actions';
        add.before(actions);actions.append(buy,add);
        add.classList.add('light');
        if(!add.disabled)add.textContent='AGREGAR AL CARRITO Y SEGUIR COMPRANDO';
      }
    });
    if(comboPage&&!initialAnchorHandled&&catalogReady){const target=[...section.querySelectorAll('[id]')].find(el=>'#'+el.id===location.hash)||section;requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));initialAnchorHandled=true;}
  }
  function render() {
    const grid = section.querySelector('.combo-grid');
    if (!catalogReady) { grid.innerHTML='<p>Los combos estarán disponibles cuando se verifiquen los precios y el stock del catálogo.</p>'; return; }
    grid.innerHTML=definitions.map(def=>{
      const entries=resolve(def), missing=entries.some(e=>!e.product);
      if(missing) return `<article class="combo-card"><h3>${safe(def.name)}</h3><p>Esta selección no está disponible por el momento.</p></article>`;
      const total=entries.reduce((s,e)=>s+e.product.price,0);
      const list=entries.reduce((s,e)=>s+Math.max(e.product.price,e.product.referencePrice||0),0);
      const saving=list-total;
      const available=entries.every(e=>cnRemaining(e.product)>0);
      return `<article class="combo-card" data-combo-card="${def.id}"><h3>${safe(def.name)}</h3><p>${safe(def.description)}</p>${groupPhotos(entries)}<ul>${entries.map(e=>`<li>1 frasco de ${safe(e.product.name)}</li>`).join('')}</ul><p class="combo-note">${safe(def.note)}</p><div class="combo-price">${saving>0?`<del>Lista ${money(list)}</del>`:''}<strong>${money(total)}</strong>${saving>0?`<span class="combo-saving">Ahorrás ${money(saving)} <small>(${(saving/list*100).toLocaleString('es-AR',{maximumFractionDigits:1})}%)</small></span>`:''}</div><button class="button" type="button" data-add-combo="${def.id}" ${available?'':'disabled'}>${available?'Agregar combo al carrito':'Sin disponibilidad para sumar otro'}</button></article>`;
    }).join('');
  }
  section.addEventListener('click',event=>{
    const button=event.target.closest('[data-add-combo]'); if(!button||!catalogReady)return;
    const def=definitions.find(d=>d.id===button.dataset.addCombo); if(!def)return;
    const entries=resolve(def);
    if(entries.some(e=>!e.product||cnRemaining(e.product)<=0)) {render();section.querySelector('#combo-status').textContent='No hay stock suficiente para agregar el combo completo.';return;}
    entries.forEach(e=>cart.set(e.index,(cart.get(e.index)||0)+1));
    renderCart();
    section.querySelector('#combo-status').textContent=`${def.name} agregado: ${entries.length} frascos. Podés revisar cada producto en tu carrito.`;
    if(window.CNAnalytics)CNAnalytics.addToCartLines(entries.map(e=>({product:e.product,quantity:1})),product=>cnCoupon.unitPrice(product));
    track('AddToCart',{content_ids:entries.map(e=>e.product.id),contents:entries.map(e=>({id:e.product.id,quantity:1,item_price:e.product.price})),content_type:'product',value:entries.reduce((s,e)=>s+e.product.price,0),currency:'ARS'});
    if(button.hasAttribute('data-buy-combo')){location.href=location.pathname+'?checkout=1';return;}
    document.querySelector('#cart-panel').classList.remove('open');
  });
  document.addEventListener('cn:cart-updated',render);
  document.addEventListener('cn:cart-updated',refreshPromos);
  selectPromo(0);
  render();
  refreshPromos();
})();
