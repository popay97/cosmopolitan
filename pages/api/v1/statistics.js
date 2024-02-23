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
  } else {
    queryLowerBound = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    let lastDay = new Date(year, month, 0);
    queryUpperBound = new Date(Date.UTC(year, month - 1, lastDay.getDate(), 23, 59, 59));
  }

  // Helper function to add reservation data to the result object
  const addReservationData = (reservations, type) => {
    reservations.forEach(reservation => {
      const airport = type === 'incoming' ? reservation.arrivalAirport : reservation.arrivalAirport;
      const date = type === 'incoming' ? new Date(reservation.arrivalDate) : new Date(reservation.depDate);
      const month = date.toLocaleString('default', { month: 'short' });
      const status = reservation.status.toLowerCase();

      if (!result[type][airport]) {
        result[type][airport] = {};
      }
      if (!result[type][airport][month]) {
        result[type][airport][month] = { booked: 0, amended: 0, adults: 0, children: 0, infants: 0 };
      }

      result[type][airport][month][status] += 1;
      result[type][airport][month].adults += reservation.adults;
      result[type][airport][month].children += reservation.children;
      result[type][airport][month].infants += reservation.infants;
    });
  };

  const reservationsArrived = await Reservation.find({
    status: { $in: ["BOOKED", "AMENDED"] },
    transfer: { $in: ["STR", "PTR", "NST", "NPT"] },
    arrivalDate: { $gte: queryLowerBound, $lte: queryUpperBound }
  }).lean();

  const reservationsDeparted = await Reservation.find({
    status: { $in: ["BOOKED", "AMENDED"] },
    transfer: { $in: ["STR", "PTR", "NST", "NPT"] },
    depDate: { $gte: queryLowerBound, $lte: queryUpperBound }
  }).lean();

  let result = {
    incoming: {},
    outgoing: {}
  };

  // Add data for arrived reservations
  addReservationData(reservationsArrived, 'incoming');

  // Add data for departed reservations
  addReservationData(reservationsDeparted, 'outgoing');

  //fill up remaining months with 0s
  if(month == undefined) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep','Oct', 'Nov', 'Dec'];
  for (const airport in result.incoming) {
    for (const month of months) {
      if (!result.incoming[airport][month]) {
        result.incoming[airport][month] = { booked: 0, amended: 0, adults: 0, children: 0, infants: 0 };
      }
    }
  }
  for (const airport in result.outgoing) {
    for (const month of months) {
      if (!result.outgoing[airport][month]) {
        result.outgoing[airport][month] = { booked: 0, amended: 0, adults: 0, children: 0, infants: 0 };
      }
    }
  }
  //sort months
  for (const airport in result.incoming) {

    let ordered = {};
    for (const month of months) {
      ordered[month] = result.incoming[airport][month];
    }
    result.incoming[airport] = ordered;
    
  }
  for (const airport in result.outgoing) {

    let ordered = {};
    for (const month of months) {
      ordered[month] = result.outgoing[airport][month];
    }
    result.outgoing[airport] = ordered;
  }
  }
  console.log(result);


  return res.status(200).json(result);
}
