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
  // Real text keeps prices current and readable at every screen size.
  const promo=document.createElement('section');
  promo.className='combo-promos';promo.hidden=true;
  promo.setAttribute('aria-label','Promociones de combos');
  promo.setAttribute('aria-roledescription','carrusel');
  const hero=document.querySelector('#inicio');
  const originalHero=hero.querySelector('.hero-banner').outerHTML;
  hero.querySelector('.wrap').append(promo);
  const promoStyle=document.createElement('style');
  promoStyle.textContent=`
    .combo-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.combo-card .combo-actions .button{margin:0;min-width:0;padding:14px 8px;font-size:11px;letter-spacing:.03em;min-height:48px}.combo-actions .button.light{background:transparent;color:#465536;border-color:#465536}.combo-actions .button.light:hover{background:#eeefdf}
    .combo-promos{max-width:1120px;margin:28px auto;padding:0 20px}.combo-promos[hidden]{display:none}
    .promo-banner{display:grid;grid-template-columns:1fr 1.15fr;align-items:center;background:#f5f1e7;border:1px solid #dbd6c5;color:#303c28;text-decoration:none;overflow:hidden;border-radius:12px}
    .promo-banner[hidden]{display:none}.promo-copy{padding:30px}.promo-copy h2{font-size:clamp(27px,3.4vw,46px);margin:10px 0}.promo-copy p{font:15px/1.4 Arial,sans-serif;margin:10px 0}.promo-copy del{font:14px Arial,sans-serif;color:#65665b}.promo-copy strong{display:block;font:700 clamp(26px,3vw,38px) Arial,sans-serif;margin:8px 0}.promo-save{display:block;color:#465536;font:700 17px Arial,sans-serif}.promo-save small{font-size:13px}.promo-cta{display:inline-block;background:#465536;color:white;padding:12px 18px;margin-top:18px;font:700 12px Arial,sans-serif;letter-spacing:.05em}.promo-banner img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:contain}
    .promo-controls{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}.promo-controls button{cursor:pointer;border:1px solid #465536;background:#fffdf8;color:#465536;min-width:44px;min-height:44px;font:bold 20px Arial,sans-serif;border-radius:50%}.promo-controls button[aria-current=true]{background:#465536;color:white}.promo-banner:focus-visible,.promo-controls button:focus-visible{outline:3px solid #983e32;outline-offset:3px}.combo-card{scroll-margin-top:120px}.combo-card:target{outline:2px solid #465536}
    @media(max-width:600px){.combo-promos{padding:0 14px;margin:20px auto}.promo-banner{grid-template-columns:1fr 1fr}.promo-copy{padding:18px 12px}.promo-copy h2{font-size:25px}.promo-copy p{font-size:12px}.promo-copy strong{font-size:25px}.promo-save{font-size:14px}.promo-copy del{font-size:12px}.promo-cta{font-size:10px;padding:10px}.promo-controls{gap:6px}.promo-copy .eyebrow{font-size:10px}}
  `;
  document.head.append(promoStyle);
  const heroCarouselStyle=document.createElement('style');
  heroCarouselStyle.textContent=`
    #inicio .combo-promos{position:relative;max-width:none;margin:0;padding:0}
    #inicio .promo-banner{height:clamp(430px,34vw,560px);border:0;border-radius:0;grid-template-columns:.9fr 1.1fr}
    #inicio .promo-banner>img{height:100%;max-height:560px;object-fit:contain}
    #inicio .promo-copy{padding:30px clamp(24px,5vw,80px)}
    #inicio .promo-cover{position:relative;display:block}
    #inicio .promo-cover .hero-banner{height:100%;min-height:0}
    #inicio .promo-cover .hero-photo{height:100%;min-height:0}
    #inicio .promo-cover .hero-photo img{height:100%;width:100%;margin:0;object-fit:cover}
    #inicio .promo-cover[hidden],#inicio .promo-banner[hidden]{display:none}
    #inicio .promo-controls{padding:0 8px;gap:8px}
    #inicio .promo-controls [data-slide]{min-width:12px;min-height:12px;width:12px;height:12px;padding:0;font-size:0}
    @media(max-width:1000px){#inicio .promo-cover .hero-banner{display:block}#inicio .promo-cover .hero-copy{position:absolute;top:20px;left:24px;width:45%;padding:0;margin:0}#inicio .promo-cover .hero-copy h1{font-size:32px}}
    @media(max-width:600px){#inicio .promo-banner{height:560px;grid-template-columns:1fr;grid-template-rows:auto 240px}#inicio .promo-copy{padding:24px 24px 8px}#inicio .promo-banner>img{height:240px}#inicio .promo-copy h2{font-size:32px}#inicio .promo-cover .hero-copy{top:24px;left:24px;width:calc(100% - 48px)}#inicio .promo-cover .hero-photo img{object-position:68% bottom}#inicio .promo-cover .hero-photo{position:absolute;bottom:0;width:100%;height:300px}#inicio .promo-cover .hero-banner{background:#f6f1e8}#inicio .promo-cover .hero-copy .lead{max-width:290px}}
  `;
  document.head.append(heroCarouselStyle);
  const unifiedStyle=document.createElement('style');
  unifiedStyle.textContent=`
    #inicio .promo-banner{position:relative;isolation:isolate;height:560px;background:#f5eee3 url('carousel-lino-v1.jpg') center/cover no-repeat;display:block}
    #inicio .promo-banner>.promo-copy,#inicio .promo-cover .hero-copy{position:absolute;inset:44px auto 44px max(28px,calc((100% - 1120px)/2));width:40%;max-width:440px;height:auto;margin:0;padding:0;background:transparent;display:grid;grid-template-rows:26px 106px 60px 24px 48px 30px 1fr;align-items:start;justify-items:start;text-align:left;z-index:2}
    #inicio .promo-copy .eyebrow,#inicio .hero-copy .eyebrow{grid-row:1;font:700 11px/1.4 Arial,sans-serif;letter-spacing:.16em;color:#465536;margin:0}
    #inicio .promo-copy h2,#inicio .hero-copy h1{grid-row:2;font-size:40px;line-height:1.08;letter-spacing:-.04em;margin:0;max-width:440px}
    #inicio .promo-copy p,#inicio .hero-copy .lead{grid-row:3;font:16px/1.45 Arial,sans-serif;margin:0;max-width:410px;color:#414b39}
    #inicio .promo-copy del{grid-row:4;margin:0}#inicio .promo-copy strong{grid-row:5;margin:0;font-size:36px}#inicio .promo-save{grid-row:6;margin:0}
    #inicio .promo-copy .promo-cta,#inicio .hero-copy .hero-cta{grid-row:7;align-self:end;margin:0;padding:15px 20px;font:700 11px/1.3 Arial,sans-serif;letter-spacing:.05em;background:#465536;color:white;border:1px solid #465536}
    #inicio .promo-banner>img{position:absolute;right:3%;bottom:25px;width:52%;height:86%;max-height:none;object-fit:contain;mix-blend-mode:normal}
    #inicio .promo-cover .hero-banner{position:static;background:transparent;display:block}
    #inicio .promo-cover .hero-photo{position:absolute;inset:0;width:100%;height:100%}
    @media(max-width:1000px){#inicio .promo-copy h2,#inicio .hero-copy h1{font-size:34px}#inicio .promo-banner>.promo-copy,#inicio .promo-cover .hero-copy{left:28px;width:43%}}
    @media(max-width:600px){#inicio .promo-banner{height:720px;background-position:center}#inicio .promo-banner>.promo-copy,#inicio .promo-cover .hero-copy{inset:24px 24px auto;width:auto;max-width:none;height:386px;grid-template-rows:24px 84px 60px 24px 44px 28px 1fr}#inicio .promo-copy h2,#inicio .hero-copy h1{font-size:32px}#inicio .promo-copy p,#inicio .hero-copy .lead{font-size:14px;max-width:none}#inicio .promo-copy strong{font-size:30px}#inicio .promo-banner>img{right:5%;bottom:10px;width:90%;height:290px}#inicio .promo-cover .hero-photo{top:auto;bottom:0;height:300px}#inicio .promo-cover .hero-photo img{object-position:70% bottom}#inicio .promo-cover .hero-copy{background:transparent}}
  `;
  document.head.append(unifiedStyle);
  const comboTitleStyle=document.createElement('style');
  comboTitleStyle.textContent=`#inicio .promo-banner[href^="combos.html#combo-"] h2{font-size:clamp(40px,3.6vw,52px);font-weight:700;color:var(--wine);line-height:1.04}@media(max-width:600px){#inicio .promo-banner[href^="combos.html#combo-"] h2{font-size:36px;line-height:1.08}}`;
  document.head.append(comboTitleStyle);
  const videoStyle=document.createElement('style');
  videoStyle.textContent=`#inicio .promo-video video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}#inicio .promo-video:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(246,240,228,.94) 0%,rgba(246,240,228,.88) 38%,rgba(246,240,228,.3) 68%,rgba(246,240,228,.13));z-index:1;pointer-events:none}.video-toggle{display:block;margin:10px auto;background:#f6f0e4;color:#465536;border:1px solid #465536;padding:9px 14px;cursor:pointer}.video-toggle[hidden]{display:none}@media(max-width:600px){#inicio .promo-video video{object-position:85% center}#inicio .promo-video:after{background:linear-gradient(180deg,rgba(246,240,228,.95) 0%,rgba(246,240,228,.88) 53%,rgba(246,240,228,.15) 78%)}}`;
  document.head.append(videoStyle);
  const navigationStyle=document.createElement('style');
  navigationStyle.textContent=`#inicio .promo-controls [data-direction]{position:absolute;top:280px;transform:translateY(-50%);z-index:4;width:44px;height:44px;background:rgba(255,253,248,.94);box-shadow:0 2px 10px #0002;border:1px solid #d6d0c4;font-size:24px}#inicio .promo-controls [data-direction="-1"]{left:8px}#inicio .promo-controls [data-direction="1"]{right:8px}#inicio .promo-controls [data-direction]:hover{background:#465536;color:white}@media(max-width:600px){#inicio .promo-controls [data-direction]{top:360px}}`;
  document.head.append(navigationStyle);
  const motionStyle=document.createElement('style');
  motionStyle.textContent=`#inicio .promo-banner:not([hidden]){animation:promoFade .7s ease both}@keyframes promoFade{from{opacity:0}to{opacity:1}}#inicio .promo-cover .hero-photo{inset:0;height:100%}#inicio .promo-cover video{width:100%;height:100%;object-fit:cover}#inicio .promo-cover .hero-banner:after{display:block;background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.12) 75%)}#inicio .promo-cover .hero-copy h1,#inicio .promo-cover .hero-copy .eyebrow,#inicio .promo-cover .hero-copy .lead{color:#fff;text-shadow:0 1px 8px #0006}#inicio .promo-collection>img{inset:0;width:100%;height:100%;object-fit:cover}@media(max-width:600px){#inicio .promo-collection>img{top:auto;height:300px;object-position:70% bottom}#inicio .promo-cover .hero-banner:after{background:linear-gradient(180deg,rgba(0,0,0,.6),rgba(0,0,0,.1))}}@media(prefers-reduced-motion:reduce){#inicio .promo-banner:not([hidden]){animation:none}}`;
  document.head.append(motionStyle);
  let promoIndex=0;
  let promoTimer;
  function selectPromo(index){
    clearTimeout(promoTimer);
    const slides=[...promo.querySelectorAll('.promo-banner')];
    if(!slides.length)return;
    promoIndex=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>slide.hidden=i!==promoIndex);
    promo.querySelectorAll('[data-slide]').forEach((dot,i)=>dot.setAttribute('aria-current',String(i===promoIndex)));
    const video=promo.querySelector('video');
    const active=video&&!video.closest('.promo-banner').hidden;
    if(video){if(active&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.hidden){video.play().catch(()=>{});}else video.pause();}
    if(!document.hidden)promoTimer=setTimeout(()=>selectPromo(promoIndex+1),5000);
  }
  function renderPromos(){
    if(!catalogReady)return;
    const available=definitions.filter(def=>resolve(def).every(e=>e.product));
    promo.hidden=!available.length;
    if(available.length) hero.querySelector('.wrap > .hero-banner')?.remove();
    promo.innerHTML=`<a class="promo-banner promo-all-combos" href="combos.html#combos" aria-label="Ver todos los combos"><div class="promo-copy"><span class="eyebrow">COMBOS CASA NATURAL</span><h2>Combos creados para vos</h2><p>Descubrí nuestros combos y elegí el tuyo para disfrutar o compartir.</p><span class="promo-cta">VER TODOS LOS COMBOS →</span></div><img src="assets/optimized/combo-completa-cutout-1280.webp" srcset="assets/optimized/combo-completa-cutout-640.webp 640w, assets/optimized/combo-completa-cutout-1280.webp 1280w" sizes="(max-width: 650px) 100vw, 60vw" alt="Conservas y untables Jumbalay reunidos en un combo" width="1536" height="1024"></a>`;
    promo.insertAdjacentHTML('afterbegin',`<div class="promo-banner promo-cover">${originalHero}</div>`);
    const coverCta=promo.querySelector('.promo-cover .hero-cta');
    coverCta.href='index.html#productos';
    coverCta.textContent='VER PRODUCTOS Y PRECIOS';
    const names=['Presentación','Todos los combos'];
    promo.insertAdjacentHTML('beforeend',`<div class="promo-controls"><button type="button" data-direction="-1" aria-label="Diapositiva anterior">←</button>${names.map((name,i)=>`<button type="button" data-slide="${i}" aria-label="Mostrar ${safe(name)}" aria-current="${i===promoIndex}">${i+1}</button>`).join('')}<button type="button" data-direction="1" aria-label="Diapositiva siguiente">→</button></div>`);
    const coverPhoto=promo.querySelector('.promo-cover .hero-photo');
    const video=document.createElement('video');video.src='portada-video-final.mp4';video.poster=matchMedia('(max-width: 650px)').matches?'assets/optimized/hero-tostada-final-640.webp':'assets/optimized/hero-tostada-final-1280.webp';video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');coverPhoto.replaceChildren(video);
    selectPromo(promoIndex);
  }
  promo.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;selectPromo(b.hasAttribute('data-slide')?Number(b.dataset.slide):promoIndex+Number(b.dataset.direction));});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(promoTimer);promo.querySelector('video')?.pause();}else selectPromo(promoIndex);});
  promo.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();selectPromo(promoIndex+(event.key==='ArrowRight'?1:-1));}});
  let touchStart=null;
  promo.addEventListener('touchstart',e=>{touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  promo.addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))selectPromo(promoIndex+(dx<0?1:-1));touchStart=null;},{passive:true});
  let initialAnchorHandled=false;
  function refreshPromos(){
    renderPromos();
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
  render();
  refreshPromos();
})();
