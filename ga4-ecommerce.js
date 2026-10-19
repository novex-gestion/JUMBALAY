/* GA4 ecommerce events. Prices and confirmed purchases always come from the
   server-backed catalog/order flow; no customer data is sent to analytics. */
window.CNAnalytics = (() => {
  const currency = 'ARS';
  const viewed = new Set();
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
  const emit = (name, params) => {
    if (typeof window.gtag !== 'function') return false;
    try { window.gtag('event', name, params); return true; } catch (_) { return false; }
  };
  const item = (product, quantity, unitPrice = product?.price) => ({
    item_id: String(product?.id || ''),
    item_name: String(product?.name || ''),
    price: positive(unitPrice),
    quantity: Number(quantity) || 0
  });
  const validItems = items => items.filter(line => line.item_id && line.item_name && line.price > 0 && line.quantity > 0);
  const cartItems = (lines, products, unitPrice) => validItems(lines.map(([index, quantity]) => item(products[index], quantity, unitPrice(products[index]))));
  const cart = (lines, products, unitPrice) => {
    const items = cartItems(lines, products, unitPrice);
    return { currency, value: items.reduce((total, line) => total + line.price * line.quantity, 0), items };
  };
  const shippingTier = locality => locality === 'Retiro por Champagnat 1176, Pilar · 24 hs' ? 'retiro' : locality === 'other' ? 'envio_nacional' : 'entrega_local';

  return {
    viewItemList(products, unitPrice) {
      const items = validItems(products.map(product => item(product, 1, unitPrice(product))));
      if (items.length) emit('view_item_list', { item_list_id: 'catalogo_principal', item_list_name: 'Catálogo principal', items });
    },
    viewItem(product, unitPrice) {
      if (!product?.id || viewed.has(product.id)) return;
      viewed.add(product.id);
      const items = validItems([item(product, 1, unitPrice(product))]);
      if (items.length) emit('view_item', { currency, value: items[0].price, items });
    },
    addToCart(product, quantity, unitPrice) {
      const items = validItems([item(product, quantity, unitPrice(product))]);
      if (items.length) emit('add_to_cart', { currency, value: items[0].price * items[0].quantity, items });
    },
    addToCartLines(lines, unitPrice) {
      const items = validItems(lines.map(line => item(line.product, line.quantity, unitPrice(line.product))));
      if (items.length) emit('add_to_cart', { currency, value: items.reduce((total, line) => total + line.price * line.quantity, 0), items });
    },
    viewCart(lines, products, unitPrice) {
      const data = cart(lines, products, unitPrice);
      if (data.items.length) emit('view_cart', data);
    },
    beginCheckout(lines, products, unitPrice) {
      const data = cart(lines, products, unitPrice);
      if (data.items.length) emit('begin_checkout', data);
    },
    checkoutDetails(lines, products, unitPrice, locality, paymentType) {
      const data = cart(lines, products, unitPrice);
      if (!data.items.length) return;
      emit('add_shipping_info', { ...data, shipping_tier: shippingTier(locality) });
      emit('add_payment_info', { ...data, payment_type: paymentType });
    },
    purchase(payment) {
      if (payment?.purchase_owner === 'server') return true; // Server owns this conversion; preserve receipt UI.
      const transactionId = String(payment?.transaction_id || payment?.payment_id || payment?.id || '');
      const items = validItems((Array.isArray(payment?.items) ? payment.items : []).map(line => ({
        item_id: String(line.item_id || line.id || ''),
        item_name: String(line.item_name || line.name || line.nombre || ''),
        price: positive(line.price ?? line.unit_price ?? line.precio),
        quantity: Number(line.quantity ?? line.cantidad) || 0
      })));
      const value = positive(payment?.value) || items.reduce((total, line) => total + line.price * line.quantity, 0);
      if (!transactionId || !items.length || !value) return false;
      const key = `cn-ga4-purchase-${transactionId}`;
      try { if (localStorage.getItem(key)) return false; } catch (_) {}
      const emitted = emit('purchase', { transaction_id: transactionId, affiliation: 'Casa Natural', currency, value, shipping: positive(payment?.shipping), items });
      if (!emitted) return false;
      try { localStorage.setItem(key, '1'); } catch (_) {}
      return true;
    }
  };
})();

// Attach only measurement context to this shop's existing order-creation request.
// No prices, items, delivery, payment method or request ID are changed.
(() => {
  const originalFetch = window.fetch;
  if (typeof originalFetch !== 'function') return;
  const cookie = name => { try { const v=document.cookie.split('; ').find(v=>v.startsWith(name+'=')); return v?decodeURIComponent(v.slice(name.length+1)):''; } catch (_) { return ''; } };
  const context = async () => {
    const result = {};
    const ga=cookie('_ga').match(/^GA\d+\.\d+\.(\d+\.\d+)$/);
    if (ga) result.client_id=ga[1];
    for (const key of ['fbp','fbc']) { const value=cookie('_'+key); if (/^fb\.\d\.\d{10,16}\.[A-Za-z0-9_.-]{1,200}$/.test(value)) result[key]=value; }
    if (typeof window.gtag==='function') {
      const get=field=>new Promise(resolve=>{const timer=setTimeout(()=>resolve(''),180);try{window.gtag('get','G-0KWGE3QME7',field,value=>{clearTimeout(timer);resolve(String(value||''));});}catch(_){clearTimeout(timer);resolve('');}});
      const [client,session]=await Promise.all([get('client_id'),get('session_id')]);
      if (/^\d{1,20}\.\d{1,20}$/.test(client)) result.client_id=client;
      if (/^\d{1,20}$/.test(session)) result.session_id=session;
    }
    return result;
  };
  window.fetch = async function(input, init) {
    let next=init;
    try {
      const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:'',location.href);
      if(url.origin==='https://panel.tucasaesnatural.com'&&url.pathname==='/api/create-order.php'&&init?.method?.toUpperCase()==='POST'&&typeof init.body==='string') {
        const body=JSON.parse(init.body);
        if(body&&typeof body==='object'&&!Array.isArray(body))next={...init,body:JSON.stringify({...body,analytics_context:await context()})};
      }
    } catch (_) {} // Measurement cannot prevent order submission.
    return originalFetch.call(this,input,next);
  };
})();
