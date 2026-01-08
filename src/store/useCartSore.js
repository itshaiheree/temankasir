import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  // =====================
  // STATE
  // =====================
  products: [], // [{ id, nama, harga }]
  cart: [],     // [{ id, nama, harga, qty }]

  // =====================
  // ACTIONS
  // =====================

  // set semua produk (dari backend / tauri)
  setProducts: (products) => set({ products }),

  // tambah ke cart pakai ID
  addToCartById: (id) => {
    const { products, cart } = get();
    const product = products.find(p => p.id === id);

    if (!product) return;

    const exist = cart.find(i => i.id === id);

    if (exist) {
      set({
        cart: cart.map(i =>
          i.id === id ? { ...i, qty: i.qty + 1 } : i
        ),
      });
    } else {
      set({
        cart: [...cart, { ...product, qty: 1 }],
      });
    }

    return "yes"
  },

  addToCartByName: (nama) => {
    const { products, cart } = get();
    const product = products.find(p => p.nama === nama);

    if (!product) return;

    const exist = cart.find(i => i.nama === nama);

    if (exist) {
      set({
        cart: cart.map(i =>
          i.nama === nama ? { ...i, qty: i.qty + 1 } : i
        ),
      });
    } else {
      set({
        cart: [...cart, { ...product, qty: 1 }],
      });
    }

    return "yes"
  },

  // kurangi qty
  decreaseQty: (id) => {
    const { cart } = get();
    set({
      cart: cart
        .map(i =>
          i.id === id ? { ...i, qty: i.qty - 1 } : i
        )
        .filter(i => i.qty > 0),
    });
  },

  // hapus item
  removeItem: (id) =>
    set({ cart: get().cart.filter(i => i.id !== id) }),

  // kosongkan cart
  clearCart: () => set({ cart: [] }),

  // =====================
  // GETTERS
  // =====================
  totalQty: () =>
    get().cart.reduce((sum, i) => sum + i.qty, 0),

  totalHarga: () =>
    get().cart.reduce((sum, i) => sum + i.qty * i.harga, 0),
}));
