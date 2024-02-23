import React, { useEffect, useRef } from "react";
import Reservation from "../../models/ReservationModel";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import jwt from "jsonwebtoken";
import axios from "axios";
import { DownloadTableExcel } from "react-export-table-to-excel";
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import TimePicker from 'react-time-picker';
import {
  dateBetweenArrFn,
  dateBetweenDepFn,
  countryFilterFn,
} from "../../components/filterHnadlers";
import {
  useTable,
  usePagination,
  useFilters,
  useGlobalFilter,
} from "react-table";
import { TfiReload } from "react-icons/tfi";
import DateRangePicker from '@wojtekmaj/react-daterange-picker/dist/entry.nostyle';
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css'
import 'react-calendar/dist/Calendar.css';
import CommentModal from "../../components/CommentModal";

export async function getServerSideProps(context) {
  let today = new Date()
  let date = new Date(today.getTime() - (60 * 24 * 60 * 60 * 1000))

  const getData = await Reservation.find({
    status: { $ne: "CANCELLED" },
    depDate: { $gte: date }
  }).sort({ arrivalDate: 1 }).lean();

  const data = JSON.parse(JSON.stringify(getData));
  let airports = [];
  let AllData = data.filter((r) => {
    if (
      airports.indexOf(r.arrivalAirport) === -1 &&
      r.arrivalAirport != undefined &&
      r.arrivalAirport != null &&
      r.arrivalAirport != ""
    ) {
      airports.push(r.arrivalAirport);
    }
    return true;
  });

  return {
    props: { AllData, airports },
  };
}

