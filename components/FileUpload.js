import { useState, useRef } from "react";
import styles from "./FileUpload.module.css";
import axios from 'axios';
import * as XLSX from 'xlsx/xlsx.mjs';

function fileUpload({endpoint, title}) {
  const [file, setFile] = useState();
  const [obj, setObj] = useState([]);
  const hiddenFileInput = useRef(null);



  const changeHandler = async (event) => {
    if (event.target.files[0]) {
      setFile(event.target.files[0]);
      const fileReader = new FileReader();
      fileReader.onload = function (e) {
        console.log(e.target.result);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        let rows = csvData.split("\n");
        //check if the first row is header

        setObj(rows);
      };
      fileReader.readAsArrayBuffer(event.target.files[0]);
    }
  };
  const handleOnSubmit = async () => {
    if (obj.length > 0) {
      const chunkSize = 1000; // set the chunk size to 1000
      const chunkedObjs = [];
      for (let i = 0; i < obj.length; i += chunkSize) {
        chunkedObjs.push(obj.slice(i, i + chunkSize));
      }
      // send each chunkedObj one by one
      for (let i = 0; i < chunkedObjs.length; i++) {
        const chunkedObj = chunkedObjs[i];
        console.log(chunkedObj);
        await axios.post(`/api/v1/${endpoint}`, chunkedObj).then((res) => {
          window.alert(`${res.data.updated} updated, ${res.data.errors} errors`)
        }).catch(err => {
          window.alert(` ${err.response.data.updated} updated, ${err.response.data.message}`)
        })
      }
    }
  };

  return (
    <div style={{ textAlign: "center", width: "100%", height: "100%" }}>
      <h3>{title}</h3>

      <button
        onClick={() => {
          hiddenFileInput.current.click();
        }}
        className={styles.myButton}
      >
        Izaberi fajl
      </button>
      <input
        className={styles.myButton}
        ref={hiddenFileInput}
        type={"file"}
        accept={".xlsx"}
        onChange={(e) => {
          changeHandler(e);
        }}
        style={{ display: "none" }}
      />
      {file ? (
        <>
          <h3 style={{ fontFamily: "PostNord" }}>
            {file.name}{" "}
            <img
              src="/check-solid.svg"
              style={{
                width: "20px",
                verticalAlign: "middle",
                marginLeft: "5px",
              }}
            ></img>{" "}
          </h3>
          <button onClick={handleOnSubmit} className={styles.myButton}>
            Obradi fajl
          </button>
        </>
      ) : (
        <div></div>
      )}
    </div>
  );
}

export default fileUpload;
