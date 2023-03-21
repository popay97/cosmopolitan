import fs from 'fs';
import Prices from '../../../../models/PricesModel.js';
import dbConnect from '../../../../lib/dbConnect.js';
import Locations from '../../../../models/LocationsModel.js';

async function loadPricesCSV(type) {
    // Define the file path based on the version (new or old)
    let filePath;
    if (type === 'Incoming') {
        filePath = `./pages/api/v1/prices/${type}.csv`;
    } else if (type === 'Outgoing') {
        filePath = `./pages/api/v1/prices/${type}.csv`;
    } else {
        console.error('Invalid version specified');
        return;
    }

    var objToReturn = [];
    //create valdFrom and validTo, validFrom date is 09.01.2023, 31.12.2024 is validTo
    var valdFrom = new Date(2023, 0, 9, 0, 0);
    var valdTo = new Date(2024, 11, 31, 23, 59);
    try {
        // Read the CSV file using fs module
        const data = await fs.promises.readFile(filePath, 'utf-8');
        // Split the CSV data into rows and parse each row as an object, first row is header
        const rows = data.split('\n');
        //remove /r from every row and trim
        rows.forEach((row, index) => {
            rows[index] = row.replace('\r', '').trim();
        });

        console.log(rows)
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].length === 0) {
                rows.splice(i, 1);
                i--;
            }
        }
        for (let i = 0; i < rows.length; i++) {
            var row = rows[i];
            const values = row.split(',').map(value => value.trim());
            if (isNaN(values[2].trim().replace(/,/g, '.')) || isNaN(values[3].trim().replace(/,/g, '.')) || isNaN(values[4].trim().replace(/,/g, '.'))) {
                continue;
            }
            objToReturn.push({
                type: type.toLowerCase(),
                airport: values[0],
                destination: values[1],
                shared: Number(values[2]),
                private3less: Number(values[3]),
                private3more: Number(values[4]),
                validFrom: valdFrom,
                validTo: valdTo,
            });
        }



    } catch (error) {
        console.error(error);
    }
    return objToReturn;
}
async function loadLocationsCSV() {
    let objToReturn = [];
    try {
        // Read the CSV file using fs module
        const data = await fs.promises.readFile('./pages/api/v1/prices/locations.csv', 'utf-8');
        // Split the CSV data into rows and parse each row as an object
        const rows = data.split('\n');
        const locations = rows.slice(1).map(row => {
            const [code, hotel, destination] = row.split(',').map(value => value.trim());
            objToReturn.push({
                code: code,
                hotel: hotel,
                destination: destination
            });
        });

        // Store the prices in the database collection
        // Replace the following code with your own code for storing in database collection

    } catch (error) {
        console.error(error);
    }

    console.log(objToReturn);
    return objToReturn;
}
export default async function handler(req, res) {
    try {
        await dbConnect();

        //locations
        const prices = await loadPricesCSV('Outgoing');
        const prices2 = await loadPricesCSV('Incoming');
        if (!prices || !prices2) return res.status(500).json({ success: false });
        else {
            const update = await Prices.insertMany(prices);
            const update2 = await Prices.insertMany(prices2);

            return res.status(200).json({ success: true, data: update2 });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
}
