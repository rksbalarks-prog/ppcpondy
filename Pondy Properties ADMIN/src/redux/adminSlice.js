// src/redux/adminSlice.js
import { createSlice } from '@reduxjs/toolkit';

const adminSlice = createSlice({
  name: 'user',
  initialState: {
    name: '',
    role: '',
    isVerified: false,
  },
  reducers: {
    setName: (state, action) => {
      state.name = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setIsVerified: (state, action) => {
      state.isVerified = action.payload;
    },
    setAdminData: (state, action) => {
      const { name, role, isVerified } = action.payload;
      state.name = name;
      state.role = role;
      state.isVerified = isVerified;

    },
  },
});

export const { setName, setRole, setIsVerified, setAdminData } = adminSlice.actions;
export default adminSlice.reducer;



// // localStorage.setItem('adminData', JSON.stringify(action.payload));
