const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');


// function to convert the numbers into words

function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const scales = ['', 'Thousand', 'Million'];

    if (num === 0) return 'Zero';

    const convert = (n, scale) => {
        if (n === 0) return '';
        let str = '';
        if (n >= 100) {
            str += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 20) {
            str += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        } else if (n >= 10) {
            return str + teens[n - 10] + ' ' + scale;
        }
        if (n > 0) {
            str += ones[n] + ' ';
        }
        return str + scale;
    };

    let result = '';
    let scaleIndex = 0;
    while (num > 0) {
        if (num % 1000 !== 0) {
            result = convert(num % 1000, scales[scaleIndex]) + ' ' + result;
        }
        num = Math.floor(num / 1000);
        scaleIndex++;
    }

    return result.trim() + ' only';
}


// Register Handlebars helpers
handlebars.registerHelper('formatDate', function (date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN');
});

handlebars.registerHelper('formatCurrency', function (number) {
    if (isNaN(number)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(number);
});

handlebars.registerHelper('default', function (value, defaultValue) {
    return value != null ? value : defaultValue;
});


// Register a helper to add multiple numbers
handlebars.registerHelper('add', function(...args) {
    // Remove the last argument (options object) and sum the rest
    const sum = args.slice(0, -1).reduce((acc, num) => acc + Number(num), 0);
    return sum;
});



// Register the helper with Handlebars
handlebars.registerHelper('amountInWords', function(amount) {
    let numericAmount = Math.round(parseFloat(amount));
    if (isNaN(numericAmount)) {
        return 'Invalid Amount';
    }
    return numberToWords(numericAmount);
});


async function generateInvoice(order, res) {

    const templateHtml = await fs.readFile(path.join(__dirname, 'invoice-template.hbs'), 'utf8');
    const template = handlebars.compile(templateHtml);
    const html = template(order);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout: 60000
    });

    try {
        const page = await browser.newPage();

        await page.setContent(html);
        await page.waitForNetworkIdle();

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            timeout: 60000
        });

        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNo || order._id}.pdf`);
        res.setHeader('Content-Length', pdf.length);
        res.send(Buffer.from(pdf, 'binary'));
    } catch (error) {
        res.status(500).send('Error generating invoice');
    } finally {
        await browser.close();
    }
}

module.exports = { generateInvoice };
