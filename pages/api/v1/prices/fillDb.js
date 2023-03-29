import fs from 'fs';
import Prices from '../../../../models/PricesModel.js';
import dbConnect from '../../../../lib/dbConnect.js';
import Locations from '../../../../models/LocationsModel.js';

async function loadPricesCSV(type) {
    let filePath;

    filePath = `./pages/api/v1/prices/${type}.csv`;

    var objToReturn = [];
    var valdFrom = new Date(Date.UTC(2020, 7, 11, 0, 0));
    var valdTo = new Date(Date.UTC(2021, 8, 14, 23, 59));
    try {
        // Read the CSV file using fs module
        const data = await fs.promises.readFile(filePath, 'utf-8');
        // Split the CSV data into rows and parse each row as an object, first row is header
        const rows = data.split('\n');
        //remove /r from every row and trim
        rows.forEach((row, index) => {
            rows[index] = row.replace('\r', '').trim();
        });

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
                type: 'incoming',
                airport: values[0].trim(),
                destination: values[1].trim(),
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
        const data = await fs.promises.readFile('./pages/api/v1/prices/Locations.csv', 'utf-8');
        // Split the CSV data into rows and parse each row as an object
        const rows = data.split('\n');
        const locations = rows.map(row => {
            const values = row.split(',').map(value => value.trim());
            objToReturn.push({
                code: values[0],
                hotel: values[1],
                destination: values[2]
            });
        });

        return objToReturn;
    } catch (error) {
        console.error(error);
        return objToReturn;
    }
}
export default async function handler(req, res) {
    try {
        await dbConnect();
        var loaded = 0;
        /*  const locations = await loadLocationsCSV();
 
         for (let i = 0; i < locations.length; i++) {
             try {
                 const found = await Locations.findOne({ code: locations[i].code, hotel: locations[i].hotel, destination: locations[i].destination });
                 if (!found) {
                     const location = await Locations.create(locations[i]);
                     console.log('Location created');
                     loaded++;
 
                 } else {
                     console.log('Location already exists');
                 }
 
 
             } catch (error) {
                 console.error(error);
             }
         }
         if (loaded === locations.length) {
             console.log('Locations loaded');
             return res.status(200).json({ success: true });
         }
         else {
             console.log('Not all Locations loaded');
             return res.status(200).json({ success: true, loaded: loaded, total: locations.length });
         } */
        var created = 0;
        const prices = await loadPricesCSV('Incoming-old');
        for (let i = 0; i < prices.length; i++) {
            const create = await Prices.create(prices[i]);
            if (create) {
                created++;
            }
        }
        if (created === prices.length) {
            console.log('Prices loaded');
            return res.status(200).json({ success: true });
        } else {
            console.log('Not all Prices loaded');
            return res.status(200).json({ success: true, loaded: created, total: prices.length });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
}
