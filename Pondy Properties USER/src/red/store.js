 

// store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer, // This means state.user will contain the phoneNumber
  },
});