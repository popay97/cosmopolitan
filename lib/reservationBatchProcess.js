import Prices from "../models/PricesModel.js";
import dbConnect from "../lib/dbConnect.js";
import Reservation from "../models/ReservationModel.js";
import Locations from "../models/LocationsModel.js";


async function runner(items, fn) {
    const results = [];
    while (items.length > 0) {
        const item = items.pop();
        const result = await fn(item);
        results.push(result);
    }
    return results;
}

async function eachLimit(items, limit, fn) {
    const runners = [];
    const splitItems = [];

    // Split items into chunks
    for (let i = 0; i < items.length; i += limit) {
        splitItems.push(items.slice(i, i + limit));
    }

    // Create runner for each chunk
    for (const chunk of splitItems) {
        runners.push(runner(chunk, fn));
    }

    // Collect results from all runners
    const results = await Promise.all(runners);
    return results.flat(); // Flatten the array of results
}

const mongoDateToJSDate = (mongoDate) => new Date(mongoDate);

const calculateInvoice = (transferType, priceDetails, passengerCount, isRoundTrip) => {
    const { adults, children } = passengerCount;
    let totalw1 = 0, totalw2 = 0, total = 0;

    if (transferType === 'STR') {
        totalw1 = Number(((adults * priceDetails.arrival.shared) + (children * priceDetails.arrival.shared * 0.5)).toFixed(3));
        totalw2 = Number(((adults * priceDetails.departure.shared) + (children * priceDetails.departure.shared * 0.5)).toFixed(3));
    } else if (transferType === 'PTR') {
        const rateType = adults + children <= 3 ? 'private3less' : 'private3more';
        totalw1 = Number(priceDetails.arrival[rateType].toFixed(3));
        totalw2 = Number(priceDetails.departure[rateType].toFixed(3));
    }

    total = Number((totalw1 + totalw2).toFixed(3));
    return { totalw1, totalw2, total };
};

const processReservation = async (reservation) => {
    if (!reservation.accomCd || !reservation.resort) {
        return { ...reservation, hasLocation: false, hasPricesIncoming: false, hasPricesOutgoing: false };
    }

    let location = await Locations.findOne({ code: reservation.accomCd }) || await Locations.findOne({ hotel: reservation.resort });
    if (!location) {
        return { ...reservation, hasLocation: false, hasPricesIncoming: false, hasPricesOutgoing: false, billingDestination: ''};
    }

    reservation.billingDestination = location.destination;
    const arrivalDate = mongoDateToJSDate(reservation.arrivalDate);
    const depDate = mongoDateToJSDate(reservation.depDate);
    const booked = mongoDateToJSDate(reservation.booked);
    const isRoundTrip = arrivalDate.getMonth() === depDate.getMonth() && arrivalDate.getFullYear() === depDate.getFullYear();

    const [pricesIncomingArrival, pricesIncomingDep, pricesOutgoingArrival, pricesOutgoingDep] = await Promise.all([
        Prices.findOne({ airport: reservation.arrivalAirport, destination: reservation.billingDestination, validFrom: { $lte: arrivalDate }, validTo: { $gte: arrivalDate }, type: "incoming" }),
        Prices.findOne({ airport: reservation.arrivalAirport, destination: reservation.billingDestination, validFrom: { $lte: depDate }, validTo: { $gte: depDate }, type: "incoming" }),
        Prices.findOne({ airport: reservation.arrivalAirport, destination: reservation.billingDestination, validFrom: { $lte: booked }, validTo: { $gte: booked }, type: "outgoing" }),
        Prices.findOne({ airport: reservation.arrivalAirport, destination: reservation.billingDestination, validFrom: { $lte: booked }, validTo: { $gte: booked }, type: "outgoing" })
    ]);
     // Check if prices are available
     const hasPricesIncoming = !!pricesIncomingArrival && !!pricesIncomingDep;
     const hasPricesOutgoing = !!pricesOutgoingArrival && !!pricesOutgoingDep;
 
     // If no prices are available, update reservation accordingly
     if (!hasPricesIncoming && !hasPricesOutgoing) {
         return { ...reservation, hasPricesIncoming, hasPricesOutgoing, pricing: { calculated: false }, hasLocation: true};
     }

    const passengerCount = { adults: reservation.adults, children: reservation.children };
    const incomingPriceDetails = { arrival: pricesIncomingArrival, departure: pricesIncomingDep };
    const outgoingPriceDetails = { arrival: pricesOutgoingArrival, departure: pricesOutgoingDep };

    const incomingInvoice = hasPricesIncoming ? calculateInvoice(reservation.transfer, incomingPriceDetails, passengerCount, isRoundTrip) : { totalw1: 0, totalw2: 0, total: 0 };
    const outgoingInvoice = hasPricesOutgoing ? calculateInvoice(reservation.transfer, outgoingPriceDetails, passengerCount, isRoundTrip) : { totalw1: 0, totalw2: 0, total: 0 };

    // Calculate handling fee for outgoing invoice
    outgoingInvoice.handlingFee = ((reservation.adults * 4.5) + (reservation.children * 2.25)).toFixed(3);
    outgoingInvoice.totalWithFee = (Number(outgoingInvoice.total) + Number(outgoingInvoice.handlingFee)).toFixed(3);

    reservation.pricing = {
        ways: isRoundTrip ? 2 : 1,
        calculated: incomingInvoice.total > 0 && outgoingInvoice.total > 0,
        incomingInvoice,
        outgoingInvoice
    };

    reservation.hasPricesIncoming = !!pricesIncomingArrival && !!pricesIncomingDep;
    reservation.hasPricesOutgoing = !!pricesOutgoingArrival && !!pricesOutgoingDep;
    reservation.hasLocation = true;
    return reservation;
};

const processAndSaveReservation = async (reservation) => {
    try {
        let objForSave = await processReservation(reservation);
        console.log('reservation processed', objForSave);
        let { _id, ...updateData } = objForSave;
        const res = await Reservation.findOneAndUpdate(
            { _id: _id },
            { $set: updateData },
            { new: true }
        );
        console.log('reservation saved', res);
        return res?.resId ? 'updated' : 'error';
    } catch (error) {
        console.error(error);
        return 'error';
    }
};

const processBatch = async (batch) => {
    await dbConnect();
    console.log("batch length", batch.length);
    console.log("starting batch processing");
    const results = await eachLimit(batch, 10, async (reservation) => {
        return processAndSaveReservation(reservation);
    });
    const updatedCount = results.filter(result => result === 'updated').length;
    const errorsCount = results.filter(result => result === 'error').length;
    return { updatedCount, errorsCount };
};

const processSingleReservation = async (resId) => {
    try {
        await dbConnect();

        // Find the reservation by resId
        const reservation = await Reservation.findOne({ resId });

        if (!reservation) {
            console.log(`Reservation with resId ${resId} not found`);
            return 'not found';
        }

        // Process and save the reservation
        const result = await processAndSaveReservation(reservation);

        return result;
    } catch (error) {
        console.error(error);
        return 'error';
    }
};

module.exports = {processBatch, processSingleReservation };