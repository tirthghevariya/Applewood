/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
import { useState } from "react";
import { Input } from "reactstrap";
import { updateState } from "../slices/users/reducer";
import { useDispatch } from "react-redux";
const SearchField = (props) => {
  const [filterParams, setFilterParams] = useState(props.filterParams || {});

  const dispatch = useDispatch();

  return (
    <div className="search-max-width mb-4">
      <div className="form-icon left">
        <Input
          type="search"
          className="form-control form-control-icon"
          value={props.searchValue}
          onChange={(event) => {
            const newFilterParams = {
              ...filterParams,
              search: event.target.value.trim(),
            };
            setFilterParams(newFilterParams);
            if (
              newFilterParams.search.length === 0 ||
              newFilterParams.search.length >= 3
            ) {
              dispatch(updateState({ search: newFilterParams.search }))
            }
          }}
          id="iconrightInput"
          placeholder="Search...."
        />
        <i className="ri-search-line"></i>
      </div>
    </div>
  );
};

export default SearchField;
