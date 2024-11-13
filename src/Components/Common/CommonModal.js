/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/prop-types */
// import React, { useState, useEffect } from 'react';
import { Modal, Button, ModalBody, ModalFooter } from "reactstrap";

const CommonModal = (props) => {
  // const [data, setData] = useState([]);

  let size = "lg";
  if (props.modalSize) {
    size = props.modalSize;
  }
  let icon = <i className="mdi mdi-plus"></i>;

  if (props.isEdit) {
    icon = <i className="ri-arrow-left-up-line"></i>;
  } else if (props.isSend) {
    icon = <i className="bx bxs-paper-plane"></i>;
  } else if (props.isDelete) {
    icon = <i className=""></i>;
  }

  return (
    <Modal
      size={size}
      isOpen={props.isPopupOpen}
      toggle={() => {
        props.closeModal();
      }}
      id="exampleModal"
    >
      <div className="modal-title modal-header">
        <h5 className="modal-title ">{props.modelTitle}</h5>

        <button
          type="button"
          onClick={() => {
            props.closeModal();
          }}
          className="btn-close"
          aria-label="Close"
        ></button>
      </div>
      <ModalBody>{props.modalBody}</ModalBody>

      {!props.closeTitle && !props.submitTitle ? (
        ""
      ) : (
        <ModalFooter>
          {props.closeTitle ? (
            <Button
              color="light"
              className="btn btn-light"
              onClick={() => {
                props.closeModal();
              }}
            >
              {props.closeTitle}
            </Button>
          ) : (
            ""
          )}
          {props.submitTitle ? (
            <Button color="primary" onClick={() => props.submitModal()}>
              {icon} {props.submitTitle}
            </Button>
          ) : (
            ""
          )}
        </ModalFooter>
      )}
    </Modal>
  );
};
export default CommonModal;
