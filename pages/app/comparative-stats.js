import Head from "next/head";
import React from "react";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";
import { exportTableToExcel } from "../../lib/exportToExcel";
import axios from 'axios';
import ComparativeStatTable from "../../components/ComparativeStatTable"; // Assuming you have this component

export default function ComparativeStatistics() {
  const [year1, setYear1] = React.useState(new Date().getFullYear());
  const [year2, setYear2] = React.useState(new Date().getFullYear() - 1);
  const [data, setData] = React.useState({});
  const [months, setMonths] = React.useState([]);
  const [airports, setAirports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    if (!token || !user.isAdmin) {
      window.location.href = "/";
    }

    const fetchData = async () => {
      if (year1 < 2000 || year2 < 2000) return;

      const result = await axios.post('/api/v1/comparative-stat', {
        year1,
        year2,
      });

      setData(result.data);

      // Assuming your API response structure is as described in the previous response
      const sampleAirport = Object.keys(result.data.incoming)[0];
      setMonths(Object.keys(result.data.incoming[sampleAirport]).filter(month => month !== 'totalTransfers' && month !== 'totalPassengers'));
      const allAirports = new Set([...Object.keys(result.data.incoming), ...Object.keys(result.data.outgoing)]);
      setAirports(Array.from(allAirports)); 
      setLoading(false);
    };

    setLoading(true);
    fetchData();
  }, [year1, year2]);

  const handleYearChange = (event, setYearFunction) => {
    const newYear = parseInt(event.target.value, 10);
    if (!isNaN(newYear) && newYear >= 1900 && newYear <= 2100) { // Reasonable year range
      setYearFunction(newYear);
    }
  };

  // Helper function to merge incoming and outgoing data
  const mergeIncomingOutgoingData = (data) => {
    const mergedData = {};
    for (const type of ['incoming', 'outgoing']) {
      for (const airport in data[type]) {
        if (!mergedData[airport]) {
          mergedData[airport] = {};
        }
        Object.assign(mergedData[airport], data[type][airport]);
      }
    }
    return mergedData;
  };

  return (
    <div className="container">
      <Head>
        <title>Cosmoplitan conrol panel - Comparative Statistics</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main>
        <h1 className="title">Comparative Transfer and Passenger Statistics</h1>
        <div className="tables">
          <div className="period-filter">
            <div className='filter'>
              <label htmlFor="year1">Year 1: </label>
              <input type="number" min="1900" max="2100" id="year1" value={year1} onChange={(e) => handleYearChange(e, setYear1)} />
            </div>
            <div className='filter'>
              <label htmlFor="year2">Year 2: </label>
              <input type="number" min="1900" max="2100" id="year2" value={year2} onChange={(e) => handleYearChange(e, setYear2)} />
            </div>
          </div>
          {Object.keys(data).length > 0 && (
            <div>
              <div className="red">
                <div className="tabela">
                  {loading && <p>Loading...</p>}
                  {!loading && ( 
                    <label htmlFor="transfers" style={{ fontWeight: '600', fontSize: 18 }}>Transfers: </label>  
                    )}
                
                  {!loading && (
                    <ComparativeStatTable 
                      data={mergeIncomingOutgoingData(data)} 
                      airports={airports} 
                      months={months} 
                      type={"transfers"}
                      year1={year1} 
                      year2={year2}
                      id={"comparativeStatsTable-transfers"}
                    />
                  )}
                  {!loading && (
                    <button className="myButton" onClick={() => exportTableToExcel('comparativeStatsTable-transfers', `comparative_stats_${year1}_${year2}`)}>
                      Export
                    </button>
                  )}
                  <br></br>
                  <br></br>
                  <br></br>
                  {!loading && (
                    <label htmlFor="passengers" style={{ fontWeight: '600', fontSize: 18 }}>Passengers: </label>
                  )
                    }
                  {!loading && ( 
                    <ComparativeStatTable 
                      data={mergeIncomingOutgoingData(data)} 
                      airports={airports} 
                      months={months} 
                      type={"passengers"}
                      year1={year1} 
                      year2={year2}
                      id={"comparativeStatsTable-passengers"}
                    />
                  )}
                  {!loading && (
                    <button className="myButton" onClick={() => exportTableToExcel('comparativeStatsTable-passengers', `comparative_stats_${year1}_${year2}`)}>
                      Export
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <footer>
      <div className="footer-div">
          <p>Powered by</p>
          <img src="/trid-logo.jpg" alt="Trid Logo" className="logo" />
        </div>
      </footer>

      <style jsx>{`
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
          `}</style>
    </div>
  );
}