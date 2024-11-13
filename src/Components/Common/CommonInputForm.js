/* eslint-disable react/prop-types */
import React from "react";
import CommonModal from "./CommonModal";
import { useDispatch } from "react-redux";
import FormBuilder from "./formBuilder";

const FormModalBuilder = ({
  formFields,
  validationSchema,
  submitButtonText,
  onSubmitActions,
  onUpdateStateActions,
  modalStates,
  modalTitle,
  closeTitle,
  initialValues,
}) => {
  const dispatch = useDispatch();

  const handleSubmit = (values) => {
    onUpdateStateActions.forEach((action) => {
      dispatch(action({ loading: true }));
    });
    onSubmitActions.forEach((action) => {
      dispatch(action(values));
    });
  };

  return (
    <>
      {modalStates.map((modalState, index) => (
        <CommonModal
          key={index}
          isPopupOpen={modalState.formOpen}
          modalSize={"md"}
          closeModal={() =>
            onUpdateStateActions.forEach((action) =>
              dispatch(action({ formOpen: false, isEdit: false }))
            )
          }
          closeTitle={closeTitle}
          modelTitle={modalTitle}
          modalBody={
            <FormBuilder
              fields={formFields}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              submitButtonText={submitButtonText}
              initialValues={initialValues}
            />
          }
        />
      ))}
    </>
  );
};

export default FormModalBuilder;
