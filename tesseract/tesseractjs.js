/** 
 * Optical Character Recognition via Tesseract.js
 */

// Firstly you must install tesseract ocr:
// with homebrew: brew install tesseract
// of with macports: sudo port install tesseract

// Download lang (eng) file manually from:
// https://github.com/tesseract-ocr/tessdata/blob/master/eng.traineddata
// put it to the same path as this script

var Tesseract = require('tesseract.js');

const path = require("path");
var imagePath= path.join(__dirname, 'ocr.png');

Tesseract
    .recognize(imagePath, {lang: "eng"})
    .progress(progress => console.log('progress', progress))
    .then(result => console.log(result.text))
    .then(() => process.exit(0));
