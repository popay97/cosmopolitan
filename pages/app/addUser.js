import React from "react";
import Head from "next/head";
import axios from "axios";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";
function ManageUsers() {
  React.useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    console.log(user);
    if (!token || !user.isAdmin) {
      window.location.href = "/";
    }
  }, []);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isSubcontractor, setIsSubcontractor] = React.useState(false);
  const [subcontractorCountry, setSubcontractorCountry] = React.useState("");
  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const response = await axios.post("/api/v1/register", {
        username: username,
        password: password,
        isAdmin: isAdmin,
        isSubcontractor: isSubcontractor,
        subcontractorCountry: subcontractorCountry,
      });
      console.log(response);
      window.alert("User created successfully");
    } catch (e) {
      console.log(e);
      window.alert("Something went wrong, please try again later");
    }
  }
  return (
    <div className="container">
      <Head>
        <title>Cosmoplitan conrol panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Navbar></Navbar>
        <div className="regsiterForm">
          <h3>Register new user</h3>
          <Form>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="username"
                placeholder="Username"
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicCheckbox">
              <Form.Check
                type="checkbox"
                label="User is Admin?"
                onChange={(e) => {
                  setIsAdmin(e.target.checked);
                  setIsSubcontractor(!e.target.checked);
                  setSubcontractorCountry("");
                }}
                disabled={isSubcontractor}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicCheckbox">
              <Form.Check
                type="checkbox"
                label="User is subcontractor?"
                disabled={isAdmin}
                checked={isSubcontractor}
                onChange={(e) => {
                  setIsSubcontractor(e.target.checked);
                  setIsAdmin(!e.target.checked);
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Subcontractor country:</Form.Label>
              <Form.Select
                type="select"
                label="Subcontractor country:"
                value={subcontractorCountry || "select"}
                disabled={isAdmin}
                onChange={(e) => {
                  if (e.target.value !== "select") {
                    setSubcontractorCountry(e.target.value);
                  }
                }}
              >
                <option value="select">Select</option>
                <option value="ME">Montenegro</option>
                <option value="HR">Croatia</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit" onClick={handleSubmit}>
              Submit
            </Button>
          </Form>
        </div>
      </main>

      <footer>
        <div className="footer-div">
          <p>Powered by</p>
          <img src="/trid-logo.jpg" alt="Trid Logo" className="logo" />
        </div>
      </footer>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        main {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          width: 100%;
          align-items: center;
          text-align: center;
        }
        .regsiterForm {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 80vh;
          width: 100%;
        }
        footer {
          width: 100%;
          height: 80px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .footer-div {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }

        .logo {
          width: 3.5rem;
          margin-left: 20px;
        }
      `}</style>
    </div>
  );
}

export default ManageUsers;
