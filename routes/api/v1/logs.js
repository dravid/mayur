'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();

function validRequest(query) {
	return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

const apiUrl = '/api/v1';
let db;
let logsCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

MongoClient.connect(mongoUrl, (err, mongoClient) => {
	if (err) {
		throw new Error(err);
	}

	db = mongoClient.db(process.env.MONGO_DB);
	logsCollection = db.collection('logs');
});

module.exports = (expressApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	/**
	 * Private API endpoint: Logs
	 */
	expressApp.get(apiUrl + '/logs', (req, res) => {

		if (validRequest(req.query)) {

			let queryParams = ['action', 'entity', 'ownerId'];
			let filter = {};

			queryParams.map((queryParam) => {
				if (req.query[queryParam]) {
					filter[queryParam] = req.query[queryParam];
				}
			});

			logsCollection.find(filter).sort({
				createdAt: -1
			}).limit(100).toArray(function (error, items) {
				if (error) {
					console.log(apiUrl + '/logs: ', error);
					return res.status(500).json({ error: 'db_error' });
				}
				return res.status(200).json(items);
			});

		}
		else {
			return res.status(403).json({ error: 'forbidden' });
		}

	});

};