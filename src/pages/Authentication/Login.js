import React, { useEffect } from "react";
import {
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Row,
  Button,
  Form,
  FormFeedback,
  Alert,
  Spinner,
} from "reactstrap";
import { showToast } from "../../slices/toast/reducer";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import ParticlesAuth from "./ParticlesAuth";
import * as Yup from "yup";
import { useFormik } from "formik";
import { enableLoading, disableLoading } from "../../slices/auth/login/reducer";
import bcrypt from "bcryptjs";
// import logoLight from "../../assets/images/logo-light.png";
import withRouter from "../../Components/Common/withRouter";

// Define static username and password
const STATIC_USERNAME = "Applewood";
const STATIC_PASSWORD = "AZsxdcfv@!8!3405";

const Login = () => {
  const dispatch = useDispatch();

  const { errorMsg, loading } = useSelector((state) => ({
    errorMsg: state.Login.errorMsg,
    loading: state.Login.loading,
  }));

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));

    if (userData && userData.username) {
      navigate("/inches-to-mm");
    }
  }, [navigate]);

  const validation = useFormik({
    enableReinitialize: true,

    initialValues: {
      username: "",
      password: "",
    },

    validationSchema: Yup.object({
      username: Yup.string().required("Please Enter Your Username"),
      password: Yup.string().required("Please Enter Your Password"),
    }),

    onSubmit: async (values, { resetForm }) => {
      dispatch(enableLoading());

      try {
        // Encrypt the entered credentials
        const enteredUsernameHash = await bcrypt.hash(values.username, 10);
        // const enteredPasswordHash = await bcrypt.hash(values.password, 10);

        // Encrypt static credentials to compare
        const staticUsernameHash = await bcrypt.hash(STATIC_USERNAME, 10);
        const staticPasswordHash = await bcrypt.hash(STATIC_PASSWORD, 10);

        // Check if entered credentials match the static ones
        if (
          await bcrypt.compare(values.username, staticUsernameHash) &&
          await bcrypt.compare(values.password, staticPasswordHash)
        ) {
          // If matched, store encrypted user data and navigate
          const userData = {
            username: enteredUsernameHash,
            // password: enteredPasswordHash,
          };
          localStorage.setItem("userData", JSON.stringify(userData));
          navigate("/inches-to-mm");
          resetForm();
        } else {
          dispatch(showToast({ type: "error", msg: "Access denied: Incorrect credentials" }));
        }
      } catch (error) {
        dispatch(showToast({ type: "error", msg: "Error saving data: " + error.message }));
      } finally {
        dispatch(disableLoading());
      }
    },
  });

  document.title = process.env.REACT_APP_SITE_TITLE + " | Login";
  return (
    <React.Fragment>
      <ParticlesAuth>
        <div className="auth-page-content">
          <Container>
            <Row className="mt-4">
              <Col lg={12}>
                <div className="text-center mt-sm-5 mb-4 text-white-50 mt-3">

                  <p className="mt-3 fs-15">
                    {"Applewood designs customizable, high-quality modular furniture for modern, versatile spaces."}<br />
                  </p>
                </div>
              </Col>
            </Row>

            <Row className="justify-content-center">
              <Col md={8} lg={6} xl={5}>
                <Card className="mt-4">
                  <CardBody className="p-4">
                    <div className="text-center">
                      <h5 className="text-primary">Welcome Back !</h5>
                      <p className="text-muted">
                        Sign in to continue to Applewood.
                      </p>
                    </div>
                    {errorMsg && (
                      <Alert color="danger"> {errorMsg} </Alert>
                    )}
                    <div className="p-2 mt-4">
                      <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          validation.handleSubmit();
                          return false;
                        }}
                        action="#"
                      >
                        <div className="mb-3">
                          <Label htmlFor="username" className="form-label">
                            Username
                          </Label>
                          <Input
                            name="username"
                            className="form-control"
                            placeholder="Enter Username"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.username || ""}
                            invalid={
                              validation.touched.username &&
                                validation.errors.username
                                ? true
                                : false
                            }
                          />
                          {validation.touched.username &&
                            validation.errors.username ? (
                            <FormFeedback type="invalid">
                              {validation.errors.username}
                            </FormFeedback>
                          ) : null}
                        </div>

                        <div className="mb-3">
                          <Label className="form-label" htmlFor="password">
                            Password
                          </Label>
                          <Input
                            name="password"
                            value={validation.values.password || ""}
                            type="password"
                            className="form-control"
                            placeholder="Enter Password"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={
                              validation.touched.password &&
                                validation.errors.password
                                ? true
                                : false
                            }
                          />
                          {validation.touched.password &&
                            validation.errors.password ? (
                            <FormFeedback type="invalid">
                              {validation.errors.password}
                            </FormFeedback>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          <Button
                            disabled={loading ? true : false}
                            color="primary"
                            className="btn btn-primary w-100"
                            type="submit"
                          >
                            {loading === true ? (
                              <Spinner size="sm" className="me-2">
                                {" "}
                                Loading...{" "}
                              </Spinner>
                            ) : (
                              "Sign In"
                            )}
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </ParticlesAuth>
    </React.Fragment>
  );
};

export default withRouter(Login);