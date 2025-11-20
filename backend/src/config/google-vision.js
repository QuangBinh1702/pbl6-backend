const vision = require('@google-cloud/vision');
const path = require('path');

// Lấy đường dẫn credentials từ .env hoặc set default
const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
  path.join(__dirname, '../../google-credentials.json');

const client = new vision.ImageAnnotatorClient({
  keyFilename: credentialsPath
});

module.exports = client;
