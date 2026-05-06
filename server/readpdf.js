const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '../docs/BT_Tuan08/TUAN8B_Search.pdf');
const outPath = path.join(__dirname, 'pdf_output.txt');

try {
  const pdfParse = require('pdf-parse');
  const buf = fs.readFileSync(pdfPath);
  pdfParse(buf).then(data => {
    fs.writeFileSync(outPath, data.text, 'utf8');
    console.log('DONE: Written to pdf_output.txt, pages=' + data.numpages);
  }).catch(err => {
    fs.writeFileSync(outPath, 'ERROR: ' + err.message, 'utf8');
    console.log('ERROR written');
  });
} catch(e) {
  fs.writeFileSync(outPath, 'LOAD_ERROR: ' + e.message, 'utf8');
  console.log('Module error: ' + e.message);
}
