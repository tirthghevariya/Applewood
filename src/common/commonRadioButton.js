/* eslint-disable react/prop-types */
import React from "react";
import { FormGroup, Label, Input, FormFeedback } from "reactstrap";

const RadioGroup = ({
  label,
  options,
  name,
  id,
  validation,
  layout = "vertical", // Default to vertical layout
}) => {
  const isHorizontal = layout === "horizontal";

  return (
    <div className="mb-3">
      <Label htmlFor={id} className="col-lg-12">
        {label}
      </Label>
      {options.map((option, index) => (
        <FormGroup check key={index} inline={isHorizontal}>
          <Label check>
            <Input
              type="radio"
              name={name}
              id={`${id}-${index}`}
              value={option.value}
              onChange={validation.handleChange}
              onBlur={validation.handleBlur}
              checked={validation.values[name] === option.value}
            />{" "}
            {option.label}
          </Label>
        </FormGroup>
      ))}
      {validation.touched[name] && validation.errors[name] ? (
        <FormFeedback type="invalid">{validation.errors[name]}</FormFeedback>
      ) : null}
    </div>
  );
};

export default RadioGroup;
