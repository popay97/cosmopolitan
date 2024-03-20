import React, { useEffect, useRef } from "react";
import Reservation from "../../models/ReservationModel";
import TableComponent from "../../components/TableComponent";
import Navbar from "../../components/Navbar";
import Head from "next/head";
import jwt from "jsonwebtoken";
import { exportTableToExcel } from "../../lib/exportToExcel";


export async function getServerSideProps(context) {
  const getData = await Reservation.find({
    status: { $ne: "CANCELLED" },
  }).lean();
  const data = JSON.parse(JSON.stringify(getData));
  let airports = [];
  let resorts = [];
  let billingDestinations = [];
  let AllData = data.filter((r) => {
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
    if (
      billingDestinations.indexOf(r.billingDestination) === -1 &&
      r.billingDestination != undefined &&
      r.billingDestination != null &&
      r.billingDestination != ""
    ) {
      billingDestinations.push(r.billingDestination);
    }
    return true;
  });
  return {
    props: { airports, resorts, billingDestinations },
  };
}


export default function StatisticsByDest({ airports, resorts, billingDestinations }) {
  const [airport, setAirport] = React.useState(0);
  const [year, setYear] = React.useState(0);
  const [month, setMonth] = React.useState(0);
  const [day, setDay] = React.useState(0);
  const [data, setData] = React.useState([]);
  const [view, setView] = React.useState("hotel");
  const [yearOnly, setYearOnly] = React.useState(false);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const columns = React.useMemo(
    () => {
      if (view === "hotel") {
        return [
          {
            Header: "Hotel",
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
          {
            Header: "Number of Passengers",
            accessor: "numOfPassengers",
          },
          {
            Header: "% Passengers",
            accessor: "percentagePassengers",
          }
        ]
      }
      else {
        return [
          {
            Header: "Resort",
            accessor: "billingDestination",
          },
          {
            Header: "Number of Transfers",
            accessor: "numOfTransfers",
          },
          {
            Header: "Percentage",
            accessor: "percentage",
          },
          {
            Header: "Number of Passengers",
            accessor: "numOfPassengers",
          },
          {
            Header: "% Passengers",
            accessor: "percentagePassengers",
          }
        ]
      }
    },
    [view]
  );
  const displayData = React.useMemo(() => {
    if (data.length > 0 && !yearOnly) {
      console.log('nije samo godina')
      if (view === "hotel") {
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
          let numOfPassengers = 0;
          for (let j = 0; j < data.length; j++) {
            if (data[j].resort === resort) {
              numOfTransfers++;
              numOfPassengers += data[j].adults + data[j].children + data[j].infants;
            }
          }
          let percentage = ((numOfTransfers / total) * 100).toFixed(2);
          let percentagePassengers = ((numOfPassengers / total) * 100).toFixed(2);
          if (percentage > 0) {
            resortData.push({ resort, numOfTransfers, percentage, numOfPassengers, percentagePassengers });
          }
        }
        return resortData.sort((a, b) => b.numOfTransfers - a.numOfTransfers);
      }
      else {
        //do the same but insted of resort do billingDestination
        let total = data.length;
        for (let i = 0; i < data.length; i++) {
          let billingDestination = data[i].billingDestination;
          if (billingDestinations.indexOf(billingDestination) === -1) {
            billingDestinations.push(billingDestination);
          }
        }
        let billingDestinationData = [];
        for (let i = 0; i < billingDestinations.length; i++) {
          let billingDestination = billingDestinations[i];
          let numOfTransfers = 0;
          let numOfPassengers = 0;
          for (let j = 0; j < data.length; j++) {
            if (data[j].billingDestination === billingDestination) {
              numOfTransfers++;
              numOfPassengers += data[j].adults + data[j].children + data[j].infants;
            }
          }
          let percentage = ((numOfTransfers / total) * 100).toFixed(2);
          let percentagePassengers = ((numOfPassengers / total) * 100).toFixed(2);
          if (percentage > 0) {
            billingDestinationData.push({ billingDestination, numOfTransfers, percentage, numOfPassengers, percentagePassengers });
          }
        }
        return billingDestinationData.sort((a, b) => b.numOfTransfers - a.numOfTransfers);
      }
    }
    else if (data.length > 0 && yearOnly) {
      //same as above but each element of data is an array with a monthly data, let each element of data be a month and data formatting be the same as above
      setYearOnly(true);
      let resortData = [];
      let billingDestinationData = [];
      for (let i = 0; i < data.length; i++) {
        let monthData = data[i];
        let total = monthData.length;
        let totalPassengers = monthData.reduce((total, current) => total + current.adults + current.children + current.infants, 0);
        for (let j = 0; j < monthData.length; j++) {
          let resort = monthData[j].resort;
          let billingDestination = monthData[j].billingDestination;
          if (resorts.indexOf(resort) === -1) {
            resorts.push(resort);
          }
          if (billingDestinations.indexOf(billingDestination) === -1) {
            billingDestinations.push(billingDestination);
          }
        }
        let monthlyResortData = [];
        for (let j = 0; j < resorts.length; j++) {
          let resort = resorts[j];
          let numOfTransfers = 0;
          let numOfPassengers = 0;
          for (let k = 0; k < monthData.length; k++) {
            if (monthData[k].resort === resort) {
              numOfTransfers++;
              numOfPassengers += monthData[k].adults + monthData[k].children + monthData[k].infants;
            }
          }
          let percentage = ((numOfTransfers / total) * 100).toFixed(2);
          let percentagePassengers = ((numOfPassengers / totalPassengers) * 100).toFixed(2);
          if (percentage > 0) {
            monthlyResortData.push({ resort, numOfTransfers, percentage, numOfPassengers,percentagePassengers })
          }
        }
        resortData.push(monthlyResortData.sort((a, b) => b.numOfTransfers - a.numOfTransfers));
        let monthlyBillingDestinationData = [];
        for (let j = 0; j < billingDestinations.length; j++) {
          let billingDestination = billingDestinations[j];
          let numOfTransfers = 0;
          let numOfPassengers = 0;
          for (let k = 0; k < monthData.length; k++) {
            if (monthData[k].billingDestination === billingDestination) {
              numOfTransfers++;
              numOfPassengers += monthData[k].adults + monthData[k].children + monthData[k].infants;
            }
          }
          let percentage = ((numOfTransfers / total) * 100).toFixed(2);
          let percentagePassengers = ((numOfPassengers / totalPassengers) * 100).toFixed(2);
          if (parseFloat(percentage) > 0) {
            monthlyBillingDestinationData.push({ billingDestination, numOfTransfers, percentage, numOfPassengers, percentagePassengers })
          }
        }
        billingDestinationData.push(monthlyBillingDestinationData.sort((a, b) => b.numOfTransfers - a.numOfTransfers));
      }

      if (view === "hotel") {
        console.log("a kao vraca tabelu za resort")
        return resortData
      }
      else {
        return billingDestinationData
      }

    }
    return [];

  }, [data, view, yearOnly]);

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
        if (data.yearOnly) {
          setYearOnly(true);
          setData(data.reservationsArray);
        }
        else {
          setYearOnly(false);
          setData(data.reservations);
        }
      });
  };

  return (
    <>
      <Head>
        <title>Cosmoplitan conrol panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
            Stats by:
            <select value={view} onChange={
              (event) => {
                setView(event.target.value);
              }
            }>
              <option value="hotel">Hotel</option>
              <option value="resort">Resort</option>
            </select>
          </label>
          <label>
            Year:
            <input type='number' value={year} onChange={handleYearChange} defaultValue={new Date().getFullYear()} />
          </label>
          <label>
            Month:
            <input type="number" value={month} onChange={handleMonthChange} defaultValue={new Date().getMonth + 1} />
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
              exportTableToExcel('airportStats', "AirportStats");
            }}
          >
            Export excel
          </button>
        </div>
        <div className='table'>
          {displayData.length > 0 && !yearOnly && (
            <TableComponent
              id='airportStats'
              columns={columns}
              data={displayData}
            />
          )}
          {displayData.length > 0 && yearOnly && (
            displayData.map((monthData, index) => {
              if (monthData.length > 0) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', margin: '10px', justifyContent: 'center', alignItems: 'center' }}>
                    <h3>{months[index]}</h3>
                    <TableComponent
                      id='airportStats'
                      columns={columns}
                      data={monthData}
                      key={index}
                    />
                  </div>
                )
              }
            })
          )}
          {displayData.length === 0 && (
            <h1>No data to display</h1>
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
            overflow-x: ${yearOnly ? "scroll" : "hidden"};
            display: flex;
            flex-direction: ${yearOnly ? "row" : "column"};
            align-items: ${yearOnly ? "flex-start" : "center"};
            justify-content: ${yearOnly ? "flex-start" : "center"};
            width: 100vw;
          }
        `}</style>
      </div>
    </>
  );
}
