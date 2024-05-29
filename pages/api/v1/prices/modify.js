import Prices from "../../../../models/PricesModel.js";
import dbConnect from "../../../../lib/dbConnect.js";
import Reservation from "../../../../models/ReservationModel.js";
import Locations from "../../../../models/LocationsModel.js";


// update all reservations' billingDestination field such that first you lowercase it and then  replace characters č and ć with c and š with s and đ with dj using regex and then save.

async function updateBillingDestination() {
    const batchSize = 300;
    let skip = 0;
    let reservations = [];

    do {
        reservations = await Locations.find().skip(skip).limit(batchSize);
        const updatedReservations = reservations.map(async (reservation) => {
            const billingDestination = reservation.destination.toLowerCase().replace(/č/g, 'c').replace(/ć/g, 'c').replace(/š/g, 's').replace(/đ/g, 'dj');
            reservation.destination = billingDestination;
            await reservation.save();
        });
        await Promise.all(updatedReservations);
        skip += batchSize;
    } while (reservations.length > 0);
}

export default async function handler(req, res) {
    await dbConnect();
    await updateBillingDestination();
    res.status(200).json({ success: true });
}
