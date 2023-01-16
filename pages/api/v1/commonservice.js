import Reservation from "../../../models/ReservationModel";
import User from "../../../models/UserModel";
import dbConnect from "../../../lib/dbConnect";


export default async function handler(req, res) {
    let { method, table, objectId, updates } = req.body;
    switch (table) {
        case "reservations":
            table = Reservation;
            break;
        case "users":
            table = User;
            break;
        default:
            res.status(400).json({ message: "Invalid table" });
            return;
    }

    await dbConnect();
    switch (method) {
        case 'getall':
            try {
                const data = await table.find({});
                res.status(200).json(data);
            } catch (err) {
                res.status(400).json({ message: err });
            }
            break;
        case 'getone':
            try {
                const data = await table.finOne({ _id: objectId });
                res.status(200).json(data);
            } catch (err) {
                res.status(400).json({ message: err });
            }
            break;
        case 'update':
            try {
                const data = await table.updateOne({
                    _id: objectId
                }, updates);
                res.status(200).json(data);
            } catch (err) {
                res.status(400).json({ message: err });
            }
            break;
        case 'delete':
            try {
                const data = await table.deleteOne({ _id: objectId });
                res.status(200).json(data);
            }
            catch (err) {
                res.status(400).json({ message: err });
            }
            break;
        default:
            res.status(400).json({ message: "Invalid method" });
            return;
    }
}
