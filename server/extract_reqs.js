const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../docs/BT_Tuan08/TUAN8B_Search.pdf');
const outPath = path.join(__dirname, '../docs/BT_Tuan08/requirements_text.txt');

async function extract() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        fs.writeFileSync(outPath, data.text);
        console.log('Successfully extracted PDF text to requirements_text.txt');
        console.log('Character count:', data.text.length);
    } catch (err) {
        console.error('Error extracting PDF:', err);
    }
}

extract();
