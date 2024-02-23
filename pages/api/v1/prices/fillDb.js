import fs from 'fs';
import Prices from '../../../../models/PricesModel.js';
import Location from '../../../../models/LocationsModel.js';
import dbConnect from '../../../../lib/dbConnect.js';
import PricesModel from '../../../../models/PricesModel.js';
function convertToMongoDate(dateString, startOrEnd) {
    // Split the dateString based on '.'
    
    const [day, month, year] = dateString.split('.');
    let dateObj = null;
    // Create a new Date object with the year, month, and day. 
    // Subtract 1 from the month since JavaScript months are 0-based.
    if(startOrEnd === 'start'){
    dateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    }
    else if(startOrEnd === 'end'){
    dateObj = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
    }
    

    return dateObj;
}
async function loadPricesCSVS() {
    //get all csv files in the folder
    const files = fs.readdirSync('./pages/api/v1/prices/');
    //filter only csv files
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    //loop through all csv files and create an array of filenames
    const fileNames = csvFiles.map(file => file.split('.')[0]).filter(file => file != 'locations');
    const filePaths = fileNames.map(name => `./pages/api/v1/prices/${name}.csv`);
    var objToReturn = [];
    for (let i = 0; i < filePaths.length; i++) {
        //code for locations csv
/* 
        try {
            const filePath = filePaths[i];
            // Read the CSV file using fs module encoding is set to utf-8 with BOM
        
            const data = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
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
            console.log(rows);
            for (let i = 0; i < rows.length; i++) {
                var row = rows[i];
                const values = row.split(',').map(value => value.trim());

                    let code = values[0]
                    let hotel = values[1]
                    let destination = values[2].toLowerCase();
                    objToReturn.push({
                        code: code,
                        hotel: hotel,
                        destination: destination.toLowerCase(),
                    });


            }

        } catch (error) {
            console.error(error);
        }
 */
        //code for prices
       try {
            let type = fileNames[i].trim().toLowerCase();
            const filePath = filePaths[i];
            // Read the CSV file using fs module encoding is set to utf-8 with BOM
            const data = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
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
                let shared = isNaN(Number(values[2])) ? 0 : Number(values[2]);
                let private3less = isNaN(Number(values[3])) ? 0 : Number(values[3]);
                let private3more = isNaN(Number(values[4])) ? 0 : Number(values[4]);
                //dates in csv are in format dd.mm.yyyy, convert to monogo compatible format
                let validFrom = convertToMongoDate(values[5], 'start');
                let validTo = convertToMongoDate(values[6], 'end');
                console.log(validFrom);
                console.log(validTo);
                //if one of them is Invalid Date, log the row and skip it   

                if (validFrom.toString() === 'Invalid Date' || validTo.toString() === 'Invalid Date') {
                    console.log('Invalid Date');
                    console.log(row);
                    continue;
                }

                objToReturn.push({
                    type: type,
                    airport: values[0].trim(),
                    destination: values[1].trim().toLowerCase(),
                    shared: shared,
                    private3less: private3less,
                    private3more: private3more,
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
            let found = await PricesModel.findOne({ type: price.type, airport: price.airport, destination: price.destination, validFrom: price.validFrom, validTo: price.validTo });
            if (found) {
                found.hotel = price.hotel;
                found.destination = price.destination;
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
