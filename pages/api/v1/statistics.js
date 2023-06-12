import Reservation from "../../../models/ReservationModel.js";
import dbConnect from "../../../lib/dbConnect.js";

export default async function handler(req, res) {
  await dbConnect();
  const { year, month } = req.body;
  let queryLowerBound;
  let queryUpperBound;
  if (month == undefined) {
    queryLowerBound = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    queryUpperBound = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  }
  else {
    queryLowerBound = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    let lastDay = new Date(year, month, 0);
    queryUpperBound = new Date(Date.UTC(year, month - 1, lastDay.getDate(), 23, 59, 59));
  }

  const query = Reservation.aggregate([
    {
      $facet: {
        "arrivalDateReservations": [
          {
            $match: {
              arrivalDate: {
                $gte: queryLowerBound,
                $lte: queryUpperBound,
              },
              transfer: { $in: ['STR', 'PTR'] },
            },
          },
          {
            $group: groupingStage("$arrivalDate"),
          },
          sortingStage(),
        ],
        "depDateReservations": [
          {
            $match: {
              depDate: {
                $gte: queryLowerBound,
                $lte: queryUpperBound,
              },
              transfer: { $in: ['STR', 'PTR'] },
            },
          },
          {
            $group: groupingStage("$depDate"),
          },
          sortingStage(),
        ],
      },
    },
    {
      $project: {
        allReservations: {
          $setUnion: ["$arrivalDateReservations", "$depDateReservations"],
        },
      },
    },
    { $unwind: "$allReservations" },
    { $replaceRoot: { newRoot: "$allReservations" } },
  ]);

  const result = await query.exec();
  return res.status(200).json(result);
}

function groupingStage(dateField) {
  return {
    _id: {
      arrivalAirport: '$arrivalAirport',
      month: { $month: dateField },
      status: '$status',
      transfer: '$transfer',
    },
    count: { $sum: 1 },
    // for each group, sum adults and children and infants field and store in totalPassengers
    passengers: {
      $sum: {
        $add: [
          { $toInt: { $ifNull: ["$adults", 0] } },
          { $toInt: { $ifNull: ["$children", 0] } },
          { $toInt: { $ifNull: ["$infants", 0] } }
        ]
      }
    },
    adults: { $sum: '$adults' },
    children: { $sum: '$children' },
    infants: { $sum: '$infants' },
  };
}

function sortingStage() {
  return {
    $sort: {
      '_id.arrivalAirport': 1,
      '_id.month': 1,
      '_id.status': 1,
      '_id.transfer': 1,
    },
  };
}
