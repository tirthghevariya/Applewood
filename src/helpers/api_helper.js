import axios from "axios";
import { api } from "../config";

// default
axios.defaults.baseURL = api.API_URL;
// content type
axios.defaults.headers.post["Content-Type"] = "application/json";

function setAuthorization() {
  const authUser = JSON.parse(localStorage.getItem("authUser"));

  if (authUser) {
    axios.defaults.headers.common["Authorization"] = "Bearer " + authUser.token;
    axios.defaults.headers.common["x-api-key"] = authUser.xApiKey;
  } else {
    // Clear headers if not logged in
    delete axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["x-api-key"];
  }
}

// // content type
// const token = JSON.parse(localStorage.getItem("authUser")) ? JSON.parse(localStorage.getItem("authUser")).token : null;
// const xApiKey = JSON.parse(localStorage.getItem("authUser")) ? JSON.parse(localStorage.getItem("authUser")).xApiKey : null;
// if (token) {
//   axios.defaults.headers.common["Authorization"] = "Bearer " + token;
//   axios.defaults.headers.common["x-api-key"] = xApiKey;
// }

setAuthorization();

// intercepting to capture errors
axios.interceptors.response.use(
  function (response) {
    return response.data ? response.data : response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    let message;
    switch (error.status) {
      case 500:
        message = "Internal Server Error";
        break;
      case 401:
        message = "Invalid credentials";
        break;
      case 404:
        message = "Sorry! the data you are looking for could not be found";
        break;
      default:
        message = error.message || error;
    }
    return Promise.reject(message);
  }
);
/**
 * Sets the default authorization
 * @param {*} token
 */
// const setAuthorization = (token) => {
//   axios.defaults.headers.common["Authorization"] = "Bearer " + token;
// };

class APIClient {
  /**
   * Fetches data from given url
   */

  //  get = (url, params) => {
  //   return axios.get(url, params);
  // };
  get(url, params) {
    let response;

    let paramKeys = [];

    if (params && params) {
      Object.keys(params).map((key) => {
        let filterValue = params[key].toString();
        filterValue = filterValue.replace("e=>e.", "");
        paramKeys.push(key + "=" + filterValue);
        return paramKeys;
      });

      let queryString =
        paramKeys && paramKeys.length ? paramKeys.join("&") : "";

      response = axios.get(`${url}?${queryString}`, params);
    } else {
      response = axios.get(`${url}`, params);
    }

    return response;
  }
  /**
   * post given data to url
   */
  create(url, data) {
    return axios.post(url, data);
  }
  /**
   * Updates data
   */
  update(url, data) {
    return axios.patch(url, data);
  }

  put(url, data) {
    return axios.put(url, { ...data });
  }
  /**
   * Delete
   */
  delete(url, config) {
    return axios.delete(url + config, { ...config });
  }
}

const getLoggedinUser = () => {
  const user = localStorage.getItem("authUser");
  if (!user) {
    return null;
  }
  return JSON.parse(user);
};

export { APIClient, setAuthorization, getLoggedinUser };
