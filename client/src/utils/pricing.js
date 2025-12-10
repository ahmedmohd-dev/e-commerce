export function isSaleActive(product) {
  if (!product?.sale?.isEnabled || !product.sale?.price) {
    return false;
  }

  const now = Date.now();

  if (product.sale.start) {
    const start = new Date(product.sale.start).getTime();
    if (!Number.isNaN(start) && start > now) {
      return false;
    }
  }

  if (product.sale.end) {
    const end = new Date(product.sale.end).getTime();
    if (!Number.isNaN(end) && end < now) {
      return false;
    }
  }

  return true;
}

export function getEffectivePrice(product) {
  if (!product) return 0;
  if (isSaleActive(product)) {
    return Number(product.sale.price) || 0;
  }
  return Number(product.price) || 0;
}

export function formatETB(value) {
  const numeric = Number(value) || 0;
  return `ETB ${numeric.toLocaleString()}`;
}




















