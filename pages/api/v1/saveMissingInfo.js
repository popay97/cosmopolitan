import ReservationModel from "../../../models/ReservationModel";
import PricesModel from "../../../models/PricesModel";
import LocationsModel from "../../../models/LocationsModel";
import dbConnect from "../../../lib/dbConnect";
import {processBatch} from "../../../lib/reservationBatchProcess";

export default async function handler(req, res) {
    await dbConnect();
    var type = req.body.type;
    var missingObj = req.body.missingObj;
    if (!type || !missingObj) {
        return res.status(400).json({ message: "Missing type or missingObj" });
    }
    console.log("type", type);
    console.log("missingObj", missingObj);
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
        let resToUpdate = await ReservationModel.find({ accomCd: missingObj.code, accom: missingObj.hotel, hasLocation: false }).lean();
        if (resToUpdate?.length === 0) {
            return res.status(200).json({ success: true, message: "No reservations to update" });
        }
        else {
            let result = await processBatch(resToUpdate);
            console.log("updated", result.updatedCount);
            console.log("errors", result.errorsCount);
            return res.status(200).json({ success: true, message: "Location saved", updated: result.updatedCount, errors: result.errorsCount });
        }
    }
    if (type === 'price') {
        let resToUpdate = null;
        if (missingObj.type === 'incoming') {
            resToUpdate = await ReservationModel.find({ arrivalAirport: missingObj.airport, billingDestination: missingObj.destination, hasPricesIncoming: false }).lean();
        }
        else if (missingObj.type === 'outgoing') {
            resToUpdate = await ReservationModel.find({ arrivalAirport: missingObj.airport, billingDestination: missingObj.destination, hasPricesOutgoing: false }).lean();
        }
        else {
            return res.status(400).json({ message: "Error saving price, invalid price type" });
        }

        if (resToUpdate?.length === 0) {
            return res.status(200).json({ success: true, message: "No reservations to update" });
        }

        else {
            let result = await processBatch(resToUpdate);
            console.log("updated", result.updatedCount);
            console.log("errors", result.errorsCount);
            return res.status(200).json({ success: true, message: "Prices saved", updated: result.updatedCount, errors: result.errorsCount });
        }
    }
}