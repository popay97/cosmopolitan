import Head from "next/head";
import React from "react";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";
import { exportTableToExcel } from "../../lib/exportToExcel";
import axios from 'axios';
import StatTable from "../../components/StatTable";

export default function Statistics() {
  const [yearPort, setYearPort] = React.useState(0);
  const [monthPort, setMonthPort] = React.useState(0);
  const [data, setData] = React.useState({});
  const [months, setMonths] = React.useState([]);
  const [airportsIn, setAirportsIn] = React.useState([]);
  const [airportsOut, setAirportsOut] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
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
    const fetchData = async () => {
        let year = tab.year;
        let month = tab.month;
        if (!year && !month) return;
        if (year < 2000) return;
        if (!month || month < 1 || month > 12) {
            month = undefined;
        }
        const result = await axios.post('/api/v1/statistics2', {
            year: year,
            month: month,
        });
        setData(result.data);
        setMonths(Object.keys(result.data.incoming[Object.keys(result.data.incoming)[0]]).filter((month) => month !== 'totalTransfers' && month !== 'totalPassengers'));
        setAirportsIn(Object.keys(result.data.incoming));
        setAirportsOut(Object.keys(result.data.outgoing));
        setLoading(false);
    };
    setLoading(true);
    fetchData();
    
}, [tab]);


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
          {Object.keys(data).length > 0 ?
          <div>
          <h2>Dolasci</h2>
          <div className="red">
            <div className="tabela">
              <label htmlFor="transfers" style={{ fontWeight: '600', fontSize: 18 }}>Transferi: </label>
              {!loading && <StatTable data={data} airports={airportsIn} months={months} year={tab.year} id={"incomingtransfersTable"} type="incoming"/>}
              {!loading  ? <button className="myButton" onClick={() => {
                if (tab?.month < 1 && tab?.month > 12) exportTableToExcel('incomingtransfersTable', `transferi ${tab.year} -incoming`)
                else exportTableToExcel('incomingtransfersTable', `transferi ${tab.year}-${tab.month} -incoming`)
              }}>Export</button> : null}


            </div>
            <div className="tabela">
              <label htmlFor="passengers" style={{ fontWeight: '600', fontSize: 18 }}>Putnici: </label>
              {!loading && <StatTable data={data} airports={airportsIn} months={months} passangers={true} year={tab.year} id="incomingpassangersTable" type="incoming"/>}
              {!loading ? (<button className="myButton" onClick={() => {
                if (tab.month < 1 && tab.month > 12) exportTableToExcel('incomingpassangersTable', `putnici ${tab.year} -incoming`)
                else exportTableToExcel('incomingpassangersTable', `putnici ${tab.year}-${tab.month} -incoming`)
              }}>Export</button>) : null}

            </div>
          </div>
          <br></br>
          <br></br>
          <h2>Odlasci</h2 >
          <div className="red">
            <div className="tabela">
              <label htmlFor="transfers" style={{ fontWeight: '600', fontSize: 18 }}>Transferi: </label>
              {!loading && <StatTable data={data} airports={airportsOut} months={months} year={tab.year} id={"outgoingtransfersTable"} type="outgoing"/>}
              {!loading ? <button className="myButton" onClick={() => {
                if (tab?.month < 1 && tab?.month > 12) exportTableToExcel('outgoingtransfersTable', `transferi ${tab.year} -outgoing`)
                else exportTableToExcel('outgoingtransfersTable', `transferi ${tab.year}-${tab.month} -outgoing`)
              }}>Export</button> : null}


            </div>
            <div className="tabela">
              <label htmlFor="passengers" style={{ fontWeight: '600', fontSize: 18 }}>Putnici: </label>
              {!loading && <StatTable data={data} airports={airportsOut} months={months} passangers={true} year={tab.year} id="outgoingpassangersTable" type="outgoing"/>}
              {!loading ? (<button className="myButton" onClick={() => {
                if (tab.month < 1 && tab.month > 12) exportTableToExcel('outgoingpassangersTable', `putnici ${tab.year} -outgoing`)
                else exportTableToExcel('outgoingpassangersTable', `putnici ${tab.year}-${tab.month} -outgoing`)
              }}>Export</button>) : null}

            </div>
          </div>
          </div>
         : null}
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
