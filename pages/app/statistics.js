import Head from "next/head";
import React from "react";
import jwt from "jsonwebtoken";
import TableComponent from "../../components/TableComponent";
import Navbar from "../../components/Navbar";
import axios from "axios";
import { exportTableToExcel } from "../../lib/exportToExcel";


export default function Statistics() {
  const [months, setMonths] = React.useState([]);
  const [transfersArr, setTransfersArr] = React.useState([]);
  const [passengersArr, setPassengersArr] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [yearPort, setYearPort] = React.useState(0);
  const [monthPort, setMonthPort] = React.useState(0);
  const [yearDest, setYearDest] = React.useState(0);
  const [monthDest, setMonthDest] = React.useState(0);

  const fetchTransfers = async (year, month) => {
    let reqobj;
    if (year && month) {
      reqobj = {
        year: year,
        month: month,
      };
    } else {
      reqobj = {
        year: year,
        month: undefined,
      };
    }
    await axios.post("/api/v1/statistics", reqobj).then((res) => {
      setMonths(res.data.months);
      var tmp1 = [];
      var tmp2 = [];
      for (let i = 0; i < res.data.airports.length; i++) {
        tmp1.push(res.data.brojTransfera[res.data.airports[i]]);
      }
      for (let i = 0; i < res.data.airports.length; i++) {
        tmp2.push(res.data.brojPutnika[res.data.airports[i]]);
      }
      setTransfersArr(tmp1);
      setPassengersArr(tmp2);
      setLoading(false);
    });
  };
  let displayTransfers = React.useMemo(() => {
    return transfersArr;
  }, [transfersArr]);


  let displayPassengers = React.useMemo(() => {
    return passengersArr;
  }, [passengersArr]);


  React.useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    if (!token || !user.isAdmin) {
      window.location.href = "/";
    }
    const year = new Date().getFullYear();
    fetchTransfers(year);
  }, []);


  const columns1 = React.useMemo(
    () => [
      {
        Header: "Airport",
        accessor: "airport",
      },
      ...months.map((m) => {
        return {
          Header: m,
          accessor: m,
        };
      }),
      {
        Header: "Total",
        accessor: "Total",
      },
    ],
    [months]
  );


  if (loading) {
    return <div>Loading...</div>;
  } else {
    return (
      <div className="container">
        <Head>
          <title>Cosmoplitan conrol panel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <Navbar />
          <h1 className="title">Transferi i putnici</h1>
          <div className="tables">
            <h2>Po Aerodromu: </h2>
            <div className="period-filter">
              <div className='filter'>
                <label htmlFor="year">Godina: </label>
                <input type="number" id="year" onChange={(e) => setYearPort(e.target.value)} />
              </div>
              <div className='filter'>
                <label htmlFor="month">Mjesec: </label>
                <input type="number" id="month" onChange={(e) => setMonthPort(e.target.value)} />
              </div>
            </div>
            <div className="red">
              <div className="tabela">
                <h3>Transferi</h3>
                <TableComponent
                  id='transfers-dest'
                  columns={columns1}
                  data={displayTransfers}
                />
                <button
                  className="myButton"
                  onClick={() => {
                    exportTableToExcel("transfers-dest");
                  }}
                >
                  Export to excel
                </button>
              </div>
              <div className="tabela">
                <h3>Putnici: </h3>
                <TableComponent
                  id='passengers-dest'
                  columns={columns1}
                  data={displayPassengers}
                />
                <button
                  className="myButton"
                  onClick={() => {
                    exportTableToExcel("passengers-dest");
                  }}
                >
                  Export to excel
                </button>
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
              widrt: 100%;
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
              justify-content: space-evenly;
              align-items: center;
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
}
