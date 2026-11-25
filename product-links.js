/* Links only published product routes; preserve quick-add and image navigation. */
window.CNProductLinks = products => {
  const routes = new Set(['aceitunas-verdes-magna','aceitunas-negras-premium','tomates-secos-mediterraneos','tomates-secos-patagonicos','berenjenas-condimentadas','untable-fruta-frutos-bosque','pepinitos-en-vinagre','pepinitos-2x1','pimientos-agridulces','pasta-de-aceitunas-verdes','pasta-de-aceitunas-negras','zanahorias-encurtidas-agridulces']);
  products.forEach((product,index)=>{
    const id=product.id;
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

// Keep the existing storefront navigation and cart actions in the mobile header.
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const bar = header?.querySelector('.nav');
  const brand = bar?.querySelector('.brand');
  const links = bar?.querySelector('.nav-links');
  const cart = links?.querySelector('.header-cart[data-open-cart]');
  if (!brand || !links || !cart) return;

  const mobile = matchMedia('(max-width: 700px)');
  const menu = document.createElement('button');
  menu.type = 'button';
  menu.className = 'cn-mobile-menu';
  menu.setAttribute('aria-label', 'Menú');
  links.id ||= 'cn-header-navigation';
  menu.setAttribute('aria-controls', links.id);
  menu.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';

  const bag = document.createElement('button');
  bag.type = 'button';
  bag.className = 'cn-mobile-bag';
  bag.setAttribute('aria-label', 'Abrir carrito');
  bag.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="14" rx="2"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>';

  function setOpen(open) {
    menu.setAttribute('aria-expanded', String(open));
    header.classList.toggle('cn-menu-open', open);
  }

  bar.prepend(menu);
  brand.after(bag);
  setOpen(false);
  menu.addEventListener('click', () => setOpen(menu.getAttribute('aria-expanded') !== 'true'));
  bag.addEventListener('click', () => {
    setOpen(false);
    cart.click();
  });
  header.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && menu.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      menu.focus();
    }
  });
  links.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('a')) setOpen(false);
  });
  mobile.addEventListener('change', () => setOpen(false));
  header.classList.add('cn-mobile-ready');
});
