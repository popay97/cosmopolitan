import Reservation from "../../../models/ReservationModel.js";

export default async (req, res) => {
  const year = req.body.year;
  const month = req.body.month;

  //return all reservations with arrival date in the selected month and year that are not cancelled and sort them by arrival date ascending

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
