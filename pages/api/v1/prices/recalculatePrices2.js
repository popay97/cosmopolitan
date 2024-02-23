import Prices from "../../../../models/PricesModel.js";
import dbConnect from "../../../../lib/dbConnect.js";
import Reservation from "../../../../models/ReservationModel.js";
import Locations from "../../../../models/LocationsModel.js";


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
    let totalw1 = 0, totalw2 = 0, total = 0, cost = 0;

    if (transferType === 'STR') {
        totalw1 = (adults * priceDetails.arrival.shared + children * priceDetails.arrival.shared * 0.5).toFixed(3);
        totalw2 = (adults * priceDetails.departure.shared + children * priceDetails.departure.shared * 0.5).toFixed(3);
        cost = priceDetails.departure.shared;
    } else if (transferType === 'PTR') {
        const rateType = adults + children <= 3 ? 'private3less' : 'private3more';
        totalw1 = priceDetails.arrival[rateType].toFixed(3);
        totalw2 = priceDetails.departure[rateType].toFixed(3);
        cost = priceDetails.departure[rateType];
    }

    total = isRoundTrip ? Number(totalw1) + Number(totalw2) : Number(totalw2);
    return { totalw1, totalw2, total, cost };
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

    const incomingInvoice = hasPricesIncoming ? calculateInvoice(reservation.transfer, incomingPriceDetails, passengerCount, isRoundTrip) : { totalw1: 0, totalw2: 0, total: 0, cost: 0 };
    const outgoingInvoice = hasPricesOutgoing ? calculateInvoice(reservation.transfer, outgoingPriceDetails, passengerCount, isRoundTrip) : { totalw1: 0, totalw2: 0, total: 0, cost: 0 };

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
        let {_id, ...updateData} = objForSave;
        const res = await Reservation.findOneAndUpdate(
            { _id: _id },
            { $set: updateData },
            { new: true }
        );
        return res?.resId ? 'updated' : 'error';
    } catch (error) {
        console.error(error);
        return 'error';
    }
};

const processBatch = async (batch) => {
    const results = await eachLimit(batch, 10, async (reservation) => {
        return processAndSaveReservation(reservation);
    });
    const updatedCount = results.filter(result => result === 'updated').length;
    const errorsCount = results.filter(result => result === 'error').length;
    return { updatedCount, errorsCount };
};

export default async function handler(req, res) {
    await dbConnect();

    //update pricing.calculated of all reservations to false
    const batchSize = 200; // Adjust as appropriate
    let totalCount = await Reservation.countDocuments({
        status: { $in: ['BOOKED', 'AMENDED'] },
        transfer: { $in: ['STR', 'PTR', "NST", "NPT"] }
    });

    let totalUpdated = 0;
    let totalErrors = 0;

    for (let i = 0; i < totalCount; i += batchSize) {
        const batch = await Reservation.find({
            status: { $in: ["BOOKED", "AMENDED"] },
            transfer: { $in: ["STR", "PTR", "NST", "NPT"] },
        }).skip(i).limit(batchSize).lean();
        console.log("Processing batch", i, "to", i + batchSize - 1);
        const { updatedCount, errorsCount } = await processBatch(batch);
        totalUpdated += updatedCount;
        totalErrors += errorsCount;
        console.log("Updated bat:", updatedCount, "Errors bat:", errorsCount);

    }

    console.log("Total Updated:", totalUpdated, "Total Errors:", totalErrors);
    return res.status(200).json({ updated: totalUpdated, errors: totalErrors, success: true });
}
