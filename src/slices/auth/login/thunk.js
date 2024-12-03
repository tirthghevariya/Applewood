import { chatLogin } from "../../../helpers/apis";

import { loginSuccess, logoutUserSuccess, apiError } from "./reducer";
import { setAuthorization } from "../../../helpers/api_helper";

export const loginUser = (user, history) => async (dispatch) => {
  try {
    let response;

    // response = chatLogin({
    //   email: user.email,
    //   password: user.password,
    // });
    history("/inches-to-mm");

    // let data = await response;

    // if (data) {
    //   localStorage.setItem("authUser", JSON.stringify(data));
    //   let finallogin = JSON.stringify(data);
    //   finallogin = JSON.parse(finallogin);
    //   // console.log("finallogin.token_expire_at", finallogin.tokenExpireAt);
    //   localStorage.setItem("expiryIn", finallogin.tokenExpireAt);
    //   if (finallogin.error === false) {
    //     dispatch(loginSuccess(finallogin));

    //     const expiryAt = new Date();
    //     // expiryAt.setTime(expiryAt.getTime() + 5 * 60 * 1000); // Expire in 5 mins
    //     expiryAt.setTime(
    //       expiryAt.getTime() + parseInt(data.tokenExpireAt) * 60 * 60 * 1000
    //     ); // Convert hours to milliseconds
    //     localStorage.setItem("expiryAt", expiryAt.getTime());
    //     setAuthorization();
    //   } else {
    //     dispatch(apiError(finallogin));
    //   }
    // }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    localStorage.removeItem("authUser");
    localStorage.removeItem("expiryAt");
    localStorage.removeItem("expiryIn");
    dispatch(logoutUserSuccess(true));
  } catch (error) {
    dispatch(apiError(error));
  }
};
