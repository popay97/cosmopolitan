import Reservation from "../../../models/ReservationModel.js";
import mongoose from "mongoose";
export default async (req, res) => {
  function csvToObject(csv) {
    // Split the CSV string into an array of rows.
    const rows = csv.split("\r\n");

    // Get the keys from the first row of the CSV file.
    const keys = rows[0].split(",");

    // Create an empty object that will be used to store the data.
    const data = [];

    // Loop through the remaining rows of the CSV file.
    for (let i = 1; i < rows.length; i++) {
      // Split the current row into an array of values.
      const values = rows[i].split(",");

      // Create an empty object for the current data item.
      const item = {};

      // Loop through the keys and values and add them to the item object.
      for (let j = 0; j < keys.length; j++) {
        if (j > 1 && j < keys.length - 1) {
          //remove whitespace and parse to float round to 2 decimals
          item[keys[j]] = parseFloat(values[j].replace(/\s/g, "")).toFixed(2);
        } else {
          item[keys[j]] = values[j];
        }
      }

      // Add the item to the data object.
      data.push(item);
    }

    // Return the data object.
    return data;
  }

  //update all documents in the database pricing.calculated to false
  await Reservation.updateMany(
    { "pricing.calculated": true },
    { $set: { "pricing.calculated": false } }
  );

  const fs = require("fs");
  const path = require("path");
  const dirRelativeToPublicFolder = "prices";
  const dir = path.resolve("./public", dirRelativeToPublicFolder);
  const incomingOldPrices = fs.readFileSync(
    path.resolve(dir, "incoming_pricing_old.csv"),
    "utf8"
  );
  const incomingNewPrices = fs.readFileSync(
    path.resolve(dir, "incoming_pricing_new.csv"),
    "utf8"
  );
  const outgoingOldPrices = fs.readFileSync(
    path.resolve(dir, "outgoing_pricing_old.csv"),
    "utf8"
  );
  const outgoingNewPrices = fs.readFileSync(
    path.resolve(dir, "outgoing_pricing_new.csv"),
    "utf8"
  );
  const locationData = fs.readFileSync(
    path.resolve(dir, "locations.csv"),
    "utf8"
  );

  let errors = [];
  let updated = 0;
  const handlingFeeAdult = 4.5;
  const handlingFeeChild = 2.25;
  const incomingOld = csvToObject(incomingOldPrices);
  const incomingNew = csvToObject(incomingNewPrices);
  const outgoingOld = csvToObject(outgoingOldPrices);
  const outgoingNew = csvToObject(outgoingNewPrices);
  const locations = csvToObject(locationData);
  const query = await Reservation.find({
    "pricing.calculated": false,
    status: { $ne: "CANCELLED" },
  })
  const reservations = JSON.parse(JSON.stringify(query));

  for (let i = 0; i < reservations.length; i++) {
    if (reservations[i].booked) {
      var bookingDate = new Date(reservations[i].booked);
    }
    else {
      errors.push('Invalid reservation in the database');
      continue;
    }
    const isOldPricing =
      bookingDate.getTime() < new Date("2021-09-15").getTime();
    const numOfPassangers = reservations[i].adults + reservations[i].children;
    const location = locations.find(
      (location) => location.accomCd === reservations[i].accomCd
    );
    if (!location) {
      errors.push(`Location not found for accomCD ${reservations[i].accomCd}`,
      );
      continue;
    }
    if (Object.keys(location).length === 0) {
      errors.push(`Location not found for accomCd: ${reservations[i].accomCd}`);
      continue;
    }

    //extract only Resort field
    const resort = location.Resort;

    //depending on isOldPricing use old or new prices
    reservations[i].billingDestination = resort;
    if (isOldPricing) {
      const pricesOI = incomingOld.find(
        (price) =>
          price.Airport.toUpperCase() ===
          reservations[i].arrivalAirport.toUpperCase() &&
          price.Destination.toUpperCase() === resort.toUpperCase()
      );
      if (pricesOI !== null && pricesOI !== undefined) {
        if (reservations[i].transfer === "STR") {
          reservations[i].pricing.incomingInvoice.total = pricesOI["Shared"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers <= 3) {
          reservations[i].pricing.incomingInvoice.total = pricesOI["Private<3"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers > 3) {
          reservations[i].pricing.incomingInvoice.total = pricesOI["Private>3"];
        } else {
          errors.push(
            `Transfer PRICE oi not found for reservation: ${reservations[i]._id}`
          );
          continue;
        }
      } else {
        console.log("prices is empty");
        console.log("skiping reservation");
        //skip this reservation
        continue;
      }
      const pricesOutgoing = outgoingOld.find(
        (price) =>
          price.Airport.toUpperCase() ===
          reservations[i].arrivalAirport.toUpperCase() &&
          price.Destination.toUpperCase() === resort.toUpperCase()
      );
      if (pricesOutgoing !== null && pricesOutgoing !== undefined) {
        if (reservations[i].transfer === "STR") {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Shared"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers <= 3) {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Private<3"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers > 3) {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Private>3"];
        } else {
          errors.push(
            `Transfer PRICE OO not found for reservation: ${reservations[i]._id}`
          );
          continue;
        }
      } else {
        console.log(
          "prices OO is empty for reservation: " + reservations[i]._id
        );
        continue;
      }
      reservations[i].pricing.outgoingInvoice.handlingFee =
        parseInt(reservations[i].adults) * handlingFeeAdult +
        parseInt(reservations[i].children) * handlingFeeChild;

      reservations[i].pricing.outgoingInvoice.total =
        parseFloat(reservations[i].pricing.outgoingInvoice.cost) +
        parseFloat(reservations[i].pricing.outgoingInvoice.handlingFee);
    } else {
      const prices = incomingNew.find(
        (price) =>
          price.Airport.toUpperCase() ===
          reservations[i].arrivalAirport.toUpperCase() &&
          price.Destination.toUpperCase() === resort.toUpperCase()
      );
      if (prices != null && prices != undefined) {
        if (reservations[i].transfer === "STR") {
          reservations[i].pricing.incomingInvoice.total = prices["Shared"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers <= 3) {
          reservations[i].pricing.incomingInvoice.total = prices["Private<3"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers > 3) {
          reservations[i].pricing.incomingInvoice.total = prices["Private>3"];
        } else {
          errors.push(
            `Transfer PRICE NI not found for reservation: ${reservations[i].accomCd}`
          );
          //skip this reservation
          continue;
        }
      } else {
        console.log(
          "prices NI is empty for reservation: " + reservations[i].accomCd
        );
        continue;
      }

      const pricesOutgoing = outgoingNew.find(
        (price) =>
          price.Airport.toUpperCase() ===
          reservations[i].arrivalAirport.toUpperCase() &&
          price.Destination.toUpperCase() === resort.toUpperCase()
      );
      if (pricesOutgoing !== null && pricesOutgoing !== undefined) {
        if (reservations[i].transfer === "STR") {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Shared"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers <= 3) {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Private<3"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers > 3) {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Private>3"];
        } else {
          errors.push(
            `Transfer PRICE NO not found for reservation: ${reservations[i].accomCd}`
          );
          continue;
        }
      } else {
        console.log(
          "prices NO is empty for reservation: " + reservations[i].accomCd
        );
        continue;
      }
      reservations[i].pricing.outgoingInvoice.handlingFee =
        parseInt(reservations[i].adults) * handlingFeeAdult +
        parseInt(reservations[i].children) * handlingFeeChild;

      reservations[i].pricing.outgoingInvoice.total =
        parseFloat(reservations[i].pricing.outgoingInvoice.cost) +
        parseFloat(reservations[i].pricing.outgoingInvoice.handlingFee);
    }

    //update reservation
    console.log(reservations[i].arrivalDate);
    console.log(reservations[i].depDate);
    let arrD = new Date(reservations[i].arrivalDate);
    let depD = new Date(reservations[i].depDate);
    const ways =
      arrD.getFullYear() === depD.getFullYear() &&
        arrD.getMonth() === depD.getMonth()
        ? 2
        : 1;

    reservations[i].pricing.ways = ways;
    reservations[i].pricing.calculated = true;
    try {
      await Reservation.findByIdAndUpdate(reservations[i]._id, reservations[i]);
      updated++;
    } catch (err) {
      errors.push(err);
    }
  }

  return res.status(200).json({
    errorArray: errors,
    errors: errors.length > 0 ? errors.length : null,
    updated: updated,
  });
};
