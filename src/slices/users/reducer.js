import { createSlice } from "@reduxjs/toolkit";
import {
  createUser,
  getUserList,
  updateUsers,
  updateUserStatus,
  bulkDeleteUser,
} from "./thunk";
const moment = require("moment");

export const initialState = {
  filterParams: {
  },

  insersUser: {
    formOpen: false,
    loading: false,
    isSuperForm: false,
    userData: {}
  },

  updateUser: {
    loading: false,
    formOpen: false,
    isEdit: false,
    singleUser: {},
  },

  updateStatus: {
    loading: false,
    formOpen: false,
    singleUser: {},
  },

  updateDate: {
    startDate: moment().subtract(15, "days").format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  },

  bulkDelete: {},
  userList: [],
  vendorList: [],
  topPerformingVendor: [],
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    updateState: (state, action) => {
      state.insersUser = { ...state.insersUser, ...action.payload };
    },
    updateUserStates: (state, action) => {
      state.updateUser = { ...state.updateUser, ...action.payload };
    },
    updateStatusStates: (state, action) => {
      state.updateStatus = { ...state.updateStatus, ...action.payload };
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getUserList.fulfilled, (state, action) => {
      state.userList = action.payload;
    });

    builder.addCase(createUser.fulfilled, (state) => {
      state.insersUser = { formOpen: false, loading: false };
    });

    builder.addCase(updateUsers.fulfilled, (state) => {
      state.updateUser = { formOpen: false, loading: false };
    });

    builder.addCase(updateUserStatus.fulfilled, (state) => {
      state.updateStatus = { formOpen: false, loading: false };
    });

    builder.addCase(bulkDeleteUser.fulfilled, (state, action) => {
      state.bulkDelete = action.payload;
    });
  },
});

export const { updateState, updateUserStates, updateStatusStates } =
  usersSlice.actions;

export default usersSlice.reducer;
