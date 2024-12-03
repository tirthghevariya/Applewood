import React from "react";
import { Navigate } from "react-router-dom";

//Forms
import InchesToMM from "../pages/IncheToMM/inchesToMM";
import ClientMenu from "../pages/ClientMenu/clientMenu";
import MMToMM from "../pages/MMToMM/MMToMM";

//login
import Login from "../pages/Authentication/Login";

const authProtectedRoutes = [
  //charts

  // Forms
  { path: "/inches-to-mm", component: <InchesToMM /> },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/inches-to-mm" />,
  },
  { path: "/client-menu", component: <ClientMenu /> },
  { path: "/mm-to-mm", component: <MMToMM /> },
  { path: "*", component: <Navigate to="/inches-to-mm" /> },
];

const publicRoutes = [
  { path: "/login", component: <Login /> },
];

export { authProtectedRoutes, publicRoutes };
