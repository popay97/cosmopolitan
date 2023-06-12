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
  const [invoiceType, setInvoiceType] = useState(null);
  const monthDict = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
  };

  const displayData = React.useMemo(() => {
    return data;
  }, [data]);

  const handleInvoice = async () => {
    //get the sum of total cost column of the current table
    /*  let totalCost = 0;
     for (let i = 0; i < data.length; i++) {
       let value = data[i];
         totalCost += parseFloat(value.pricing.outgoingInvoice.totalWithFee);
   
     } */
    // calculate total sum and total handling fee 
    let totalCost = 0;
    let totalHandlingFee = 0;
    for (let i = 0; i < data.length; i++) {
      let value = data[i];
      if (value.pricing.outgoingInvoice.totalWithFee != undefined) {
        totalCost += parseFloat(value.pricing.outgoingInvoice.totalWithFee);
      }
      if (value.pricing.outgoingInvoice.handlingFee != undefined) {
        totalHandlingFee += parseFloat(value.pricing.outgoingInvoice.handlingFee);
      }
    }
    totalCost = parseFloat(totalCost.toFixed(3));
    totalHandlingFee = parseFloat(totalHandlingFee.toFixed(3));
    let invDate = new Date().toDateString();
    let invNumber = year + "/" + monthDict[month - 1]
    let invTime = new Date().toLocaleTimeString();
    let items = [
      {
        service: 'Transfers executed on territory of ' + country,
        qty: 1,
        unit: '',
        price: totalCost - totalHandlingFee,
        discount: 0.00,
        vat: 0.00,
        priceWithVat: totalCost - totalHandlingFee,
      },
      {
        service: 'Handling fee',
        qty: 1,
        unit: '',
        price: totalHandlingFee,
        discount: 0.00,
        vat: 0.00,
        priceWithVat: totalHandlingFee,
      }
    ]
    let vatSpecs = [
      {
        taxRate: 0.00,
        vatBase: totalCost - totalHandlingFee,
        vat: 0.00,
        priceWithVat: totalCost - totalHandlingFee
      },
      {
        taxRate: 0.00,
        vatBase: totalHandlingFee,
        vat: 0.00,
        priceWithVat: totalHandlingFee

      }
    ]
    let body = {
      invDate: invDate,
      invNo: invNumber,
      invTime: invTime,
      items: items,
      total: totalCost,
      vatSpecs: vatSpecs,
      month: month,
      year: year,
    }



    const result = axios({
      method: "post",
      url: "/api/v1/pdfInvoice",
      data: body,
      responseType: "blob",
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");

      link.download = `invoice-${monthDict[month - 1]}-${year}.pdf`;

      link.href = url;

      document.body.appendChild(link);

      link.click();
    })

  }



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
        accessor: (row) => {
          if (invoiceType === 'outgoing') {
            return row.pricing.outgoingInvoice.cost.toFixed(3)
          }
          else if (invoiceType === 'incoming') {
            return row.pricing.incomingInvoice.total.toFixed(3);
          }
        },

      },
      {
        Header: "Handling Fee",
        accessor: (row) => row,
        Cell: ({ value }) => {
          if (invoiceType === 'outgoing') {
            let objYear = new Date(value.depDate).getFullYear();
            let objMonth = new Date(value.depDate).getMonth() + 1;
            if (parseInt(objYear) === parseInt(year) && parseInt(objMonth) === parseInt(month)) {
              return value.pricing.outgoingInvoice.handlingFee;
            } else {
              return null;
            }
          }
          else return null;
        },

      },
      {
        Header: "Total Cost",
        accessor: (row) => row,
        Cell: ({ value }) => {
          if (invoiceType === 'outgoing') {
            let objYear = new Date(value.depDate).getFullYear();
            let objMonth = new Date(value.depDate).getMonth() + 1;
            var handlingFee = objYear === parseInt(year) && objMonth === parseInt(month) && withHandlingFee ? true : false;
            if (handlingFee) {
              return value.pricing.outgoingInvoice.totalWithFee.toFixed(3);
            } else {
              return value.pricing.outgoingInvoice.total.toFixed(3);
            }
          }
          else if (invoiceType === 'incoming') {
            return value.pricing.incomingInvoice.total.toFixed(3);
          }
          else return null

        }
      },
    ],
    [month, year, withHandlingFee, country, invoiceType]
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
      const res = await axios.post("/api/v1/reservations", {
        year: year,
        month: month,
        country: country
      })
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
            <label htmlFor="month">Year & Month</label>
            <input
              type='month'
              defaultValue={new Date().toISOString().slice(0, 7)}
              value={month < 10 ? `${year}-0${month}` : `${year}-${month}`}
              name="month"
              id="month"
              onChange={(e) => {
                setYear(parseInt(e.target.value.split("-")[0]));
                setMonth(parseInt(e.target.value.split("-")[1]));
              }}
            />
          </div>
          <div className="filter">
            <label htmlFor="month">Country</label>
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
            <label htmlFor="month">Invoice type</label>
            <select
              name='invoiceType'
              onChange={(e) => setInvoiceType(e.target.value)}
            >
              <option value=''>Select</option>
              <option value='incoming'>Incoming</option>
              <option value='outgoing'>Outgoing</option>
            </select>
          </div>
          {invoiceType === 'outgoing' ? (<div className="filter">
            <label htmlFor="handlingFee">Handling Fee</label>
            <input type='checkbox' id='handlingFee' name='handlingFee' value='handlingFee' onChange={(e) => setWithHandlingFee(e.target.checked)} />
          </div>) : (null)}
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
          <div className='filter'>
            <button
              className="myButton"
              onClick={handleInvoice}
            >
              PDF Invoice
            </button>

          </div>
        </div>
        {loading && data.length == 0 ? (
          <div className="loading">Please select required filters</div>
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
      display: flex;
      flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100vw;
  }
          .tabelica{
    display: flex;
    flex-direction: column;
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
