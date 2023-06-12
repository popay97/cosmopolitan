import dbConnect from '../../../../lib/dbConnect';
import Location from '../../../../models/LocationsModel';
import ReservationModel from '../../../../models/ReservationModel';
import PricesModel from '../../../../models/PricesModel';
function processString(s) {
    // Removes multiple whitespaces in a row
    s = s.replace(/\s+/g, ' ');

    // Trims the inside of brackets and capitalizes the word inside
    s = s.replace(/\(\s*([^)]+?)\s*\)/g, function (_, match) {
        return '(' + match.trim().charAt(0).toUpperCase() + match.trim().slice(1) + ')';
    });

    // Capitalizes every new word
    return s.split(' ').map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

export default async function handler(req, res) {
    await dbConnect();
    try {

        //get all prices
        const prices = await PricesModel.find({}).lean()
        //get all locations
        const locations = await Location.find({}).lean()
        let locationsMap = locations.map(location => {
            return location.destination
        })
        let missing = []
        for (let i = 0; i < prices.length; i++) {

            let price = prices[i];
            if (price['destination']) {
                if (!locationsMap.includes(price['destination'])) {
                    missing.push(price['destination'])
                }


            }
        }
        console.log([...new Set(missing)])


        res.status(200).json({ success: true, message: 'done' })
    }
    catch (err) {
        console.log(err)
    }


}
