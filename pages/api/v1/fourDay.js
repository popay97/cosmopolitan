import Reservation from '../../../models/ReservationModel.js';
import dbConnect from '../../../lib/dbConnect.js';
import Log from '../../../models/LogModel.js';
import { processSingleReservation } from '../../../lib/reservationBatchProcess.js';


export default async function handler(req, res) {

    await dbConnect();
    let created = 0;
    let updated = 0;
    let errors = 0;
    let stringifiedRows = [...req.body];
    // RES_ID,ADU,CHD,INF,BOOKED,USER_CD,ARR,ARR_DATE,ARR_FLIGHT,DEP_DATE,DEP_FLIGHT,TRANSFER_CD,TRANSFER,ACCOM_CD,ACCOM,RESORT,ROOM,COUNTRY,DMC,CHD_AGE1,CHD_AGE2,CHD_AGE3,CHD_AGE4,GIATA_CD,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
    let csvMapByIndex = {
        0: "resId",
        1: "adults",
        2: "children",
        3: "infants",
        4: "booked",
        5: "userCd",
        6: "arrivalAirport",
        7: "arrivalDate",
        8: "arrivalFlight",
        9: "depDate",
        10: "departureFlight",
        11: "transferCd",
        12: "transfer",
        13: "accomCd",
        14: "accom",
        15: "resort",
    }
    for (let i = 0; i < stringifiedRows.length; i++) { 
        let row = stringifiedRows[i];
        let rowArray = row.split(",").map((el) => el.trim());
        let rowObject = {};
        rowObject["arrivalDate"] = new Date();  
        rowObject["depDate"] = new Date();
        rowObject["booked"] = new Date();   
        rowObject["arrivalFlight"] = {
            number: null,
            depAirport: null,
            arrTime: null,
        };
        rowObject['departureFlight'] = {
            number: null,
            arrAirport: null,
            depTime: null,
        };

        
        //csv arrivalFlight field comes in always formatted: MAN 06:40 - TIV 10:45 EZY2271
        //csv departureFlight field comes in always formatted: TIV 11:35 - MAN 13:40 EZY2272
        //in loop split the string and assign values to rowObject properly
        let dropRow = false;
        for (let j = 0; j < rowArray.length; j++) {
            if (csvMapByIndex[j]) {
                switch (csvMapByIndex[j]) {
                    case "transfer":
                        if(rowArray[j].includes(";")){
                            //contains multiple transfers drop this whole row and log it
                            console.log("Multiple transfers in one row");
                            errors++;
                            dropRow = true;
                            continue;
                        }
                        else if(rowArray[j].toLowerCase().startsWith("shared transfer")){
                            rowObject[csvMapByIndex[j]] = "STR";
                        }
                        else if(rowArray[j].toLowerCase().startsWith("private transfer")){
                            rowObject[csvMapByIndex[j]] = "PTR";
                        }
                        else if(rowArray[j].toLowerCase().startsWith("no shared transfer")){
                            rowObject[csvMapByIndex[j]] = "NST";
                        }
                        else if(rowArray[j].toLowerCase().startsWith("no private transfer")){
                            rowObject[csvMapByIndex[j]] = "NPT";
                        }
                        else{
                            console.log("Unknown transfer type");
                            errors++;
                            dropRow = true;
                            continue;
                        }

                        break;
                    case "arrivalDate":
                        //split by / and set manually to the date
                        let arrivalDate = rowArray[j].split("/").map((el) => Number(el));
                        if(arrivalDate[2] < 1000) arrivalDate[2] += 2000;
                        rowObject[csvMapByIndex[j]]?.setFullYear(arrivalDate[2]);
                        rowObject[csvMapByIndex[j]]?.setMonth(arrivalDate[0] - 1);
                        rowObject[csvMapByIndex[j]]?.setDate(arrivalDate[1]);
                        break;
                    case "resort": 
                        //to lowercase
                        rowObject[csvMapByIndex[j]] = rowArray[j].toLowerCase();
                        break;
                    case "arrivalFlight":
                        let arrivalFlight = rowArray[j].split("-").map((el) => el.trim());
                        let arrivalFlightDep = arrivalFlight[0].split(" ").map((el) => el.trim());
                        let arrivalFlightArr = arrivalFlight[1].split(" ").map((el) => el.trim());
                        rowObject[csvMapByIndex[j]] = {
                            depAirport: arrivalFlightDep[0],
                            arrTime: arrivalFlightDep[1],
                            number: arrivalFlightArr[2],
                        }
                        //use time to set it to the date
                        let arrivalTime = arrivalFlightArr[1].split(":");
                        //check if date is already set to the rowObject
                        if (rowObject["arrivalDate"]) {
                            rowObject["arrivalDate"].setHours(arrivalTime[0], arrivalTime[1]);
                        }
                        break;
                    case "depDate":
                        //split by / and set manually to the date
                        let depDate = rowArray[j].split("/").map((el) => Number(el));
                        if(depDate[2] < 1000) depDate[2] += 2000;
                        rowObject[csvMapByIndex[j]]?.setFullYear(depDate[2]);
                        rowObject[csvMapByIndex[j]]?.setMonth(depDate[0] - 1);
                        rowObject[csvMapByIndex[j]]?.setDate(depDate[1]);
                        break; 
                    case "departureFlight":
                        let departureFlight = rowArray[j].split("-").map((el) => el.trim());
                        let departureFlightDep = departureFlight[0].split(" ").map((el) => el.trim());
                        let departureFlightArr = departureFlight[1].split(" ").map((el) => el.trim());
                        rowObject[csvMapByIndex[j]] = {
                            arrAirport: departureFlightArr[0],
                            depTime: departureFlightDep[1],
                            number: departureFlightArr[2],
                        }
                        //use time to set it to the date
                        let departureTime = departureFlightDep[1].split(":");
                        //check if date is already set to the rowObject
                        if (rowObject["depDate"]) {
                            rowObject["depDate"].setHours(departureTime[0], departureTime[1]);
                        }
                        break;
                    case "adults":
                        rowObject[csvMapByIndex[j]] = Number(rowArray[j].trim());
                        break;
                    case "children":
                        rowObject[csvMapByIndex[j]] = Number(rowArray[j].trim());
                        break;
                    case "infants":
                        rowObject[csvMapByIndex[j]] = Number(rowArray[j].trim());
                        break;
            
                    case "booked":
                        //booked is a date in the format of MM/DD/YYYY
                        let booked = rowArray[j].split("/").map((el) => parseInt(el));
                        if(booked[2] < 1000) booked[2] += 2000;
                        rowObject[csvMapByIndex[j]]?.setFullYear(booked[2]);
                        rowObject[csvMapByIndex[j]]?.setMonth(booked[0] - 1);
                        rowObject[csvMapByIndex[j]]?.setDate(booked[1]);
                        //set utc hours to 4 am 
                        rowObject[csvMapByIndex[j]]?.setUTCHours(4);
                        break;
                    default:
                        rowObject[csvMapByIndex[j]] = rowArray[j].toString();
                        break;
                        
                }
            }
        }
        if(dropRow) {
            continue;
        }
        //check if the reservation exists
        //if it does, update it
        //if it doesn't, create it
        let reservation = await Reservation.findOne({ resId: rowObject.resId });    
        if (reservation) {
            try {
                let updatedReservation = await Reservation.findOneAndUpdate({ resId: rowObject.resId },
                    {
                        adults: rowObject.adults,
                        status: "AMENDED",
                        children: rowObject.children,
                        infants: rowObject.infants,
                        booked: rowObject.booked,
                        userCd: rowObject.userCd,
                        arrivalAirport: rowObject.arrivalAirport,
                        arrivalDate: rowObject.arrivalDate,
                        arrivalFlight: rowObject.arrivalFlight,
                        depDate: rowObject.depDate,
                        departureFlight: rowObject.departureFlight,
                        transferCd: rowObject.transferCd,
                        transfer: rowObject.transfer,
                        accomCd: rowObject.accomCd,
                        accom: rowObject.accom,
                        resort: rowObject.resort,
                    }, { new: true });
                updated++;
                await processSingleReservation(updatedReservation.resId);
            }
            catch (error) {
                console.log(error);
                errors++;
            }
        }
        else{
            
            let newReservation = new Reservation({
                resId: rowObject.resId,
                status: "AMENDED",
                adults: rowObject.adults,
                children: rowObject.children,
                infants: rowObject.infants,
                booked: rowObject.booked,
                userCd: rowObject.userCd,
                arrivalAirport: rowObject.arrivalAirport,
                arrivalDate: rowObject.arrivalDate,
                arrivalFlight: rowObject.arrivalFlight,
                depDate: rowObject.depDate,
                departureFlight: rowObject.departureFlight,
                transferCd: rowObject.transferCd,
                transfer: rowObject.transfer,
                accomCd: rowObject.accomCd,
                accom: rowObject.accom,
                resort: rowObject.resort,
            });
            try {
                await newReservation.save();
                await processSingleReservation(newReservation.resId); 
                created++;
            }
            catch (error) {
                console.log(error);
                errors++;
            }
        }
        
     }

    res.status(200).json({created,updated, errors });
}