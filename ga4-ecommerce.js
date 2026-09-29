/* GA4 ecommerce events. Prices and confirmed purchases always come from the
   server-backed catalog/order flow; no customer data is sent to analytics. */
window.CNAnalytics = (() => {
  const currency = 'ARS';
  const viewed = new Set();
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
  const emit = (name, params) => {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
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
      emit('purchase', { transaction_id: transactionId, affiliation: 'Casa Natural', currency, value, shipping: positive(payment?.shipping), items });
      try { localStorage.setItem(key, '1'); } catch (_) {}
      return true;
    }
  };
})();
