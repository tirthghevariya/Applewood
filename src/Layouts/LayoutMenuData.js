import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {

  const history = useNavigate();
  //state data
  const [isDashboard, setIsDashboard] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isPages, setIsPages] = useState(false);
  const [isForms, setIsForms] = useState(false);
  const [iscurrentState, setIscurrentState] = useState("Dashboard");

  useEffect(() => {
    document.body.classList.remove("twocolumn-panel");
    if (iscurrentState !== "Auth") {
      setIsAuth(false);
    }
    if (iscurrentState === "/payout-form") {
      history("/payout-form");
      document.body.classList.add("twocolumn-panel");
    }
  }, [
    history,
    iscurrentState,
    isDashboard,
    isAuth,
    isPages,
    isForms,
  ]);

  const menuItems = [
    {
      id: "forms",
      label: "Inches to mm",
      icon: "ri-file-list-3-line",
      link: "/payout-form",
      stateVariables: isForms,
    },
    {
      id: "forms",
      label: "MM to MM",
      icon: "ri-file-list-3-line",
      link: "/payout-form",
      stateVariables: isForms,

    }
  ];

  return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;
