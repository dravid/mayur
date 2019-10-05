'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();
const moment = require('moment');
const fs = require('fs-extra')


const imagePath = "static/images/"
const apiUrl = '/api/v1/products';
let db;
let productsCollection;
let resourcesCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;


function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}


MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  productsCollection = db.collection('products');
  resourcesCollection = db.collection('resources');
});

module.exports = (expressApp) => {


  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  //fetch all products
  expressApp.get(apiUrl + '/products', (req, res) => {

    if (validRequest(req.query)) {

      productsCollection.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/products', error);
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


  //Fetch product by uri
  expressApp.get(apiUrl + '/products/:uri', (req, res) => {


    if (validRequest(req.query)) {

      if (req.params.uri === 'new') {
        /**
         * New product
         */
        return res.status(200).json({});
      } else {
        /**
         * Existing product
         */
        productsCollection.findOne({
          uri: req.params.uri,
        }, function (error, item) {
          if (error) {
            console.log(apiUrl + '/products/:uri ', error);
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





  //Fetch product by requested id, unless request is for new product
  expressApp.get(apiUrl + '/products/:_id', (req, res) => {

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
        productsCollection.findOne({
          _id: ObjectID(req.params._id),
        }, function (error, item) {
          if (error) {
            console.log(apiUrl + '/products/:_id ', error);
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
	 * Private API endpoint: products
	 */
  expressApp.post(apiUrl + '/products', (req, res) => {

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

        productsCollection.find(filters).sort(sort).toArray(function (error, items) {

          if (error) {
            console.log('api :: error :: /products :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (items.length > 0) {
              return res.json({
                status: 'items_fetched',
                return: 'products',
                data: items
              });
            }
            else {
              return res.json({
                status: 'no_items',
                return: 'products',
                data: []
              });
            }
          }
        });

        break;

      case 'add':

        let newItem = {
          name: postData.name ? postData.name : "",
          uri: postData.uri ? postData.uri : "",
          productCode: postData.productCode ? postData.productCode : "",
          seo: postData.seo ? postData.seo : "",
          description: postData.description ? postData.description : "",

          category: postData.category ? postData.category : "other",
          subCategory: postData.subCategory ? postData.subCategory : "other",
          selectedCategory: postData.selectedCategory ? postData.selectedCategory : "other",

          descriptor1: postData.descriptor1 ? postData.descriptor1 : "",
          subDescriptor1: postData.subDescriptor1 ? postData.subDescriptor1 : "",
          descriptor2: postData.descriptor2 ? postData.descriptor2 : "",
          subDescriptor2: postData.subDescriptor2 ? postData.subDescriptor2 : "",
          descriptor3: postData.descriptor3 ? postData.descriptor3 : "",
          subDescriptor3: postData.subDescriptor3 ? postData.subDescriptor3 : "",
          descriptor4: postData.descriptor4 ? postData.descriptor4 : "",
          subDescriptor4: postData.subDescriptor4 ? postData.subDescriptor4 : "",
          descriptor5: postData.descriptor5 ? postData.descriptor5 : "",
          subDescriptor5: postData.subDescriptor5 ? postData.subDescriptor5 : "",

          price: postData.price ? postData.price : '',
          discount: postData.discount ? postData.discount : 0,

          supply: postData.supply ? postData.supply : "",
          sku: postData.sku ? postData.sku : "",
          active: postData.active ? postData.active : "",

          //Images
          images: postData.images ? JSON.parse(postData.images) : "",

          //Creator info
          authorId: postData.authorId ? postData.authorId : "",
          authorFirstName: postData.authorFirstName ? postData.authorFirstName : "",
          authorLastName: postData.authorLastName ? postData.authorLastName : "",
          createdAt: now,
          updatedAt: now
        };

        productsCollection.insertOne(newItem, (error, results) => {

          if (error) {
            console.log('api :: error :: /products :: add :: ', error);

            return res.json({
              status: 'database_error'
            });
          }

					/**
					 * Insert product into the `resources` collection
					 */
          let newResource = {
            productId: newItem._id,
            uri: postData.uri ? postData.uri : "",
            category: postData.category ? postData.category : "other",
            subCategory: postData.subCategory ? postData.subCategory : "other",
            productCode: postData.productCode ? postData.productCode : "",
            sku: postData.sku ? postData.sku : "",
            type: "products",
          };

          resourcesCollection.insertOne(newResource, (error, newResource) => {
            if (error) {
              console.log(apiUrl + '/products - new resource: ', error);
              return res.status(500).json({ error: 'db_error' });
            }

            return res.json({
              status: 'item_added',
              return: 'newItem',
              data: newItem
            });
          });
        });

        break;

      case 'set':

        let updateItem = {
          name: postData.name ? postData.name : "",
          uri: postData.uri ? postData.uri : "",
          productCode: postData.productCode ? postData.productCode : "",
          seo: postData.seo ? postData.seo : "",
          description: postData.description ? postData.description : "",

          category: postData.category ? postData.category : "other",
          subCategory: postData.subCategory ? postData.subCategory : "other",
          selectedCategory: postData.selectedCategory ? postData.selectedCategory : "other",

          descriptor1: postData.descriptor1 ? postData.descriptor1 : "",
          subDescriptor1: postData.subDescriptor1 ? postData.subDescriptor1 : "",
          descriptor2: postData.descriptor2 ? postData.descriptor2 : "",
          subDescriptor2: postData.subDescriptor2 ? postData.subDescriptor2 : "",
          descriptor3: postData.descriptor3 ? postData.descriptor3 : "",
          subDescriptor3: postData.subDescriptor3 ? postData.subDescriptor3 : "",
          descriptor4: postData.descriptor4 ? postData.descriptor4 : "",
          subDescriptor4: postData.subDescriptor4 ? postData.subDescriptor4 : "",
          descriptor5: postData.descriptor5 ? postData.descriptor5 : "",
          subDescriptor5: postData.subDescriptor5 ? postData.subDescriptor5 : "",

          price: postData.price ? postData.price : '',
          discount: postData.discount ? postData.discount : 0,

          supply: postData.supply ? postData.supply : "",
          sku: postData.sku ? postData.sku : "",
          active: postData.active ? postData.active : "",

          //Images
          images: postData.images ? JSON.parse(postData.images) : "",

          //Updated by info
          modifiedBy: postData.modifiedByFirstName + ' ' + postData.modifiedByLastName,
          modifiedCount: postData.modifiedCount ? postData.modifiedCount : 1,
          updatedAt: now,

          //Original creator
          authorId: postData.authorId ? postData.authorId : "",
          authorFirstName: postData.authorFirstName ? postData.authorFirstName : "",
          authorLastName: postData.authorLastName ? postData.authorLastName : "",
          createdAt: postData.createdAt ? postData.createdAt : now,
        };

        productsCollection.update({
          _id: ObjectID(postData._id)
        }, updateItem, {}, function (error, result) {
          if (error) {
            console.log('api :: error :: /products :: set :: ', error);

            return res.json({
              status: 'database_error'
            });
          }

					/**
									 * Update product in `resources` collection
									 */
          let updateResource = {
            productId: ObjectID(postData._id),
            uri: postData.uri ? postData.uri : "",
            category: postData.category ? postData.category : "other",
            subCategory: postData.subCategory ? postData.subCategory : "other",
            productCode: postData.productCode ? postData.productCode : "",
            sku: postData.sku ? postData.sku : "",
            type: "products",
          };

          resourcesCollection.update(
            { productId: ObjectID(postData._id) },
            updateResource, {}, function (error, result) {
              if (error) {
                console.log(apiUrl + '/products - update resource: ', error);
                return res.status(500).json({ error: 'db_error' });
              }

              return res.json({
                status: 'item_updated',
                return: 'result',
                data: result
              });
            });
        });

        break;

      case 'remove':

        //Remove product from products collection
        productsCollection.deleteOne({
          _id: ObjectID(postData._id)
        }, (error, result) => {

          if (error) {
            console.log('api :: error :: /products :: remove :: ', error);

            return res.json({
              status: 'database_error'
            });
          }

          //Delete product in resources collection 
          resourcesCollection.deleteOne({
            productId: ObjectID(postData._id)
          }, (error, result) => {

            if (error) {
              console.log(apiUrl + '/products - remove resource: ', error);
              return res.status(500).json({ error: 'db_error' });
            }

            return res.json({
              status: 'item_deleted',
              return: 'result',
              data: result
            });

          });

        });

        break;

      case 'getOne':

        productsCollection.findOne({
          _id: ObjectID(postData._id)
        }, function (error, item) {

          if (error) {
            console.log('api :: error :: /products :: get :: ', error);

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