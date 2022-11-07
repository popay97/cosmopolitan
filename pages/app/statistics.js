import Head from "next/head";
import React, { useRef } from "react";
import Reservation from "../../models/ReservationModel";
import jwt from "jsonwebtoken";
import TableComponent from "../../components/TableComponent";
import { DownloadTableExcel } from "react-export-table-to-excel";

export async function getServerSideProps(context) {
  //calculate number of reservations per airport per month for the last 12 months and place in a table
  const util = require("util");
  const getData = await Reservation.find({}).lean();
  const data = JSON.parse(JSON.stringify(getData));
  let airports = [];
  let AllData = data.filter((r) => {
    if (r.status == "CANCELLED" || r.arrivalDate === undefined) {
      return false;
    } else {
      if (
        airports.indexOf(r.arrivalAirport) === -1 &&
        r.arrivalAirport != undefined &&
        r.arrivalAirport != null &&
        r.arrivalAirport != ""
      ) {
        airports.push(r.arrivalAirport);
      }
      return true;
    }
  });
  let months = [];
  let AllMonths = AllData.filter((r) => {
    let arrdate = new Date(r.arrivalDate);
    if (
      months.indexOf(`${arrdate.getMonth()}-${arrdate.getFullYear()}`) === -1
    ) {
      months.push(`${arrdate.getMonth()}-${arrdate.getFullYear()}`);
    }
    return true;
  });
  //sort months by descending order (newest first)
  months.sort((a, b) => {
    let a1 = a.split("-");
    let b1 = b.split("-");
    if (a1[1] > b1[1]) {
      return -1;
    } else if (a1[1] < b1[1]) {
      return 1;
    } else {
      if (a1[0] > b1[0]) {
        return -1;
      } else if (a1[0] < b1[0]) {
        return 1;
      } else {
        return 0;
      }
    }
  });
  //sort airports alphabetically
  airports.sort((a, b) => {
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  });
  let brojTransfera = {};
  let brojPutnika = {};
  for (let i = 0; i < airports.length; i++) {
    brojTransfera[airports[i]] = { airport: airports[i] };
    brojPutnika[airports[i]] = { airport: airports[i] };
    for (let j = 0; j < months.length; j++) {
      brojTransfera[airports[i]][months[j]] = 0;
      brojPutnika[airports[i]][months[j]] = 0;
    }
  }
  for (let i = 0; i < AllData.length; i++) {
    let arrdate = new Date(AllData[i].arrivalDate);
    brojTransfera[AllData[i].arrivalAirport][
      `${arrdate.getMonth()}-${arrdate.getFullYear()}`
    ]++;
    brojPutnika[AllData[i].arrivalAirport][
      `${arrdate.getMonth()}-${arrdate.getFullYear()}`
    ] += AllData[i].adults + AllData[i].children + AllData[i].infants;
  }
  let resortPercentageofTransfersbyAirport = [];
  // calculate the percentage of transfers per resort per airport, do not differentiate between months
  for (let i = 0; i < airports.length; i++) {
    resortPercentageofTransfersbyAirport[airports[i]] = {
      airport: airports[i],
    };
    let totalTransfers = 0;
    for (let j = 0; j < AllData.length; j++) {
      if (AllData[j].arrivalAirport == airports[i]) {
        totalTransfers++;
      }
    }
    for (let j = 0; j < AllData.length; j++) {
      if (AllData[j].arrivalAirport == airports[i]) {
        if (
          resortPercentageofTransfersbyAirport[airports[i]][
            AllData[j].resort
          ] == undefined
        ) {
          resortPercentageofTransfersbyAirport[airports[i]][AllData[j].resort] =
            1 / totalTransfers;
        } else {
          resortPercentageofTransfersbyAirport[airports[i]][
            AllData[j].resort
          ] += 1 / totalTransfers;
        }
      }
    }
  }
  return {
    props: {
      months: months,
      airports: airports,
      brojPutnika: brojPutnika,
      brojTransfera: brojTransfera,
      resortPercentageofTransfersbyAirport:
        resortPercentageofTransfersbyAirport,
    },
  };
}

export default function Statistics({
  brojTransfera,
  brojPutnika,
  airports,
  months,
  resortPercentageofTransfersbyAirport,
}) {
  React.useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    if (!token || !user.isAdmin) {
      window.location.href = "/";
    }
  }, []);
  var transfersArr = [];
  for (let i = 0; i < airports.length; i++) {
    transfersArr.push(brojTransfera[airports[i]]);
  }
  var passengersArr = [];
  for (let i = 0; i < airports.length; i++) {
    passengersArr.push(brojPutnika[airports[i]]);
  }
  var resortPercentageofTransfersbyAirportArr = [];
  for (let i = 0; i < airports.length; i++) {
    resortPercentageofTransfersbyAirportArr.push(
      resortPercentageofTransfersbyAirport[airports[i]]
    );
  }
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
    ],
    [months]
  );

  return (
    <div className="container">
      <Head>
        <title>Cosmoplitan conrol panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">Statistics</h1>
        <div className="tables">
          <h3>Transferi po destinaciji</h3>
          <TableComponent
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
            filename="report-transferi"
            sheet="trnasfers"
            currentTableRef={tableRef.current}
          >
            <button
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
            filename="report-putnici"
            sheet="passengers"
            currentTableRef={tableRef2.current}
          >
            <button
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
