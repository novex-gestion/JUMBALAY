// Shared stock remains expressed in physical jars. The promo is a pair.
function cnPromoCatalog(products) {
  return products.flatMap(p => p.id === 'pepinitos-en-vinagre' && p.price === 10500 ? [
    {...p, collectionHidden:true},
    {...p,id:'pepinitos-2x1',name:'Pepinitos en vinagre · 2×1',
      description:'Llevá 2 frascos por $10.500 · $5.250 cada uno. El selector cuenta promos de 2 frascos. Envío según condiciones habituales.',
      referencePrice:21000,stock:Math.floor(p.stock/2),promoSource:p.id,promoUnits:2}
  ] : [p]);
}
function cnRemaining(product) {
  const source=product.promoSource||product.id;
  const physical=CONFIG.products.find(p=>p.id===source);
  let used=0;
  for(const [i,q] of cart){const p=CONFIG.products[i];if((p.promoSource||p.id)===source)used+=q*(p.promoUnits||1);}
  return Math.max(0,Math.floor(((physical?.stock||0)-used)/(product.promoUnits||1)));
}
document.addEventListener('cn:cart-updated',()=>{
  CONFIG.products.forEach((p,i)=>{
    if(!p.promoUnits)return;
    const card=document.querySelector(`#price-${i}`)?.closest('.card');if(!card)return;
    card.querySelector('.price-quantity-label').textContent=`Precio por ${draftQuantities.get(i)||1} promo(s) de 2 frascos`;
    const add=card.querySelector('[data-add-product]');if(!add.disabled)add.textContent='AGREGAR PROMO AL CARRITO';
    const badge=card.querySelector('.discount-inline');if(badge){
      badge.textContent='2×1';
      Object.assign(badge.style,{backgroundColor:'#E7AE38',color:'#3B290E',fontSize:'1.05rem',fontWeight:'800',padding:'6px 12px',lineHeight:'1.2',borderRadius:'6px',whiteSpace:'nowrap'});
    }
    const priceRef=card.querySelector('.reference-price s');if(priceRef)priceRef.setAttribute('aria-label','Precio de dos frascos sin promoción');
  });
  document.querySelectorAll('.cart-line').forEach(line=>{
    const remove=line.querySelector('[data-remove-item]');const p=CONFIG.products[Number(remove?.dataset.removeItem)];
    if(p?.promoUnits){const q=cart.get(Number(remove.dataset.removeItem))||0;line.querySelector('span').textContent=`${q} promo(s) · ${q*2} frascos · ${money(p.price*q)}`;}
  });
});
