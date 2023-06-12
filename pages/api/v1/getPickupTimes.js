import ReservationModel from "../../../models/ReservationModel";
import dbConnect from "../../../lib/dbConnect";
import NextCors from 'nextjs-cors';
export default async function handler(req, res) {
    await dbConnect();
    await NextCors(req, res, {
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        origin: '*',
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    });
    if (req.body.resId === null || req.body.resId === undefined) {
        res.status(400).json({ message: 'Bad request' });
        return;
    }
    else {
        const reservation = await ReservationModel.findOne({ resId: req.body.resId });
        if (reservation === null) {
            res.status(404).json({ message: 'Reservation not found' });
            return;
        }
        else {
            res.status(200).json({ incomingPickupTime: reservation.incomingPickupTime, outgoingPickupTime: reservation.outgoingPickupTime });
            return;
        }
    }
}