import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    phoneNumber: '',
    countryCode: '',
  },
  reducers: {
    setUserPhoneNumber: (state, action) => {
      const { phoneNumber, countryCode } = action.payload;
      state.phoneNumber = phoneNumber;
      state.countryCode = countryCode;
    },
    clearUser: (state) => {
      state.phoneNumber = '';
      state.countryCode = '';
    },
  },
});

export const { setUserPhoneNumber, clearUser } = authSlice.actions;
export default authSlice.reducer;
