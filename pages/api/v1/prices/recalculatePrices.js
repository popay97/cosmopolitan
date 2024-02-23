import Prices from "../../../../models/PricesModel.js";
import dbConnect from "../../../../lib/dbConnect.js";
import Reservation from "../../../../models/ReservationModel.js";
import Locations from "../../../../models/LocationsModel.js";
const mongoDateToJSDate = (mongoDate) => {
    return new Date(mongoDate);
};
const processReservation = async (objForSave) => {
    if (objForSave.accomCd !== null && objForSave.resort !== null) {
        const hotelPattern = new RegExp(objForSave.resort, "i");
        var location = await Locations.findOne({
            code: objForSave.accomCd,
        });
        if(!location){
            location = await Locations.findOne({
                hotel: objForSave.resort,
            });
        }
        if (location) {
            objForSave["billingDestination"] = location.destination;
        } else {
            objForSave["hasLocation"] = false;
            objForSave["hasPricesIncoming"] = false;
            objForSave["hasPricesOutgoing"] = false;
        }
    }
    if (objForSave.hasLocation) {
        let arrivalDate = mongoDateToJSDate(objForSave.arrivalDate);
        let depDate = mongoDateToJSDate(objForSave.depDate);
        let destination = objForSave.billingDestination;
        let booked = mongoDateToJSDate(objForSave.booked);
        const pricesIncomingArrival = await Prices.findOne({
            airport: objForSave.arrivalAirport,
            destination: destination,
            validFrom: { $lte: arrivalDate },
            validTo: { $gte: arrivalDate },
            type: "incoming",
        });
        const pricesIncomingDep = await Prices.findOne({
            airport: objForSave.arrivalAirport,
            destination: destination,
            validFrom: { $lte: depDate },
            validTo: { $gte: depDate },
            type: "incoming",
        });
        const pricesOutgoingArrival = await Prices.findOne({
            airport: objForSave.arrivalAirport,
            destination: destination,
            validFrom: { $lte: booked },
            validTo: { $gte: booked },
            type: "outgoing",
        });
        const pricesOutgoingDep = await Prices.findOne({
            airport: objForSave.arrivalAirport,
            destination: destination,
            validFrom: { $lte: booked },
            validTo: { $gte: booked },
            type: "outgoing",
        });

        var pricing = {
            ways: 0,
            calculated: false,
            incomingInvoice: {
                totalw1: 0,
                totalw2: 0,
                total: 0,
            },
            outgoingInvoice: {
                cost: 0,
                handlingFee: 0,
                totalw1: 0,
                totalw2: 0,
                total: 0,
                totalWithFee: 0,
            },
        };
        if (arrivalDate.getMonth() === depDate.getMonth() && arrivalDate.getFullYear() === depDate.getFullYear()) {
            pricing.ways = 2;
        }
        else {
            pricing.ways = 1;
        }
        if (pricesIncomingArrival && pricesIncomingDep) {
            if (objForSave.transfer === 'STR') {
                pricing.incomingInvoice.totalw1 = Number((objForSave.adults * pricesIncomingArrival.shared + (objForSave.children * pricesIncomingArrival.shared * 0.5)).toFixed(3));
                pricing.incomingInvoice.totalw2 = Number((objForSave.adults * pricesIncomingDep.shared + (objForSave.children * pricesIncomingDep.shared * 0.5)).toFixed(3));
                pricing.incomingInvoice.total = Number((pricing.incomingInvoice.totalw1 + pricing.incomingInvoice.totalw2).toFixed(3));

            }
            else if (objForSave.transfer === 'PTR') {
                //just the sum of the adults and children matters
                if (objForSave.adults + objForSave.children <= 3) {
                    pricing.incomingInvoice.totalw1 = Number((pricesIncomingArrival.private3less).toFixed(3));
                    pricing.incomingInvoice.totalw2 = Number((pricesIncomingDep.private3less).toFixed(3));
                    pricing.incomingInvoice.total = Number((pricing.incomingInvoice.totalw1 + pricing.incomingInvoice.totalw2).toFixed(3));
                }
                else {
                    pricing.incomingInvoice.totalw1 = Number((pricesIncomingArrival.private3more).toFixed(3));
                    pricing.incomingInvoice.totalw2 = Number((pricesIncomingDep.private3more).toFixed(3));
                    pricing.incomingInvoice.total = Number((pricing.incomingInvoice.totalw1 + pricing.incomingInvoice.totalw2).toFixed(3));
                }
            }
            else {
                pricing.incomingInvoice.total = 0;
            }
            objForSave['hasPricesIncoming'] = true;
        }
        else {
            pricing.incomingInvoice.total = 0;
            objForSave['hasPricesIncoming'] = false;
        }
        if (pricesOutgoingArrival && pricesOutgoingDep) {
            if (objForSave.transfer === 'STR') {
                pricing.outgoingInvoice.cost = Number(pricesOutgoingArrival.shared.toFixed(3)) + Number(pricesOutgoingDep.shared.toFixed(3));
                //handling fee is 4.5 for every adult and 2.25 for every child
                pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
                pricing.outgoingInvoice.totalw1 = Number((pricesOutgoingArrival.shared * objForSave.adults + (pricesOutgoingArrival.shared * objForSave.children * 0.5)).toFixed(3));
                pricing.outgoingInvoice.totalw2 = Number((pricesOutgoingDep.shared * objForSave.adults + (pricesOutgoingDep.shared * objForSave.children * 0.5)).toFixed(3));
                pricing.outgoingInvoice.total = Number((pricing.outgoingInvoice.totalw1 + pricing.outgoingInvoice.totalw2).toFixed(3));
                pricing.outgoingInvoice.totalWithFee = pricing.ways == 2 ? Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3)) : Number((pricing.outgoingInvoice.totalw2 + pricing.outgoingInvoice.handlingFee).toFixed(3));
            }
            else if (objForSave.transfer === 'PTR') {
                //just the sum of the adults and children matters
                if (objForSave.adults + objForSave.children <= 3) {
                    pricing.outgoingInvoice.cost = Number(pricesOutgoingArrival.private3less.toFixed(3)) + Number(pricesOutgoingDep.private3less.toFixed(3));
                    pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
                    pricing.outgoingInvoice.totalw1 = Number(pricesOutgoingArrival.private3less.toFixed(3));
                    pricing.outgoingInvoice.totalw2 = Number(pricesOutgoingDep.private3less.toFixed(3));
                    pricing.outgoingInvoice.total = Number((pricing.outgoingInvoice.totalw1 + pricing.outgoingInvoice.totalw2).toFixed(3));
                    pricing.outgoingInvoice.totalWithFee = pricing.ways == 2 ? Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3)) : Number((pricing.outgoingInvoice.totalw2 + pricing.outgoingInvoice.handlingFee).toFixed(3));
                }
                else {

                    pricing.outgoingInvoice.cost = Number(pricesOutgoingArrival.private3more.toFixed(3)) + Number(pricesOutgoingDep.private3more.toFixed(3));
                    pricing.outgoingInvoice.handlingFee = Number(((objForSave.adults * 4.5) + (objForSave.children * 2.25)).toFixed(3));
                    pricing.outgoingInvoice.totalw1 = Number(pricesOutgoingArrival.private3more.toFixed(3));
                    pricing.outgoingInvoice.totalw2 = Number(pricesOutgoingDep.private3more.toFixed(3));
                    pricing.outgoingInvoice.total = Number((pricing.outgoingInvoice.totalw1 + pricing.outgoingInvoice.totalw2).toFixed(3));
                    pricing.outgoingInvoice.totalWithFee = pricing.ways == 2 ? Number((pricing.outgoingInvoice.total + pricing.outgoingInvoice.handlingFee).toFixed(3)) : Number((pricing.outgoingInvoice.totalw2 + pricing.outgoingInvoice.handlingFee).toFixed(3));
                }
            }
            else {
                pricing.outgoingInvoice.cost = 0;
                pricing.outgoingInvoice.handlingFee = 0;
                pricing.outgoingInvoice.total = 0;
                pricing.outgoingInvoice.totalWithFee = 0;
            }
            objForSave['hasPricesOutgoing'] = true;
        }
        else {
            objForSave['hasPricesOutgoing'] = false;
        }
        if (pricing.incomingInvoice.total > 0 && pricing.outgoingInvoice.total > 0) {
            pricing.calculated = true;
        }
        objForSave['pricing'] = pricing;
    }
    return objForSave;
}
export default async function handler(req, res) {
    await dbConnect();

    //update pricing.calculated of all reservations to false
    const batchSize = 200; // or any other size you find appropriate
    let reservations = [];
    const totalCount = await Reservation.countDocuments({
        status: { $in: ['BOOKED', 'AMENDED'] },
        transfer: { $in: ['STR', 'PTR', "NST", "NPT"] }
    });
    for (let i = 0; i < totalCount; i += batchSize) {
        const batch = await Reservation.find({
            status: { $in: ["BOOKED", "AMENDED"] },
            transfer: { $in: ["STR", "PTR", "NST", "NPT"] },
        })
            .skip(i)
            .limit(batchSize).lean();

        reservations = reservations.concat(batch);

        // Alternatively, process each batch here instead of accumulating in the reservations array
        // This will be more memory efficient if you can handle each batch separately
    }
    console.log("reservations length " + reservations.length);
    console.log("total count " + totalCount);
    var updated = 0;
    var errors = 0;
    for (let i = 0; i < reservations.length; i++) {
        const reservation = reservations[i];
        let objForSave = await processReservation(reservation);
        try {
            let tmp = objForSave._id;
            delete objForSave._id;
            const res = await Reservation.findOneAndUpdate(
                { _id: tmp },
                {
                    $set: {
                        ...objForSave,
                    },
                },
                { new: true }
            );
            if (res?.resId) {
                updated++;
            } else {
                errors++;
            }
        }
        catch (error) {
            console.log(error);
            errors++;
        }
    }

    return res.status(200).json({ updated: updated, errors: errors, success: true });
}
