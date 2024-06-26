const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");

async function html_to_pdf(templateHtml, dataBinding, options) {
    const template = handlebars.compile(templateHtml);
    const finalHtml = encodeURIComponent(template(dataBinding));
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROME_BIN || null,
        args: [
            '--no-sandbox',
            '--headless',
            '--disable-setuid-sandbox',
            "--disable-gpu",
            '--disable-dev-shm-usage'
        ]
    });
    const page = await browser.newPage();
    await page.goto(`data:text/html;charset=UTF-8,${finalHtml}`, {
        waitUntil: "networkidle0",
    });
    const pdf = await page.pdf(options);
    await browser.close();
    return pdf;

};
export default async function handler(req, res) {
    try {
        const monthDict = {
            0: "January",
            1: "February",
            2: "March",
            3: "April",
            4: "May",
            5: "June",
            6: "July",
            7: "August",
            8: "September",
            9: "October",
            10: "November",
            11: "December",
        }
        //round the total cost to 2 decimal places but keep it as a float
        const month = req.body.month;
        const year = req.body.year;
        delete req.body.month;
        delete req.body.year;
        const dataBinding = { ...req.body }
        const templateHtml = fs.readFileSync(
            path.join(process.cwd(), "public", "templates", "Invoice.html"),
            "utf8"
        );
        const filename = `invoice-${monthDict[month - 1]}-${year}.pdf`
        const options = {
            format: "A4",
            headerTemplate: "<p></p>",
            footerTemplate: "<p></p>",
            displayHeaderFooter: false,
            margin: {
                top: "40px",
                bottom: "100px",
            },
            printBackground: true,
            path: path.join(process.cwd(), "public", "invoices", filename),

        };

        const pdf = await html_to_pdf(templateHtml, dataBinding, options);
        //return the pdf file to the client


        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

        //send the pdf file to the client
        res.send(pdf);


        //delete the pdf file from the server
        fs.unlinkSync(`public/invoices/${filename}`);
        return res.status(200)
    } catch (err) {
        console.log("ERROR:", err);
        return res.status(500).json({ message: "Error" });
    }
}