import Reservation from "../../../models/ReservationModel.js";
import dbConnect from "../../../lib/dbConnect.js";

export default async function handler(req, res) {
  await dbConnect();

  const { year1, year2 } = req.body;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Construct date range queries efficiently
  const yearStart1 = new Date(Date.UTC(year1, 0, 1, 0, 0, 0));
  const yearEnd1 = new Date(Date.UTC(year1, 11, 31, 23, 59, 59));
  const yearStart2 = new Date(Date.UTC(year2, 0, 1, 0, 0, 0));
  const yearEnd2 = new Date(Date.UTC(year2, 11, 31, 23, 59, 59));

  // Define common match criteria
  const matchCriteria = {
    status: { $in: ["BOOKED", "AMENDED"] },
    transfer: { $in: ["STR", "PTR", "NST", "NPT"] },
  };

  // Fetch data with a single aggregation pipeline using $facet
  const reservations = await Reservation.aggregate([
    {
      $facet: {
        year1Data: [
          { $match: { ...matchCriteria, arrivalDate: { $gte: yearStart1, $lte: yearEnd1 }, depDate: { $gte: yearStart1, $lte: yearEnd1 } } },
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
        year2Data: [
          { $match: { ...matchCriteria, arrivalDate: { $gte: yearStart2, $lte: yearEnd2 }, depDate: { $gte: yearStart2, $lte: yearEnd2 } } },
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
      },
    },
  ]);

  // Process and format results
  const result = { incoming: {}, outgoing: {} };

  for (const type of ["incoming", "outgoing"]) { // 'incoming' and 'outgoing' are assumed based on the original code
    for (const yearData of ["year1Data", "year2Data"]) {
      reservations[0][yearData].forEach(item => {
        const airport = item._id.airport;
        const month = months[item._id.month - 1];
        const year = yearData === "year1Data" ? year1 : year2;

        if (!result[type][airport]) {
          result[type][airport] = {};
        }

        if (!result[type][airport][month]) {
          result[type][airport][month] = {};
        }

        result[type][airport][month][year] = {
          booked: item.booked,
          amended: item.amended,
          adults: item.adults,
          children: item.children,
          infants: item.infants,
        };
      });
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
                totalTransfers: {
                [year1]: 0,
                [year2]: 0,
                percentChange: "N/A",
                },
                totalPassengers: {
                [year1]: 0,
                [year2]: 0,
                percentChange: "N/A",
                },
            };
            }
        }
        }
    }
  // Calculate totals and percent changes
  for (const type of ["incoming", "outgoing"]) {
    for (const airport in result[type]) {
      for (const month in result[type][airport]) {
        const year1Data = result[type][airport][month][year1] || { booked: 0, amended: 0, adults: 0, children: 0, infants: 0, totalTransfers: {
            [year1]: 0,
            [year2]: 0,
            percentChange: "N/A",
            }, totalPassengers: {
            [year1]: 0,
            [year2]: 0,
            percentChange: "N/A",
        }};
        const year2Data = result[type][airport][month][year2] || { booked: 0, amended: 0, adults: 0, children: 0, infants: 0, totalTransfers: {
            [year1]: 0,
            [year2]: 0,
            percentChange: "N/A",
            }, totalPassengers: {
            [year1]: 0,
            [year2]: 0,
            percentChange: "N/A",
        }};

        const totalTransfersYear1 = year1Data.booked + year1Data.amended;
        const totalTransfersYear2 = year2Data.booked + year2Data.amended;
        const totalPassengersYear1 = year1Data.adults + year1Data.children + year1Data.infants; 
        const totalPassengersYear2 = year2Data.adults + year2Data.children + year2Data.infants; 

        const percentChangeTransfers = 
          totalTransfersYear1 === 0 ? 
          "N/A" : 
          ((totalTransfersYear2 - totalTransfersYear1) / totalTransfersYear1 * 100).toFixed(1) + "%"; 
        
        const percentChangePassengers = 
          totalPassengersYear1 === 0 ? 
          "N/A" : 
          ((totalPassengersYear2 - totalPassengersYear1) / totalPassengersYear1 * 100).toFixed(1) + "%";
 
        result[type][airport][month].totalTransfers = { 
          [year1]: totalTransfersYear1, 
          [year2]: totalTransfersYear2, 
          percentChange: percentChangeTransfers, 
        };
        result[type][airport][month].totalPassengers = {
          [year1]: totalPassengersYear1,
          [year2]: totalPassengersYear2,
          percentChange: percentChangePassengers,
        };
      }
      // Calculate totals for the year for each airport and avoid empty months
      
        let totalTransfers= {
            [year1]: 0,
            [year2]: 0,
            percentChange: "N/A",
            };
        
        let totalPassengers = {
            [year1]: 0,
            [year2]: 0,
            percentChange: "N/A",
            };

        for (const month in result[type][airport]) {
            totalTransfers[year1] += result[type][airport][month].totalTransfers[year1];
            totalTransfers[year2] += result[type][airport][month].totalTransfers[year2];
            totalPassengers[year1] += result[type][airport][month].totalPassengers[year1];
            totalPassengers[year2] += result[type][airport][month].totalPassengers[year2];
        }

        const percentChangeTransfers = 
          totalTransfers[year1] === 0 ? 
          "N/A" : 
          ((totalTransfers[year2] - totalTransfers[year1]) / totalTransfers[year1] * 100).toFixed(1) + "%";

        const percentChangePassengers =
            totalPassengers[year1] === 0 ?
            "N/A" :
            ((totalPassengers[year2] - totalPassengers[year1]) / totalPassengers[year1] * 100).toFixed(1) + "%";

        result[type][airport].totalTransfers = totalTransfers;
        result[type][airport].totalPassengers = totalPassengers;

        result[type][airport].totalTransfers.percentChange = percentChangeTransfers;

        result[type][airport].totalPassengers.percentChange = percentChangePassengers;


    }
  }
  //sort the months in the natural order
    for (const type of ["incoming", "outgoing"]) {
        for (const airport in result[type]) {
        const sortedResult = {};
        Object.keys(result[type][airport]).sort((a, b) => months.indexOf(a) - months.indexOf(b)).forEach(key => {
            sortedResult[key] = result[type][airport][key];
        });
        result[type][airport] = sortedResult;
        }
    }

  return res.status(200).json(result);
}