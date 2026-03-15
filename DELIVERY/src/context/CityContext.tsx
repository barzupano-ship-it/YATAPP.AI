import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CITIES_TAJIKISTAN } from '../data/cities';

const STORAGE_KEY = '@delivery_selected_city';

interface CityContextType {
  city: string;
  setCity: (value: string) => void;
  loaded: boolean;
  cities: string[];
}

const CityContext = createContext<CityContextType | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCityState] = useState(CITIES_TAJIKISTAN[0]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && CITIES_TAJIKISTAN.includes(saved)) {
        setCityState(saved);
      }
      setLoaded(true);
    });
  }, []);

  const setCity = (value: string) => {
    setCityState(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  };

  return (
    <CityContext.Provider
      value={{
        city,
        setCity,
        loaded,
        cities: CITIES_TAJIKISTAN,
      }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
}
