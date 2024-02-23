import Reservation from "../../../models/ReservationModel.js";
//razdvoji booked amended cancelled
export default async (req, res) => {
  const destionation =
    req.body.destionation == "select" || req.body.destionation == undefined
      ? null
      : req.body.destionation;
  const month =
    parseInt(req.body.month) - 1 >= 0 && parseInt(req.body.month) - 1 <= 11
      ? parseInt(req.body.month) - 1
      : null;
  const year =
    parseInt(req.body.year) > 2000 && parseInt(req.body.year) < 2100
      ? parseInt(req.body.year)
      : null;
  const day =
    parseInt(req.body.day) > 0 && parseInt(req.body.day) < 32
      ? parseInt(req.body.day)
      : null;
  var queryStartDate;
  var queryEndDate;
  if (destionation && month && year && day) {
    queryStartDate = new Date(year, month, day);
    queryEndDate = new Date(year, month, day + 1);
  } else if (destionation && month && year) {
    var lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    queryStartDate = new Date(year, month, 1);
    queryEndDate = new Date(year, month, lastDayOfMonth, 23, 59);
  } else if (destionation && year) {
    //if only the year is provided, then it should return data for each month separately
    //write the code here and return the data
    var reservationsArray = [];
    for (var i = 0; i < 12; i++) {
      var lastDayOfMonth = new Date(year, i + 1, 0).getDate();
      queryStartDate = new Date(year, i, 1);
      queryEndDate = new Date(year, i, lastDayOfMonth, 23, 59);
      const reservations = await Reservation.find({
        arrivalAirport: destionation,
        status: { $in: ["BOOKED", "AMENDED"] },
        billingDestination: { $ne: null },
        arrivalDate: { $gte: queryStartDate, $lt: queryEndDate },
      }).lean();
      reservationsArray.push(reservations);
    }
    return res.status(200).json({ reservationsArray, yearOnly: true });
  } else if (destionation) {
    queryStartDate = new Date(2000, 0, 1);
    queryEndDate = new Date(2100, 11, 31);
  }

  try {
    const reservations = await Reservation.find({
      arrivalAirport: destionation,
      status: { $in: ["BOOKED", "AMENDED"] },
      billingDestination: { $ne: null },
      arrivalDate: { $gte: queryStartDate, $lt: queryEndDate },
    }).lean();
    return res.status(200).json({ reservations, yearOnly: false });
  } catch (error) {
    return res.status(400).json({ success: false });
  }
};
