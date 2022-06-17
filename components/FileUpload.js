import {useState,useRef} from 'react'
import Papa from 'papaparse'
import styles from './FileUpload.module.css'
function fileUpload() {
    const [file,setFile] = useState();
    const [obj,setObj] = useState([]);
    const hiddenFileInput = useRef(null);

    const changeHandler = (event) => {
    setFile(event.target.files[0])
    Papa.parse(event.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        setObj([...results.data])
      },
    });
  };
    const handleOnSubmit = (e) => {
        e.preventDefault();

        if (file) {
            
        }
    };

    return (
        <div style={{ textAlign: "center", width: "100%", height: "100%" }}>
            <h3>Unesite CSV fajl:</h3>
            <form>
                <button onClick={()=>{            
                        hiddenFileInput.current.click();
                }} className={styles.myButton}>
                    Upload a file
                </button>
                <input className={styles.myButton} ref={hiddenFileInput} type={"file"} accept={".csv"} onChange={changeHandler} style={{display: 'none'}} />
            </form>
        </div>
    );
}

export default fileUpload