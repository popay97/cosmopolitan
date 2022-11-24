import Head from "next/head";
import React, { useRef } from "react";
import jwt from "jsonwebtoken";
import TableComponent from "../../components/TableComponent";
import { DownloadTableExcel } from "react-export-table-to-excel";
import Navbar from "../../components/Navbar";
import axios from "axios";

export default function Statistics() {
  const [months, setMonths] = React.useState([]);
  const [transfersArr, setTransfersArr] = React.useState([]);
  const [passengersArr, setPassengersArr] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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

  React.useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    if (!token || !user.isAdmin) {
      window.location.href = "/";
    }
    const year = new Date().getFullYear();
    fetchTransfers(year);
  }, []);

  const tableRef = useRef(null);
  const tableRef2 = useRef(null);

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
          <h1 className="title">Statistike po mjesecima</h1>
          <div className="tables">
            <h3>Transferi po destinaciji</h3>
            <TableComponent
              key={transfersArr.length}
              refValue={tableRef}
              columns={columns1}
              data={transfersArr}
            ></TableComponent>
            <button
              className="myButton"
              onClick={() => {
                if (document.getElementById("download-report1")) {
                  document.getElementById("download-report1").click();
                }
              }}
            >
              Download
            </button>
            <DownloadTableExcel
              key={transfersArr.length > 0 ? "data" : "empty"}
              filename="report-transferi"
              sheet="trnasfers"
              currentTableRef={tableRef.current}
            >
              <button
                key={transfersArr.length > 0 ? "data" : "empty"}
                style={{ display: "none" }}
                id="download-report1"
                className="myButton"
              >
                {" "}
                Export excel{" "}
              </button>
            </DownloadTableExcel>
            <h3>Putnici po destinaciji</h3>
            <TableComponent
              key={passengersArr.length}
              refValue={tableRef2}
              id="table2"
              columns={columns1}
              data={passengersArr}
            ></TableComponent>
            <button
              className="myButton"
              onClick={() => {
                if (document.getElementById("download-report2")) {
                  document.getElementById("download-report2").click();
                }
              }}
            >
              Download
            </button>
            <DownloadTableExcel
              key={passengersArr.length > 0 ? "data" : "empty"}
              filename="report-putnici"
              sheet="passengers"
              currentTableRef={tableRef2.current}
            >
              <button
                key={passengersArr.length > 0 ? "data" : "empty"}
                style={{ display: "none" }}
                id="download-report2"
                className="myButton"
              >
                {" "}
                Export excel{" "}
              </button>
            </DownloadTableExcel>
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
            .demTable {
              display: block;
              width: 100%;
              overflow-y: hidden;
              border: 1px outset #b3adad;
              border-collapse: separate;
              border-spacing: 2px;
              padding: 3px;
              border-radius: 5px;
              margin-bottom: 20px;
              box-shadow: rgba(0, 0, 0, 0.25) 0px 0.0625em 0.0625em,
                rgba(0, 0, 0, 0.25) 0px 0.125em 0.5em,
                rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset;
            }
            .demTable th {
              border: 1px outset #b3adad;
              padding: 5px;
              font-size: calc(0.5vw + 0.5vh + 0.6vmin);
              background: #3a94d9;
              color: #ffffff;
              border-radius: 5px;
            }
            .demTable td {
              border: 1px outset #b3adad;
              text-align: left;
              padding: 5px;
              font-size: calc(0.4vw + 0.5vh + 0.5vmin);
              font-weight: 550;
              background: #ffffff;
              border-radius: 5px;
              color: #313030;
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
      </div>
    );
  }
}
