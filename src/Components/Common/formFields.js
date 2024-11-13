/* eslint-disable react/react-in-jsx-scope */
const activeInActive = [
  { label: "Active", value: "Active" },
  { label: "InActive", value: "InActive" },
];

const discTypeOption = [
  { label: "Percentage", value: "Percentage" },
  { label: "Fixed", value: "Fixed" },
];

import { UPLOAD_IMAGE } from "../../helpers/url_helper";


// User
export const createUserformFields = [
  {
    type: "input",
    label: "FirstName",
    name: "firstName",
    inputType: "text",
    placeholder: "Enter your firstName",
  },
  {
    type: "input",
    label: "LastName",
    name: "lastName",
    inputType: "text",
    placeholder: "Enter your lastName",
  },
  {
    type: "input",
    label: "Email",
    name: "email",
    inputType: "text",
    placeholder: "Enter your Email",
  },
  {
    type: "input",
    label: "Password",
    name: "password",
    inputType: "password",
    placeholder: "Enter your password",
  },
  {
    type: "input",
    label: "Mobile No",
    name: "mobile",
    inputType: "tel",
    placeholder: "Enter your Mobile No",
  },
];

export const updateUserformFields = [
  {
    type: "input",
    label: "Name",
    name: "firstName",
    inputType: "text",
    placeholder: "Enter your firstName",
  },
  {
    type: "input",
    label: "Email",
    name: "email",
    inputType: "text",
    placeholder: "Enter your Email",
  },
];

export const updateUserStatusformFields = [
  {
    type: "input",
    label: "Banned Reason",
    name: "bannedReason",
    inputType: "text",
    placeholder: "Please provide the banned reason.",
  },
];


export const addButtonText = {
  loadingText: "Adding...",
  normalText: (
    <>
      <i className="ri-add-fill"></i> Add
    </>
  ),
};

export const sendNotificationText = {
  loadingText: "Sending...",
  normalText: (
    <>
      <i className="  bx bxs-send"></i> Send
    </>
  ),
};

export const updateButtonText = {
  loadingText: "Updating...",
  normalText: (
    <>
      <i className=" ri-arrow-left-up-line"></i> Update
    </>
  ),
};

export const updateBannedButtonText = {
  loadingText: "Updating...",
  normalText: (
    <>
      <i className=" ri-arrow-left-up-line"></i> Update Status
    </>
  ),
};


// {
//   type: "dropdown",
//   label: "Role",
//   name: "role",
//   options: options,
// },
// {
//   type: "multiDropdown",
//   label: "Permissions",
//   name: "permissions",
//   options: options,
// },
// {
//   type: "datePicker",
//   label: "Date of Birth",
//   name: "dob",
//   placeholder: "Select Date",
// },
// {
//   type: "checkbox",
//   label: "Hobbies",
//   name: "hobbies",
//   options: options,
// },
// {
//   type: "radioButton",
//   label: "Gender",
//   name: "gender",
//   options: options,
// },
// {
//   type: "fileInput",
//   label: "Choose a file:",
//   name: "file",
//   placeholder: "Select File",
// },
