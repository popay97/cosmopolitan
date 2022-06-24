import Reservation from '../../models/ReservationModel';

export default async function handler(req, res) {
  const csvData = [...req.body];
  let objForSave;
  for (let i = 0; i < csvData.length; i++) {
      let phone;
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
        price: csvData[i][27],
        accomCd: csvData[i][29],
      };
      console.log(objForSave);
    }
  try {
    const found = await Reservation.findOne({ resId: objForSave.resId });
    if (found) {
    const savedBooking = await Reservation.findOneandUpdate({ resId: objForSave.resId }, objForSave, { new: true });
     res.status(200).json({success: true, ...savedBooking});
    }
    else {
      const savedBooking = await Reservation.create(objForSave);
      res.status(200).json({success: true, ...savedBooking});
    }

  } catch (error) {
    res.status(500).json({success: false, error: error});
  }
}
