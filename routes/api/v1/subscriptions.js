'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();

const apiUrl = '/api/v1';
let db;
let subscriptionsCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  subscriptionsCollection = db.collection('subscriptions');

});

module.exports = (expressApp) => {

  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  expressApp.get(apiUrl + '/subscriptions', (req, res) => {

    if (validRequest(req.query)) {

      subscriptionsCollection.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/subscriptions: ', error);
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
	 * Private API endpoint: Subscriptions
	 */
  expressApp.post(apiUrl + '/subscriptions', (req, res) => {

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

        subscriptionsCollection.find(filters).sort(sort).toArray(function (error, items) {

          if (error) {
            console.log('api :: error :: /subscriptions :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (items.length > 0) {
              return res.json({
                status: 'items_fetched',
                return: 'subcsriptions',
                data: items
              });
            }
            else {
              return res.json({
                status: 'no_items',
                return: 'subscriptions',
                data: []
              });
            }
          }
        });

        break;

      case 'set':

        let updateItem = {
          subscriptionName: postData.subscriptionName,
          description: postData.description,
          price: postData.price,
          limit: postData.limit,
          duration: postData.duration,
          createdAt: postData.createdAt,
          updatedAt: now
        };

        subscriptionsCollection.update({
          _id: ObjectID(postData._id)
        }, updateItem, {}, function (error, result) {
          if (error) {
            console.log('api :: error :: /subscriptions :: set :: ', error);

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

        let newItem = {
          subscriptionName: postData.subscriptionName,
          description: postData.description,
          price: postData.price,
          limit: postData.limit,
          duration: postData.duration,
          createdAt: now,
        };

        subscriptionsCollection.insertOne(newItem, (error, results) => {

          if (error) {
            console.log('api :: error :: /subcsriptions :: add :: ', error);

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

        subscriptionsCollection.deleteOne({
          _id: ObjectID(postData.id)
        }, (error, result) => {

          if (error) {
            console.log('api :: error :: /subscriptions :: remove :: ', error);

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

        subscriptionsCollection.findOne({
          _id: ObjectID(postData._id)
        }, function (error, item) {

          if (error) {
            console.log('api :: error :: /subscriptions :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (item) {
              return res.json({
                status: 'item_fetched',
                return: 'subscriptions',
                data: item
              });
            }
            else {
              return res.json({
                status: 'no_item',
                return: 'subscriptions',
                data: {}
              });
            }
          }
        });

        break;
    }

  });

};