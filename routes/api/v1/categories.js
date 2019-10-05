'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();
const moment = require('moment');

const apiUrl = '/api/v1';
let db;
let categoriesCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  categoriesCollection = db.collection('categories');

});

module.exports = (expressApp) => {

  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  expressApp.get(apiUrl + '/categories', (req, res) => {

    if (validRequest(req.query)) {

      categoriesCollection.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/categories: ', error);
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
	 * Private API endpoint: Categories
	 */
  expressApp.post(apiUrl + '/categories', (req, res) => {

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

        categoriesCollection.find(filters).sort(sort).toArray(function (error, items) {

          if (error) {
            console.log('api :: error :: /categories :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (items.length > 0) {
              return res.json({
                status: 'items_fetched',
                return: 'categories',
                data: items
              });
            }
            else {
              return res.json({
                status: 'no_items',
                return: 'categories',
                data: []
              });
            }
          }
        });

        break;

      case 'add':


        let newItem = {
          categoryName: postData.categoryName,
          uri: postData.uri,
          googleDescription: postData.googleDescription,
          keywords: postData.keywords,
          featuredImage: JSON.parse(postData.featuredImage),
          createdAt: now,
          updatedAt: now
        };

        categoriesCollection.insertOne(newItem, (error, results) => {

          if (error) {
            console.log('api :: error :: /categories :: add :: ', error);

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

      case 'set':

        let updateItem = {
          categoryName: postData.categoryName,
          uri: postData.uri,
          googleDescription: postData.googleDescription,
          keywords: postData.keywords,
          featuredImage: JSON.parse(postData.featuredImage),
          createdAt: postData.createdAt,
          updatedAt: now
        };

        categoriesCollection.update({
          _id: ObjectID(postData._id)
        }, updateItem, {}, function (error, result) {
          if (error) {
            console.log('api :: error :: /categories :: set :: ', error);

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

      case 'remove':

        categoriesCollection.deleteOne({
          _id: ObjectID(postData._id)
        }, (error, result) => {

          if (error) {
            console.log('api :: error :: /categories :: remove :: ', error);

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

        categoriesCollection.findOne({
          _id: ObjectID(postData._id)
        }, function (error, item) {

          if (error) {
            console.log('api :: error :: /categories :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (item) {
              return res.json({
                status: 'item_fetched',
                return: 'categories',
                data: item
              });
            }
            else {
              return res.json({
                status: 'no_item',
                return: 'categories',
                data: {}
              });
            }
          }
        });

        break;
    }

  });

};