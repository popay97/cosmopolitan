import Reservations from '../../../models/ReservationModel';
import Prices from '../../../models/PricesModel';
import Locations from '../../../models/LocationsModel';
import dbConnect from '../../../lib/dbConnect';

export default async function handler(req, res) {

    await dbConnect();
    //first extract all unique combinations of validFrom and validTo from prices
    let uniquePrices = new Set();
    const prices = await Prices.find({}).select('validFrom validTo');
    prices.forEach((item) => {
        uniquePrices.add({
            validFrom: item.validFrom,
            validTo: item.validTo,
        });
    }
    );
    //a set will not will eliminate duplicates only if data type is not an object
    //so we need to convert it to an array
    let uniquePricesArray = Array.from(uniquePrices);
    //then we need to convert it back to a set to eliminate duplicates
    uniquePricesArray = [...new Set(uniquePricesArray.map(JSON.stringify))].map(JSON.parse);
    let missingLocationSet = new Set();
    const missingLocation = await Reservations.find({ hasLocation: false }).select('accom accomCd');
    missingLocation.forEach((item) => {
        missingLocationSet.add({
            code: item.accomCd,
            hotel: item.accom,
            destination: null,
        });
    }
    );

    let missingPricesIncomingSet = new Set();

    const missingPrices = await Reservations.find({ hasPricesIncoming: false }).select('arrivalAirport billingDestination arrivalDate');
    missingPrices.forEach((item) => {

        uniquePricesArray.forEach((price) => {
            if (new Date(item.arrivalDate).getTime() >= new Date(price.validFrom).getTime() && new Date(item.arrivalDate).getTime() <= new Date(price.validTo).getTime()) {
                missingPricesIncomingSet.add({
                    type: 'incoming',
                    airport: item.arrivalAirport,
                    destination: item.billingDestination,
                    shared: null,
                    private3less: null,
                    private3more: null,
                    validFrom: price.validFrom,
                    validTo: price.validTo,
                    assignedSubcontractor: null,
                });
            }
        });

        /*  
         missingPricesIncomingSet.add({
             type: 'incoming',
             airport: item.arrivalAirport,
             destination: item.billingDestination,
             shared: null,
             private3less: null,
             private3more: null, 
             validFrom: null,
             validTo: null,
             assignedSubcontractor: null,
         }); */
    }
    );
    let missingPricesOutgoingSet = new Set();
    const missingPricesOutgoing = await Reservations.find({ hasPricesOutgoing: false }).select('arrivalAirport billingDestination booked');
    missingPricesOutgoing.forEach((item) => {
        uniquePricesArray.forEach((price) => {
            if (new Date(item.booked).getTime() >= new Date(price.validFrom).getTime() && new Date(item.booked).getTime() <= new Date(price.validTo).getTime()) {
                missingPricesOutgoingSet.add({
                    type: 'outgoing',
                    airport: item.arrivalAirport,
                    destination: item.billingDestination,
                    shared: null,
                    private3less: null,
                    private3more: null,
                    validFrom: price.validFrom,
                    validTo: price.validTo,
                    assignedSubcontractor: null
                });

            }
        });

        /*  missingPricesOutgoingSet.add({
             type: 'outgoing',
             airport: item.arrivalAirport,
             destination: item.billingDestination,
             shared: null,
             private3less: null,
             private3more: null,
             validFrom: null,
             validTo: null,
             assignedSubcontractor: null
         }); */
    });

    const missingFields = await Reservations.find({ hasEmptyFields: true }).lean();
    var missingLocationArray = Array.from(missingLocationSet);
    var missingPricesIncomingArray = Array.from(missingPricesIncomingSet);
    var missingPricesOutgoingArray = Array.from(missingPricesOutgoingSet);
    missingLocationArray = [...new Set(missingLocationArray.map(JSON.stringify))].map(JSON.parse);
    missingPricesIncomingArray = [...new Set(missingPricesIncomingArray.map(JSON.stringify))].map(JSON.parse);
    missingPricesOutgoingArray = [...new Set(missingPricesOutgoingArray.map(JSON.stringify))].map(JSON.parse);

    return res.status(200).json({
        missingLocations: missingLocationArray,
        missingPricesIncoming: missingPricesIncomingArray,
        missingPricesOutgoing: missingPricesOutgoingArray,
        missingFields: missingFields
    });
}
