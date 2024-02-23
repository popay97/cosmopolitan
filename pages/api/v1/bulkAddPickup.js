import Reservation from '../../../models/ReservationModel.js';
import dbConnect from '../../../lib/dbConnect.js';
import NextCors from 'nextjs-cors';

export default async function handler(req, res) {
  await NextCors(req, res, {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
  await dbConnect();

  let updated = 0;
  let errors = 0;
  let stringifiedRows = [...req.body];
  for (let i = 0; i < stringifiedRows.length; i++) {    
    //split row into array
    let row = stringifiedRows[i].split(',');
    //row[1] is the id of the reservation, row[8] is the pickup time to be inserted into the reservation

    //find reservation by id

    let pickupTime = row[8].toString().trim();  
    await Reservation.findOneAndUpdate({ resId: row[1].toString() }, { outgoingPickupTime: pickupTime }).then((res) => {
        updated++;
    }).catch((err) => {
        console.log(err);
      errors++;
    });

    }
    res.status(200).json({ updated: updated, errors: errors, success: errors == 0});
  }