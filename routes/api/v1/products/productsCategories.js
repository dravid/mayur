'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();
const moment = require('moment');
const fs = require('fs-extra')


const apiUrl = '/api/v1/products';
let db;
let productsCategoriesCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;


function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}


MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  productsCategoriesCollection = db.collection('productsCategories');
});

module.exports = (expressApp) => {


  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  //fetch all productsCategories
  expressApp.get(apiUrl + '/productsCategories', (req, res) => {

    if (validRequest(req.query)) {

      productsCategoriesCollection.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/productsCategories', error);
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
  expressApp.get(apiUrl + '/productsCategories/:_id', (req, res) => {

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
        productsCategoriesCollection.findOne({
          _id: ObjectID(req.params._id),
        }, function (error, item) {
          if (error) {
            console.log(apiUrl + '/productsCategories/:_id ', error);
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
	 * Private API endpoint: productsCategories
	 */
  expressApp.post(apiUrl + '/productsCategories', (req, res) => {

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

        productsCategoriesCollection.find(filters).sort(sort).toArray(function (error, items) {

          if (error) {
            console.log('api :: error :: /productsCategories :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (items.length > 0) {
              return res.json({
                status: 'items_fetched',
                return: 'productsCategories',
                data: items
              });
            }
            else {
              return res.json({
                status: 'no_items',
                return: 'productsCategories',
                data: []
              });
            }
          }
        });

        break;

      case 'add':

        let newItem = {

          category: postData.category ? JSON.parse(postData.category) : [],
          featuredImage: postData.featuredImage ? JSON.parse(postData.featuredImage) : [],
          createdAt: now,
          updatedAt: now
        };

        productsCategoriesCollection.insertOne(newItem, (error, results) => {

          if (error) {
            console.log('api :: error :: /productsCategories :: add :: ', error);

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

          category: postData.category ? JSON.parse(postData.category) : [],
          featuredImage: postData.featuredImage ? JSON.parse(postData.featuredImage) : [],
          createdAt: postData.createdAt ? postData.createdAt : now,
          updatedAt: now

        };

        productsCategoriesCollection.update({
          _id: ObjectID(postData._id)
        }, updateItem, {}, function (error, result) {
          if (error) {
            console.log('api :: error :: /productsCategories :: set :: ', error);

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

      case 'remove':

        //Remove product from productsCategories collection
        productsCategoriesCollection.deleteOne({
          _id: ObjectID(postData._id)
        }, (error, result) => {

          if (error) {
            console.log('api :: error :: /productsCategories :: remove :: ', error);

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

        productsCategoriesCollection.findOne({
          _id: ObjectID(postData._id)
        }, function (error, item) {

          if (error) {
            console.log('api :: error :: /productsCategories :: get :: ', error);

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