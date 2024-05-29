import { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";
import styles from "./tables.module.css";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from "../../components/Navbar";
function TransferPrices() {
    const [type, setType] = useState("outgoing");
    const [activeTab, setActiveTab] = useState("locations");
    const [data, setData] = useState([]);
    const [locationsData, setLocationsData] = useState([]);
    const [hasBeenEdited, setHasBeenEdited] = useState(false);
    const [subcontractorsData, setSubcontractorsData] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const airports = [
        "ZAG",
        "SPU",
        "DBV",
        "PUY",
        "RJK",
        "OSI",
        "ZAD",
        "TGD",
        "TIV",
    ]
    useEffect(() => {
        setHasBeenEdited(false);
    }, [activeTab]);
    useEffect(() => {
        const fetchSubcontractors = async () => {
            const body = {
                method: "customquery",
                table: "users",
                query: { isSubcontractor: true }
            }

            const res = await axios.post('/api/v1/commonservice', body)
            if (res.status === 200) {
                setSubcontractorsData(res.data);
            }
            else {
                console.log("Error fetching subcontractors");
            }
        }
        fetchSubcontractors();
    }, []);

    useEffect(() => {
        fetchData();
    }, [type]);

    async function fetchData() {
        const body = {
            method: "customquery",
            table: "prices",
            query: { type: type }
        }
        const res = await axios.post('/api/v1/commonservice', body)
        if (res.status === 200) {
            setData(res.data);
        }
        else {
            console.log("Error fetching data");
        }
        const locationbody = {
            method: "customquery",
            table: "locations",
            query: {}
        }
        const locationres = await axios.post('/api/v1/commonservice', locationbody)
        if (locationres.status === 200) {
            let locations = locationres.data

            setLocationsData(locations);
        }
        else {
            console.log("Error fetching data");
        }
        const destinationbody = {
            method: "customquery",
            table: "locations",
            query: {}
        }
        const destinationres = await axios.post('/api/v1/commonservice', destinationbody)
        if (destinationres.status === 200) {
            let destinations = destinationres.data.map((item) => item.destination);
            destinations = [...new Set(destinations)];
            setDestinations(destinations);
        }
        else {
            console.log("Error fetching data");
        }

    }

    function handleChange(index, value, field) {
        setHasBeenEdited(true);
        if (activeTab === "prices") {
            let values = [...data];
            if (field) {
                values[index][field] = value;
            }

            setData([...values]);
        }
        else {
            let values = [...locationsData];
            if (field) {
                values[index][field] = value;
            }

            setLocationsData([...values]);
        }

    }

    async function handleSave() {
        if (activeTab === "prices" && hasBeenEdited) {
            for (let i = 0; i < data.length; i++) {
                const body = {
                    method: "update",
                    table: "prices",
                    updates: data[i],
                    objectId: data[i]._id
                }
                const result = await axios.post('/api/v1/commonservice', body)
                if (result.status === 200) {
                    console.log("Data saved");
                }
                else {
                    alert("Error saving data");
                }
            }
        }
        else if (activeTab === "locations" && hasBeenEdited) {
            for (let i = 0; i < locationsData.length; i++) {
                const body = {
                    method: "update",
                    table: "locations",
                    updates: locationsData[i],
                    objectId: locationsData[i]._id
                }
                const result = await axios.post('/api/v1/commonservice', body)
                if (result.status === 200) {
                    console.log("Data saved");
                }
                else {
                    alert("Error saving data");
                }
            }
        }
    }

    async function handleAddRow() {
        if (activeTab === "prices") {
            //crate new object and load data
            const body = {
                method: "create",
                table: "prices",
                updates: {
                    type: type,
                    airport: "",
                    destination: "",
                    shared: "",
                    private3less: 0,
                    private3more: 0,
                    assignedSubcontractor: '',
                    validFrom: "",
                    validTo: ""
                }
            }
            const result = await axios.post('/api/v1/commonservice', body)
            if (result.status === 200) {
                setData([...data, result.data]);
            }
            else {
                alert("Error adding row");
            }

        }
        else {
            const body = {
                method: "create",
                table: "locations",
                updates: {
                    code: "",
                    hotel: "",
                    destination: ""
                }
            }
            const result = await axios.post('/api/v1/commonservice', body)
            if (result.status === 200) {
                values.push(result.data);
            }
            else {
                alert("Error adding row");
            }
        }
    }
    const handleDelete = async (index) => {
        if (data[index]?._id !== undefined && data[index]?._id !== null && data[index]?._id !== '' && activeTab === "prices") {
            const body = {
                method: "delete",
                table: "prices",
                objectId: data[index]._id
            }
            const result = await axios.post('/api/v1/commonservice', body)
            if (result.status === 200) {
                let values = [...data];
                values.splice(index, 1);
                setData([...values]);
            }
            else {
                alert("Error deleting data");
            }

        }
        else if (locationsData[index]?._id !== undefined && locationsData[index]?._id !== null && locationsData[index]?._id !== '' && activeTab === "locations") {
            const body = {
                method: "delete",
                table: "locations",
                objectId: locationsData[index]._id
            }
            const result = await axios.post('/api/v1/commonservice', body)
            if (result.status === 200) {
                console.log("Data deleted");
                //remove from array without reloading
                let values = [...locationsData];
                values.splice(index, 1);
                setLocationsData([...values]);
            }
            else {
                alert("Error deleting data");
            }
        }
    }
    const locationsTable = (
        <div style={{ maxHeight: '70vh', overflowY: 'scroll' }}><Table striped bordered hover className={styles.table} >
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Hotel</th>
                    <th>Destination</th>
                </tr>
            </thead>
            <tbody>
                {locationsData.map((location, index) => (
                    <tr key={index}>
                        <td><input className={styles.selectInput}
                            type="text"
                            name="shared"
                            value={location.code ? location.code : ""}
                            onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                        /></td>
                        <td><input className={styles.selectInput}
                            type="text"
                            name="shared"
                            value={location.hotel ? location.hotel : ""}
                            onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                        /></td>
                        <td><input className={styles.selectInput}
                            type="text"
                            name="shared"
                            value={location.destination ? location.destination : ""}
                            onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                        /></td>
                        <td><Button variant="danger" onClick={() => handleDelete(index)}>Delete</Button></td>
                    </tr>
                ))}
            </tbody>
        </Table></div>
    );

    return (
        <div className={styles.container}>
            <Navbar></Navbar>
            <div className={styles.tabs}>
                <Button
                    variant={activeTab === "prices" ? "primary" : "light"}
                    onClick={() => setActiveTab("prices")}
                    className={styles.tabButton}
                >
                    Transfer Prices
                </Button>
                <Button
                    variant={activeTab === "locations" ? "primary" : "light"}
                    onClick={() => setActiveTab("location")}
                    className={styles.tabButton}
                >
                    Locations
                </Button>
            </div>
            <div className={styles.buttons}>
                <Button variant="success" onClick={handleSave}>
                    Save
                </Button>
                <Button variant="primary" onClick={handleAddRow}>
                    Add Row
                </Button>
            </div>
            {activeTab === 'prices' ? (<select className={styles.selectInput}
                value={type ? type : ""}
                onChange={(e) => setType(e.target.value)}
            >
                <option value="">Select</option>
                <option value="outgoing">Outgoing</option>
                <option value="incoming">Incoming</option>
            </select>) : null}
            {activeTab === 'prices' ? (<div style={{ maxHeight: '70vh', overflowY: 'scroll' }}><Table striped bordered hover className={styles.table} >
                <thead>
                    <tr>
                        <th>Airport</th>
                        <th>Destination</th>
                        <th>Shared</th>
                        <th>Private &lt;= 3</th>
                        <th>Private &gt; 3</th>
                        <th>Valid From</th>
                        <th>Valid To</th>
                        <th>Assigned Subcontractor</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            <td><select className={styles.selectInput}
                                value={row?.airport ? row?.airport : ""}
                                onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                                name="airport"
                            >
                                <option value="">{row?.airport ?? "select"}</option>
                                {airports.map((airport) => (
                                    <option value={airport}>{airport}</option>
                                ))}
                            </select></td>
                            <td><select className={styles.selectInput}
                                value={row?.destination ? row?.destination : ""}
                                onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                                name="destination"
                            >
                                <option value="">{row?.destination + "(lokacija ne postoji u bazi)" ?? "select"}</option>
                                {destinations.map((destination) => (
                                    <option value={destination}>{destination}</option>
                                ))}
                            </select></td>
                            <td>
                                <input className={styles.selectInput}
                                    type="number"
                                    name="shared"
                                    value={row?.shared}
                                    onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                                />
                            </td>
                            <td> <input className={styles.selectInput}
                                type="number"
                                name="private3less"
                                value={row?.private3less}
                                onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                            /></td>
                            <td> <input className={styles.selectInput}
                                type="number"
                                name="private3more"
                                value={row?.private3more}
                                onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                            /></td>
                            <td className={styles.date}>
                                <input className={styles.selectInput}
                                    type="date"
                                    name="validFrom"
                                    value={
                                        row?.validFrom ? row?.validFrom.split("T")[0] : ""}
                                    onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                                /></td>
                            <td className={styles.date}>
                                <input className={styles.selectInput}
                                    type="date"
                                    name="validTo"
                                    value={row?.validTo ? row?.validTo.split("T")[0] : ""}
                                    onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                                />
                            </td>
                            <td><select className={styles.selectInput}
                                value={row?.assignedSubcontractor?.userName}
                                onChange={(e) => handleChange(index, e.target.value, e.target.name)}
                                name="assignedSubcontractor"
                            >
                                <option value="">Select</option>
                                {subcontractorsData.map((subcontractor) => (
                                    <option value={subcontractor._id}>{subcontractor.userName}</option>
                                ))}
                            </select></td>
                            <td><div>
                                <Button variant="danger" onClick={() => handleDelete(index)}>
                                    Delete
                                </Button>
                            </div></td>
                        </tr>
                    ))}
                </tbody>
            </Table></div>) : (locationsTable)}
        </div >
    );
}

export default TransferPrices;
