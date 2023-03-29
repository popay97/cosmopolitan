import Reservations from '../../../models/ReservationModel';
import Prices from '../../../models/PricesModel';
import Locations from '../../../models/LocationsModel';
import dbConnect from '../../../lib/dbConnect';

export default async function handler(req, res) {

    await dbConnect();

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
    console.log(missingLocationSet);

    let missingPricesIncomingSet = new Set();

    const missingPrices = await Reservations.find({ hasPricesIncoming: false }).select('arrivalAirport billingDestination');
    missingPrices.forEach((item) => {
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
        });
    }
    );
    let missingPricesOutgoingSet = new Set();
    const missingPricesOutgoing = await Reservations.find({ hasPricesOutgoing: false }).select('arrivalAirport billingDestination');
    missingPricesOutgoing.forEach((item) => {
        missingPricesOutgoingSet.add({
            type: 'outgoing',
            airport: item.arrivalAirport,
            destination: item.billingDestination,
            shared: null,
            private3less: null,
            private3more: null,
            validFrom: null,
            validTo: null,
            assignedSubcontractor: null
        });
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
