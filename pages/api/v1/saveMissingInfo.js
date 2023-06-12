import ReservationModel from "../../../models/ReservationModel";
import PricesModel from "../../../models/PricesModel";
import LocationsModel from "../../../models/LocationsModel";
import dbConnect from "../../../lib/dbConnect";

export default async function handler(req, res) {
    await dbConnect();
    var type = req.body.type;
    var missingObj = req.body.missingObj;
    if (!type || !missingObj) {
        return res.status(400).json({ message: "Missing type or missingObj" });
    }
    if (type === "location") {
        try {
            if (missingObj?.destination == null || missingObj?.destination == undefined || missingObj?.destination == "") {
                return res.status(400).json({ message: "Missing destination" });
            }
            let location = new LocationsModel(missingObj);
            await location.save();
        } catch (err) {
            console.log(err);
        }

    }
    if (type === "price") {
        try {
            let validFrom = new Date(missingObj.validFrom);
            let validTo = new Date(missingObj.validTo);
            missingObj.validFrom = new Date(Date.UTC(validFrom.getFullYear(), validFrom.getMonth(), validFrom.getDate(), 0, 0, 0));
            missingObj.validTo = new Date(Date.UTC(validTo.getFullYear(), validTo.getMonth(), validTo.getDate(), 23, 59, 59));
            missingObj.shared = Number(missingObj.shared);
            missingObj.private3less = Number(missingObj.private3less);
            missingObj.private3more = Number(missingObj.private3more);
            let price = new PricesModel(missingObj);
            await price.save();
        } catch (err) {
            console.log(err);
        }
    }

    if (type === 'location') {
        let resToUpdate = await ReservationModel.find({ accomCd: missingObj.code, accom: missingObj.hotel, hasLocation: false });
        let updated = 0;
        let errors = 0;
        for (let i = 0; i < resToUpdate.length; i++) {
            resToUpdate[i].billingDestination = missingObj.destination;
            try {
                resToUpdate[i].hasLocation = true;
                await resToUpdate[i].save();
                let objForSave = resToUpdate[i];
                let arrivalDate = new Date(objForSave.arrivalDate);
                arrivalDate = new Date(Date.UTC(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate(), arrivalDate.getHours(), arrivalDate.getMinutes()));
                let bookedDate = new Date(objForSave.booked);
                bookedDate = new Date(Date.UTC(bookedDate.getFullYear(), bookedDate.getMonth(), bookedDate.getDate(), bookedDate.getHours(), bookedDate.getMinutes()));
                let depDate = new Date(objForSave.depDate);
                depDate = new Date(Date.UTC(depDate.getFullYear(), depDate.getMonth(), depDate.getDate(), depDate.getHours(), depDate.getMinutes()));
                let pricesIncoming = null;
                let pricesOutgoing = null;
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
                if (objForSave.hasLocation) {
                    pricesIncoming = await PricesModel.findOne({ airport: objForSave.arrivalAirport, destination: objForSave.billingDestination, validFrom: { $lte: arrivalDate }, validTo: { $gte: arrivalDate }, type: 'incoming' }).lean();
                    pricesOutgoing = await PricesModel.findOne({ airport: objForSave.arrivalAirport, destination: objForSave.billingDestination, validFrom: { $lte: bookedDate }, validTo: { $gte: bookedDate }, type: 'outgoing' }).lean();
                }
                if (pricesIncoming) {
                    //check if objForSave arrivalDate and depDate are in the same month and year
                    if (arrivalDate.getMonth() === depDate.getMonth() && arrivalDate.getFullYear() === depDate.getFullYear()) {
                        pricing.ways = 2;
                    }
                    else {
                        pricing.ways = 1;
                    }
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
                if (pricing.incomingInvoice?.total > 0 && pricing.outgoingInvoice?.cost > 0) {
                    pricing.calculated = true;
                }
                objForSave['pricing'] = pricing;

                await objForSave.save();

                console.log('saved incoming price');
                updated++;


            } catch (err) {
                console.log(err);
                errors++;
            }
        }
        return res.status(200).json({ success: true, message: "Location saved", updated: updated, errors: errors });
    }
    if (type === 'price') {
        let resToUpdate = null;
        if (missingObj.type === 'incoming') {
            resToUpdate = await ReservationModel.find({ arrivalAirport: missingObj.airport, billingDestination: missingObj.destination, hasPricesIncoming: false });
        }
        else if (missingObj.type === 'outgoing') {
            resToUpdate = await ReservationModel.find({ arrivalAirport: missingObj.airport, billingDestination: missingObj.destination, hasPricesOutgoing: false });
        }
        else {
            return res.status(400).json({ message: "Error saving price, invalid price type" });
        }
        if (resToUpdate?.length === 0) {
            return res.status(200).json({ success: true, message: "No reservations to update" });
        }

        else {
            let updated = 0;
            let errors = 0;
            for (let i = 0; i < resToUpdate.length; i++) {
                let objForSave = resToUpdate[i];
                if (objForSave?.hasLocation) {
                    let arrivalDate = new Date(objForSave.arrivalDate);
                    arrivalDate = new Date(Date.UTC(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate(), arrivalDate.getHours(), arrivalDate.getMinutes()));
                    let bookedDate = new Date(objForSave.booked);
                    bookedDate = new Date(Date.UTC(bookedDate.getFullYear(), bookedDate.getMonth(), bookedDate.getDate(), bookedDate.getHours(), bookedDate.getMinutes()));
                    const pricesIncoming = await PricesModel.findOne({ airport: objForSave.arrivalAirport, destination: objForSave.billingDestination, validFrom: { $lte: arrivalDate }, validTo: { $gte: arrivalDate }, type: 'incoming' }).lean();
                    const pricesOutgoing = await PricesModel.findOne({ airport: objForSave.arrivalAirport, destination: objForSave.billingDestination, validFrom: { $lte: bookedDate }, validTo: { $gte: bookedDate }, type: 'outgoing' }).lean();
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
                        if (objForSave.arrivalDate.getMonth() === objForSave.depDate.getMonth() && objForSave.arrivalDate.getFullYear() === objForSave.depDate.getFullYear()) {
                            pricing.ways = 2;
                        }
                        else {
                            pricing.ways = 1;
                        }
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
                    if (pricing.incomingInvoice?.total > 0 && pricing.outgoingInvoice?.cost > 0) {
                        pricing.calculated = true;
                    }
                    objForSave['pricing'] = pricing;

                    try {
                        await objForSave.save();
                        updated++;
                        console.log('saved outgoing price')
                    }
                    catch (err) {
                        console.log(err);
                        errors++;
                    }

                }

            }
            return res.status(200).json({ success: true, message: "Prices saved", updated: updated, errors: errors });
        }
    }
}