function NDayReport({ AllData, airports }) {

  const [airport, setAirports] = React.useState(airports);
  React.useEffect(() => {
    const token = localStorage.getItem("cosmo_token");
    const userr = jwt.decode(token);
    if (!token) {
      window.location.href = "/";
    }
    if (!userr.isAdmin) {
      //lock the country filter to subcontractrorCountry
      console.log(userr?.subcontractorCountry)
      setCountry(userr?.subcontractorCountry);
      if (userr.subcontractorCountry == 'HR') {
        let tmp = airports.filter((a) => { return a !== 'TIV' })
        setAirports(tmp);
      }
      else {
        let tmp1 = airports.filter((a) => { return a === 'TIV' })
        setAirports(tmp1);
      }
      setUser(userr);
    }
    else {
      setUser(userr);
    }
  }, []);

  const [user, setUser] = React.useState();
  const [dateBetweenArr, setDateBetweenArr] = React.useState();
  const [dateBetweenDep, setDateBetweenDep] = React.useState();
  const [allData, setAllData] = React.useState(AllData);
  const [pageLength, setPageLength] = React.useState(8);
  const [country, setCountry] = React.useState("all");
  const [commentModal, setCommentModal] = React.useState(false);
  const [commentData, setCommentData] = React.useState(null);
  const [forExport, setForExport] = React.useState(false);
  const [reportName, setReportName] = React.useState(`report ${country} ${new Date().toLocaleDateString()}`);
  const [glFilter, setGlFilter] = React.useState();


  useEffect(() => {
    const formatDate = (date) => {
      //check if date is a string or a date object
      if (date === undefined || date === null) return '*';
      if (typeof date === 'string') {
        date = new Date(date);
      }
      let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

      if (month.length < 2)
        month = '0' + month;
      if (day.length < 2)
        day = '0' + day;

      return [year, month, day].join('-');
    }

    if (Array.isArray(dateBetweenArr) && Array.isArray(dateBetweenDep)) {
      setReportName(`Report ${country} Filters: arrivals ${formatDate(dateBetweenArr[0])} - ${formatDate(dateBetweenArr[1])}__ departures ${formatDate(dateBetweenDep[0])}  ${formatDate(dateBetweenDep[1])}`)
    }
    else if (Array.isArray(dateBetweenArr) && !Array.isArray(dateBetweenDep)) {
      setReportName(`${country} arrivals between ${formatDate(dateBetweenArr[0])} - ${formatDate(dateBetweenArr[1])}`)
    }
    else if (!Array.isArray(dateBetweenArr) && Array.isArray(dateBetweenDep)) {
      setReportName(`${country} departures between ${formatDate(dateBetweenDep[0])} - ${formatDate(dateBetweenDep[1])}`)
    }
    else {
      setReportName(`report ${country} ${new Date().toLocaleDateString()}`)
    }
  }, [dateBetweenArr, dateBetweenDep, country])

  const tableRef = useRef(null);

  useEffect(() => {
    if (commentData?.resId) {
      setCommentModal(!commentModal);
    }
  }, [commentData]);


  const reapplyFilters = (page) => {
    let globalFilter1 = glFilter;
    if (globalFilter1 !== '' && globalFilter1 !== undefined && globalFilter1 !== null) {
      setGlobalFilter(globalFilter1);
      return
    }
    if (Array.isArray(dateBetweenArr)) {
      let dateBetweenArr1 = dateBetweenArr;

      setDateBetweenArr(dateBetweenArr1);
    }
    if (Array.isArray(dateBetweenDep)) {
      let dateBetweenDep1 = dateBetweenDep;
      setDateBetweenDep(dateBetweenDep1);
    }
    let country1 = country;
    setCountry(country1);
    gotoPage(page);
  };



  const changePickUpTime = async (e, objectId, type) => {

    if (e && objectId && type) {
      let body;
      if (type === 'incoming')
        body = {
          method: "update",
          table: "reservations",
          objectId: objectId,
          updates: {
            incomingPickupTime: e
          }
        }
      else if (type === 'outgoing') {
        body = {
          method: "update",
          table: "reservations",
          objectId: objectId,
          updates: {
            outgoingPickupTime: e
          }
        }
      }
      try {
        let update = await axios.post("/api/v1/commonservice", body);
        if (update.status === 200) {
          console.log("updated")
          console.log(update.data)
        }
      }
      catch (err) {
        console.log(err)
      }
    }
  }



  const changeExtraCosts = async (pricing, objectId) => {
    if (pricing && objectId) {
      let body = {
        method: "update",
        table: "reservations",
        objectId: objectId,
        updates: {
          pricing: pricing
        }
      }
      console.log(body)
      try {
        let update = await axios.post("/api/v1/commonservice", body);
        if (update.status === 200) {
          console.log("updated")
          console.log(update.data)
        }
      }
      catch (err) {
        console.log(err)
      }

    }
  }



  const filterTypes = React.useMemo(
    () => ({
      dateBetweenDep: dateBetweenDepFn,
      dateBetweenArr: dateBetweenArrFn,
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



  const displayData = React.useMemo(() => {
    return allData;
  }, [allData]);



  const columns = React.useMemo(
    () => {
      if (!forExport) {
        return [
          {
            Header: "Reservation ID",
            accessor: "resId",
            canFilter: false,
          },
          {
            Header: "Status",
            accessor: "status",
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
            accessor: "phone",
            Cell: ({ value }) => {
              return value.replace("+", "00").toLowerCase();
            },
            canFilter: false,
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
            canFilter: true,
          },
          {
            Header: "Arrival Date",
            accessor: "arrivalDate",
            Cell: ({ value }) => {
              const date = value != undefined ? value.split("T")[0] : undefined;
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
              const date = value != undefined ? value.split("T")[0] : undefined;
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
            accessor: (row) => row.billingDestination,
          },
          {
            Header: "Comments",
            accessor: (row) => row,
            Cell: ({ value }) => {
              if (value?.comments?.length > 0) {
                return (<button
                  style={{
                    backgroundColor: "transparent",
                    border: 'black 1px solid',
                    borderRadius: '5px',
                    padding: '5px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setCommentData({ ...value });

                  }
                  }
                >Show comments</button>)
              }
              else {
                return (<button
                  style={{
                    backgroundColor: "transparent",
                    border: 'black 1px solid',
                    borderRadius: '5px',
                    padding: '5px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    //trigger even if no data mutation
                    let temp = value;
                    setCommentData(null);
                    setCommentData({ ...temp });

                  }}
                >Add comment</button>)
              }
            },
          },
          {
            Header: "Incoming Pickup Time",
            accessor: (row) => row,
            Cell: ({ value }) => {
              let date = new Date(value.arrivalDate)
              let now = new Date()
              let diff = date.getTime() - now.getTime()
              let hours = Math.floor(diff / (1000 * 60 * 60));
              if (hours > 0) {
                return <div style={{ width: '150px' }}><TimePicker
                  onChange={async (e) => {
                    let page = pageIndex;
                    let tmp = [...allData];
                    let index = tmp.findIndex((el) => el.resId === value.resId);
                    tmp[index].incomingPickupTime = e;
                    setAllData(tmp);
                    await changePickUpTime(e, value._id, 'incoming')

                    reapplyFilters(page);
                  }
                  }
                  value={value.incomingPickupTime ?? null}
                ></TimePicker></div>
              }
              else {
                return null
              }
            }
          },
          {
            Header: "Outgoing Pickup Time",
            accessor: (row) => row,
            Cell: ({ value }) => {
              let date = new Date(value.depDate)
              let now = new Date()
              let diff = date.getTime() - now.getTime()
              let hours = Math.floor(diff / (1000 * 60 * 60));
              if (hours > 0) {
                return <div style={{ width: '150px' }}><TimePicker
                  onChange={async (e) => {
                    let page = pageIndex;
                    let tmp = [...allData];
                    let index = tmp.findIndex((el) => el.resId === value.resId);
                    tmp[index].outgoingPickupTime = e;
                    setAllData(tmp);
                    await changePickUpTime(e, value._id, 'outgoing')
                    reapplyFilters(page);
                  }
                  }
                  value={value.outgoingPickupTime ?? null}
                ></TimePicker></div>
              }
              else {
                return null
              }
            }
          },
          {
            Header: "Extra Costs",
            accessor: (row) => row,
            Cell: ({ value }) => {

              return <div style={{ width: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <input
                  id={`extraCosts${value.resId}`}
                  style={
                    {
                      width: '100px',
                      height: '20px',
                      borderRadius: '5px',
                      border: '1px solid lightgrey',
                      padding: '15px'
                    }
                  }
                  defaultValue={value.pricing.incomingInvoice.extraCost}
                  onBlur={
                    async (e) => {
                      let tmp = [...allData];
                      let index = tmp.findIndex((el) => el.resId === value.resId);
                      tmp[index].pricing.incomingInvoice.extraCost = e.target.value;
                      await changeExtraCosts(tmp[index].pricing, value._id)
                    }
                  }
                />
              </div>
            }
          },
        ];
      }

      else {
        return [
          {
            Header: "Reservation ID",
            accessor: "resId",
            canFilter: false,
          },
          {
            Header: "Status",
            accessor: "status",
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
            accessor: "phone",
            Cell: ({ value }) => {
              value = value.replace("+", "00").toLowerCase();
              value = "'" + value + "'";
              return value;
            },
            canFilter: false,
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
            canFilter: true,
          },
          {
            Header: "Arrival Date",
            accessor: "arrivalDate",
            Cell: ({ value }) => {
              const date = value != undefined ? value.split("T")[0] : undefined;
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
              const date = value != undefined ? value.split("T")[0] : undefined;
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
            accessor: (row) => row.billingDestination,
          },
        ];
      }

    }, [forExport]);


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
    globalFilter,
    setGlobalFilter,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns: columns,
      data: displayData,
      filterTypes,
      initialState: { pageIndex: 0, pageSize: pageLength },
    },
    useFilters,
    useGlobalFilter,
    usePagination
  );

  const reloadAllData = () => {
    setAllData(AllData);
  };

  const loadReport = (country, days, transferType) => {
    const data = {
      country: country,
      days: days,
      transferType: transferType,
    };
    axios.post("/api/v1/getTransfers", data).then((res) => {
      console.log(res.data);
      setAllData(res.data);
    });
    setReportName(country + " " + days + " days report " + transferType);
  };

  React.useEffect(() => {
    setFilter("arrivalDate", dateBetweenArr);
  }, [dateBetweenArr]);

  React.useEffect(() => {
    setFilter("depDate", dateBetweenDep);
  }, [dateBetweenDep]);

  React.useEffect(() => {
    setFilter("arrivalFlight", country);
  }, [country]);

  React.useEffect(() => {
    state.pageSize = pageLength;
    document.getElementById("right").click();
    setTimeout(() => {
      document.getElementById("left").click();
    }, 300);
    if (pageLength == AllData.length + 1) {
      setForExport(true);
      setTimeout(() => {
        document.getElementById("download-report").click();
        setForExport(false);
        window.location.reload();
      }, 500);
    }
  }, [pageLength]);

  return (
    <div className="container" >
      <Head>
        <title>Cosmopolitan Control Panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Navbar />
        <div className="mainframe">
          <div className="control-panel">
            <div className="filterColumn">
              <h3>Search</h3>
              <label>Search any field</label>
              <input
                className="filter-input"
                type="text"
                onChange={(e) => {
                  setGlobalFilter(e.target.value || undefined);
                  setGlFilter(e.target.value || undefined);
                }}
              />
            </div>
            <div className="filterColumn">
              <h3>Arrival date:</h3>
              <DateRangePicker
                onChange={setDateBetweenArr}
                value={dateBetweenArr}
              ></DateRangePicker>
            </div>
            <div className="filterColumn">
              <h3>Departure date:</h3>
              <DateRangePicker
                value={dateBetweenDep}
                onChange={setDateBetweenDep}
              ></DateRangePicker>
            </div>
            <div className="filterColumn">
              <h3>Arrival Airport:</h3>
              <select
                onChange={(e) => {
                  setFilter("arrivalAirport", e.target.value || undefined);
                }}
              >
                <option value="">All</option>
                {airport.map((ap) => (
                  <option key={ap} value={ap}>
                    {ap}
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
                disabled={!user?.isAdmin}
                value={country}>
                <option value="all">All</option>
                <option value="ME">Montenegro</option>
                <option value="HR">Croatia</option>
              </select>
            </div>
          </div>
          <div className="reportPanel">
            <table
              {...getTableProps()}
              className="demTable"
              ref={tableRef}
              id="main-table"
              key={pageLength}
            >
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
              <button
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
                id="left"
              >
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
                id="right"
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
            <div
              style={{
                disply: "flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <button
                className="myButton"
                onClick={() => {
                  setPageLength(AllData.length + 1);
                }}
              >
                Export excel
              </button>
              <DownloadTableExcel
                filename={reportName}
                sheet="trnasfers"
                currentTableRef={tableRef.current}
              >
                <button
                  style={{ display: "none" }}
                  id="download-report"
                  className="myButton"
                >
                  Export excel
                </button>
              </DownloadTableExcel>

              <button
                style={{ marginLeft: "15px" }}
                className="myButton"
                onClick={() => {
                  if (country === "all") {
                    window.alert("Please select country");
                  } else {
                    loadReport(country, 4, "incoming");
                  }
                }}
              >
                4 day incoming transfers
              </button>

              <button
                style={{ marginLeft: "15px" }}
                className="myButton"
                onClick={() => {
                  if (country === "all") {
                    window.alert("Please select a country");
                  } else {
                    loadReport(country, 4, "outgoing");
                  }
                }}
              >
                4 day outgoing transfers
              </button>

              <button
                style={{ marginLeft: "15px" }}
                className="myButton"
                onClick={() => {
                  if (country === "all") {
                    window.alert("Please select country");
                  } else {
                    loadReport(country, 1, "incoming");
                  }
                }}
              >
                Today's incoming transfers
              </button>

              <button
                style={{ marginLeft: "15px" }}
                className="myButton"
                onClick={() => {
                  if (country === "all") {
                    window.alert("Please select country");
                  } else {
                    loadReport(country, 1, "outgoing");
                  }
                }}
              >
                Today's outgoing transfers
              </button>
              <button
                style={{ marginLeft: "15px" }}
                className="myButton"
                onClick={() => {
                  reloadAllData();
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    alignItems: "center",
                  }}
                >
                  Reload report data{" "}
                  <TfiReload
                    style={{
                      fontSize: "18px",
                      marginLeft: "8px",
                    }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
        <CommentModal reservation={commentData} isOpen={commentModal} setOpen={setCommentModal} setAllData={setAllData} />
      </main >

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
            justify-content: space-evenly;
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
            width: 100%;
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
    </div >
  );
}

export default NDayReport;
