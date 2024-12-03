import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {

  const history = useNavigate();
  //state data
  const [isAuth, setIsAuth] = useState(false);
  const [isForms, setIsForms] = useState(false);
  const [iscurrentState, setIscurrentState] = useState(false);

  useEffect(() => {
    document.body.classList.remove("twocolumn-panel");
    if (iscurrentState !== "Auth") {
      setIsAuth(false);
    }
    if (iscurrentState === "/inches-to-mm") {
      history("/inches-to-mm");
      document.body.classList.add("twocolumn-panel");
    }
  }, [
    history,
    isAuth,
  ]);

  const menuItems = [
    {
      id: "forms",
      label: "Inches to mm",
      icon: "ri-file-list-3-line",
      link: "/inches-to-mm",
      stateVariables: isForms,
    },
    {
      id: "forms",
      label: "MM to MM",
      icon: "ri-file-list-3-line",
      link: "/mm-to-mm",
      stateVariables: isForms,
    },
    {
      id: "forms",
      label: "Client Menu",
      icon: "ri-file-list-3-line",
      link: "/client-menu",
      stateVariables: isForms,

    }
  ];

  return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;
