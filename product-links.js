/* Links only published product routes; preserve quick-add and image navigation. */
window.CNProductLinks = products => {
  const routes = new Set(['aceitunas-verdes-magna','aceitunas-negras-premium','tomates-secos-mediterraneos','tomates-secos-patagonicos','berenjenas-condimentadas','untable-fruta-frutos-bosque','pepinitos-en-vinagre','pimientos-agridulces','pasta-de-aceitunas-verdes','pasta-de-aceitunas-negras','zanahorias-encurtidas-agridulces','tomates-triturados','tomates-triturados-4x3']);
  products.forEach((product,index)=>{
    const id=product.id==='pepinitos-2x1'?'pepinitos-en-vinagre':product.id;
    const card=document.getElementById(`price-${index}`)?.closest('.card');
    if(!routes.has(id)||!card||card.querySelector('.product-detail-link'))return;
    const href=`productos/${id}/`;
    const title=card.querySelector('h3');
    const name=document.createElement('a');name.href=href;name.textContent=title.textContent;
    name.style.cssText='color:inherit;text-decoration:none';title.replaceChildren(name);
    const detail=document.createElement('a');detail.href=href;detail.className='product-detail-link';detail.textContent='Ver detalle →';
    detail.style.cssText='display:inline-block;margin:0 0 10px;font:13px Arial,sans-serif;color:inherit;text-decoration:underline;text-underline-offset:3px';
    card.querySelector('.product-description').after(detail);
    card.querySelectorAll('.photo img').forEach(img=>{
      img.style.cursor='pointer';let start;
      img.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];});
      img.addEventListener('click',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])<8)location.href=href;start=null;});
    });
  });
};
