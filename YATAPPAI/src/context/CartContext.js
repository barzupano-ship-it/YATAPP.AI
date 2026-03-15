import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addToCart = (item) => {
    const baseItemId = String(item.menu_item_id || item.id);
    const cartItem = {
      ...item,
      menu_item_id: baseItemId,
      id: item.restaurantId ? `${item.restaurantId}-${baseItemId}` : baseItemId,
    };
    setItems((prev) => {
      const existing = prev.find((i) => i.id === cartItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === cartItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...cartItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const deliveryFee = null;
  const total = subtotal;

  const value = useMemo(
    () => ({
      items,
      subtotal,
      deliveryFee,
      total,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [items, subtotal, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
