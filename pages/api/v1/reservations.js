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
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const reservations = await Reservation.find({
    arrivalDate: { $gte: startDate, $lte: endDate },
    status: { $ne: "CANCELLED" },
    "pricing.calculated": true,
  })
    .sort({ arrivalDate: 1 })
    .lean();

  return res.status(200).json(reservations);
};
