// Shared stock remains expressed in physical jars. The promo is a pair.
function cnPromoCatalog(products) {
  return products.flatMap(p => {
    if(p.id==='pepinitos-en-vinagre' && p.price===10500) return [
      p,
      {...p,id:'pepinitos-2x1',name:'Pepinitos en vinagre · 2×1',
        description:'Llevá 2 frascos por $10.500 · $5.250 cada uno. El selector cuenta promos de 2 frascos. No acumulable con códigos de descuento. Envío según condiciones habituales.',
        referencePrice:21000,stock:Math.floor(p.stock/2),promoSource:p.id,promoUnits:2,promoLabel:'2×1',promoNoun:'frascos',couponExcluded:true}
    ];
    if(p.id==='tomates-triturados' && p.price===3360) return [p,
      {...p,id:'tomates-triturados-4x3',name:'Tomates triturados · Promo 4×3',
        description:'Llevá 4 botellas de 1 litro y pagá 3: $10.080 el pack. No acumulable con códigos de descuento.',
        price:10080,referencePrice:13440,stock:Math.floor(p.stock/4),
        promoSource:p.id,promoUnits:4,promoLabel:'4×3',promoNoun:'botellas',couponExcluded:true}
    ];
    return [p];
  });
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
    card.querySelector('.price-quantity-label').textContent=`Precio por ${draftQuantities.get(i)||1} promo(s) de ${p.promoUnits} ${p.promoNoun||'frascos'}`;
    const add=card.querySelector('[data-add-product]');if(!add.disabled)add.textContent='AGREGAR PROMO AL CARRITO';
    const badge=card.querySelector('.discount-inline');if(badge){
      badge.textContent=p.promoLabel||'PROMO';
      Object.assign(badge.style,{backgroundColor:'#8B512F',color:'#FFFFFF',fontSize:'1.05rem',fontWeight:'800',padding:'6px 12px',lineHeight:'1.2',borderRadius:'6px',whiteSpace:'nowrap'});
    }
    const priceRef=card.querySelector('.reference-price s');if(priceRef)priceRef.setAttribute('aria-label',`Precio de ${p.promoUnits} ${p.promoNoun||'frascos'} comprados por separado`);
    const saving=card.querySelector('.saving');if(saving)saving.textContent=`Ahorrás ${money(p.referencePrice-p.price)} frente a comprarlos sueltos`;
  });
  document.querySelectorAll('.cart-line').forEach(line=>{
    const remove=line.querySelector('[data-remove-item]');const p=CONFIG.products[Number(remove?.dataset.removeItem)];
    if(p?.promoUnits){const q=cart.get(Number(remove.dataset.removeItem))||0;line.querySelector('span').textContent=`${q} promo(s) · ${q*p.promoUnits} ${p.promoNoun||'frascos'} · ${money(p.price*q)}`;}
  });
});
