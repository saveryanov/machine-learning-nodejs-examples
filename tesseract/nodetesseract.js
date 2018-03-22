// https://github.com/desmondmorris/node-tesseract
var tesseract = require('node-tesseract');

const path = require("path");
var imagePath= path.join(__dirname, 'ocr.png');

// Recognize text of any language in any format
tesseract.process(imagePath,function(err, text) {
	if(err) {
		console.error(err);
	} else {
		console.log(text);
	}
});
