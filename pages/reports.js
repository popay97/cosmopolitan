import React, { useEffect } from "react";
import Reservation from "../models/ReservationModel";
import Head from "next/head";
import Select from "react-select";
import Navbar from "../components/Navbar";

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
  const [filterWord, setFilterWord] = React.useState("");
  const [filteredData, setFilteredData] = React.useState([]);

  const options = [
    { value: 4.8, label: "4 dana" },
    { value: 7.8, label: "7 dana" },
    { value: 10.8, label: "10 dana" },
    { value: 15.8, label: "15 dana" },
    { value: 30.8, label: "30 dana" },
  ];
  const filterData = () => {
    //set data array to contain only objects that less then filter days away from today
    setFilteredData([...data.filter((item) => {
        let searchFlag =  true;
        if(filterWord != ""){
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
  }, [filterDy, data, filterWord]);

  return (
    <div className="container">
      <Head>
        <title>Create Next App</title>
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
            <input
              style={{ width: "100%" }}
              type="text"
              placeholder="Pretrazi"
              onChange={(e) => {
                setFilterWord(e.target.value);
              }}
            />
          </div>
          <div className="reportPanel">
            <table className="demTable">
              <thead>
                <tr>
                  <th>Reservation ID</th>
                  <th>Title</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Phone</th>
                  <th>Booking Date</th>
                  <th>Arrival Airport</th>
                  <th>Arrival Date</th>
                  <th>Arrival Flight</th>
                  <th>Departure Date</th>
                  <th>Departure Flight</th>
                  <th>Transfer Type</th>
                  <th>Accommodation</th>
                  <th>Accom Cd</th>
                  <th>Resort</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((res) => (
                  <tr>
                    <td>{res.resId}</td>
                    <td>{res.title}</td>
                    <td>{res.name}</td>
                    <td>{res.surname}</td>
                    <td>{res.phone.replace(" ", "")}</td>
                    <td>{res.booked.split("T")[0]}</td>
                    <td>{res.arrivalAirport}</td>
                    <td>{res.arrivalDate.split("T")[0]}</td>
                    <td>
                      {res.arrivalFlight.number +
                        " " +
                        res.arrivalDate.split("T")[1].slice(0, 5) +
                        " " +
                        res.arrivalAirport +
                        " - " +
                        res.departureFlight.arrAirport}
                    </td>
                    <td>{res.depDate.split("T")[0]}</td>
                    <td>
                      {res.departureFlight.number +
                        " " +
                        res.depDate.split("T")[1].slice(0, 5) +
                        " " +
                        res.arrivalAirport +
                        " - " +
                        res.departureFlight.arrAirport}
                    </td>
                    <td>{res.transfer}</td>
                    <td>{res.accom}</td>
                    <td>{res.accomCd}</td>
                    <td>{res.resort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            -webkit-box-shadow: 4px 1px 10px 1px #000000;
            box-shadow: 4px 1px 10px 1px #000000;
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
