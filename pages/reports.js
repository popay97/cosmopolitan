import React, { useEffect } from "react";
import Reservation from "../models/ReservationModel";
import Head from "next/head";
import Select from "react-select";
import Navbar from "../components/Navbar";
import {
  useTable,
  usePagination,
  useAsyncDebounce,
  useGlobalFilter,
} from "react-table";

export async function getServerSideProps(context) {
  const getData = await Reservation.find({}).lean();
  const AllData = JSON.parse(JSON.stringify(getData));
  return {
    props: { AllData },
  };
}


function NDayReport({ AllData }) {
  const [data, setData] = React.useState([...AllData]);
  const [filterDy, setFilterDys] = React.useState(4);
  const [filteredData, setFilteredData] = React.useState([]);
  function GlobalFilter({
    preGlobalFilteredRows,
    globalFilter,
    setGlobalFilter,
  }) {
    const count = preGlobalFilteredRows.length;
    const [value, setValue] = React.useState(globalFilter);
    const onChange = useAsyncDebounce((value) => {
      setGlobalFilter(value || undefined);
    }, 200);
  
    return (
      <div style={{ width: "100%" }}>
        Search:{" "}
        <input
          style={{ width: "100%" }}
          value={value || ""}
          onChange={(e) => {
            setValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={`${count} records...`}
        />
      </div>
    );
  }
  
  const columns = React.useMemo(
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
        Header: "Phone",
        accessor: (row) => row.phone.replace(" ", ""),
      },
      {
        Header: "Booking Date",
        accessor: (row) => row.booked.split("T")[0],
      },
      {
        Header: "Arrival Airport",
        accessor: "arrivalAirport",
      },
      {
        Header: "Arrival Date",
        accessor: (row) => row.arrivalDate.split("T")[0],
      },
      {
        Header: "Arrival Flight",
        accessor: (row) =>
          row.arrivalFlight.number +
          " " +
          row.arrivalDate.split("T")[1].slice(0, 5) +
          " " +
          row.arrivalAirport +
          " - " +
          row.departureFlight.arrAirport,
      },
      {
        Header: "Departure Date",
        accessor: (row) => row.depDate.split("T")[0],
      },
      {
        Header: "Departure Flight",
        accessor: (row) =>
          row.departureFlight.number +
          " " +
          row.depDate.split("T")[1].slice(0, 5) +
          " " +
          row.departureFlight.arrAirport +
          " - " +
          row.arrivalAirport,
      },
      {
        Header: " Transfer Type",
        accessor: (row) => row.transfer,
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
        accessor: (row) => row.resort,
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
    previousPage,
    visibleColumns,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns: columns,
      data: AllData,
      initialState: { pageIndex: 0, pageSize: 8 },
    },
    useGlobalFilter,
    usePagination
  );

  const options = [
    { value: 4.7, label: "4 dana" },
    { value: 7.7, label: "7 dana" },
    { value: 10.7, label: "10 dana" },
    { value: 15.7, label: "15 dana" },
    { value: 30.7, label: "30 dana" },
  ];
  const filterData = () => {
    //set data array to contain only objects that less then filter days away from today
    setFilteredData([
      ...data.filter((item) => {
        let searchFlag = true;
        if (filterWord != "") {
          let arr = Object.values(item);
          let str = arr.join(" ").toLowerCase();
          searchFlag = str.includes(filterWord.toLowerCase());
        }
        const date = new Date(item.arrivalDate);
        const today = new Date();
        const diff = Math.abs(date.getTime() - today.getTime());
        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
        return diffDays <= filterDy && searchFlag;
      }),
    ]);
  };
  useEffect(() => {
    filterData();
  }, [filterDy, data]);

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
            <label>Broj dana:</label>
            <Select
              options={options}
              defaultValue={options[0]}
              onChange={(e) => {
                setFilterDys(e.value);
              }}
            />
            <label>Pretraga:</label>
            <GlobalFilter
              preGlobalFilteredRows={preGlobalFilteredRows}
              globalFilter={state.globalFilter}
              setGlobalFilter={setGlobalFilter}
            />
          </div>
          <div className="reportPanel">
            <table {...getTableProps()} className="demTable">
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
            border-radius: 5px;
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
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            height: 100%;
            padding: 10px;
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
            width: 90%;
            height: 85vh;
            padding: 10px;
          }
          .control-panel {
            display: flex;
            flex-direction: column;
            justify-content: start;
            align-items: center;
            width: 10%;
            height: 85vh;
            padding-left: 10px;
          }
          main {
            display: flex;
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
