import { configureStore } from '@reduxjs/toolkit';
import adminReducer from './redux/adminSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
  },
});
