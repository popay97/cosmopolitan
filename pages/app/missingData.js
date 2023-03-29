import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Head from "next/head";
import Navbar from "../../components/Navbar";

const MissingDataComponent = () => {
    const [missingData, setMissingData] = useState({});

    const fetchData = async () => {
        const result = await axios.get("/api/v1/getMissingData");
        setMissingData(result.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const renderTable = (tableData, tableHeaders) => (
        <table>
            <thead>
                <tr>
                    {tableHeaders
                        .filter((el) => el != "assignedSubcontractor" && el != "type")
                        .map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                </tr>
            </thead>
            <tbody>
                {tableData.map((row, index) => (
                    <tr key={index}>
                        {Object.keys(row)
                            .filter((el) => el != "assignedSubcontractor" && el != "type")
                            .map((field, index) => (
                                <td key={field}>
                                    <input
                                        type="text"
                                        value={row[field]}
                                        disabled={row[field] !== null}
                                        onChange={(e) => console.log(e.target.value)}
                                    />
                                </td>
                            ))}
                        <td>
                            <button className='myButton' onClick={() => handleSave(tableData.tableName, index)} style={{ paddingInline: '10px', paddingTop: '5px', paddingBottom: '5px' }}>
                                Save
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
    if (Object.keys(missingData).length === 0) {
        return <div>Loading...</div>;
    } else {
        return (
            <div>
                <Head>
                    <title>Cosmopolitan Control Panel</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <main>
                    <Navbar />
                    {Object.keys(missingData).map((table) => {
                        if (missingData[table]?.length > 0) {
                            return (

                                <div key={table} className="tablewrap">
                                    <h2 className="tabletitle">{
                                        table.replace(/([A-Z])/g, " $1").replace(/^./, function (str) {
                                            //if 3 words wrap the last one in brackets
                                            return str.toUpperCase();
                                        })

                                    }</h2>
                                    {renderTable(
                                        missingData[table],
                                        Object.keys(missingData[table][0])
                                    )}
                                    <br />
                                    <br />
                                </div>
                            );
                        } else {
                            return null;
                        }
                    })}
                </main>
                <footer>
                    <div className="footer-div">
                        <p>Powered by</p>
                        <img src="/trid-logo.jpg" alt="Trid Logo" className="logo" />
                    </div>
                </footer>
                <style jsx>
                    {`
            main {
              display: flex;
              width: 100%;
              flex-direction: column;
              justify-content: center;
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
            .tablewrap {
              width: 80%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .tabletitle {
              margin: 0;
              padding: 0;
              font-size: 1.5rem;
              font-weight: 600;
              color: #000;
              margin-bottom: 20px;
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
};

export default MissingDataComponent;
