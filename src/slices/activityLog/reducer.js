import { createSlice } from "@reduxjs/toolkit";
import { getLogList } from "./thunk";

export const initialState = {
  logList: [],

  filterParams: {
    currentPage: 1,
    perPage: 20,
  },
};

const activityLogSlice = createSlice({
  name: "activityLog",
  initialState,
  reducers: {
    updateState: (state, action) => {
      state.insertEmail = {
        ...state.insertEmail,
        ...action.payload,
      };
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getLogList.fulfilled, (state, action) => {
      state.logList = action.payload;
    });
  },
});

export const { updateState, updateEmailStates } = activityLogSlice.actions;

export default activityLogSlice.reducer;
