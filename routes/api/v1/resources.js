'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();

const moment = require("moment");
const newDate = moment(new Date()).format("DD.MM.YYYY HH:mm");

const apiUrl = '/api/v1';
let db;
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
	resourcesCollection = db.collection('resources');

});

module.exports = (expressApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	expressApp.get(apiUrl + '/resources', (req, res) => {

		if (validRequest(req.query)) {

			// console.log('Resources baza - prosao query');
			// console.log(req.query)

			resourcesCollection.find({
				uri: req.query.uri
			}).sort({}).toArray(function (error, items) {
				if (error) {
					// console.log('Resources baza - Greska');
					console.log(apiUrl + '/resources: ', error);
					return res.status(500).json({ error: 'db_error' });
				}

				if (items.length > 0) {
					// console.log('Resources baza - ima taj uri');
					return res.status(200).json(items[0]);
				} else {
					// console.log('Resources baza - nema taj URI');
					return res.status(200).json({});
				}
			});

		}
		else {
			return res.status(403).json({ error: 'forbidden' });
		}

	});

};