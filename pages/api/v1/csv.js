import Reservation from '../../../models/ReservationModel.js';
import dbConnect from '../../../lib/dbConnect.js';
import Locations from '../../../models/LocationsModel.js';
import Prices from '../../../models/PricesModel.js';
import NextCors from 'nextjs-cors';
import Log from '../../../models/LogModel.js';

export default async function handler(req, res) {
  await NextCors(req, res, {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  });
  await dbConnect();
  let updated = 0;
  let created = 0;
  let errors = 0;
  const csvData = [...req.body];
  for (let i = 0; i < csvData.length; i++) {
    console.log('for loop')
    let phone;
    var objForSave = {};
    if (csvData[i][10].startsWith("00")) {
      phone = "+" + csvData[i][10].slice(2);
      //remove whitespaces
      phone = phone.replace(/\s/g, "");
    }
    else if (csvData[i][10].startsWith("0")) {
      phone = "+44" + csvData[i][10].slice(1);
      //remove whitespaces
      phone = phone.replace(/\s/g, "");
    }
    else {
      phone = "+" + csvData[i][10];
      //remove whitespaces
      phone = phone.replace(/\s/g, "");
    }
    function formatDate(str, timestamp) {
      if (str.length === 7) {
        str = "0" + str;
      }
      let dd = parseInt(str.slice(0, 2));
      let mm = parseInt(str.slice(2, 4));
      let yyyy = parseInt(str.slice(4, 8));
      let tmpDate = new Date(Date.UTC(yyyy, mm - 1, dd, parseInt(timestamp.split(":")[0]), parseInt(timestamp.split(":")[1])));
      return tmpDate;
    }
    console.log('prepare objForSave')
    objForSave = {
      resId: csvData[i][0] ? csvData[i][0].trim() : null,
      status: csvData[i][1] ? csvData[i][1].trim() : null,
      booked: csvData[i][2] && csvData[i][3] ? formatDate(csvData[i][2], csvData[i][3]) : null,
      title: csvData[i][4] ? csvData[i][4].trim() : null,
      name: csvData[i][5] ? csvData[i][5].trim() : null,
      surname: csvData[i][6] ? csvData[i][6].trim() : null,
      adults: csvData[i][7] ? parseInt(csvData[i][7].trim()) : null,
      children: csvData[i][8] ? parseInt(csvData[i][8].trim()) : null,
      infants: csvData[i][9] ? parseInt(csvData[i][9].trim()) : null,
      arrivalAirport: csvData[i][11] ? csvData[i][11].trim() : null,
      phone: phone ? phone.trim() : null,
      transfer: csvData[i][13] ? csvData[i][13].trim() : null,
      arrivalDate: csvData[i][19] && csvData[i][20] ? formatDate(csvData[i][19], csvData[i][20]) : null,
      arrivalFlight: {
        number: csvData[i][18] ? csvData[i][18].trim() : null,
        depAirport: csvData[i][17] ? csvData[i][17].trim() : null,
        arrTime: csvData[i][20] ? csvData[i][20].trim() : null,
      },
      depDate: csvData[i][23] && csvData[i][24] ? formatDate(csvData[i][23], csvData[i][24]) : null,
      accom: csvData[i][21] ? csvData[i][21].trim() : null,
      resort: csvData[i][22] ? csvData[i][22].trim() : null,
      departureFlight: {
        number: csvData[i][25] ? csvData[i][25].trim() : null,
        arrAirport: csvData[i][26] ? csvData[i][26].trim() : null,
        depTime: csvData[i][24] ? csvData[i][24].trim() : null,
      },
      accomCd: csvData[i][29] ? csvData[i][29].trim() : null,
      hasLocation: true,
      hasEmptyFields: false,
      hasPricesIncoming: true,
      hasPricesOutgoing: true,
      billingDestination: '',
    };
    //check if object has a field with value null
    for (let key in Object.keys(objForSave)) {
      if (typeof objForSave[key] === 'object') {
        for (let key2 in Object.keys(objForSave[key])) {
          if (objForSave[key][key2] === null) {
            objForSave['hasEmptyFields'] = true;
          }
        }
      }
      else if (objForSave[key] === null) {
        objForSave['hasEmptyFields'] = true;
      }
    }
    //check if location exists for the given accomCd and resort
    if (objForSave.accomCd !== null && objForSave.resort !== null) {
      var location = await Locations.findOne({
        code: objForSave.accomCd,
      });
      if (!location) {
        location = await Locations.findOne({
          hotel: objForSave.resort,
        });
      }
      if (location) {
        objForSave["billingDestination"] = location.destination;
      } else {
        objForSave["hasLocation"] = false;
        objForSave["hasPricesIncoming"] = false;
        objForSave["hasPricesOutgoing"] = false;
      }
    }
    if (objForSave.hasLocation) {
      let arrivalDate = objForSave.arrivalDate;
      let depDate = objForSave.depDate;
      let destination = objForSave.billingDestination;
      let booked = objForSave.booked;
      const pricesIncomingArrival = await Prices.findOne({
        airport: objForSave.arrivalAirport,
        destination: destination,
        validFrom: { $lte: arrivalDate },
        validTo: { $gte: arrivalDate },
        type: "incoming",
      });
      const pricesIncomingDep = await Prices.findOne({
        airport: objForSave.arrivalAirport,
        destination: destination,
        validFrom: { $lte: depDate },
        validTo: { $gte: depDate },
        type: "incoming",
      });
      const pricesOutgoingArrival = await Prices.findOne({
        airport: objForSave.arrivalAirport,
        destination: destination,
        validFrom: { $lte: booked },
        validTo: { $gte: booked },
        type: "outgoing",
      });
      const pricesOutgoingDep = await Prices.findOne({
        airport: objForSave.arrivalAirport,
        destination: destination,
        validFrom: { $lte: booked },
        validTo: { $gte: booked },
        type: "outgoing",
      });

      var pricing = {
        ways: 0,
        calculated: false,
        incomingInvoice: {
          totalw1: 0,
          totalw2: 0,
          total: 0,
        },
        outgoingInvoice: {
          cost: 0,
          handlingFee: 0,
          totalw1: 0,
          totalw2: 0,
          total: 0,
          totalWithFee: 0,
        },
      };
      if (arrivalDate.getMonth() === depDate.getMonth() && arrivalDate.getFullYear() === depDate.getFullYear()) {
        pricing.ways = 2;
      }
      else {
        pricing.ways = 1;
      }
      if (pricesIncomingArrival && pricesIncomingDep) {
        if (objForSave.transfer === 'STR') {
          pricing.incomingInvoice.totalw1 = Number((objForSave.adults * pricesIncomingArrival.shared + (objForSave.children * pricesIncomingArrival.shared * 0.5)).toFixed(3));
          pricing.incomingInvoice.totalw2 = Number((objForSave.adults * pricesIncomingDep.shared + (objForSave.children * pricesIncomingDep.shared * 0.5)).toFixed(3));
          pricing.incomingInvoice.total = Number((pricing.incomingInvoice.totalw1 + pricing.incomingInvoice.totalw2).toFixed(3));

        }
        else if (objForSave.transfer === 'PTR') {
          //just the sum of the adults and children matters
          if (objForSave.adults + objForSave.children <= 3) {
            pricing.incomingInvoice.totalw1 = Number((pricesIncomingArrival.private3less).toFixed(3));
            pricing.incomingInvoice.totalw2 = Number((pricesIncomingDep.private3less).toFixed(3));
            pricing.incomingInvoice.total = Number((pricing.incomingInvoice.totalw1 + pricing.incomingInvoice.totalw2).toFixed(3));
          }
          else {
            pricing.incomingInvoice.totalw1 = Number((pricesIncomingArrival.private3more).toFixed(3));
            pricing.incomingInvoice.totalw2 = Number((pricesIncomingDep.private3more).toFixed(3));
            pricing.incomingInvoice.total = Number((pricing.incomingInvoice.totalw1 + pricing.incomingInvoice.totalw2).toFixed(3));
          }
        }
        else {
          pricing.incomingInvoice.total = 0;
        }
        objForSave['hasPricesIncoming'] = true;
      }
      else {
        pricing.incomingInvoice.total = 0;
        objForSave['hasPricesIncoming'] = false;
      }
      if (pricesOutgoingArrival && pricesOutgoingDep) {
        if (objForSave.transfer === 'STR') {
          pricing.outgoingInvoice.cost = Number(pricesOutgoingArrival.shared.toFixed(3)) + Number(pricesOutgoingDep.shared.toFixed(3));
          //handling fee is 4.5 for every adult and 2.25 for every child
          pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
          pricing.outgoingInvoice.totalw1 = Number((pricesOutgoingArrival.shared * objForSave.adults + (pricesOutgoingArrival.shared * objForSave.children * 0.5)).toFixed(3));
          pricing.outgoingInvoice.totalw2 = Number((pricesOutgoingDep.shared * objForSave.adults + (pricesOutgoingDep.shared * objForSave.children * 0.5)).toFixed(3));
          pricing.outgoingInvoice.total = Number((pricing.outgoingInvoice.totalw1 + pricing.outgoingInvoice.totalw2).toFixed(3));
          pricing.outgoingInvoice.totalWithFee = pricing.ways == 2 ? Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3)) : Number((pricing.outgoingInvoice.totalw2 + pricing.outgoingInvoice.handlingFee).toFixed(3));
        }
        else if (objForSave.transfer === 'PTR') {
          //just the sum of the adults and children matters
          if (objForSave.adults + objForSave.children <= 3) {
            pricing.outgoingInvoice.cost = Number(pricesOutgoingArrival.private3less.toFixed(3)) + Number(pricesOutgoingDep.private3less.toFixed(3));
            pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
            pricing.outgoingInvoice.totalw1 = Number(pricesOutgoingArrival.private3less.toFixed(3));
            pricing.outgoingInvoice.totalw2 = Number(pricesOutgoingDep.private3less.toFixed(3));
            pricing.outgoingInvoice.total = Number((pricing.outgoingInvoice.totalw1 + pricing.outgoingInvoice.totalw2).toFixed(3));
            pricing.outgoingInvoice.totalWithFee = pricing.ways == 2 ? Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3)) : Number((pricing.outgoingInvoice.totalw2 + pricing.outgoingInvoice.handlingFee).toFixed(3));
          }
          else {

            pricing.outgoingInvoice.cost = Number(pricesOutgoingArrival.private3more.toFixed(3)) + Number(pricesOutgoingDep.private3more.toFixed(3));
            pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
            pricing.outgoingInvoice.totalw1 = Number(pricesOutgoingArrival.private3more.toFixed(3));
            pricing.outgoingInvoice.totalw2 = Number(pricesOutgoingDep.private3more.toFixed(3));
            pricing.outgoingInvoice.total = Number((pricing.outgoingInvoice.totalw1 + pricing.outgoingInvoice.totalw2).toFixed(3));
            pricing.outgoingInvoice.totalWithFee = pricing.ways == 2 ? Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3)) : Number((pricing.outgoingInvoice.totalw2 + pricing.outgoingInvoice.handlingFee).toFixed(3));
          }
        }
        else {
          pricing.outgoingInvoice.cost = 0;
          pricing.outgoingInvoice.handlingFee = 0;
          pricing.outgoingInvoice.total = 0;
          pricing.outgoingInvoice.totalWithFee = 0;
        }
        objForSave['hasPricesOutgoing'] = true;
      }
      else {
        objForSave['hasPricesOutgoing'] = false;
      }
      if (pricing.incomingInvoice.total > 0 && pricing.outgoingInvoice.cost > 0) {
        pricing.calculated = true;
      }
      objForSave = {
        ...objForSave,
        pricing: pricing
      }
    }

    try {
      console.log('trying to save');
      const found = await Reservation.findOne({ resId: objForSave.resId });
      if (found) {
        await Reservation.findOneAndUpdate({ resId: objForSave.resId }, objForSave, { new: true });
        console.log('updatedField')
        updated++;
      }
      else {
        await Reservation.create(objForSave);
        console.log('saved')
        created++;
      }

    } catch (error) {
      console.log(error);
      errors++;
    }
  }
  if (errors > 0) {
    const log = {
      dateTimeStamp: new Date(),
      type: 'import',
      message: `Imported ${created} new bookings and updated ${updated} existing bookings, ${errors} errors occured while saving the data`
    }
    let newLog = new Log(log);
    await newLog.save();
    return res.status(500).json({
      created: created,
      updated: updated,
      message: `${errors} errors occured while saving the data`,
    });
  }
  const log = {
    dateTimeStamp: new Date(),
    type: 'import',
    message: `Imported ${created} new bookings and updated ${updated} existing bookings, ${errors} errors occured while saving the data`
  }
  let newLog = new Log(log);
  await newLog.save();

  return res.status(200).json({ success: true, created: created, updated: updated, errors: errors });

}
