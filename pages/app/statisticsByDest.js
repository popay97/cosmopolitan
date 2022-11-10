import React, { useEffect, useRef } from "react";
import Reservation from "../../models/ReservationModel";
import TableComponent from "../../components/TableComponent";
import Navbar from "../../components/Navbar";
import { DownloadTableExcel } from "react-export-table-to-excel";

export async function getServerSideProps(context) {
  const getData = await Reservation.find({}).lean();
  const data = JSON.parse(JSON.stringify(getData));
  let airports = [];
  let resorts = [];
  let AllData = data.filter((r) => {
    if (r.status == "CANCELLED" || r.booked === undefined) {
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
      if (
        resorts.indexOf(r.resort) === -1 &&
        r.resort != undefined &&
        r.resort != null &&
        r.resort != ""
      ) {
        resorts.push(r.resort);
      }
      return true;
    }
  });

  return {
    props: { airports, resorts },
  };
}
export default function StatisticsByDest({ airports, resorts }) {
  const [airport, setAirport] = React.useState(0);
  const [year, setYear] = React.useState(0);
  const [month, setMonth] = React.useState(0);
  const [day, setDay] = React.useState(0);
  const [data, setData] = React.useState([]);
  const [displayData, setDisplayData] = React.useState([]);
  const tableRef = useRef(null);
  const columns = React.useMemo(
    () => [
      {
        Header: "Resort",
        accessor: "resort",
      },
      {
        Header: "Number of Transfers",
        accessor: "numOfTransfers",
      },
      {
        Header: "Percentage",
        accessor: "percentage",
      },
    ],
    []
  );

  const handleAirportChange = (event) => {
    setAirport(event.target.value);
  };
  const handleYearChange = (event) => {
    setYear(event.target.value);
  };
  const handleMonthChange = (event) => {
    setMonth(event.target.value);
  };
  const handleDayChange = (event) => {
    setDay(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    //call api to get data
    fetch("/api/v1/destinationResortStats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destionation: airport,
        month: month,
        year: year,
        day: day,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      });
  };
  useEffect(() => {
    if (data.length > 0) {
      let total = data.length;
      for (let i = 0; i < data.length; i++) {
        let resort = data[i].resort;
        if (resorts.indexOf(resort) === -1) {
          resorts.push(resort);
        }
      }
      let resortData = [];
      for (let i = 0; i < resorts.length; i++) {
        let resort = resorts[i];
        let numOfTransfers = 0;
        for (let j = 0; j < data.length; j++) {
          if (data[j].resort === resort) {
            numOfTransfers++;
          }
        }
        let percentage = ((numOfTransfers / total) * 100).toFixed(2);
        if (percentage > 0) {
          resortData.push({ resort, numOfTransfers, percentage });
        }
      }
      setDisplayData(resortData);
    }
  }, [data]);
  return (
    <>
      <Navbar></Navbar>
      <div className="main">
        <h1>Statistics By Destination</h1>
        <div className="params">
          <label>
            Airport:
            <select value={airport} onChange={handleAirportChange}>
              <option value="0">Select Airport</option>
              {airports.map((airport, index) => {
                return (
                  <option value={airport} key={index}>
                    {airport}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            Year:
            <input type="number" value={year} onChange={handleYearChange} />
          </label>
          <label>
            Month:
            <input type="number" value={month} onChange={handleMonthChange} />
          </label>
          <label>
            Day:
            <input type="number" value={day} onChange={handleDayChange} />
          </label>
          <button className="myButton" onClick={handleSubmit}>
            Submit
          </button>
          <button
            className="myButton"
            onClick={() => {
              if (
                document.getElementById("download-report-component")
                  .className !== "empty"
              ) {
                document.getElementById("download-report-component").click();
              }
            }}
          >
            Export excel
          </button>
          <DownloadTableExcel
            id="download-report-component"
            key={displayData.length > 0 ? displayData[0].resort : "empty"}
            className={displayData.length > 0 ? displayData[0].resort : "empty"}
            filename={`StatisticsByDest_${airport}_${year}_${month}_${day}`}
            sheet="trnasfers"
            currentTableRef={tableRef.current}
          >
            <button
              id="download-report-component"
              key={displayData.length > 0 ? displayData[0].resort : "empty"}
              className={
                displayData.length > 0 ? displayData[0].resort : "empty"
              }
              style={{ display: "none" }}
            >
              {" "}
              Export excel{" "}
            </button>
          </DownloadTableExcel>
        </div>
        <div className={displayData.length > 0 ? "table" : "empty"}>
          {displayData.length > 0 ? (
            <TableComponent
              columns={columns}
              data={displayData}
              refValue={tableRef}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <h3>No Data for your filter values</h3>
            </div>
          )}
        </div>
        <style jsx>{`
          .main {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            width: 100%;
            min-height: 70vh;
          }
          .params {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-evenly;
            width: 100%;
            margin-bottom: 20px;
            margin-top: 20px;
          }
          .table {
            overflow-y: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            width: min-content;
          }
        `}</style>
      </div>
    </>
  );
}
