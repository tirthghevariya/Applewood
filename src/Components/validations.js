import * as Yup from "yup";


const clientIdRegex = /^FW\d{6}$/;

export const entriesSchema = Yup.object({
  clientId: Yup.string()
    .required("Client ID is required")
    .matches(clientIdRegex, "Client ID must start with 'FW' followed by 6 digits"),

  clientName: Yup.string()
    .required("Client Name is required"), // This will be auto-filled but still required for submission

  myWallet: Yup.number()
    .min(0, "Wallet value must be greater than or equal to 0"),

  trade: Yup.number()
    .min(0, "Trade value must be greater than or equal to 0"),

  // The following fields are hidden, so no need to validate:
  status: Yup.string(),
  notes: Yup.string(),
  currentMonth: Yup.string(),
});

// Define validation schema for the form
export const validationSchema = Yup.object().shape({
  fullName: Yup.string().required("Please Enter Full Name"),
  emailId: Yup.string()
    .required("Please Enter Email Id")
    .email("Please Enter a Valid Email Address"),
  mobile: Yup.string()
    .required("Please Enter Your Mobile No.")
    .matches(/^[0-9]{10}$/, "Please Enter a Valid 10-digit Mobile Number"),
  password: Yup.string()
    .required("Please Enter Your Password")
    .min(6, "Password must be at least 6 characters long"),
  country: Yup.string().required("Please Select country"),
  langKnown: Yup.array().min(1, "Please select at least one option"),
  selectedDate: Yup.date(),
  description: Yup.string(),
  hobbies: Yup.array().min(1, "Please select at least one hobby"),
  gender: Yup.string(),
});

export const createAdminValidationSchema = Yup.object().shape({
  clientId: Yup.string()
    .required("Please Enter Client ID")
    .matches(/^FW\d{6}$/, "Client ID must start with 'FW' followed by 6 digits"),
  username: Yup.string().required("Please Enter Username"),
});

export const createSuperAdminValidationSchema = Yup.object().shape({
  clientId: Yup.string(),
  username: Yup.string(),
  password: Yup.string().required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
  adminName: Yup.string(),
});


// permission
export const createPermissionSchema = {
  name: Yup.string().required("Please Enter Permission Name"),
  parent: Yup.string().required("Please Enter parent Id"),
};

export const updatePermissionSchema = {
  name: Yup.string().required("Please Enter Permission Name"),
  parent: Yup.string(),
};

// Role
export const createRoleSchema = {
  name: Yup.string().required("Please Enter Role Name"),
  permission: Yup.array(),
};

// users
export const createUserSchema = {
  firstName: Yup.string().required("Please Enter FirstName"),
  lastName: Yup.string().required("Please Enter LastName"),
  email: Yup.string()
    .required("Please Enter Email Id")
    .email("Please Enter a Valid Email Address"),
  password: Yup.string()
    .required("Please Enter Your Password")
    .min(6, "Password must be at least 6 characters long"),
  mobile: Yup.string()
    .required("Please Enter Your Mobile No.")
    .matches(/^[0-9]{10}$/, "Please Enter a Valid 10-digit Mobile Number"),
};

export const updateUserSchema = {
  email: Yup.string()
    .required("Please Enter Email Id")
    .email("Please Enter a Valid Email Address"),
  firstName: Yup.string().required("Please Enter Name"),
};

export const updateUserStatusSchema = {
  bannedReason: Yup.string().required("Please Enter Reason"),
};