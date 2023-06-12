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
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 59, 999));
  let reservations = [];
  if (country === 'CRO') {
    reservations = await Reservation.find({
      arrivalAirport: { $in: ["ZAG", "DBV", "PUY", "SPU", "RJK", 'ZAD'] },
      depDate: { $gt: startDate, $lte: endDate },
      status: { $ne: "CANCELLED" },
      transfer: { $in: ['STR', 'PTR'] },
      "pricing.calculated": true,
    })
      .sort({ arrivalDate: 1 })
      .lean();
  }
  if (country === 'ME') {
    reservations = await Reservation.find({
      arrivalAirport: { $in: ["TGD", "TIV"] },
      arrivalDate: { $gt: startDate, $lte: endDate },
      status: { $ne: "CANCELLED" },
      transfer: { $in: ['STR', 'PTR'] },
      "pricing.calculated": true,
    })
      .sort({ arrivalDate: 1 })
      .lean();
    reservations.sort((a, b) => {
      return new Date(a.arrivalDate) - new Date(b.arrivalDate);
    });
  }
  return res.status(200).json(reservations);

};
