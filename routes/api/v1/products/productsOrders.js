'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();
const moment = require('moment');
const fs = require('fs-extra')


const apiUrl = '/api/v1/products';
let db;
let productsOrdersCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;


function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}


MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  productsOrdersCollection = db.collection('productsOrders');
});

module.exports = (expressApp) => {


  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  //fetch all productsOrders
  expressApp.get(apiUrl + '/productsOrders', (req, res) => {

    if (validRequest(req.query)) {

      productsOrdersCollection.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/productsOrders', error);
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


  //Fetch product by requested id, unless request is for new product
  expressApp.get(apiUrl + '/productsOrders/:_id', (req, res) => {

    let filters = {};
    let sort = {};

    if (validRequest(req.query)) {

      if (req.params._id === 'new') {
				/**
				 * New product
				 */
        return res.status(200).json({});
      } else {
				/**
				 * Existing product
				 */
        productsOrdersCollection.findOne({
          _id: ObjectID(req.params._id),
        }, function (error, item) {
          if (error) {
            console.log(apiUrl + '/productsOrders/:_id ', error);
            return res.status(500).json({ error: 'db_error' });
          }
          return res.status(200).json(item);
        });
      }

    }
    else {
      return res.status(403).json({ error: 'forbidden' });
    }

  });
  // ------------------------------

	/**
	 * Private API endpoint: productsOrders
	 */
  expressApp.post(apiUrl + '/productsOrders', (req, res) => {

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

        productsOrdersCollection.find(filters).sort(sort).toArray(function (error, items) {

          if (error) {
            console.log('api :: error :: /productsOrders :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (items.length > 0) {
              return res.json({
                status: 'items_fetched',
                return: 'productsOrders',
                data: items
              });
            }
            else {
              return res.json({
                status: 'no_items',
                return: 'productsOrders',
                data: []
              });
            }
          }
        });

        break;

      case 'set':

        let updateItem = {
          userId: postData.userId ? postData.userId : '',
          order: postData.order ? postData.order : [{ sku: postData.sku, quantity: postData.quantity }],
          totalPrice: postData.totalPrice ? postData.totalPrice : '',
          createdAt: postData.createdAt,
          updatedAt: now
        };

        productsOrdersCollection.update({
          _id: ObjectID(postData._id)
        }, updateItem, {}, function (error, result) {
          if (error) {
            console.log('api :: error :: /productsOrders :: set :: ', error);

            return res.json({
              status: 'database_error'
            });
          }

          return res.json({
            status: 'item_updated',
            return: 'result',
            data: result
          });

        });

        break;

      case 'add':

        let newItem = {

          userId: postData.userId ? postData.userId : '',
          order: postData.order ? postData.order : [{ sku: postData.sku, name: postData.name, quantity: postData.quantity }],
          subTotal: postData.subTotal ? postData.subTotal : '',
          total: postData.total ? postData.total : '',
          paymentType: postData.paymentType ? postData.paymentType : '',
          createdAt: now

        };

        productsOrdersCollection.insertOne(newItem, (error, results) => {

          if (error) {
            console.log('api :: error :: /productsOrders :: add :: ', error);

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

        //Remove product from productsOrders collection
        productsOrdersCollection.deleteOne({
          _id: ObjectID(postData._id)
        }, (error, result) => {

          if (error) {
            console.log('api :: error :: /productsOrders :: remove :: ', error);

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

        console.log(postData._id)

        productsOrdersCollection.findOne({
          _id: ObjectID(postData._id)
        }, function (error, item) {

          if (error) {
            console.log('api :: error :: /productsOrders :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (item) {
              return res.json({
                status: 'item_fetched',
                return: 'post',
                data: item
              });
            }
            else {
              return res.json({
                status: 'no_item',
                return: 'post',
                data: {}
              });
            }
          }
        });

        break;
    }

  });

};