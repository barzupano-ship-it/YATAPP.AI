import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Order {
  id: string;
  restaurantId?: string;
  restaurant: string;
  pickupAddress: string;
  deliveryAddress: string;
  status?: string;
  distance: string;
  deliveryFee: string;
  items?: string;
  estimatedTime?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  deliveryGoogleMapsUrl?: string;
}

export interface ActiveDelivery {
  order: Order;
  status: 'accepted' | 'picked_up' | 'delivering';
}

interface DeliveryContextType {
  activeDelivery: ActiveDelivery | null;
  acceptOrder: (order: Order) => void;
  updateDeliveryStatus: (status: ActiveDelivery['status']) => void;
  completeDelivery: () => void;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);

  const acceptOrder = useCallback((order: Order) => {
    setActiveDelivery({ order, status: 'accepted' });
  }, []);

  const updateDeliveryStatus = useCallback((status: ActiveDelivery['status']) => {
    setActiveDelivery((prev) => (prev ? { ...prev, status } : null));
  }, []);

  const completeDelivery = useCallback(() => {
    setActiveDelivery(null);
  }, []);

  return (
    <DeliveryContext.Provider
      value={{
        activeDelivery,
        acceptOrder,
        updateDeliveryStatus,
        completeDelivery,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
}
