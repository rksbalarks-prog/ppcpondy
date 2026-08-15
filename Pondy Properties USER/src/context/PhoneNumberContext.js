// src/context/PhoneNumberContext.js
import React, { createContext, useState, useContext } from 'react';

// Create context for phone number and country code
const PhoneNumberContext = createContext();

// Provider component
export const PhoneNumberProvider = ({ children }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('');

  return (
    <PhoneNumberContext.Provider value={{ phoneNumber, setPhoneNumber, countryCode, setCountryCode }}>
      {children}
    </PhoneNumberContext.Provider>
  );
};

// Custom hook to use context
export const usePhoneNumber = () => {
  return useContext(PhoneNumberContext);
};
