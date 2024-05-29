import Reservation from "../../../models/ReservationModel.js";
import dbConnect from "../../../lib/dbConnect.js";



export default async function handler(req, res) {
  await dbConnect();
    
  // Validate input against schema (optional but recommended)
  // ...

  const { year, month } = req.body;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Construct date range queries efficiently
  const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  const query = {
    status: { $in: ["BOOKED", "AMENDED"] },
    transfer: { $in: ["STR", "PTR", "NST", "NPT"] },
  };

  if (month) {
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, month - 1, new Date(year, month, 0).getDate(), 23, 59, 59));
    query.arrivalDate = { $gte: monthStart, $lte: monthEnd };
    query.depDate = { $gte: monthStart, $lte: monthEnd };
  } else {
    query.arrivalDate = { $gte: yearStart, $lte: yearEnd };
    query.depDate = { $gte: yearStart, $lte: yearEnd };
  }

  // Fetch data with a single aggregation pipeline
  const reservations = await Reservation.aggregate([
    { $match: query },
    {
      $facet: {
        incoming: [
          { $match: { arrivalDate: { $exists: true } } },
          {
            $group: {
              _id: { airport: "$arrivalAirport", month: { $month: "$arrivalDate" } },
              booked: { $sum: { $cond: [{ $eq: ["$status", "BOOKED"] }, 1, 0] } },
              amended: { $sum: { $cond: [{ $eq: ["$status", "AMENDED"] }, 1, 0] } },
              adults: { $sum: "$adults" },
              children: { $sum: "$children" },
              infants: { $sum: "$infants" },
            },
          },
        ],
        outgoing: [
          { $match: { depDate: { $exists: true } } },
          {
            $group: {
              _id: { airport: "$arrivalAirport", month: { $month: "$depDate" } },
              booked: { $sum: { $cond: [{ $eq: ["$status", "BOOKED"] }, 1, 0] } },
              amended: { $sum: { $cond: [{ $eq: ["$status", "AMENDED"] }, 1, 0] } },
              adults: { $sum: "$adults" },
              children: { $sum: "$children" },
              infants: { $sum: "$infants" },
            },
          },
        ],
      },
    },
  ]);

  // Process and format results
  const result = { incoming: {}, outgoing: {} };

  for (const type of ["incoming", "outgoing"]) {
    reservations[0][type].forEach(item => {
      const airport = item._id.airport;
      const month = months[item._id.month - 1];

      if (!result[type][airport]) {
        result[type][airport] = {};
      }

      result[type][airport][month] = {
        booked: item.booked,
        amended: item.amended,
        adults: item.adults,
        children: item.children,
        infants: item.infants,
      };
    });
  }

  for (const type of ["incoming", "outgoing"]) {
    for (const airport in result[type]) {
      let totalTransfers = 0;
      let totalPassengers = 0;

      for (const month in result[type][airport]) {
        totalTransfers += result[type][airport][month].booked + result[type][airport][month].amended;
        totalPassengers += result[type][airport][month].adults + result[type][airport][month].children + result[type][airport][month].infants;
      }

      result[type][airport].totalTransfers = totalTransfers;
      result[type][airport].totalPassengers = totalPassengers;
    }
  }

  // Fill missing months with 0s and sort (if needed)
  for (const type of ["incoming", "outgoing"]) {
    for (const airport in result[type]) {
      for (const month of months) {
        if (!result[type][airport][month]) {
          result[type][airport][month] = {
            booked: 0,
            amended: 0,
            adults: 0,
            children: 0,
            infants: 0,
          };
        }
      }

      // Sort months alphabetically (optional, depending on requirements)
      result[type][airport] = Object.fromEntries(
        Object.entries(result[type][airport]).sort((a, b) => months.indexOf(a[0]) - months.indexOf(b[0]))
      );
    }
  }

  return res.status(200).json(result);
}