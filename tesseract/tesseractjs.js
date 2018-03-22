/** 
 * Optical Character Recognition via Tesseract.js
 */

// Firstly you must install tesseract ocr:
// with homebrew: brew install tesseract
// of with macports: sudo port install tesseract

// Download lang (eng) file manually from:
// https://github.com/tesseract-ocr/tessdata/blob/master/eng.traineddata
// or
// https://github.com/tesseract-ocr/tessdata/blob/master/rus.traineddata
// put it to the same path as this script
//
// GZipped langs:
// https://github.com/naptha/tessdata

var Tesseract = require('tesseract.js');

const path = require("path");
var imagePath= path.join(__dirname, 'ocr.png');


/*
// Text detection
// 
// need to specify langPath for detecting, but there are no links for download langs online so before download all data from:
// https://github.com/naptha/tessdata
// and set langPath
// 
Tesseract.detect(imagePath)
    .then(function(result){
        console.log('done');
    });
*/

// Text recognition
Tesseract
    //.recognize(imagePath, {lang: "rus"})
    .recognize(imagePath, {lang: "eng"})
    .progress(progress => console.log('progress', progress))
    .then(result => console.log(result.text))
    .then(() => process.exit(0));
