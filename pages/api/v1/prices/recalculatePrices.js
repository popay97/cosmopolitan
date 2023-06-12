import Prices from '../../../../models/PricesModel.js';
import dbConnect from '../../../../lib/dbConnect.js';
import Reservation from '../../../../models/ReservationModel.js';
const mongoDateToJSDate = (mongoDate) => {
    return new Date(mongoDate)

}

export default async function handler(req, res) {
    await dbConnect();

    try {
        //update pricing.calculated of all reservations to false
        const reservations = await Reservation.find({ status: { $in: ['BOOKED', 'AMENDED'] }, transfer: { $in: ['STR', 'PTR'] } }).lean();
        var updated = 0;
        var errors = 0;
        for (let i = 0; i < reservations.length; i++) {
            var objForSave = reservations[i];
            if (objForSave.hasLocation) {
                let bookedDate = mongoDateToJSDate(objForSave.booked);
                let depDate = mongoDateToJSDate(objForSave.depDate);
                const pricesIncoming = await Prices.findOne({ airport: objForSave.arrivalAirport, destination: objForSave.billingDestination, validFrom: { $lte: depDate }, validTo: { $gte: depDate }, type: 'incoming' }).lean();
                const pricesOutgoing = await Prices.findOne({ airport: objForSave.arrivalAirport, destination: objForSave.billingDestination, validFrom: { $lte: bookedDate }, validTo: { $gte: bookedDate }, type: 'outgoing' }).lean();
                var pricing = {
                    ways: 0,
                    calculated: false,
                    incomingInvoice: {
                        total: 0,
                    },
                    outgoingInvoice: {
                        cost: 0,
                        handlingFee: 0,
                        total: 0,
                        totalWithFee: 0
                    }
                }
                if (pricesIncoming) {
                    //check if objForSave arrivalDate and depDate are in the same month and year
                    pricing.ways = 2;
                    if (objForSave.transfer === 'STR') {
                        pricing.incomingInvoice.total = Number((objForSave.adults * pricesIncoming.shared + (objForSave.children * pricesIncoming.shared * 0.5)).toFixed(3)) * pricing.ways;
                    }
                    else if (objForSave.transfer === 'PTR') {
                        //just the sum of the adults and children matters
                        if (objForSave.adults + objForSave.children <= 3) {
                            pricing.incomingInvoice.total = Number((pricesIncoming.private3less).toFixed(3)) * pricing.ways;
                        }
                        else {
                            pricing.incomingInvoice.total = Number((pricesIncoming.private3more).toFixed(3)) * pricing.ways;
                        }
                    }
                    else {
                        pricing.incomingInvoice.total = 0;
                    }
                }
                else {
                    objForSave['hasPricesIncoming'] = false;
                }
                if (pricesOutgoing) {
                    if (objForSave.transfer === 'STR') {
                        pricing.outgoingInvoice.cost = Number(pricesOutgoing.shared.toFixed(3));
                        //handling fee is 4.5 for every adult and 2.25 for every child
                        pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
                        pricing.outgoingInvoice.total = Number((pricesOutgoing.shared * objForSave.adults + (pricesOutgoing.shared * objForSave.children * 0.5)).toFixed(3)) * pricing.ways;
                        pricing.outgoingInvoice.totalWithFee = Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3));
                    }
                    else if (objForSave.transfer === 'PTR') {
                        //just the sum of the adults and children matters
                        if (objForSave.adults + objForSave.children <= 3) {
                            pricing.outgoingInvoice.cost = Number(pricesOutgoing.private3less.toFixed(3));
                            pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
                            pricing.outgoingInvoice.total = Number(pricesOutgoing.private3less.toFixed(3)) * pricing.ways;
                            pricing.outgoingInvoice.totalWithFee = Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3));
                        }
                        else {
                            pricing.outgoingInvoice.cost = Number(pricesOutgoing.private3more.toFixed(3));
                            pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
                            pricing.outgoingInvoice.total = Number(pricesOutgoing.private3more.toFixed(3)) * pricing.ways;
                            pricing.outgoingInvoice.totalWithFee = Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3));
                        }
                    }
                    else {
                        pricing.outgoingInvoice.cost = 0;
                        pricing.outgoingInvoice.handlingFee = 0;
                        pricing.outgoingInvoice.total = 0;
                        pricing.outgoingInvoice.totalWithFee = 0;
                    }
                }
                else {
                    objForSave['hasPricesOutgoing'] = false;
                }
                if (pricing.incomingInvoice.total > 0 && pricing.outgoingInvoice.cost > 0) {
                    pricing.calculated = true;
                }
            }
            try {
                let tmp = objForSave._id;
                delete objForSave._id;
                const res = await Reservation.findOneAndUpdate({ _id: tmp }, {
                    $set: {
                        pricing: pricing,
                    }
                }, { new: true });
                if (res?.resId) {
                    updated++;
                }
                else {
                    errors++;
                }

            } catch (error) {
                console.log(error);
                errors++;
            }
        }
        res.status(200).json({ updated: updated, errors: errors, success: true });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, error: errors, message: 'Something went wrong', updated: updated });
    }
}
