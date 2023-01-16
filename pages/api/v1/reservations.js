import Reservation from "../../../models/ReservationModel.js";

export default async (req, res) => {
  const year = req.body.year;
  const month = req.body.month;

  if (year == null || month == null) {
    res.status(400).json({ message: "Please select a year and month" });
    return;
  }
  if (month < 1 || month > 12) {
    res.status(400).json({ message: "Please select a valid month" });
    return;
  }
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 59, 999);

  const reservations = await Reservation.find({
    arrivalDate: { $gt: startDate, $lte: endDate },
    status: { $ne: "CANCELLED" },
    "pricing.calculated": true,
  })
    .sort({ arrivalDate: 1 })
    .lean();
  //include reservations that have arrived one month prior to the selected month but will leave in the selected month
  const reservations2 = await Reservation.find({
    arrivalDate: { $lte: startDate },
    depDate: { $gt: startDate, $lte: endDate },
    status: { $ne: "CANCELLED" },
    "pricing.calculated": true,
  })
    .sort({ arrivalDate: 1 })
    .lean();
  reservations.push(...reservations2)
  reservations.sort((a, b) => {
    return new Date(a.arrivalDate) - new Date(b.arrivalDate);
  });

  return res.status(200).json(reservations);
};
