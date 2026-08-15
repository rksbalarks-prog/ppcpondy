 
// userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  phoneNumber: null,
  isVerified: false
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setPhoneNumber: (state, action) => {
      state.phoneNumber = action.payload;
    },
    setIsVerified: (state, action) => {
      state.isVerified = action.payload;
    },
  },
});

export const { setPhoneNumber, setIsVerified } = userSlice.actions;
export default userSlice.reducer;