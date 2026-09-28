/* Bundles use existing product IDs; checkout and inventory remain server-validated. */
(() => {
  const definitions = [
    {id:'bruschetta',name:'La Bruschetta',description:'Tres sabores para tu próxima tostada.',note:'3 frascos · Pan no incluido.',items:['pasta-de-aceitunas-verdes','tomates-secos-mediterraneos','aceitunas-negras-premium']},
    {id:'amigos',name:'Mesa de Amigos',description:'Una selección para acompañar tu próxima picada.',note:'4 frascos para compartir.',items:['aceitunas-verdes-magna','berenjenas-condimentadas','pepinitos-en-vinagre','tomates-secos-mediterraneos']},
    {id:'regalo',name:'Quedá Bien',description:'Un detalle rico para llevar y compartir.',note:'4 frascos · Presentación de regalo no incluida.',items:['pasta-de-aceitunas-verdes','tomates-secos-mediterraneos','aceitunas-negras-premium','pimientos-agridulces']},
    {id:'completa',name:'La Mesa Completa',description:'Nuestra selección más completa de conservas y untables.',note:'7 frascos · Pan, quesos y accesorios no incluidos.',items:['aceitunas-verdes-magna','aceitunas-negras-premium','tomates-secos-mediterraneos','berenjenas-condimentadas','pepinitos-en-vinagre','pimientos-agridulces','pasta-de-aceitunas-verdes']}
  ];
  const style = document.createElement('style');
  style.textContent = `#combos{scroll-margin-top:100px;background:#eeeede;padding:56px 0}.combo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.combo-card{background:#fffdf8;border:1px solid #d8d7c5;padding:24px;display:flex;flex-direction:column;min-width:0}.combo-card h3{font-size:30px;margin:0 0 10px}.combo-card p{line-height:1.5}.combo-photo{display:flex;align-items:end;justify-content:center;gap:4px;height:180px;background:white;margin:12px 0 18px}.combo-photo img{width:calc(100% / var(--count));min-width:0;height:100%;object-fit:contain}.combo-photo img.small-jar{height:77%}.combo-card ul{padding-left:20px;font:14px/1.6 Arial,sans-serif;margin:0 0 16px}.combo-note{font:12px/1.5 Arial,sans-serif;color:#626454}.combo-price{margin-top:auto;padding-top:16px;border-top:1px solid #e2dece}.combo-price del{color:#777;font:14px Arial,sans-serif}.combo-price strong{display:block;font:700 34px Arial,sans-serif;margin:8px 0}.combo-saving{color:#465536;font:700 18px Arial,sans-serif}.combo-saving small{font-size:13px}.combo-card .button{width:100%;margin-top:18px;cursor:pointer}.combo-card .button:disabled{opacity:.45;cursor:not-allowed}#combo-status{font:700 15px/1.5 Arial,sans-serif;color:#465536;min-height:24px}.combo-explainer{max-width:720px;font:14px/1.6 Arial,sans-serif;margin:14px 0 24px}@media(max-width:650px){.combo-grid{grid-template-columns:1fr}.combo-card{padding:20px}.combo-photo{height:150px}.combo-card h3{font-size:28px}.nav-main{flex-wrap:wrap}}`;
  document.head.append(style);
  const section = document.createElement('section');
  section.id = 'combos'; section.setAttribute('aria-labelledby','combos-title');
  section.innerHTML = '<div class="wrap"><p class="eyebrow">Elegí tu próximo encuentro</p><h2 id="combos-title">Combos</h2><p class="combo-explainer">Selecciones listas para sumar a tu carrito. Un frasco de cada producto, con los precios vigentes de la web. El ahorro se compara con el precio de lista; no es un descuento adicional por combo. Envío según tu localidad y el total de la compra.</p><p id="combo-status" role="status" aria-live="polite"></p><div class="combo-grid"></div></div>';
  document.querySelector('#productos').before(section);
  const nav = document.createElement('a'); nav.href='#combos';nav.textContent='Combos';
  document.querySelector('.nav-main').prepend(nav);
  function resolve(def) { return def.items.map(id=>({index:CONFIG.products.findIndex(p=>p.id===id)})).map(({index})=>({index,product:CONFIG.products[index]})); }
  function render() {
    const grid = section.querySelector('.combo-grid');
    if (!catalogReady) { grid.innerHTML='<p>Los combos estarán disponibles cuando se verifiquen los precios y el stock del catálogo.</p>'; return; }
    grid.innerHTML=definitions.map(def=>{
      const entries=resolve(def), missing=entries.some(e=>!e.product);
      if(missing) return `<article class="combo-card"><h3>${safe(def.name)}</h3><p>Esta selección no está disponible por el momento.</p></article>`;
      const total=entries.reduce((s,e)=>s+e.product.price,0);
      const list=entries.reduce((s,e)=>s+Math.max(e.product.price,e.product.referencePrice||0),0);
      const saving=list-total;
      const available=entries.every(e=>e.product.stock>(cart.get(e.index)||0));
      return `<article class="combo-card" data-combo-card="${def.id}"><h3>${safe(def.name)}</h3><p>${safe(def.description)}</p><div class="combo-photo" style="--count:${entries.length}">${entries.map(e=>`<img loading="lazy" class="${/pasta-de|tomates-secos/.test(e.product.id)?'small-jar':''}" src="${safe(e.product.image)}" alt="${safe(e.product.name)}">`).join('')}</div><ul>${entries.map(e=>`<li>1 frasco de ${safe(e.product.name)}</li>`).join('')}</ul><p class="combo-note">${safe(def.note)}</p><div class="combo-price">${saving>0?`<del>Lista ${money(list)}</del>`:''}<strong>${money(total)}</strong>${saving>0?`<span class="combo-saving">Ahorrás ${money(saving)} <small>(${(saving/list*100).toLocaleString('es-AR',{maximumFractionDigits:1})}%)</small></span>`:''}</div><button class="button" type="button" data-add-combo="${def.id}" ${available?'':'disabled'}>${available?'Agregar combo al carrito':'Sin disponibilidad para sumar otro'}</button></article>`;
    }).join('');
  }
  section.addEventListener('click',event=>{
    const button=event.target.closest('[data-add-combo]'); if(!button||!catalogReady)return;
    const def=definitions.find(d=>d.id===button.dataset.addCombo); if(!def)return;
    const entries=resolve(def);
    if(entries.some(e=>!e.product||e.product.stock<=(cart.get(e.index)||0))) {render();section.querySelector('#combo-status').textContent='No hay stock suficiente para agregar el combo completo.';return;}
    entries.forEach(e=>cart.set(e.index,(cart.get(e.index)||0)+1));
    renderCart();
    section.querySelector('#combo-status').textContent=`${def.name} agregado: ${entries.length} frascos. Podés revisar cada producto en tu carrito.`;
    track('AddToCart',{content_ids:entries.map(e=>e.product.id),contents:entries.map(e=>({id:e.product.id,quantity:1,item_price:e.product.price})),content_type:'product',value:entries.reduce((s,e)=>s+e.product.price,0),currency:'ARS'});
    document.querySelector('#cart-panel').classList.add('open');
  });
  document.addEventListener('cn:cart-updated',render);
  render();
})();
