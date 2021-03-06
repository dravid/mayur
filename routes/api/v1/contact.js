'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();
const moment = require('moment');
const apiUrl = '/api/v1';
let db;
let contact;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;


function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  contact = db.collection('contact');
});

module.exports = (expressApp) => {

  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  //fetch all contact
  expressApp.get(apiUrl + '/contact', (req, res) => {

    if (validRequest(req.query)) {

      contact.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/contact: ', error);
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



  expressApp.post(apiUrl + '/contact', (req, res) => {

    let now = moment(new Date()).format('DD.MM.YYYY HH:mm');
    let postData = req.body;

    // Parameters for `get`
    let filters = {};
    let sort = {};

    // Parameters for `set`
    let update = {};
    let options = {};

    switch (postData.action) {

      case 'get':

        filters = postData.filters ? postData.filters : {};
        sort = postData.sort ? postData.sort : {};

        contact.find(filters).sort(sort).toArray(function (error, items) {

          if (error) {
            console.log('api :: error :: /contact :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (items.length > 0) {
              return res.json({
                status: 'items_fetched',
                return: 'contact',
                data: items
              });
            }
            else {
              return res.json({
                status: 'no_items',
                return: 'contact',
                data: []
              });
            }
          }
        });

        break;


      case 'add':
        let newItem = {
          firstName: postData.firstName ? postData.firstName : '',
          lastName: postData.lastName ? postData.lastName : '',
          name: postData.name ? postData.name : '',
          dateOfBirth: postData.dateOfBirth ? postData.dateOfBirth : '',
          email: postData.email ? postData.email : '',
          phone: postData.phone ? postData.phone : '',
          subject: postData.subject ? postData.subject : '',
          message: postData.message ? postData.message : '',
          createdAt: now
        };

        contact.insertOne(newItem, (error, results) => {

          if (error) {
            console.log('api :: error :: /contact :: set :: ', error);

            return res.json({
              status: 'database_error'
            });
          }

          return res.json({
            status: 'item_added',
            return: 'result',
            data: newItem
          });
        });

        break;

      case 'remove':

        contact.deleteOne({
          _id: ObjectID(postData._id)
        }, (error, result) => {

          if (error) {
            console.log('api :: error :: /contact :: remove :: ', error);

            return res.json({
              status: 'database_error'
            });
          }

          return res.json({
            status: 'item_deleted',
            return: 'result',
            data: result
          });

        });

        break;

      case 'getOne':

        contact.findOne({
          _id: ObjectID(postData._id)
        }, function (error, item) {

          if (error) {
            console.log('api :: error :: /contact :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (item) {
              return res.json({
                status: 'item_fetched',
                return: 'contact',
                data: item
              });
            }
            else {
              return res.json({
                status: 'no_item',
                return: 'contact',
                data: {}
              });
            }
          }
        });

        break;
    }

  });

};