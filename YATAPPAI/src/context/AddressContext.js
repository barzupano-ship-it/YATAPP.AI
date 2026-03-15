import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddressContext = createContext(null);
const ADDRESSES_STORAGE_KEY = 'yatapp_saved_addresses';

const generateId = () => 'addr-' + Date.now() + '-' + Math.random().toString(36).slice(2);

export const AddressProvider = ({ children }) => {
  const [addresses, setAddresses] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ADDRESSES_STORAGE_KEY)
      .then((json) => {
        if (json) {
          try {
            const parsed = JSON.parse(json);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAddresses(parsed);
            }
          } catch {}
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses)).catch(() => {});
  }, [addresses, loaded]);

  const addAddress = (address) => {
    const newAddress = {
      ...address,
      id: generateId(),
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => {
      const updated = newAddress.isDefault
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : prev;
      return [...updated, newAddress];
    });
  };

  const updateAddress = (id, updates) => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const removeAddress = (id) => {
    setAddresses((prev) => {
      const removed = prev.find((a) => a.id === id);
      const remaining = prev.filter((a) => a.id !== id);
      if (removed?.isDefault && remaining.length > 0) {
        return remaining.map((a, i) => ({ ...a, isDefault: i === 0 }));
      }
      return remaining;
    });
  };

  const setDefaultAddress = (id) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) || addresses[0],
    [addresses]
  );

  const value = useMemo(
    () => ({
      addresses,
      defaultAddress,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
    }),
    [addresses, defaultAddress]
  );

  return (
    <AddressContext.Provider value={value}>{children}</AddressContext.Provider>
  );
};

export const useAddress = () => {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddress must be used within AddressProvider');
  return ctx;
};
