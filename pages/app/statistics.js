import Head from "next/head";
import React from "react";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";
import { exportTableToExcel } from "../../lib/exportToExcel";
import StatTable from "../../components/StatTable";
export default function Statistics() {
  const [yearPort, setYearPort] = React.useState(0);
  const [monthPort, setMonthPort] = React.useState(0);
  const [tab, setTab] = React.useState({
    year: 0,
    month: 0,
  });
  React.useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    if (!token || !user.isAdmin) {
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Cosmoplitan conrol panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main>
        <h1 className="title">Transferi i putnici</h1>
        <div className="tables">
          <div className="period-filter">
            <div className='filter'>
              <label htmlFor="year">Godina: </label>
              <input type="number" min={1999} max={2099} id="year" onChange={(e) => setYearPort(e.target.value)} />
            </div>
            <div className='filter'>
              <label htmlFor="month">Mjesec: </label>
              <input type="number" id="month" min={1} max={12} onChange={(e) => setMonthPort(e.target.value)} />
            </div>
            <div>
              <button className="myButton" onClick={() => {
                setTab({ year: yearPort, month: monthPort })
              }}>Filter</button>
            </div>
          </div>
          <div className="red">
            <div className="tabela">
              <label htmlFor="transfers" style={{ fontWeight: '600', fontSize: 18 }}>Transferi: </label>
              {tab?.year > 2000 ? (<StatTable year={tab.year} month={tab.month} passangers={false} id='transfersTable' />) : null}
              {tab?.year > 2000 ? <button className="myButton" onClick={() => {
                if (tab?.month < 1 && tab?.month > 12) exportTableToExcel('transfersTable', `transferi-${tab.year}`)
                else exportTableToExcel('transfersTable', `transferi-${tab.year}-${tab.month}`)
              }}>Export</button> : null}


            </div>
            <div className="tabela">
              <label htmlFor="passengers" style={{ fontWeight: '600', fontSize: 18 }}>Putnici: </label>
              {tab?.year > 2000 ? (<StatTable year={tab.year} month={tab.month} passangers={true} id='passangersTable' />) : null}
              {tab?.year > 2000 ? (<button className="myButton" onClick={() => {
                if (tab.month < 1 && tab.month > 12) exportTableToExcel('passangersTable', `putnici-${tab.year}`)
                else exportTableToExcel('passangersTable', `putnici-${tab.year}-${tab.month}`)
              }}>Export</button>) : null}

            </div>
          </div>
        </div>
      </main>
      <footer>
        <div className="footer-div">
          <p>Powered by</p>
          <img src="/trid-logo.jpg" alt="Trid Logo" className="logo" />
        </div>
      </footer>

      <style jsx>
        {`
            .period-filter {
              display: flex;
              flex-direction: row;
              justify-content: center;
              align-items: center;
              margin-bottom: 20px;
            }
            .filter {
              display: inline-block;
              margin: 0 10px;
            }
            .tabela{
              display: inline-block;
              margin: 0 20px;
            
            }
            .container {
              min-height: 100vh;
              width: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              margin: 0;
            }
            main {
              display: flex;
              width: 100%;
              min-height: 90vh;
              flex-direction: column;
              justify-content: start;
              align-items: center;
              padding-bottom: 20px;
              height: min-content;
            }
            .red{
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-evenly;
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
            .tables {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              width: 100%;
            }
          `}
      </style>
    </div >
  );

}
