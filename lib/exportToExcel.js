import * as XLSX from 'xlsx';

export function exportTableToExcel(tableId, filename = '') {
    const table_elt = document.getElementById(tableId);
    const wb = XLSX.utils.book_new();
    const workbook = XLSX.utils.table_to_book(table_elt);
    const ws = workbook.Sheets["Sheet1"];

    // Convert the worksheet to an array of arrays (ignoring raw dates)
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

    // Process each cell to convert date values and add colspan
    for (let row = 0; row < 1; row++) {
        for (let col = 0; col < data[row].length; col++) {
            const value = data[row][col];

            // Check if the value is a date
            if (value && value?.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
                let date = new Date(value);
                if (date.getTime() > 0) {
                    // Convert the date to a string
                    const month = date.toLocaleString('default', { month: 'short' });
                    const formattedDate = month + '-' + date.getFullYear();
                    data[row][col] = { v: formattedDate, colspan: 3 };
                }
                else {
                    data[row][col] = { v: value, colspan: 3 };
                }
            } else {
                data[row][col] = { v: value };
            }
        }
    }

    // Add a new row
    data.push([{ v: "Created " + new Date().toISOString().split('T')[0] }]);

    // Convert the processed data back to a worksheet
    const newWs = XLSX.utils.aoa_to_sheet(data, {
        cellCallback: (cell, r, c) => {
            if (data[r][c].colspan) {
                cell.s = { ...cell.s, width: 3 };
            }
        }
    });

    // Replace the original worksheet with the processed one
    workbook.Sheets["Sheet1"] = newWs;

    // Write and save the XLSX file
    XLSX.writeFile(workbook, filename + ".xlsx");
}
