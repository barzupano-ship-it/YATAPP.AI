import React, { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useDelivery } from '../context';
import { updateCourierLocation } from '../services/orderService';

const UPDATE_INTERVAL_MS = 15000;

export function CourierLocationTracker() {
  const { activeDelivery } = useDelivery();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const shouldTrack =
      activeDelivery &&
      (activeDelivery.status === 'picked_up' || activeDelivery.status === 'delivering');

    if (!shouldTrack) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const sendLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = location.coords;
        await updateCourierLocation(activeDelivery!.order.id, latitude, longitude);
      } catch {
        // ignore errors
      }
    };

    void sendLocation();
    intervalRef.current = setInterval(sendLocation, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeDelivery?.order.id, activeDelivery?.status]);

  return null;
}
