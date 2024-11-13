import React from "react";
import { Navigate } from "react-router-dom";

//Forms
import BasicElements from "../pages/Forms/formikForm";

//login
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";

const authProtectedRoutes = [
  //charts

  // Forms
  { path: "/payout-form", component: <BasicElements /> },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/payout-form" />,
  },
  { path: "*", component: <Navigate to="/payout-form" /> },
];

const publicRoutes = [
  // Authentication Page
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
];

export { authProtectedRoutes, publicRoutes };
