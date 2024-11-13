import { APIClient } from "./api_helper";

import * as url from "./url_helper";

const api = new APIClient();

// Login Method
export const chatLogin = (data) => api.create(url.LOGIN, data);


//users
export const getUsersList = (data) => api.get(url.GET_USERS_LIST, data);
export const createUser = (data) => api.create(url.CREATE_USERS, data);
export const updateUser = (data) =>
  api.put(`${url.UPDATE_USERS}/${data.userId}`, data);
export const updateUserStatus = (data) =>
  api.put(`${url.UPDATE_USER_STATUS}/${data.userId}`, data);
export const deleteUser = (data) => api.delete(url.DELETE_USERS, data);
export const bulkDeleteUser = (data) => api.create(url.USER_BULK_DELETE, data);