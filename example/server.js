const express = require('express')
const path = require('path')
const multer = require('multer')

const uploadDir = path.join(__dirname, 'uploads')
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir)
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`)
  }
})

const upload = multer({ storage })

const app = module.exports = express()

app.post('/upload', upload.single('file'), (req, res, next) => {
  res.send({ src: `/uploads/${req.file.filename}` })
})

app.get('*', express.static(__dirname))

if (!module.parent) {
  app.listen(8888)
  console.log('Express started on port 8888')
}
