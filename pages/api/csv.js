import Reservation from '../../models/ReservationModel';

export default async function handler(req, res) {
  let updated = 0;
  let created = 0;
  let errors = 0;
  const csvData = [...req.body];
  for (let i = 0; i < csvData.length; i++) {
      let phone;
      let objForSave;
      if (csvData[i][10].startsWith("00")) {
        phone = "+" + csvData[i][10].slice(2);
      } else {
        phone = "+" + csvData[i][10];
      }
      function formatDate(str, timestamp) {
          let dd = parseInt(str.slice(0, 2));
          let mm = parseInt(str.slice(2, 4));
          let yyyy = parseInt(str.slice(4, 8));
          let tmpDate = new Date(yyyy, mm - 1, dd, parseInt(timestamp.split(":")[0]) + 1,parseInt(timestamp.split(":")[1]));
          return tmpDate;
      }
      objForSave = {
        resId: csvData[i][0],
        status: csvData[i][1],
        booked: formatDate(csvData[i][2], csvData[i][3]),
        title: csvData[i][4],
        name: csvData[i][5],
        surname: csvData[i][6],
        adults: parseInt(csvData[i][7]),
        children: parseInt(csvData[i][8]),
        infants: parseInt(csvData[i][9]),
        arrivalAirport: csvData[i][11],
        phone: phone,
        transfer: csvData[i][13],
        arrDate: formatDate(csvData[i][19], csvData[i][20]),
        arrivalFlight: {
          number: csvData[i][18],
          depAirport: csvData[i][17],
          arrTime: csvData[i][20],
        },
        depDate: formatDate(csvData[i][23], csvData[i][24]),
        accom: csvData[i][21],
        resort: csvData[i][22],
        departureFlight: {
          number: csvData[i][25],
          arrAirport: csvData[i][26],
          depTime: csvData[i][24],
        },
        price: parseInt(csvData[i][27]),
        accomCd: csvData[i][29],
      };
      try {
        const found = await Reservation.findOne({ resId: objForSave.resId });
        if (found) {
        const updatedField = await Reservation.findOneAndUpdate({ resId: objForSave.resId }, objForSave, { new: true });  
        updated++;
        }
        else {
          const savedBooking = await Reservation.create(objForSave);
          created++;
        }
    
      } catch (error) {
        console.log(error);
        errors++;
      }
    }
    if(errors > 0) {
      return res.status(500).json({
        created: created,
        updated: updated,
        message: `${errors} errors occured while saving the data`,
        data: csvData,
      });
    }
    return res.status(200).json({success: true, created: created, updated: updated});
}
