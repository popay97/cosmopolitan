import Head from "next/head";
import FileComponent from "../../components/FileUpload";
import React, { useState } from "react";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";
import axios from "axios";
import { useEffect } from "react";

export default function Home() {
  const [userType, setUserType] = React.useState("");
  const [userCountry, setUserCountry] = React.useState("");
  const [lastimport, setLastImport] = React.useState({});

  useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    if (user?.isAdmin) {
      setUserType("admin");
    } else {
      setUserType("subcontractor");
      setUserCountry(user?.subcontractorCountry);
    }
    if (!token) {
      window.location.href = "/";
    }
    let begginningOfToday = new Date().setHours(0, 0, 0, 0);
    let body = {
      table: "log",
      method: "customquery",
      query: { type: "import", dateTimeStamp: { $gte: begginningOfToday } },
      sort: { createdAt: 1 },
    }
    const fetchLastImport = async () => {
      const lastLog = await axios.post("/api/v1/commonservice", body);
      if (lastLog.data[0]) {
        setLastImport(lastLog.data[0]);
      }
    }
    fetchLastImport();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Cosmoplitan conrol panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar noBack={true}></Navbar>
      <main>
        <div className="grid">
          {userType === 'admin' ? <div className="card">
            <FileComponent />
          </div> : null}
          {/*  {userType === 'admin' ? <div
            className="card"
            style={{ cursor: "pointer" }}
          >s
            <h3>Posljednji import &rarr;</h3>
            <p>{lastimport?.dateTimeStamp}</p>
          </div>
            : null} */}
          <div
            className="card"
            onClick={() => {
              window.location.href = "/app/reports";
            }}
            style={{ cursor: "pointer" }}
          >
            <h3>Report/Baza &rarr;</h3>
          </div>

          {userType === 'admin' && (<div
            className="card"
            onClick={() => {
              window.location.href = "/app/manageUsers";
            }}
            style={{ cursor: "pointer" }}
          >
            <h3>Upravljanje korisnicima &rarr;</h3>
          </div>)}
          {userType === 'admin' && (<div
            className="card"
            onClick={() => {
              window.location.href = "/app/statistics";
            }}
            style={{ cursor: "pointer" }}
          >
            <h3>Statistike po mjesecima &rarr;</h3>
          </div>)}
          {userType === 'admin' && (<div
            className="card"
            onClick={() => {
              window.location.href = "/app/statisticsByDest";
            }}
            style={{ cursor: "pointer" }}
          >
            <h3>Statistike po po destinacijama &rarr;</h3>
          </div>)}
          {userType === 'admin' && (<div
            className="card"
            onClick={() => {
              window.location.href = "/app/accounting";
            }}
            style={{ cursor: "pointer" }}
          >
            <h3>Obracuni &rarr;</h3>
          </div>)}
          {userType === 'admin' && (<div
            className="card"
            onClick={() => {
              window.location.href = "/app/tables";
            }}
            style={{ cursor: "pointer" }}
          >
            <h3>Cijene i Lokacije &rarr;</h3>
          </div>)}
          {userType === 'admin' && (<div
            className="card"
            onClick={() => {
              window.location.href = "/app/missingData";
            }}
            style={{ cursor: "pointer" }}
          >
            <h3>Nedostajuci podaci &rarr;</h3>
          </div>)}
          {userType === 'admin' && (<div
            className="card"
            style={{ cursor: "pointer" }}
          >
            <h4>Last import log from EasyJet: </h4>
            <h5>{new Date(lastimport?.dateTimeStamp).toLocaleDateString()}</h5>
            <p>{lastimport?.message}</p>
          </div>)}
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
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 1rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
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

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .subtitle {
          font-size: 2rem;
        }

        .grid {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 800px;
          margin-top: 2.5rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          min-height: 150px;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card:hover,
        .card:focus,
        .card:active {
          border: 4px solid #000000;
          transition: 0.5s;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          width: 3.5rem;
          margin-left: 20px;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
