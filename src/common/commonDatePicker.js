/* eslint-disable react/prop-types */
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FormFeedback } from "reactstrap";

const DateSelector = ({
  label,
  name,
  id,
  placeholder,
  validation,
  ...restProps
}) => {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="col-lg-12">
        {label}
      </label>
      <DatePicker
        id={id}
        name={name}
        selected={validation.values[name]}
        onChange={(date) => validation.setFieldValue(name, date)}
        onBlur={validation.handleBlur}
        className="form-control"
        placeholderText={placeholder}
        {...restProps}
      />
      {validation.touched[name] && validation.errors[name] && (
        <FormFeedback type="invalid">{validation.errors[name]}</FormFeedback>
      )}
    </div>
  );
};

export default DateSelector;
