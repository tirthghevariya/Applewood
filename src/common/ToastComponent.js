import React, { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector, useDispatch } from "react-redux";
import { closeToast } from "../slices/toast/reducer";

function removeHtmlTags(input) {
  if (typeof input !== "string") {
    return input; // Return input unchanged if it's not a string
  }
  return input.replace(/<[^>]*>/g, "");
}

function ToastComponent() {
  const { type, open, msg } = useSelector((state) => state.toast);
  const dispatch = useDispatch();

  const cleanedMsg = removeHtmlTags(msg);

  useEffect(() => {
    if (open) {
      switch (type) {
        case "success":
          toast.success(cleanedMsg);
          break;
        case "warning":
          toast.warning(cleanedMsg);
          break;
        case "info":
          toast.info(cleanedMsg);
          break;
        case "error":
          toast.error(cleanedMsg);
          break;
        default:
          break;
      }
      const timer = setTimeout(() => {
        dispatch(closeToast());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, type, cleanedMsg, dispatch]);

  return <ToastContainer />;
}

export default ToastComponent;
