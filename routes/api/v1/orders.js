'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();
const moment = require('moment');
const nodemailer = require('nodemailer');

const apiUrl = '/api/v1';
let db;
let ordersCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;


function validRequest(query) {
  return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

MongoClient.connect(mongoUrl, (err, mongoClient) => {

  if (err) {
    throw new Error(err);
  }

  db = mongoClient.db(process.env.MONGO_DB);
  ordersCollection = db.collection('orders');
});



module.exports = (expressApp) => {

  if (expressApp === null) {
    throw new Error('Error: expressApp option must be an express server instance');
  }

  //fetch all orders
  expressApp.get(apiUrl + '/orders', (req, res) => {

    if (validRequest(req.query)) {

      ordersCollection.find({}).sort({}).toArray(function (error, items) {
        if (error) {
          console.log(apiUrl + '/orders: ', error);
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

  expressApp.get(apiUrl + '/orders/:_id', (req, res) => {

    if (validRequest(req.query)) {

      if (req.params._id === 'new') {
				/**
				 * New order
				 */
        return res.status(200).json({});
      } else {
				/**
				 * Existing order
				 */
        ordersCollection.findOne({
          _id: ObjectID(req.params._id)
        }, function (error, item) {
          if (error) {
            console.log(apiUrl + '/orders/:_id ', error);
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


  expressApp.post(apiUrl + '/orders', (req, res) => {

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

        ordersCollection.find(filters).sort(sort).toArray(function (error, items) {

          if (error) {
            console.log('api :: error :: /orders :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (items.length > 0) {
              return res.json({
                status: 'items_fetched',
                return: 'orders',
                data: items
              });
            }
            else {
              return res.json({
                status: 'no_items',
                return: 'orders',
                data: []
              });
            }
          }
        });

        break;

      case 'add':

        let adminEmail = 'Forbiden info';

        let newItem = {
          user: postData.user ? JSON.parse(postData.user) : "",
          guestUser: postData.guestUser ? JSON.parse(postData.guestUser) : "",
          orderList: postData.orderList ? JSON.parse(postData.orderList) : "",
          couponCode: postData.couponCode ? postData.couponCode : "",
          orderNumber: postData.orderNumber,

          shippingOption: postData.shippingOption ? postData.shippingOption : "",
          shippingPrice: postData.shippingPrice ? postData.shippingPrice : "",

          orderPrice: postData.orderPrice ? postData.orderPrice : "",
          totalPrice: postData.totalPrice ? postData.totalPrice : "",
          orderStatus: postData.orderStatus ? postData.orderStatus : "pending",

          paymentOption: postData.paymentOption ? postData.paymentOption : "",

          orderNote: postData.orderNote ? postData.orderNote : "",

          createdAt: now
        };

        ordersCollection.insertOne(newItem, (error, results) => {

          if (error) {
            console.log('api :: error :: /orders :: add :: ', error);

            return res.json({
              status: 'database_error'
            });
          }



          console.log('Sending order details email to buyer and store admin');

          //SENDING NEW PASSWORD VIA MAIL

          // Create a SMTP transport object
          var transport = nodemailer.createTransport({
            service: "Gmail",
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_FROM,
              pass: process.env.EMAIL_PASSWORD
            }
          });

          // Message object
          var message = {
            // sender info
            from: process.env.EMAIL_FROM,

            // Comma separated list of recipients
            to: `${newItem.user.email}, ${adminEmail}`,


            // Subject of the message. Nodemailer is unicode friendly ✔
            subject: "Order details.",

            // HTML body
            html: `
            <div>
              <h3>Your order has been recived</h3>
              <p>Order details.</p>
              <br /> 
              <h4>Buyer info:</h4> <br />
              City: ${newItem.user.city} <br />
              Address: ${newItem.user.address} <br />
              ZIP: ${newItem.user.zip} <br />

              Order info: <br />
              Total price: ${newItem.totalPrice} <br />
              Note: ${newItem.orderNote} <br />

              Someone will contact you to confirm order. 
            </div>
            `

            // plaintext body
            //text: req.query.text //'Hello to myself!'
          };

          transport.sendMail(message, function (error) {
            if (err) {
              transport.close();

              console.log('Error occured:');
              console.log(err);

              return res.json({
                status: 'send_email_error'
              });
            }
            else {
              transport.close();

              return res.json({
                status: 'sucess',
                return: null,
                data: null
              });
            }
          });


          //Saving order in DB
          return res.json({
            status: 'item_added',
            return: 'newItem',
            data: newItem
          });



        });

        break;

      case 'set':

        let updateItem = {
          user: postData.user ? JSON.parse(postData.user) : "",
          guestUser: postData.guestUser ? JSON.parse(postData.guestUser) : "",
          orderList: postData.orderList ? JSON.parse(postData.orderList) : "",
          couponCode: postData.couponCode ? postData.couponCode : "",
          orderNumber: postData.orderNumber,

          shippingOption: postData.shippingOption ? postData.shippingOption : "",
          shippingPrice: postData.shippingPrice ? postData.shippingPrice : "",

          orderPrice: postData.orderPrice ? postData.orderPrice : "",
          totalPrice: postData.totalPrice ? postData.totalPrice : "",
          orderStatus: postData.orderStatus ? postData.orderStatus : "pending",

          paymentOption: postData.paymentOption ? postData.paymentOption : "",

          orderNote: postData.orderNote ? postData.orderNote : "",

          modifiedBy: postData.modifiedByFirstName + ' ' + postData.modifiedByLastName,
          modifiedCount: postData.modifiedCount,
          createdAt: postData.createdAt,
          updatedAt: now
        };

        ordersCollection.update({
          _id: ObjectID(postData._id)
        }, updateItem, {}, function (error, result) {
          if (error) {
            console.log('api :: error :: /orders :: set :: ', error);

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

      case 'update_status':

        ordersCollection.updateOne(
          { _id: ObjectID(postData._id) },
          {
            $set: {
              orderStatus: postData.orderStatus ? postData.orderStatus : "pending",
              modifiedBy: postData.modifiedByFirstName + ' ' + postData.modifiedByLastName,
              modifiedCount: postData.modifiedCount,
              updatedAt: now
            }
          }

          // updateItem
          , function (error, result) {
            if (error) {
              console.log('api :: error :: /orders :: set :: ', error);

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

        ordersCollection.deleteOne({
          _id: ObjectID(postData._id)
        }, (error, result) => {

          if (error) {
            console.log('api :: error :: /orders :: remove :: ', error);

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


        ordersCollection.findOne({
          _id: ObjectID(postData._id)
        }, function (error, item) {

          if (error) {
            console.log('api :: error :: /orders :: get :: ', error);

            return res.json({
              status: 'database_error'
            });
          }
          else {
            if (item) {
              return res.json({
                status: 'item_fetched',
                return: 'order',
                data: item
              });
            }
            else {
              return res.json({
                status: 'no_item',
                return: 'order',
                data: {}
              });
            }
          }
        });

        break;
    }

  });

};