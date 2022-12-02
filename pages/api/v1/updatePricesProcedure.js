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
  const reservations = await Reservation.find({
    "pricing.calculated": false,
    status: { $ne: "CANCELLED" },
  }).lean();
  for (let i = 0; i < reservations.length; i++) {
    const bookingDate = new Date(reservations[i].booked);
    const isOldPricing = bookingDate < new Date("2021-09-15");
    const numOfPassangers = reservations[i].adults + reservations[i].children;
    //find location by accomCd from the reservation
    const location = locations.find(
      (location) => location.accomCd === reservations[i].accomCd
    );
    if (!location) {
      errors.push(`Location not found for accomCd: ${reservations[i].accomCd}`);
      continue;
    }

    //extract only Resort field
    const resort = location.Resort;
    //thats out new billingDestination
    if (resort == "" || resort == null) {
      console.log("resort is empty");
      console.log("skiping reservation");
      //skip this reservation
      continue;
    }
    //depending on isOldPricing use old or new prices
    reservations[i].billingDestination = resort;
    if (isOldPricing) {
      const prices = incomingOld.find(
        (price) =>
          price.Airport === reservations[i].arrivalAirport &&
          price.Destination === resort
      )
      if (prices != null || prices != undefined) {
        if (reservations[i].transfer === "STR") {
          reservations[i].pricing.incomingInvoice.total = prices["Shared"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers <= 3) {
          reservations[i].pricing.incomingInvoice.total = prices["Private<3"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers > 3) {
          reservations[i].pricing.incomingInvoice.total = prices["Private>3"];
        } else {
          console.log("transfer is empty");
          console.log("skiping reservation");
          //skip this reservation
          continue;
        }
      }
      else {
        console.log("prices is empty");
        console.log("skiping reservation");
        //skip this reservation
        continue;
      }
      const pricesOutgoing = outgoingOld.find(
        (price) =>
          price.Airport === reservations[i].arrivalAirport &&
          price.Destination === resort
      );
      if (pricesOutgoing != null || pricesOutgoing != undefined) {
        if (reservations[i].transfer === "STR") {
          reservations[i].pricing.outgoingInvoice.cost = pricesOutgoing["Shared"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers <= 3) {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Private<3"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers > 3) {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Private>3"];
        } else {
          console.log("transfer is empty");
          console.log("skiping reservation");
          //skip this reservation
          continue;
        }
      }
      else {
        console.log("pricesOutgoing is empty");
        console.log("skiping reservation");
        //skip this reservation
        continue;
      }
      reservations[i].pricing.outgoingInvoice.handlingFee =
        reservations[i].adults * handlingFeeAdult +
        reservations[i].children * handlingFeeChild;

      reservations[i].pricing.outgoingInvoice.total =
        reservations[i].pricing.outgoingInvoice.cost +
        reservations[i].pricing.outgoingInvoice.handlingFee;
    } else {
      const prices = incomingNew.find(
        (price) =>
          price.Airport === reservations[i].arrivalAirport &&
          price.Destination === resort
      );
      if (prices != null || prices != undefined) {
        if (reservations[i].transfer === "STR") {
          reservations[i].pricing.incomingInvoice.total = prices["Shared"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers <= 3) {
          reservations[i].pricing.incomingInvoice.total = prices["Private<3"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers > 3) {
          reservations[i].pricing.incomingInvoice.total = prices["Private>3"];
        } else {
          console.log("transfer is empty");
          console.log("skiping reservation");
          //skip this reservation
          continue;
        }
      }
      else {
        console.log("prices is empty");
        console.log("skiping reservation");
        //skip this reservation
        continue;
      }

      const pricesOutgoing = outgoingNew.find(
        (price) =>
          price.Airport === reservations[i].arrivalAirport &&
          price.Destination === resort
      );
      if (pricesOutgoing != null || pricesOutgoing != undefined) {
        if (reservations[i].transfer === "STR") {
          reservations[i].pricing.outgoingInvoice.cost = pricesOutgoing["Shared"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers <= 3) {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Private<3"];
        } else if (reservations[i].transfer === "PTR" && numOfPassangers > 3) {
          reservations[i].pricing.outgoingInvoice.cost =
            pricesOutgoing["Private>3"];
        } else {
          console.log("transfer is empty");
          console.log("skiping reservation");
          //skip this reservation
          continue;
        }
      }
      else {
        console.log("pricesOutgoing is empty");
        console.log("skiping reservation");
        //skip this reservation
        continue;
      }
      reservations[i].pricing.outgoingInvoice.handlingFee =
        reservations[i].adults * handlingFeeAdult +
        reservations[i].children * handlingFeeChild;

      reservations[i].pricing.outgoingInvoice.total =
        reservations[i].pricing.outgoingInvoice.cost +
        reservations[i].pricing.outgoingInvoice.handlingFee;
    }

    const ways =
      new Date(reservations[i].arrivalDate).getMonth() ===
        new Date(reservations[i].depDate).getMonth() &&
        new Date(reservations[i].arrivalDate).getFullYear() ===
        new Date(reservations[i].depDate).getFullYear()
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
    errors: errors.length > 0 ? errors.length : null,
    updated: updated,
  });
};
