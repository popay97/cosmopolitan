import React, { useState, useEffect } from "react";
import axios from "axios";
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


    const handleSave = async (tableName, index, pricingType) => {
        var objToSend = {
            type: tableName,
            missingObj: null
        }
        if (tableName === 'location') {
            objToSend = {
                type: tableName,
                missingObj: missingData['missingLocations'][index]
            }

        }
        else if (tableName === 'price') {
            if (pricingType === 'incoming') {
                objToSend = {
                    type: tableName,
                    missingObj: missingData['missingPricesIncoming'][index]
                }

            }
            else if (pricingType === 'outgoing') {
                objToSend = {
                    type: tableName,
                    missingObj: missingData['missingPricesOutgoing'][index]
                }

            }

        }

        try {
            const res = await axios.post('/api/v1/saveMissingInfo', objToSend)
            if (res.status === 200) {
                fetchData()
                return
            }
            else {
                window.alert('Something went wrong, please try again');
            }
        }
        catch (err) {
            window.alert('Something went wrong, please try again');
            console.log(err)
        }
    }
    const renderTable = (tableData, tableHeaders, table) => (
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
                            .map((field, index2) => (
                                <td key={field}>
                                    <input
                                        type={row.airport ? ['private3less', 'private3more', 'shared'].includes(field) ? 'number' : ['validFrom', 'validTo'].includes(field) ? 'date' : 'text' : 'text'}
                                        value={field.startsWith('valid') ? row[field].split('T')[0] : row[field]}
                                        disabled={row.airport ? (!['private3less', 'private3more', 'shared'].includes(field)) : (!['destination'].includes(field))}
                                        onChange={(e) => {
                                            let tmp = missingData
                                            tmp[table][index][field] = e.target.value
                                            setMissingData({ ...tmp })
                                        }}
                                    />
                                </td>
                            ))}
                        <td>
                            <button className='myButton' onClick={() => {
                                if (Object.keys(row)?.includes('type')) {
                                    handleSave('price', index)
                                }
                                else {
                                    handleSave('location', index, row.type)
                                }
                            }} style={{ paddingInline: '10px', paddingTop: '5px', paddingBottom: '5px' }}>
                                Save
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
    if (Object.keys(missingData)?.length === 0) {
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
                    <br />
                    <br />
                    <br />
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
                                        Object.keys(missingData[table][0]),
                                        table
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
