import React, { useEffect } from "react";
import UiContent from "../../Components/Common/UiContent";
import { useNavigate } from "react-router-dom";

// Validation schema

const BasicElements = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));

    if (userData && userData.username) {
    }
    else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const superAdminUser = JSON.parse(localStorage.getItem("superAdminUser"));
    if (superAdminUser && superAdminUser?.userType === "main_admin") {
      navigate("/entries");
    }
  }, [navigate]);

  return (
    <React.Fragment>
      <UiContent />
      <div className="page-content mt-5">

      </div>
    </React.Fragment>
  );
};

export default BasicElements;
