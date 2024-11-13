import React, { useEffect } from "react";
//import Scss
import "./assets/scss/themes.scss";
import "./App.css";
import { useLocation } from "react-router-dom";

//imoprt Route
import Route from "./Routes";

const logoutIfTokenExpire = () => {
  const expirationTime = localStorage.getItem("expiryAt");
  if (expirationTime) {
    const currentTime = new Date().getTime();
    if (currentTime > parseInt(expirationTime, 10)) {
      localStorage.removeItem("authUser");
      localStorage.removeItem("expiryAt");
      localStorage.removeItem("expiryIn");
      window.location.replace("/");
    }
  }
};

function App() {
  const location = useLocation();

  // Call the token expiration check function on every route change
  useEffect(() => {
    logoutIfTokenExpire();
  }, [location]);

  return (
    <React.Fragment>
      <Route />
    </React.Fragment>
  );
}

export default App;
