import fs from 'fs';
import Prices from '../../../../models/PricesModel.js';
import dbConnect from '../../../../lib/dbConnect.js';

async function loadPricesCSVS() {
    //get all csv files in the folder
    const files = fs.readdirSync('./pages/api/v1/prices/');
    //filter only csv files
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    //loop through all csv files and create an array of filenames
    const fileNames = csvFiles.map(file => file.split('.')[0]);
    const filePaths = fileNames.map(name => `./pages/api/v1/prices/${name}.csv`);
    var objToReturn = [];
    for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        const type = fileNames[i].split('_')[0];
        const validFromString = fileNames[i].split('_')[1];
        const validToString = fileNames[i].split('_')[2];
        //fileName format is type_validFrom_validTo
        //validFrom and validTo are in format d-m-yyyy
        const validFrom = new Date(Date.UTC(Number(validFromString.split('-')[2]), Number(validFromString.split('-')[1]) - 1, Number(validFromString.split('-')[0]), 0, 0, 0, 0));
        const validTo = new Date(Date.UTC(Number(validToString.split('-')[2]), Number(validToString.split('-')[1]) - 1, Number(validToString.split('-')[0]), 23, 59, 59, 999));
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
                    type: type,
                    airport: values[0].trim(),
                    destination: values[1].trim(),
                    shared: Number(values[2]),
                    private3less: Number(values[3]),
                    private3more: Number(values[4]),
                    validFrom: validFrom,
                    validTo: validTo,
                });
            }


        } catch (error) {
            console.error(error);
        }
    }
    return objToReturn;
}
export default async function handler(req, res) {
    try {
        await dbConnect();
        const prices = await loadPricesCSVS();
        //store in db each object returned from loadPricesCSVS and overwrite if already exists
        var updated = 0;
        var created = 0;
        var errors = 0;
        for (let i = 0; i < prices.length; i++) {
            const price = prices[i];
            let found = await Prices.findOne({ type: price.type, airport: price.airport, destination: price.destination, validFrom: price.validFrom, validTo: price.validTo });
            if (found) {
                found.shared = price.shared;
                found.private3less = price.private3less;
                found.private3more = price.private3more;
                try {
                    await found.save();
                    updated++;
                }
                catch (error) {
                    console.log(error);
                    errors++;
                }

            }
            else {
                let newPrice = new Prices(price);
                try {
                    await newPrice.save();
                    created++;
                }
                catch (error) {
                    console.log(error);
                    errors++;
                }

            }
        }
        res.status(200).json({ success: true, updated: updated, created: created, errors: errors });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
}
