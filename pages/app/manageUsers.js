import React from "react";
import Head from "next/head";
import axios from "axios";
import jwt from "jsonwebtoken";
import Navbar from "../../components/Navbar";
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
function ManageUsers() {
    React.useEffect(() => {
        const token = localStorage.getItem("cosmo_token");
        const user = jwt.decode(token);
        if (!token || !user.isAdmin) {
            window.location.href = "/";
        }
    }, []);
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const keyIgnores = ["_id", "password", "__v", 'id'];
    React.useEffect(() => {
        const getUsers = async () => {
            const body = {
                method: "getall",
                table: "users"
            }
            const res = await axios.post("/api/v1/commonservice", body);
            if (res.status === 200) {
                setUsers(res.data);
                setLoading(false);
            } else {
                setError(true);
                window.alert("Error occured");
            }

        }
        getUsers();
    }, []);

    const deleteUser = async (index) => {
        const objectId = users[index]._id;
        const body = {
            method: "delete",
            table: "users",
            objectId: objectId
        }
        const res = await axios.post("/api/v1/commonservice", body);
        if (res.status === 200) {
            window.alert("User deleted");
            window.location.reload();
        } else {
            window.alert("Error occured");
        }
    }

    return (
        <div className="container" >
            <Head>
                <title>Cosmoplitan conrol panel</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                <Navbar></Navbar>
                <div className="list">
                    <h3>Lista korisnika</h3>
                    <div className="table-filters">
                        <div className="filter">
                            <label htmlFor="filter">Search</label>
                            <input type="text" id="search" onChange={(e) => { setSearch(e.target.value) }} />
                        </div>
                        <div className="filter">
                            <button
                                className="myButton" onClick={() => { window.location.href = "/app/addUser" }} >Add new user
                            </button>
                        </div>
                    </div>
                    <div className="table">
                        {!loading && (<table>
                            <thead className="header">
                                <tr>
                                    {Object.keys(users[0]).map((key, index) => {
                                        if (!keyIgnores.includes(key)) {
                                            //check if key contains a capital letter
                                            if (key.match(/[A-Z]/)) {
                                                //split when capital letter is found and capitalize the first letter of both words
                                                const splitKey = key.split(/(?=[A-Z])/).map((word) => {
                                                    return word.charAt(0).toUpperCase() + word.slice(1);
                                                }).join(" ");
                                                return <th key={index} className='field'>{splitKey}</th>
                                            }
                                        }
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {search === "" ? users.map((user, index) => {
                                    return (
                                        <tr key={index} className='row'>
                                            {Object.keys(user).map((key1, index1) => {
                                                if (!keyIgnores.includes(key1)) {
                                                    return <td key={index1} className='field'>{user[key1].toString()}</td>
                                                }
                                            })}
                                            <td key={index} className='field'>
                                                <button className="myButton" onClick={() => { deleteUser(index) }}><DeleteSweepIcon /></button>
                                            </td>
                                        </tr>
                                    )
                                }) : users.filter((user) => {
                                    return Object.keys(user).some((key) => {
                                        if (!keyIgnores.includes(key)) {
                                            return user[key].toString().toLowerCase().includes(search.toLowerCase())
                                        }
                                    })
                                }).map((user, index) => {
                                    return (
                                        <tr key={index} className='row'>
                                            {Object.keys(user).map((key, index) => {
                                                if (!keyIgnores.includes(key)) {
                                                    return <td className="field" key={index}>{user[key]}</td>
                                                }
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>)}
                    </div>
                </div>
            </main>

            <footer>
                <div className="footer-div">
                    <p>Powered by</p>
                    <img src="/trid-logo.jpg" alt="Trid Logo" className="logo" />
                </div>
            </footer>
            <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        main {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          width: 100%;
          min-height: 100vh;
          align-items: center;
          text-align: center;
        }
        .header {
            //backgoround color light grey
            background-color: #337fed;
            color: white;
            border-bottom: 1px solid #ddd;
        }
        .row {
            border-bottom: 1px solid #ddd;
        }
        .row:hover {
            background-color: #ddd;
        }
        .field {
            padding: 15px;
        }
        .table-filters {
            display: flex;
            flex-direction: row;
            justify-content: space-evenly;
            width: 80%;
            align-items: center;
            text-align: center;
            margin-bottom: 20px;
        }
        .list{
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            width: 80%;
            align-items: center;    
        }
        .filter{
            display: flex;
            flex-direction: row;
            justify-content: space-evenly;
            max-width: 170px;
            align-items: center;
            text-align: center;
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
      `}</style>
        </div >
    );
}

export default ManageUsers;
