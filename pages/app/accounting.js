import React, { useEffect, useState, useMemo, useRef } from "react";
import Head from "next/head";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";
import TableComponent from "../../components/TableComponent";
import axios from "axios";
import { exportTableToExcel } from "../../lib/exportToExcel";

export default function Accounting() {
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withHandlingFee, setWithHandlingFee] = useState(false);
  const [country, setCountry] = useState(null);


  const displayData = React.useMemo(() => {
    return data;
  }, [data]);


  const columns = useMemo(
    () => [
      {
        Header: "Reservation ID",
        accessor: "resId",
      },
      {
        Header: "Title",
        accessor: "title",
      },
      {
        Header: "First Name",
        accessor: "name",
      },
      {
        Header: "Last Name",
        accessor: "surname",
      },
      {
        Header: "Booking Date",
        accessor: "booked",
        Cell: ({ value }) => {
          const date = value != undefined ? value.split("T")[0] : undefined;
          return date;
        },
      },
      {
        Header: "Arrival Airport",
        accessor: "arrivalAirport",
        filterType: "text",
      },
      {
        Header: "Arrival Date",
        accessor: "arrivalDate",
        Cell: ({ value }) => {
          const date = value != undefined ? value.split("T")[0] : undefined;
          return date;
        },
      },
      {
        Header: "Departure Date",
        accessor: "depDate",
        Cell: ({ value }) => {
          const date = value != undefined ? value.split("T")[0] : undefined;
          return date;
        },
      },
      {
        Header: "Transfer Type",
        accessor: (row) => row.transfer,
      },
      {
        Header: "Adults",
        accessor: (row) => row.adults,
      },
      {
        Header: "Children",
        accessor: (row) => row.children,
      },
      {
        Header: "Infants",
        accessor: (row) => row.infants,
      },
      {
        Header: "Accomodation",
        accessor: (row) => row.accom,
      },
      {
        Header: "Accom Cd",
        accessor: (row) => row.accomCd,
      },
      {
        Header: "Resort",
        accessor: (row) => row.billingDestination,
      },
      {
        Header: "Ways",
        accessor: (row) => row.pricing.ways,
      },
      {
        Header: "Transfer Cost",
        accessor: (row) => row.pricing.outgoingInvoice.cost.toFixed(2),
      },
      {
        Header: "Handling Fee",
        accessor: (row) => row,
        Cell: ({ value }) => {
          let objYear = new Date(value.depDate).getFullYear();
          let objMonth = new Date(value.depDate).getMonth() + 1;
          if (parseInt(objYear) === parseInt(year) && parseInt(objMonth) === parseInt(month)) {
            return value.pricing.outgoingInvoice.handlingFee;
          } else {
            return null;
          }

        },
      },
      {
        Header: "Total Cost",
        accessor: (row) => row,
        Cell: ({ value }) => {
          let objYear = new Date(value.depDate).getFullYear();
          let objMonth = new Date(value.depDate).getMonth() + 1;
          var handlingFee = objYear === parseInt(year) && objMonth === parseInt(month) && withHandlingFee ? true : false;
          if (handlingFee) {
            return value.pricing.outgoingInvoice.totalWithFee.toFixed(2);
          } else {
            return value.pricing.outgoingInvoice.total.toFixed(2);
          }

        }
      },
    ],
    [month, year, withHandlingFee, country]
  );

  useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    console.log(user);
    if (!token) {
      window.location.href = "/";
    }
  }, []);
  useEffect(() => {
    if (year && month && country) {
      setLoading(false);
    }
  }, [data]);

  async function fetchData(year, month, country) {
    setLoading(true);
    try {
      const res = await axios.post("/api/v1/reservations", { year, month, country })
      if (res.status === 200) {
        setData(res.data);
      }
    } catch (err) {
      console.log(err);
    }
  }


  return (
    <>
      <Head>
        <title>Accounting</title>
      </Head>
      <Navbar />
      <main>
        <div className="filterRow">
          <div className="filter">
            <label htmlFor="year">Year</label>
            <input
              type="number"
              name="year"
              id="year"
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="filter">
            <label htmlFor="month">Month</label>
            <input
              type="number"
              name="month"
              id="month"
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="filter">
            <label htmlFor="month">Month</label>
            <select
              name='country'
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value=''>Select Country</option>
              <option value='CRO'>Croatia</option>
              <option value='ME'>Montenegro</option>
            </select>
          </div>
          <div className="filter">
            <label htmlFor="handlingFee">Handling Fee</label>
            <input type='checkbox' id='handlingFee' name='handlingFee' value='handlingFee' onChange={(e) => setWithHandlingFee(e.target.checked)} />
          </div>
          <div className='filter'>
            <button
              className="myButton"
              onClick={() => {
                fetchData(year, month, country);
              }}
            >
              Load
            </button>

          </div>
          <div className='filter'>
            <button
              className="myButton"
              onClick={() => {
                exportTableToExcel('accounting-table');
              }}
            >
              Export to Excel
            </button>

          </div>
        </div>
        {loading && data.length == 0 ? (
          <div className="loading">Please select year and month</div>
        ) : (
          <div className='tabelica'>
            <TableComponent
              id='accounting-table'
              columns={columns}
              data={displayData}
            />
          </div>
        )}

        <style jsx>{`
          #main{
            display:flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100vw;
          }
          .tabelica{
            display: flex;
            f90vwlex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            width: 100vw;
            max-height: 75vh;
            overflow: scroll;
          }
          .filterRow {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .filter {
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            align-items: center;
            margin: 20px;
          }
          .loading {
            font-size: 20px;
            font-weight: 600;
            display: flex;
            flex-direction: row;
            justify-content: center;
          }
        `}</style>
      </main>
    </>
  );
}
