import { useState, useRef } from "react";
import Papa from "papaparse";
import styles from "./FileUpload.module.css";

function fileUpload() {
  const [file, setFile] = useState();
  const [obj, setObj] = useState([]);
  const hiddenFileInput = useRef(null);
  const changeHandler = async (event) => {
    if (event.target.files[0]) {
      setFile(event.target.files[0]);
      await Papa.parse(event.target.files[0], {
        header: false,
        skipEmptyLines: true,
        complete: function (results) {
          setObj([...results.data]);
          console.log([...results.data]);
        },
      });
    }
  };
  const handleOnSubmit = async () => {
    if (file) {
      console.log("Salji fajl na bek");
    }
  };

  return (
    <div style={{ textAlign: "center", width: "100%", height: "100%" }}>
      <h3>Unesi CSV u bazu</h3>

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
        accept={".csv"}
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
