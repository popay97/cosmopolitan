import React from "react";
import Head from "next/head";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";

export default function Accounting() {
  const [country, setCountry] = React.useState("");
  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date());
  const [data, setData] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [handlingFee, setHandlingFee] = React.useState(0);
  return (
    <div className="container">
      <Head>
        <title>Cosmoplitan conrol panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <Navbar></Navbar>
        <div className="date-filters">
          <select
            name="country"
            id="country"
            onChange={(e) => {
              setCountry(e.target.value);
            }}
          >
            <option value="ME">Montenegro</option>
            <option value="CRO">Croatia</option>
          </select>
          <input
            type="date"
            name="date"
            id="date"
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
          />
          <input
            type="date"
            name="date"
            id="date"
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
          />
        </div>
        <div className="accounting-data">
          <h4>{`Obracun za period od ${startDate} do ${endDate}`}</h4>
          <h5>Number of transfers: 255</h5>
          <h5>Handling fee: 2043.35</h5>
          <h5>Total: 2043.35</h5>
          <h5>Total: 7450.92</h5>
        </div>
      </main>
      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .date-filters {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }
        .date-filters > select {
          width: 100px;
          height: 45px;
          border: 1px solid #eaeaea;
          border-radius: 5px;
          padding: 0 10px;
        }
        .date-filters > input {
          width: 100px;
          height: 45px;
          border: 1px solid #eaeaea;
          border-radius: 5px;
          padding: 0 10px;
        }
        .accounting-data {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
        }
        .accounting-data > h4 {
          margin: 0;
          font-size: 1.5rem;
        }
        .accounting-data > h5 {
          margin: 0;
          font-size: 1rem;
        }
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          width: 100%;
          min-height: 100vh;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
