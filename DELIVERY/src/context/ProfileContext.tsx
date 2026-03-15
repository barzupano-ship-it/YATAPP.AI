import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  color: string;
}

export interface NotificationSettings {
  newOrders: boolean;
  deliveryUpdates: boolean;
  earningsAlerts: boolean;
  promotions: boolean;
}

const DEFAULT_VEHICLE: VehicleInfo = {
  make: '',
  model: '',
  year: '',
  plateNumber: '',
  color: '',
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  newOrders: true,
  deliveryUpdates: true,
  earningsAlerts: true,
  promotions: false,
};

interface ProfileContextType {
  vehicle: VehicleInfo;
  notifications: NotificationSettings;
  updateVehicle: (data: Partial<VehicleInfo>) => void;
  updateNotifications: (data: Partial<NotificationSettings>) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [vehicle, setVehicle] = useState<VehicleInfo>(DEFAULT_VEHICLE);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);

  useEffect(() => {
    // In production: load from AsyncStorage/API
  }, []);

  const updateVehicle = useCallback((data: Partial<VehicleInfo>) => {
    setVehicle((prev) => ({ ...prev, ...data }));
    // In production: sync to backend
  }, []);

  const updateNotifications = useCallback((data: Partial<NotificationSettings>) => {
    setNotifications((prev) => ({ ...prev, ...data }));
    // In production: sync to backend
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        vehicle,
        notifications,
        updateVehicle,
        updateNotifications,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
