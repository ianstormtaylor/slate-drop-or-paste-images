var express = require('express');
var uuidv4 = require('uuid/v4');
var path = require('path');
var multer  = require('multer');

var uploadDir = path.join(__dirname, 'uploads');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
})

var upload = multer({ storage: storage });

var app = module.exports = express();

app.post('/upload', upload.single('file'), function (req, res, next) {
  res.send({ src: '/uploads/' + req.file.filename });
});

app.get('*', express.static(__dirname));

if (!module.parent) {
  app.listen(8888);
  console.log('Express started on port 8888');
}