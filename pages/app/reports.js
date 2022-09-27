import React, { useRef } from "react";
import Reservation from "../../models/ReservationModel";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import { DownloadTableExcel } from "react-export-table-to-excel";
import {
  dateBetweenFilterFn,
  dateBetweenArrFn,
  dateBetweenDepFn,
  countryFilterFn,
} from "../../components/filterHnadlers";
import { useTable, usePagination, useFilters } from "react-table";

export async function getServerSideProps(context) {
  const getData = await Reservation.find({}).lean();
  const data = JSON.parse(JSON.stringify(getData));
  let airports = [];
  let AllData = data.filter((r) => {
    if (r.status == "CANCELLED") {
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

  return {
    props: { AllData, airports },
  };
}

function NDayReport({ AllData, airports }) {
  React.useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const user = jwt.decode(token);
    console.log(user);
    if (!token) {
        window.location.href = "/";
    }
}, [])
  const [data, setData] = React.useState([...AllData]);
  const [dateBetween, setDateBetween] = React.useState([]);
  const [dateBetweenArr, setDateBetweenArr] = React.useState([]);
  const [dateBetweenDep, setDateBetweenDep] = React.useState([]);
  const [country, setCountry] = React.useState("all");
  const tableRef = useRef(null);
  const filterTypes = React.useMemo(
    () => ({
      dateBetweenDep: dateBetweenDepFn,
      dateBetweenArr: dateBetweenArrFn,
      dateBetweenFn: dateBetweenFilterFn,
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true;
        });
      },
    }),
    []
  );

  const columns = React.useMemo(
    () => [
      {
        Header: "Reservation ID",
        accessor: "resId",
        canFilter: false,
      },
      {
        Header: "Title",
        accessor: "title",
        canFilter: false,
      },
      {
        Header: "First Name",
        accessor: "name",
        canFilter: false,
      },
      {
        Header: "Last Name",
        accessor: "surname",
        canFilter: false,
      },
      {
        Header: "Phone",
        accessor: (row) => row.phone.replace(" ", ""),
        canFilter: false,
      },
      {
        Header: "Booking Date",
        accessor: "booked",
        Cell: ({ value }) => {
          const date = value.split("T")[0];
          return date;
        },
        filter: dateBetweenFilterFn,
        canFilter: true,
      },
      {
        Header: "Arrival Airport",
        accessor: "arrivalAirport",
        filterType: "text",
        canFilter: true,
      },
      {
        Header: "Arrival Date",
        accessor: "arrivalDate",
        Cell: ({ value }) => {
          const date = value.split("T")[0];
          return date;
        },
        filter: dateBetweenArrFn,
        canFilter: false,
      },
      {
        Header: "Arrival Flight",
        accessor: "arrivalFlight",
        Cell: (props) => {
          return (
            props.row.original.arrivalFlight.number +
            " " +
            props.row.original.arrivalDate?.split("T")[1].slice(0, 5) +
            " " +
            props.row.original.departureFlight.arrAirport +
            " - " +
            props.row.original.arrivalAirport
          );
        },
        filter: countryFilterFn,
        canFilter: true,
      },
      {
        Header: "Departure Date",
        accessor: "depDate",
        Cell: ({ value }) => {
          const date = value.split("T")[0];
          return date;
        },
        filter: dateBetweenDepFn,
        canFilter: true,
      },
      {
        Header: "Departure Flight",
        accessor: (row) =>
          row.departureFlight.number +
          " " +
          row.depDate?.split("T")[1].slice(0, 5) +
          " " +
          row.arrivalAirport +
          " - " +
          row.departureFlight.arrAirport,
        canFilter: false,
      },
      {
        Header: "Transfer Type",
        accessor: (row) => row.transfer,
        canFilter: false,
      },
      {
        Header: "Adults",
        accessor: (row) => row.adults,
        canFilter: false,
      },
      {
        Header: "Children",
        accessor: (row) => row.children,
        canFilter: false,
      },
      {
        Header: "Infants",
        accessor: (row) => row.infants,
        canFilter: false,
      },
      {
        Header: "Accomodation",
        accessor: (row) => row.accom,
        canFilter: false,
      },
      {
        Header: "Accom Cd",
        accessor: (row) => row.accomCd,
        canFilter: false,
      },
      {
        Header: "Resort",
        accessor: (row) => row.resort,
        canFilter: false,
      },
    ],
    []
  );
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    state,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    setFilter,
    previousPage,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns: columns,
      data: AllData,
      filterTypes,
      initialState: { pageIndex: 0, pageSize: 8 },
    },
    useFilters,
    usePagination
  );

  React.useEffect(() => {
    setFilter("booked", dateBetween);
  }, [dateBetween]);
  React.useEffect(() => {
    setFilter("arrivalDate", dateBetweenArr);
  }, [dateBetweenArr]);
  React.useEffect(() => {
    setFilter("depDate", dateBetweenDep);
  }, [dateBetweenDep]);
  React.useEffect(() => {
    setFilter("arrivalFlight", country);
  }, [country]);
  return (
    <div className="container">
      <Head>
        <title>Cosmopolitan Control Panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Navbar />
        <div className="mainframe">
          <div className="control-panel">
            <div className="filterColumn">
              <h3>Booking Date</h3>
              <label>From:</label>
              <input
                type="date"
                onChange={(e) => {
                  setDateBetween([e.target.value, dateBetween[1]]);
                }}
              />
              <label>to</label>
              <input
                type="date"
                onChange={(e) => {
                  setDateBetween([dateBetween[0], e.target.value]);
                }}
              />
            </div>
            <div className="filterColumn">
              <h3>Arrival date:</h3>
              <label>From:</label>
              <input
                type="date"
                onChange={(e) => {
                  setDateBetweenArr([e.target.value, dateBetweenArr[1]]);
                }}
              />
              <label>to</label>
              <input
                type="date"
                onChange={(e) => {
                  setDateBetweenArr([dateBetweenArr[0], e.target.value]);
                }}
              />
            </div>
            <div className="filterColumn">
              <h3>Departure date:</h3>
              <label>From:</label>
              <input
                type="date"
                onChange={(e) => {
                  setDateBetweenDep([e.target.value, dateBetweenDep[1]]);
                }}
              />
              <label>to</label>
              <input
                type="date"
                onChange={(e) => {
                  console.log(e.target.value);
                  setDateBetweenDep([dateBetweenDep[0], e.target.value]);
                }}
              />
            </div>
            <div className="filterColumn">
              <h3>Arrival Airport:</h3>
              <select
                onChange={(e) => {
                  setFilter("arrivalAirport", e.target.value || undefined);
                }}
              >
                <option value="">All</option>
                {airports.map((airport) => (
                  <option key={airport} value={airport}>
                    {airport}
                  </option>
                ))}
              </select>
            </div>
            <div className="filterColumn">
              <h3>Country:</h3>
              <select
                onChange={(e) => {
                  setCountry(e.target.value);
                }}
              >
                <option value="all">All</option>
                <option value="ME">Montenegro</option>
                <option value="HR">Croatia</option>
              </select>
            </div>
          </div>
          <div className="reportPanel">
            <table {...getTableProps()} className="demTable" ref={tableRef}>
              <thead>
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th {...column.getHeaderProps()}>
                        {column.render("Header")}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()}>
                      {row.cells.map((cell) => {
                        return (
                          <td {...cell.getCellProps()}>
                            {cell.render("Cell")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pagination">
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                {"<<"}
              </button>{" "}
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                {"<"}
              </button>{" "}
              <button onClick={() => nextPage()} disabled={!canNextPage}>
                {">"}
              </button>{" "}
              <button
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
              >
                {">>"}
              </button>{" "}
              <span>
                Page{" "}
                <strong>
                  {pageIndex + 1} of {pageOptions.length}
                </strong>{" "}
              </span>
              <span>
                | Go to page:{" "}
                <input
                  type="number"
                  defaultValue={pageIndex}
                  onChange={(e) => {
                    const page = e.target.value
                      ? Number(e.target.value) - 1
                      : 0;
                    gotoPage(page);
                  }}
                  style={{ width: "100px" }}
                />
              </span>{" "}
            </div>
            <div>
              <DownloadTableExcel
                filename="report"
                sheet="trnasfers"
                currentTableRef={tableRef.current}
              >
                <button className="myButton"> Export excel </button>
              </DownloadTableExcel>
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
          .mainframe {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
            min-height: 100vh;
            padding: 2px;
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
          .reportPanel {
            display: flex;
            flex-direction: column;
            justify-content: start;
            align-items: start;
            width: 100%;
            min-height: 85vh;
            padding: 10px;
          }
          .filterColumn {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 10vh;
            padding: 10px;
          }
          .control-panel {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            margin-left: 40px;
            margin-right: 40px;
            width: 100%;
          }
          .pagination {
            margin-bottom: 15px;
          }
          main {
            display: flex;
            widrt: 100%;
            height: 100%;
            flex-direction: column;
            justify-content: start;
            align-items: center;
            padding-bottom: 20px;
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
        `}
      </style>
    </div>
  );
}

export default NDayReport;
