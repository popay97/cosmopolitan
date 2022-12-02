import React, { useEffect, useState, useMemo, useRef } from "react";
import Head from "next/head";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";
import TableComponent from "../../components/TableComponent";
import axios from "axios";

export default function Accounting() {
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const tableRef = useRef(null);

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
        accessor: (row) => row.pricing.outgoingInvoice.cost,
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
          if (parseInt(objYear) === parseInt(year) && parseInt(objMonth) === parseInt(month)) {
            return (
              parseFloat(value.pricing.outgoingInvoice.cost * value.pricing.ways + parseFloat(value.pricing.outgoingInvoice.handlingFee)).toFixed(2)
            );
          }
          return parseFloat(value.pricing.outgoingInvoice.cost * value.pricing.ways).toFixed(2);
        },
      },
    ],
    [month, year]
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
    async function fetchData() {
      setLoading(true);
      const res = await axios
        .post("/api/v1/reservations", { year, month })
        .then((res) => {
          console.log(res.data);
          setData(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
      setLoading(false);
    }

    if (year && month) {
      fetchData();
    }
  }, [year, month]);

  return (
    <>
      <Head>
        <title>Accounting</title>
      </Head>
      <Navbar />
      <div className="container">
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
        </div>
        {loading && data.length == 0 ? (
          <div className="loading">Please select year and month</div>
        ) : (
          <TableComponent
            columns={columns}
            data={displayData}
            tableRef={tableRef}
          />
        )}

        <style jsx>{`
          .container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .filterRow {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .filter {
            margin: 0 10px;
          }
          .loading {
            font-size: 20px;
            font-weight: 600;
          }
        `}</style>
      </div>
    </>
  );
}
