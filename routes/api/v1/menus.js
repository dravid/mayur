'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();

const moment = require("moment");
const newDate = moment(new Date()).format("DD.MM.YYYY HH:mm");

const apiUrl = '/api/v1';
let db;
let menusCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  menusCollection = db.collection('menus');

});

module.exports = (expressApp) => {

  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  expressApp.get(apiUrl + '/menus', (req, res) => {

    if (validRequest(req.query)) {

      menusCollection.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/menus: ', error);
          return res.status(500).json({ error: 'db_error' });
        }
        return res.status(200).json(items);
      });

    }
    else {
      return res.status(403).json({ error: 'forbidden' });
    }

  });

	/**
	 * Private API endpoint: menus
	 */
  expressApp.post(apiUrl + '/menus', (req, res) => {

    let now = new Date();
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

        menusCollection.find(filters).sort(sort).toArray(function (error, items) {

          if (error) {
            console.log('api :: error :: /menus :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (items.length > 0) {
              return res.json({
                status: 'items_fetched',
                return: 'menus',
                data: items
              });
            }
            else {
              return res.json({
                status: 'no_items',
                return: 'menus',
                data: []
              });
            }
          }
        });

        break;

      case 'set':

        // let updateItem = {
        //   menuData: [postData.menuData],
        //   name: postData.name,
        //   description: postData.description,
        //   updatedAt: newDate,
        // };

        console.log(postData);
        menusCollection.updateOne(
          { _id: ObjectID(postData._id) },
          {
            $set: {
              menuData: (postData.menuData && postData.menuData.length) > 0
                ? JSON.parse(postData.menuData)
                : [],
            }
          }
          , function (error, result) {
            if (error) {
              console.log('api :: error :: /menus :: set :: ', error);

              return res.json({
                status: 'database_error'
              });
            }

            return res.json({
              status: 'items_updated',
              return: 'result',
              data: result
            });
          });

        break;

      case 'add':

        console.log('OOOOOOOOOOOOOOOOOOOO');
        console.log(postData);

        let newItem = {
          name: postData.name,
          description: postData.description,
          menuData: [],
          createdAt: newDate,
        };

        menusCollection.insertOne(newItem, (error, results) => {

          if (error) {
            console.log('api :: error :: /menus :: add :: ', error);

            return res.json({
              status: 'database_error'
            });
          }

          return res.json({
            status: 'item_added',
            return: 'newItem',
            data: newItem
          });

        });

        break;

      case 'remove':

        menusCollection.deleteOne({
          _id: ObjectID(postData._id)
        }, (error, result) => {

          if (error) {
            console.log('api :: error :: /menus :: remove :: ', error);

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

        menusCollection.findOne({
          _id: ObjectID(postData._id)
        }, function (error, item) {

          if (error) {
            console.log('api :: error :: /menus :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (item) {
              return res.json({
                status: 'item_fetched',
                return: 'menus',
                data: item
              });
            }
            else {
              return res.json({
                status: 'no_item',
                return: 'menus',
                data: {}
              });
            }
          }
        });

        break;
    }

  });

};