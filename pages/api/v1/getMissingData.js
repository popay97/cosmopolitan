import Reservations from '../../../models/ReservationModel';
import Prices from '../../../models/PricesModel';
import Locations from '../../../models/LocationsModel';
import dbConnect from '../../../lib/dbConnect';


const findUniqueDateBrackets = async () => {
  const brackets = await Prices.aggregate([
    {
      $group: {
        _id: { validFrom: "$validFrom", validTo: "$validTo" },
      },
    },
    {
      $project: {
        _id: 0,
        validFrom: "$_id.validFrom",
        validTo: "$_id.validTo",
      },
    },
  ]);
  return brackets.map(bracket => ({ validFrom: new Date(bracket.validFrom), validTo: new Date(bracket.validTo) }));
};
export default async function handler(req, res) {

  await dbConnect();
  try {
    // Start all queries in parallel
    const [missingLocations, dateBrackets, missingOutgoingPrices, missingIncomingPrices] = await Promise.all([
      // Query for reservations with missing location data
      Reservations.find({ hasLocation: false, transfer: { $in: ['PTR', 'STR'] }, status: { $ne: "CANCELLED" } }).select('accomCd arrivalAirport accom -_id'),

      // Query for unique date brackets from prices
      findUniqueDateBrackets(),

      // Query for reservations with missing outgoing prices
      Reservations.find({ hasPricesOutgoing: false, transfer: { $in: ['PTR', 'STR'] }, status: { $ne: "CANCELLED" }, hasLocation: true }).select('booked billingDestination arrivalAirport -_id'),

      // Query for reservations with missing incoming prices
      Reservations.find({ hasPricesIncoming: false, transfer: { $in: ['PTR', 'STR'] }, status: { $ne: "CANCELLED" }, hasLocation: true }).select('arrivalDate depDate billingDestination arrivalAirport -_id'),
    ]);

    // Process missing locations to add to response
    const processedMissingLocations = missingLocations.map(reservation => ({
      code: reservation.accomCd,
      hotel: reservation.accom,
      destination: '' // to be filled in the UI
    }));
    // Helper function to check if a value is a valid date
    const isValidDate = (date) => date instanceof Date && !isNaN(date.valueOf());

    // Helper function to parse and validate the reference date
    const parseReferenceDate = (referenceDate, type) => {
      if (type === 'outgoing') {
        const parsedDate = new Date(referenceDate);
        return isValidDate(parsedDate) ? parsedDate.getTime() : null;
      } else {
        const arrival = new Date(referenceDate.arrival);
        const departure = new Date(referenceDate.departure);
        if (isValidDate(arrival) && isValidDate(departure)) {
          return { min: Math.min(arrival, departure), max: Math.max(arrival, departure) };
        }
        return null;
      }
    };
    // Process missing prices to add to response
    const processMissingPrices = (type, reservations, brackets) => {
      return reservations.map(reservation => {
        const datesToCheck = type === 'outgoing' ? [new Date(reservation.booked)] : [new Date(reservation.arrivalDate), new Date(reservation.depDate)];
        const priceObjects = [];

        datesToCheck.forEach(date => {
          const bracket = brackets.find(bracket => date >= bracket.validFrom && date <= bracket.validTo);
          if (bracket) {
            priceObjects.push({
              airport: reservation.arrivalAirport, // Assuming arrivalAirport is used for price lookup
              destination: reservation.billingDestination, // To be filled in the UI
              shared: null,
              private3less: null,
              private3more: null,
              validFrom: bracket.validFrom,
              validTo: bracket.validTo,
              type: type
            });
          }
        });

        if (priceObjects.length === 0) {
          // If no brackets found, return an empty price object
          priceObjects.push({
            airport: reservation.arrivalAirport,
            destination: reservation.billingDestination,
            shared: null,
            private3less: null,
            private3more: null,
            validFrom: null, // Empty dates for the UI to fill
            validTo: null,
            type: type,
            referenceDate: type === 'outgoing' ? new Date(reservation.booked) : { arrival: new Date(reservation.arrivalDate), departure: new Date(reservation.depDate) }
          });
        }

        return priceObjects;
      }).flat(); // Flatten the array of price objects
    };
    const consolidatePrices = (prices) => {
      const uniquePricesMap = prices.reduce((acc, price) => {
        if (!price.referenceDate && price.validFrom && price.validTo) {
          // Do not touch prices with their brackets set and no referenceDate
          const priceKey = `${price.airport}-${price.destination}-${price.shared}-${price.private3less}-${price.private3more}-${price.validFrom}-${price.validTo}-${price.type}`;
          acc[priceKey] = { ...price, count: (acc[priceKey]?.count || 0) + 1 };
          return acc;
        }
        // Create a unique key for the price object to use for matching
        const priceKey = `${price.airport}-${price.destination}-${price.shared}-${price.private3less}-${price.private3more}-${price.validFrom}-${price.validTo}-${price.type}`;

        let minDate, maxDate;

        if (price.type === 'outgoing') {
          // Outgoing prices have a single reference date
          minDate = maxDate = new Date(price.referenceDate).getTime();
        } else {
          // Incoming prices have an object with "arrival" and "departure" dates
          minDate = Math.min(new Date(price.referenceDate.arrival).getTime(), new Date(price.referenceDate.departure).getTime());
          maxDate = Math.max(new Date(price.referenceDate.arrival).getTime(), new Date(price.referenceDate.departure).getTime());

        }
        if (!minDate || !maxDate) return acc;
        if (!acc[priceKey]) {
          // If this key hasn't been seen before, add it with the current price object
          acc[priceKey] = {
            ...price,
            minReferenceDate: minDate,
            maxReferenceDate: maxDate,
            count: 1
          };
        } else {
          // If the key exists, update min/max reference dates and increment count
          acc[priceKey].minReferenceDate = Math.min(acc[priceKey].minReferenceDate, minDate);
          acc[priceKey].maxReferenceDate = Math.max(acc[priceKey].maxReferenceDate, maxDate);
          acc[priceKey].count += 1;
        }

        return acc;
      }, {});

      // Convert the map back into an array and adjust date formats
      return Object.values(uniquePricesMap).map(price => {
        // Convert timestamps back to date strings
        if(price.minReferenceDate && price.maxReferenceDate){
        price.minReferenceDate = new Date(price.minReferenceDate).toISOString().split('T')[0];
        price.maxReferenceDate = new Date(price.maxReferenceDate).toISOString().split('T')[0];
        }

        delete price.referenceDate; // Remove the original referenceDate field
        return price;
      });
    };


    const processedMissingOutgoingPrices = processMissingPrices('outgoing', missingOutgoingPrices, dateBrackets);
    const processedMissingIncomingPrices = processMissingPrices('incoming', missingIncomingPrices, dateBrackets);
    //remove duplicates by set -> array
    var uniqueProcessedMissingIncomingPrices = [...new Set(processedMissingIncomingPrices.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
    var uniqueProcessedMissingOutgoingPrices = [...new Set(processedMissingOutgoingPrices.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
    var uniqueProcessedMissingLocations = [...new Set(processedMissingLocations.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
    // unify prices that are the same except for the referenceDate field and make the referenceDate field an array of dates for outgoing prices and an object with arrival and departure dates for incoming prices
    uniqueProcessedMissingIncomingPrices = consolidatePrices(uniqueProcessedMissingIncomingPrices);
    uniqueProcessedMissingOutgoingPrices = consolidatePrices(uniqueProcessedMissingOutgoingPrices);
    // Send the missing data back to the client
    return res.status(200).json({
      missingLocations: uniqueProcessedMissingLocations,
      missingPricesOutgoing: uniqueProcessedMissingOutgoingPrices,
      missingPricesIncoming: uniqueProcessedMissingIncomingPrices
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
