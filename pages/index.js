import React from "react";
import axios from "axios";
import Head from "next/head";
import jwt from "jsonwebtoken";
import dbConnect from "../lib/dbConnect";

export async function getServerSideProps(context) {
  try {
    await dbConnect();
    return {
      props: { isConnected: true },
    };
  } catch (e) {
    console.error(e);
    return {
      props: { isConnected: false },
    };
  }
}
function Login({ isConnected }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  //listen for enter key press to call handleSubmit
  React.useEffect(() => {
    const handleEnter = async (e) => {
      if (e.key === "Enter") {
        document.getElementById("login").click();
      }
    };
    document.addEventListener("keydown", handleEnter);
    return () => {
      document.removeEventListener("keyup", handleEnter);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loginPost = await axios.post("/api/authenticate", {
        username: username,
        password: password,
      });
      if (loginPost.data.access_token) {
        localStorage.setItem("cosmo_token", loginPost.data.access_token);
        window.location.href = "/app/dashboard";
      } else {
        window.alert(`${loginPost.data.message}`);
      }
    } catch (err) {
      console.log(err);
      window.alert(err);
    }
  };
  return (
    <div className="container">
      <Head>
        <title>Cosmopolitan Control Panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="login-form">
        <h1>Cosmopolitan Management Panel</h1>
        <h2>Login</h2>
        <div className="form-field">
          <input
            type="text"
            id="username"
            value={username}
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-field">
          <input
            type="password"
            id="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="myButton" id='login' onClick={handleSubmit}>
          Login
        </button>
      </main>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 550px;
        }
        .form-field {
          display: flex;
          flex-direction: row;
          width: 90%;
          margin-bottom: 10px;
          text-align: center;
        }
        .form-field > input {
          width: 100%;
          height: 45px;
          border: 1px solid #eaeaea;
          border-radius: 5px;
          padding: 0 10px;
        }
      `}</style>
    </div>
  );
}

export default Login;
