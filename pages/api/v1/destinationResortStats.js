import Reservation from "../../../models/ReservationModel.js";

export default async (req, res) => {
  const destionation = req.body.destionation;
  const month = parseInt(req.body.month) - 1;
  const year = parseInt(req.body.year);
  const day = parseInt(req.body.day);
  var queryStartDate;
  var queryEndDate;
  if (destionation && month && year && day) {
    queryStartDate = new Date(year, month, day);
    queryEndDate = new Date(year, month, day + 1);
    console.log("queryStartDate: " + queryStartDate);
    console.log("queryEndDate: " + queryEndDate);
  } else if (destionation && month && year) {
    var lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    queryStartDate = new Date(year, month, 1);
    queryEndDate = new Date(year, month, lastDayOfMonth);
    console.log("queryStartDate: " + queryStartDate);
    console.log("queryEndDate: " + queryEndDate);
  } else if (destionation && year) {
    queryStartDate = new Date(year, 0, 1);
    queryEndDate = new Date(year, 11, 31);
    console.log("queryStartDate: " + queryStartDate);
    console.log("queryEndDate: " + queryEndDate);
  } else if (destionation) {
    queryStartDate = new Date(2000, 0, 1);
    queryEndDate = new Date(2100, 11, 31);
    console.log("queryStartDate: " + queryStartDate);
    console.log("queryEndDate: " + queryEndDate);
  }
  try {
    const reservations = await Reservation.find({
      arrivalAirport: destionation,
      arrivalDate: { $gte: queryStartDate, $lt: queryEndDate },
    }).lean();
    res.status(200).json(reservations);
  } catch (error) {
    res.status(400).json({ success: false });
  }
};
