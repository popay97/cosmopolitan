import Reservation from "../../../models/ReservationModel.js";
import mongoose from "mongoose";
import dbConnect from "../../../lib/dbConnect.js";
export default async (req, res) => {
  //connect to database
  await dbConnect();
  //update all documents in the database pricing.calculated to false
  await Reservation.updateMany(
    { "pricing.calculated": true },
    { $set: { "pricing.calculated": false } }
  );

}