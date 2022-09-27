import Head from "next/head";
import FileComponent from "../../components/FileUpload";
import React from "react";
import jwt from 'jsonwebtoken';

export default function Home({ isConnected }) {
    React.useEffect(() => {
        const token = localStorage.getItem("cosmo_token");
        const user = jwt.decode(token);
        console.log(user);
        if (!token) {
            window.location.href = "/";
        }
    }, [])

    return (
      <div className="container">
        <Head>
          <title>Cosmoplitan conrol panel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <div className="grid">
            <div className="card">
              <FileComponent />
            </div>

            <div className="card" onClick={() => {
              window.location.href = "/app/reports"
            }} style={{cursor: "pointer"}}>
              <h3>Reports &rarr;</h3>
            </div>

            <div className="card" onClick={() => {
              window.location.href = "/app/manageUsers"
            }} style={{cursor: "pointer"}}>
              <h3>Registruj novog korisnika &rarr;</h3>
            </div>

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
            padding: 5rem 0;
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