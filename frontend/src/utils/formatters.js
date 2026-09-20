export function formatPrice(price) {
  if (!price || price === '') return 'N/A';
  return `${price.replace('.', ',')} €`;
}

export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export function getDiscountedPrice(brand, price, discounts) {
  const discount = discounts[brand];
  if (!discount || !price) return null;
  
  const priceNum = parseFloat(price.replace(',', '.'));
  let discountedPrice;
  
  if (discount.type === 'cents') {
    discountedPrice = priceNum - (discount.value / 100);
  } else {
    discountedPrice = priceNum * (1 - discount.value / 100);
  }
  
  return discountedPrice.toFixed(3).replace('.', ',');
}
