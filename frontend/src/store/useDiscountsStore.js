import { create } from 'zustand';

export const useDiscountsStore = create((set, get) => ({
  discounts: {},
  
  loadDiscounts: () => {
    const stored = localStorage.getItem('gasolineras-descuentos');
    if (stored) {
      set({ discounts: JSON.parse(stored) });
    }
  },

  setDiscount: (brand, type, value) => {
    const newDiscounts = { ...get().discounts, [brand]: { type, value } };
    set({ discounts: newDiscounts });
    localStorage.setItem('gasolineras-descuentos', JSON.stringify(newDiscounts));
  },

  removeDiscount: (brand) => {
    const newDiscounts = { ...get().discounts };
    delete newDiscounts[brand];
    set({ discounts: newDiscounts });
    localStorage.setItem('gasolineras-descuentos', JSON.stringify(newDiscounts));
  },

  getDiscount: (brand) => {
    return get().discounts[brand] || null;
  },

  applyDiscount: (brand, price) => {
    const discount = get().discounts[brand];
    if (!discount || !price) return null;
    
    const priceNum = parseFloat(price.replace(',', '.'));
    let discountedPrice;
    
    if (discount.type === 'cents') {
      discountedPrice = priceNum - (discount.value / 100);
    } else {
      discountedPrice = priceNum * (1 - discount.value / 100);
    }
    
    return discountedPrice.toFixed(3).replace('.', ',');
  },
}));
