/* eslint-disable react/prop-types */
import React from "react";
import Select from "react-select";
import { FormGroup, Label, FormFeedback } from "reactstrap";

const SelectDropdown = ({
  label,
  options,
  name,
  id,
  placeholder,
  validation,
}) => {
  const handleChange = (selectedOption) => {
    validation.setFieldValue(name, selectedOption ? selectedOption.value : "");
  };

  const handleBlur = () => {
    validation.setFieldTouched(name, true);
  };

  const selectedValue = options.find(
    (option) => option && option.value === validation.values[name]
  );
  
  return (
    <FormGroup className="mt-2">
      <Label style={{ textAlign: "left", display: "block" }} // Align label to the left
 for={id}>{label}</Label>
      <Select
        className=""
        name={name}
        id={id}
        options={options}
        onChange={handleChange}
        onBlur={handleBlur}
        value={selectedValue}
        placeholder={placeholder}
        isInvalid={validation.touched[name] && validation.errors[name]}
      />
      {validation.touched[name] && validation.errors[name] ? (
        <FormFeedback type="invalid">{validation.errors[name]}</FormFeedback>
      ) : null}
    </FormGroup>
  );
};

export default SelectDropdown;
