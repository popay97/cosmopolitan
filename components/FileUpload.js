import { useState, useRef } from "react";
import styles from "./FileUpload.module.css";
import axios from 'axios';
import * as XLSX from 'xlsx/xlsx.mjs';
import Papa from 'papaparse';

function fileUpload({endpoint, title}) {
  const [file, setFile] = useState();
  const [obj, setObj] = useState([]);
  const hiddenFileInput = useRef(null);
  const [loading,setLoading] = useState(false);


  const validateFile = (res) => {
    if (endpoint?.includes("bulkAdd") ?? false) {
      let validRows = [];
      let invalidRows = [];
      const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/; // Regular expression to check HH:MM format
  
      for (let i = 0; i < res.length; i++) {
        const row = res[i];
  
        // Check if the second column contains only numerical characters
        const isSecondColumnNumeric = /^\d+$/.test(row[1]);
  
        // Check if the ninth column is in the HH:MM format
        const isTimeFormatValid = timeRegex.test(row[8]);
  
        if (isSecondColumnNumeric && isTimeFormatValid) {
          validRows.push(row);
        }
        else{
            invalidRows.push(row);
        }
      }
      if(invalidRows.length > 0){
        const intro = "Algoritam je odlucio izbaciti sljedece redove iz XLSX dokumenta zbog nevalidnog resId ili pickup-time. Prekontrolisati redove:\n"
        const invalidRowsString = invalidRows.map((row) => row.join(',')).join('\n');
        window.alert(`${intro}${invalidRowsString}`);
      }
      validRows = validRows.map((e)=> e.join(',').trim());
      setObj(validRows);
    }
    else{
        let validRows = [];
        let invalidRows = [];    
        for (let i = 0; i < res.length; i++) {
          const row = res[i];
    
          // Check if the second column contains only numerical characters
          const isSecondColumnNumeric = /^\d+$/.test(row[0]);
    
          // Check if the ninth column is in the HH:MM format
    
          if (isSecondColumnNumeric) {
            validRows.push(row);
          }
          else{
            invalidRows.push(row);
          }
        }
        if(invalidRows.length > 0){
          const intro = "Algoritam je odlucio izbaciti sljedece redove iz XLSX dokumenta zbog nevalidnog resId ili pickup-time. Prekontrolisati redove:\n"
          const invalidRowsString = invalidRows.map((row) => row.join(',')).join('\n');
          window.alert(`${intro}${invalidRowsString}`);
        }
        validRows = validRows.map((e)=> e.join(',').trim());
        setObj(validRows);
    }
  };
  const changeHandler = async (event) => {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      setFile(file);
      const fileContent = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(fileContent, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_csv(worksheet, { header: 1 });
      Papa.parse(data, {
        header: false,
        skipEmptyLines: true,
        complete: function (res){
          setObj(res.data);
          validateFile(res.data);
        },
        transform: (value) => value.trim().replace(/[\r\n]/g, ''),
      });
    }
  };
  
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
  
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
  
      fileReader.onerror = () => {
        reject(fileReader.error);
      };
  
      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleOnSubmit = async () => {
    if (obj.length > 0) {
      const chunkSize = 250; // set the chunk size to 1000
      const chunkedObjs = [];
      for (let i = 0; i < obj.length; i += chunkSize) {
        chunkedObjs.push(obj.slice(i, i + chunkSize));
      }
      // send each chunkedObj one by one
      for (let i = 0; i < chunkedObjs.length; i++) {
        const chunkedObj = chunkedObjs[i];
        console.log(chunkedObj);
        setLoading(true);
        await axios.post(`/api/v1/${endpoint}`, chunkedObj).then((res) => {
          window.alert(`${res.data.updated} updated, ${res.data.errors} errors`)
        }).catch(err => {
          window.alert(` ${err.response.data.updated} updated, ${err.response.data.message}`)
        })
      }
      setLoading(false);
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
          <button onClick={handleOnSubmit} className={styles.myButton} disabled={loading}>
            {loading ? 'Obradjuje se... ': 'Obradi Fajl'}
          </button>
        </>
      ) : (
        <div></div>
      )}
    </div>
  );
}

export default fileUpload;
