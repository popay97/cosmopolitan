import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import LoadingOverlay from 'react-loading-overlay'
import BounceLoader from 'react-spinners/BounceLoader'
import 'react-datepicker/dist/react-datepicker.css';

const MissingDataComponent = () => {
    const [missingData, setMissingData] = useState({});
    const [active, setActive] = useState(false);

    const fetchData = async () => {
        const result = await axios.get("/api/v1/getMissingData");
        setMissingData(result.data);
        // reload the page
    };

    useEffect(() => {
        fetchData();
    }, []);


    const handleSave = async (tableName, missingObj) => {
        var objToSend = {
            type: tableName,
            missingObj: missingObj
        }

        try {
            setActive(true)
            const res = await axios.post('/api/v1/saveMissingInfo', objToSend)
            if (res.status === 200) {
                fetchData()
                setActive(false)
                return
            }
            else {
                window.alert('Something went wrong, please try again');
                setActive(false)
            }
        }
        catch (err) {
            setActive(false)
            window.alert('Something went wrong, please try again');
            console.log(err)
        }
    }
    if (Object.keys(missingData)?.length === 0 || active === true) {
        return <div>Loading...</div>;
    } else {
        return (
            <div>
                <Head>
                    <title>Cosmopolitan Control Panel</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <main>
                    {active ? <div className="loadingOverlay">
                        <LoadingOverlay
                            active={active}
                            spinner={<BounceLoader />}
                        >
                        </LoadingOverlay>
                    </div> : null}
                    <Navbar />
                    <br />
                    <br />
                    <MissingDataComp
                        missingLocations={missingData["missingLocations"]}
                        missingPricesOutgoing={missingData["missingPricesOutgoing"]}
                        missingPricesIncoming={missingData["missingPricesIncoming"]}
                        handleSave={handleSave}
                    />


                </main >
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
            .loadingOverlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-evenly;
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
};

export default MissingDataComponent;


const MissingDataComp = ({ missingLocations, missingPricesOutgoing, missingPricesIncoming, handleSave }) => {
    const [currentPrices, setCurrentPrices] = useState({ 
        outgoing: missingPricesOutgoing,
        incoming: missingPricesIncoming
    });
    const [currentLocations, setCurrentLocations] = useState(missingLocations);

    const renderInputField = (value, onChange, type = 'text') => {
        return value !== null ? (
            <input type="text" value={value} disabled className="form-control" style={{fontSize: 12}} />
        ) : (
            <input type={type} onChange={onChange} className="form-control" />
        );
    };
    const InputGroup = ({ label, value, onChange, type = 'text', disabled = false }) => {
        return (
          <div className="input-group mb-2">
            <div className="input-group-prepend">
              <span  id="basic-addon1">{label}</span>
            </div>
            <input
              type={type}
              className="form-control"
              value={value}
              onChange={onChange}
              disabled={disabled}
              style={{ minWidth: '120px' }} // Ensure minimum width for content visibility
            />
          </div>
        );
      };
      
    // Renders price fields
    const renderPriceFields = (price, index ) => {
        let type = index < currentPrices.outgoing.length ? 'outgoing' : 'incoming';
        let realIndex = index < currentPrices.outgoing.length ? index : index - currentPrices.outgoing.length;
        const handleChange = (field, value) => {
            setCurrentPrices({
                ...currentPrices,
                [type]: currentPrices[type].map((price, i) => {
                    if (i === realIndex) {
                        return { ...price, [field]: value };
                    }
                    return price;
                })
            });
        };
        
        return (
            <div className="row mb-2" key={index}>
              <div className="col">
                <InputGroup label="Airport" value={price.airport} disabled={true} />
              </div>
              <div className="col">
                <InputGroup label="Destination" value={price.destination} disabled={true} />
              </div>
              <div className="col">
                <InputGroup label="Shared" value={price.shared || ''} onChange={(e) => {
                    handleChange('shared', Number(e.target.value));
                }} type="number" />
              </div>
              <div className="col">
                <InputGroup label="<=3 passangers" value={price.private3less || ''} onChange={(e) => {
                    handleChange('private3less', Number(e.target.value));
                }} type="number" />
              </div>
              <div className="col">
                <InputGroup label=">3 passangers" value={price.private3more || ''} onChange={(e) => {
                    handleChange('private3more', Number(e.target.value));
                }} type="number"  />
              </div>
              <div className="col">
                <InputGroup label="Valid From" value={price.validFrom ? new Date(price.validFrom).toISOString().split("T")[0] : ''} onChange={(e) => {
                    //convert the picker date to UTC, assume user is in UTC+2
                    let formattedValue = new Date(Date.UTC(e.target.value.split('-')[0], e.target.value.split('-')[1] - 1, e.target.value.split('-')[2], 0, 0, 0));
                    console.log(formattedValue);
                    handleChange('validFrom', formattedValue);
                }} type="date" disabled={price.validFrom !== null} />
              </div>
              <div className="col">
                <InputGroup label="Valid To" value={price.validTo ? new Date(price.validTo).toISOString().split("T")[0] : '' } onChange={(e) => {

                    let formattedValue = new Date(Date.UTC(e.target.value.split('-')[0], e.target.value.split('-')[1] - 1, e.target.value.split('-')[2], 23, 59, 59));
                    console.log(formattedValue);
                    handleChange('validTo', formattedValue);
                }} type="date" disabled={price.validTo !== null} />
              </div>
              <div className="col">
                <InputGroup label="Type" value={price.type} disabled={true} />
                </div>
              <div className="col">
                    <button onClick={() => handleSave('price', currentPrices[type][realIndex])} className="btn btn-primary">Save</button>
                </div>
                {price.count && (
                    <div className="col-12 text-muted">
                        <small>
                            {price.count} reservations missing this price, dates span {price.minReferenceDate} - {price.maxReferenceDate}
                        </small>
                        </div>
                )}
            </div>
          );
    };

    return (
        <div className="container">
            <div className="row">
                <div className="col">
                    <h4>Missing Prices</h4>
                    {currentPrices.outgoing.concat(currentPrices.incoming).map(renderPriceFields)}
                </div>
                <div className="col">
                    <h4>Missing Locations</h4>
                    {currentLocations.map((location, index) => (
                        <div className="row mb-2" key={index}>
                            <div className="col">
                                {renderInputField(location.code, () => {}, 'text')}
                            </div>
                            <div className="col">
                                {renderInputField(location.hotel, () => {}, 'text')}
                            </div>
                            <div className="col">
                                <input type="text" onChange={(e) => {
                                    setCurrentLocations(currentLocations.map((loc, i) => {
                                        if (i === index) {
                                            return { ...loc, destination: e.target.value };
                                        }
                                        return loc;
                                    }));
                                }} className="form-control" />
                            </div>
                            <div className="col">
                                <button onClick={() => handleSave( 'location', currentLocations[index])} className="btn btn-primary">Save</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
