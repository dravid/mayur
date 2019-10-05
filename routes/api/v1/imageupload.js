'use strict';

const fs = require('fs');
require('dotenv').load();
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const apiUrl = '/api/v1';
const imagePath = "static/images/";
const imagePathCSV = "static/csv/";
const moment = require('moment');


const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
let db;
let imagesCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  imagesCollection = db.collection('images');
});

function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

//Check if directory exists, if not create it
function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch (e) {
    try {
      fs.mkdirSync(directory);
    } catch (e) {
      return e;
    }
  }
}

module.exports = (expressApp) => {
  let now = moment(new Date()).format('DD.MM.YYYY HH:mm');

  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  // SET STORAGE

  let storage = multer.diskStorage({
    destination: function (req, file, cb) {

      let tempimagePath = imagePath + req.headers.path + "/";
      if (file.fieldname === 'uploadFileCSV') {
        tempimagePath = imagePathCSV;
      }

      checkDirectorySync(tempimagePath);  //check if dir exists
      // fs.mkdirSync(imagePath + req.headers.uri);
      // cb(null, imagePath + `${req.headers.uri}`)
      cb(null, tempimagePath)
    },
    filename: function (req, file, cb) {
      // cb(null, file.fieldname + '-' + Date.now())
      cb(null, file.originalname)
    }
  })
  let upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 10
    }, //10Mb
  })

  //Upload csv files
  expressApp.post(apiUrl + '/fileupload', upload.single("uploadFileCSV"), (req, res, next) => {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload csv file')
      error.httpStatusCode = 400
      return next(error)
    } else {
      return res.send(file)
    }
  })

  //Upload to storage
  expressApp.post(apiUrl + '/imageupload', upload.single("myFile"), (req, res, next) => {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload image file')
      error.httpStatusCode = 400
      return next(error)
    }
    //Save image path in image collection
    let newItem = {
      uri: req.headers.uri,
      path: req.file.path,
      type: req.headers.type,
      createdAt: now
    };
    imagesCollection.insertOne(newItem, (error, success) => {
      if (error) {
        console.log(apiUrl + '/images - new image: ', error);
        return res.status(500).json({ error: 'db_error' });
      }
      if (success) {
        console.log(apiUrl + '/images - new image: ', success);
      }

      return res.send(file)
    });

  })

  //fetch all images
  expressApp.get(apiUrl + '/imageupload/getall', (req, res) => {

    if (validRequest(req.query)) {

      imagesCollection.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/images: ', error);
          return res.status(500).json({ error: 'db_error' });
        }
        return res.status(200).json(items);
      });

    }
    else {
      return res.status(403).json({ error: 'forbidden' });
    }

  });
  // -------------------------------
};
