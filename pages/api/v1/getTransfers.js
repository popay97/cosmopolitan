import Reservation from "../../../models/ReservationModel.js";

export default async (req, res) => {
  function daysToTime(days) {
    return days * 24 * 60 * 60 * 1000;
  }
  //get all outgoing or incoming transfers for a given number of days, for a specific country
  const country = req.body.country;
  const transferType = req.body.transferType; // can be "incoming" or "outgoing"
  const days = req.body.days;
  //start day is today's date at 00:00:00 and end day is today's date + days at 23:59:59
  var startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  var endTime = daysToTime(days) + startDate.getTime();
  var endDate = new Date(endTime);
  endDate.setHours(23, 59, 59, 999);
  console.log("startDate: " + startDate);
  console.log("endDate: " + endDate);
  if (transferType == "incoming" && country) {
    try {
      let reservations = [];
      if (country == "ME") {
        reservations = await Reservation.find({
          status: { $ne: "CANCELLED" },
          arrivalAirport: { $eq: "TIV" },
          arrivalDate: { $gte: startDate, $lt: endDate },
        })
          .lean()
          .sort({ arrivalDate: 1 });
      } else {
        reservations = await Reservation.find({
          status: { $ne: "CANCELLED" },
          arrivalAirport: { $ne: "TIV" },
          arrivalDate: { $gte: startDate, $lt: endDate },
        })
          .lean()
          .sort({ arrivalDate: 1 });
      }
      res.status(200).json(reservations);
    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  } else if (transferType == "outgoing" && country) {
    try {
      let reservations = [];
      if (country == "ME") {
        reservations = await Reservation.find({
          status: { $ne: "CANCELLED" },
          arrivalAirport: { $in: ["TIV", "TGD"] },
          depDate: { $gte: startDate, $lt: endDate },
        })
          .lean()
          .sort({ depDate: 1 });
      } else {
        reservations = await Reservation.find({
          status: { $ne: "CANCELLED" },
          arrivalAirport: { $ne: "TIV" },
          depDate: { $gte: startDate, $lt: endDate },
        })
          .lean()
          .sort({ depDate: 1 });
      }
      res.status(200).json(reservations);
    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  } else {
    res.status(400).json({ success: false, message: "Country not specified" });
  }
};
