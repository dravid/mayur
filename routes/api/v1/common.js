'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();

const apiUrl = '/api/v1';
let db;
let postsCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

MongoClient.connect(mongoUrl, (err, mongoClient) => {

	if (err) {
		throw new Error(err);
	}

	db = mongoClient.db(process.env.MONGO_DB);
	postsCollection = db.collection('posts');

});

module.exports = (expressApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	expressApp.get(apiUrl + '/foofa', (req, res) => {
		console.log("------------------------ API REQUEST START postData ----------------------------");
		// console.log(JSON.stringify(req, null, 4));
		console.log(req.csrfToken());
		console.log("------------------------ API REQUEST END postData ----------------------------");

		return res.json({
			status: 'items_fetched',
			return: 'posts',
			data: 'items'
		});
	});

	/**
	 * Private API endpoint: Posts
	 */

	expressApp.post(apiUrl + '/common', (req, res) => {

		let now = new Date();
		let postData = req.body;

		// Parameters for `get`
		let filters = {};
		let sort = {};

		// Parameters for `set`
		let update = {};
		let options = {};

		switch (postData.action) {

			// case 'foo':
			//
			// 	console.log("------------------------ API REQUEST START postData ----------------------------");
			// 	// console.log(JSON.stringify(req, null, 4));
			// 	console.log(req.csrfToken());
			// 	console.log("------------------------ API REQUEST END postData ----------------------------");
			//
			// 	return res.json({
			// 		status: 'items_fetched',
			// 		return: 'posts',
			// 		data: 'items'
			// 	});
			//
			// 	break;

			case 'get':

				console.log("------------------------ API REQUEST START postData ----------------------------");
				// console.log(JSON.stringify(req, null, 4));
				// console.log(req);
				console.log(postData);
				console.log("------------------------ API REQUEST END postData ----------------------------");

				filters = postData.filters ? postData.filters : {};
				sort = postData.sort ? postData.sort : {};

				postsCollection.find(filters).sort(sort).toArray(function (error, items) {

					console.log("------------------------ API RESULTS ----------------------------");
					// console.log(items);
					console.log("------------------------ /API RESULTS----------------------------");

					if (error) {
						console.log('api :: error :: /posts :: get :: ', error);

						return res.json({
							status: 'database_error'
						});
					}
					else {
						if (items.length > 0) {
							return res.json({
								status: 'items_fetched',
								return: 'posts',
								data: items
							});
						}
						else {
							return res.json({
								status: 'no_items',
								return: 'posts',
								data: []
							});
						}
					}
				});

				break;

			case 'set':

				let updateItem = {
					title: postData.title,
					content: postData.content,
					authorId: postData.authorId,
					createdAt: now,
					updatedAt: now
				};

				postsCollection.update({
					_id: ObjectID(postData._id)
				}, updateItem, {}, function (error, result) {
					if (error) {
						console.log('api :: error :: /posts :: set :: ', error);

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
					title: postData.title,
					content: postData.content,
					authorId: postData.authorId,
					createdAt: now
				};

				postsCollection.insertOne(newItem, (error, results) => {

					if (error) {
						console.log('api :: error :: /posts :: add :: ', error);

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

				postsCollection.deleteOne({
					_id: ObjectID(postData._id)
				}, (error, result) => {

					if (error) {
						console.log('api :: error :: /posts :: remove :: ', error);

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

				postsCollection.findOne({
					_id: ObjectID(postData._id)
				}, function (error, item) {

					if (error) {
						console.log('api :: error :: /posts :: get :: ', error);

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