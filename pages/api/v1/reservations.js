import Reservation from "../../../models/ReservationModel.js";

export default async (req, res) => {
  const year = req.body.year;
  const month = req.body.month;
  const country = req.body.country;

  if (year == null || month == null) {
    res.status(400).json({ message: "Please select a year and month" });
    return;
  }
  if (month < 1 || month > 12) {
    res.status(400).json({ message: "Please select a valid month" });
    return;
  }
  if (country == null) {
    res.status(400).json({ message: "Please select a country" });
    return;
  }
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 59, 999);
  let reservations = [];
  let reservations2 = [];
  if (country === 'CRO') {
    reservations = await Reservation.find({
      arrivalAirport: { $in: ["ZAG", "DBV", "PUY", "SPU", "RJK"] },
      arrivalDate: { $gt: startDate, $lte: endDate },
      status: { $ne: "CANCELLED" },
      "pricing.calculated": true,
    })
      .sort({ arrivalDate: 1 })
      .lean();
    //include reservations that have arrived one month prior to the selected month but will leave in the selected month
    reservations2 = await Reservation.find({
      arrivalAirport: { $in: ["ZAG", "DBV", "PUY", "SPU", "RJK"] },
      arrivalDate: { $lte: startDate },
      depDate: { $gte: startDate, $lt: endDate },
      status: { $ne: "CANCELLED" },
      "pricing.calculated": true,
    })
      .sort({ arrivalDate: 1 })
      .lean();
  }
  if (country === 'ME') {
    reservations = await Reservation.find({
      arrivalAirport: { $in: ["TGD", "TIV"] },
      arrivalDate: { $gte: startDate, $lt: endDate },
      status: { $ne: "CANCELLED" },
      "pricing.calculated": true,
    })
      .sort({ arrivalDate: 1 })
      .lean();
    //include reservations that have arrived one month prior to the selected month but will leave in the selected month
    reservations2 = await Reservation.find({
      arrivalAirport: { $in: ["TGD", "TIV"] },
      arrivalDate: { $lt: startDate },
      depDate: { $gte: startDate, $lt: endDate },
      status: { $ne: "CANCELLED" },
      "pricing.calculated": true,
    })
      .sort({ arrivalDate: 1 })
      .lean();
  }
  reservations.push(...reservations2)
  reservations.sort((a, b) => {
    return new Date(a.arrivalDate) - new Date(b.arrivalDate);
  });

  return res.status(200).json(reservations);
};
