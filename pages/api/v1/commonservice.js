import Reservation from "../../../models/ReservationModel";
import User from "../../../models/UserModel";
import dbConnect from "../../../lib/dbConnect";
import Prices from "../../../models/PricesModel";
import Locations from "../../../models/LocationsModel";
import Log from "../../../models/LogModel";

export default async function handler(req, res) {
    const { method, objectId, updates, query, sort } = req.body;
    let table = req.body.table;
    try {
        await dbConnect();
    } catch (err) {
        return res.status(400).json({ message: err });
    }
    switch (table) {
        case "reservations":
            table = Reservation;
            break;
        case "users":
            table = User;
            break;
        case "prices":
            table = Prices;
            break;
        case "locations":
            table = Locations;
            break;
        case "log":
            table = Log;
            break;
        default:
            res.status(400).json({ message: "Invalid table" });
    }
    switch (method) {
        case 'getall':
            try {
                const data = await table.find({});
                return res.status(200).json(data);
            } catch (err) {
                return res.status(400).json({ message: err });
            }
        case 'getone':
            try {
                const data = await table.findOne({ _id: objectId });
                return res.status(200).json(data);
            } catch (err) {
                return res.status(400).json({ message: err });
            }
        case 'update':
            try {
                const data = await table.findOneAndUpdate({ _id: objectId }, {
                    $set: {
                        ...updates
                    }
                }, { new: true })
                return res.status(200).json(data);
            }
            catch (err) {
                return res.status(400).json({ message: err });
            }
        case 'delete':
            try {
                const data = await table.deleteOne({ _id: objectId });
                return res.status(200).json(data);
            }
            catch (err) {
                return res.status(400).json({ message: err });
            }
        case 'customquery':
            try {
                const data = await table.find(query).sort(sort).lean();
                return res.status(200).json(data);
            } catch (err) {
                return res.status(400).json({ message: err });
            }
        case 'getlastdoc':
            try {
                const data = await table.find().limit().lean();
                return res.status(200).json(data);
            } catch (err) {
                return res.status(400).json({ message: err });
            }
        case 'create':
            try {
                const insert = new table(updates);
                const data = await insert.save();
                return res.status(200).json(data);
            } catch (err) {
                return res.status(400).json({ message: err });
            }
        default:
            return res.status(200).json({ message: "Invalid method" });


    }
}
