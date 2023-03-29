import dbConnect from '../../../../lib/dbConnect';
import Location from '../../../../models/LocationsModel';
import csvParser from 'csv-parser';
import fs from 'fs';

export default async function handler(req, res) {
    await dbConnect();

    const missingLocations = fs.createWriteStream('./pages/api/v1/scripts/missingLocations.csv');
    missingLocations.write('code,hotel,destination\n');

    const linesToWrite = new Set();

    const parser = fs.createReadStream('./pages/api/v1/scripts/cosmo.csv')
        .pipe(csvParser({ headers: false }))
        .on('data', async (row) => {
            const location = await Location.findOne({ code: row[29].trim(), hotel: row[21].trim() });
            if (!location) {
                linesToWrite.add(`${row[29].trim()},${row[21].trim()},,\n`);
            }
        })
        .on('end', () => {
            for (const line of linesToWrite) {
                missingLocations.write(line);
            }
            missingLocations.end();
        });

    await streamFinished(missingLocations);

    return res.status(200).json({ message: 'success' });
}

function streamFinished(stream) {
    return new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}
