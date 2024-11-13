import React from "react";
import { Input, FormFeedback } from "reactstrap";

const TextInput = ({
  label,
  maxLength,
  name,
  id,
  placeholder,
  validation,
  textarea,
  readOnly,
  onChange
}) => {
  const inputComponent = textarea ? "textarea" : "input"; // Use textarea if specified

  return (
    <div className="mb-0">
      <label
        htmlFor={id}
        className="col-form-label"
        style={{ textAlign: "left", display: "block" }} // Align label to the left
      >
        {label}
      </label>
      <Input
        readOnly={readOnly}
        type={inputComponent}
        maxLength={maxLength}
        className="form-control"
        name={name}
        id={id}
        placeholder={placeholder}
        onChange={onChange ? onChange:validation.handleChange} 
        invalid={
          validation.touched[name] && validation.errors[name] ? true : false
        }
        value={validation.values[name] || ""}
        onBlur={validation.handleBlur}
      />
      {validation.touched[name] && validation.errors[name] ? (
        <FormFeedback style={{ textAlign: "left", display: "block" }} // Align label to the left
  type="invalid">{validation.errors[name]}</FormFeedback>
      ) : null}
    </div>
  );
};

export default TextInput;
