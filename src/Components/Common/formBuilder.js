/* eslint-disable react/prop-types */
import React from "react";
import { Button, Spinner, Form } from "reactstrap";
import TextInput from "../../common/textInput";
import SelectDropdown from "../../common/selectDropdown";
import RadioGroup from "../../common/commonRadioButton";
import { useFormik } from "formik";
import * as Yup from "yup";
import CheckboxGroup from "../../common/checkBoxGroup";
import DateSelector from "../../common/commonDatePicker"
const FormBuilder = ({
  fields,
  validationSchema,
  onSubmit,
  submitButtonText,
  initialValues,
}) => {
  const formRef = React.useRef(null);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: initialValues || {},
    validationSchema: Yup.object(validationSchema),
    onSubmit,
  });

  return (
    <Form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        validation.handleSubmit();
        return false;
      }}
    >
      {fields.map((field, index) => {
        switch (field.type) {
          case "input":
            return (
              <TextInput
                key={index}
                label={field.label}
                type={field.inputType}
                name={field.name}
                id={field.name}
                placeholder={field.placeholder}
                validation={validation}
              />
            );
          case "dropdown":
            return (
              <SelectDropdown
                key={index}
                label={field.label}
                options={field.options}
                name={field.name}
                id={field.name}
                validation={validation}
              />
            );
          case "datePicker":
            return (
              <DateSelector
                key={index}
                label={field.label}
                name={field.name}
                id={field.name}
                placeholder={field.placeholder}
                validation={validation}
              />
            );
          case "checkbox":
            return (
              <CheckboxGroup
                key={index}
                label={field.label}
                options={field.options}
                name={field.name}
                id={field.name}
                validation={validation}
              />
            );
          case "radioButton":
            return (
              <RadioGroup
                key={index}
                label={field.label}
                options={field.options}
                name={field.name}
                id={field.name}
                validation={validation}
              />
            );
        

          default:
            return null;
        }
      })}
      <div className="modal-footer">
        <Button color="primary" type="submit" className="">
          {validation.isSubmitting ? (
            <>
              <Spinner size="sm" className="me-0"></Spinner>{" "}
              {submitButtonText.loadingText}
            </>
          ) : (
            <>{submitButtonText.normalText}</>
          )}
        </Button>
      </div>
    </Form>
  );
};

export default FormBuilder;
