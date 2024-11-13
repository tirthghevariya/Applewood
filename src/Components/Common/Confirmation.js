import React from "react";
/* eslint-disable react/prop-types */
const CustomConfirmationModal = ({ show, onClose, onConfirm }) => {
  return (
    <div className={`custom-modal ${show ? "show" : "hide"}`}>
      <div className="modal-content">
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this item?</p>
        <div className="button-container">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirmationModal;
