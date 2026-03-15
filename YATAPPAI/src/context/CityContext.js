import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CITIES_TAJIKISTAN } from '../data/cities';

const STORAGE_KEY = '@app_selected_city';

const CityContext = createContext(null);

export const CityProvider = ({ children }) => {
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

  const setCity = (value) => {
    setCityState(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  };

  const value = {
    city,
    setCity,
    loaded,
    cities: CITIES_TAJIKISTAN,
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
};
