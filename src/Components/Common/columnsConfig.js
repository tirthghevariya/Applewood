import React, { useState } from "react";
import Switch from "react-switch";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
// eslint-disable-next-line react/prop-types

const ConfirmPopup = ({ message, setConfirmOpen, onConfirm }) => {
  return (
    <>
      <div
        className="position-fixed translate-middle-x bg-white p-2 border border-gray-500 rounded-3 shadow popup"
        style={{ zIndex: "100000", width: "265px" }}
      >
        <div>
          <p>{message}</p>
          <div className="d-flex flex-row align-items-end justify-content-end gap-2">
            <button
              className="btn btn-light"
              onClick={() => {
                setConfirmOpen(false);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={(event) => {
                onConfirm(event);
                setConfirmOpen(false);
              }}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
      <div
        onClick={() => setConfirmOpen(false)}
        className="position-fixed top-0 start-0 vw-100 vh-100"
        style={{
          zIndex: "10000",
        }}
      ></div>
    </>
  );
};



