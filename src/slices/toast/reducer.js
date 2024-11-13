import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  type: "success",
  open: false,
  msg: "",
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: (state, action) => {
      state.type = action.payload.type;
      state.open = true;
      state.msg = action.payload.msg;
    },
    closeToast: (state) => {
      state.open = false;
    },
  },
});

export const { showToast, closeToast } = toastSlice.actions;
export default toastSlice.reducer;
