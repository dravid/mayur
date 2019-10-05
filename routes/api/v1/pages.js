'use strict';

const fs = require('fs-extra')
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const multer = require('multer');
require('dotenv').load();
const moment = require('moment');

const imagePath = "static/images/"
const apiUrl = '/api/v1';
let db;
let pagesCollection;
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
	pagesCollection = db.collection('pages');
	resourcesCollection = db.collection('resources');
});

module.exports = (expressApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	//fetch all pages
	expressApp.get(apiUrl + '/pages', (req, res) => {

		if (validRequest(req.query)) {

			pagesCollection.find({}).sort({}).toArray(function (error, items) {
				if (error) {
					console.log(apiUrl + '/pages: ', error);
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


	// GET PAGE BY URI
	expressApp.get(apiUrl + '/pages/:uri', (req, res) => {

		if (validRequest(req.query)) {

			if (req.params.uri === 'new') {
				/**
				 * New page
				 */
				return res.status(200).json({});
			} else {
				/**
				 * Existing page
				 */
				pagesCollection.findOne({
					uri: req.params.uri
				}, function (error, item) {
					if (error) {
						console.log(apiUrl + '/pages/:uri ', error);
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



	expressApp.get(apiUrl + '/pages/:_id', (req, res) => {

		if (validRequest(req.query)) {

			if (req.params._id === 'new') {
				/**
				 * New page
				 */
				return res.status(200).json({});
			} else {
				/**
				 * Existing page
				 */
				pagesCollection.findOne({
					_id: ObjectID(req.params._id)
				}, function (error, item) {
					if (error) {
						console.log(apiUrl + '/pages/:_id ', error);
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


	// Parameters for `get`
	let filters = {};
	let sort = {};

	//Fetch pages by user_id
	expressApp.get(apiUrl + '/pages', (req, res) => {

		if (validRequest(req.query)) {
			let authorId = req.query.authorId ? req.query.authorId : null;
			if (authorId === null) {
				return res.status(200).json([]);
			}
			pagesCollection
				.find({ authorId: authorId })
				// .sort({ createdAt: -1 })
				.toArray(function (error, items) {
					if (error) {
						console.log(apiUrl + '/pages: ', error);
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
	 * Private API endpoint: pages
	 * 
	 * 
	 */


	expressApp.post(apiUrl + '/pages', (req, res) => {

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

				pagesCollection.find(filters).sort(sort).toArray(function (error, items) {

					if (error) {
						console.log('api :: error :: /pages :: get :: ', error);

						return res.json({
							status: 'database_error'
						});
					}
					else {
						if (items.length > 0) {
							return res.json({
								status: 'items_fetched',
								return: 'pages',
								data: items
							});
						}
						else {
							return res.json({
								status: 'no_items',
								return: 'pages',
								data: []
							});
						}
					}
				});

				break;

			case 'add':
				let newItem = {
					title: postData.title,
					content: postData.content,
					keywords: postData.keywords,
					googleDescription: postData.googleDescription,
					uri: postData.uri,
					featuredImage: JSON.parse(postData.featuredImage),

					authorId: postData.authorId,
					authorFirstName: postData.authorFirstName,
					authorLastName: postData.authorLastName,
					createdAt: now
				};

				pagesCollection.insertOne(newItem, (error, results) => {

					if (error) {
						console.log('api :: error :: /pages :: add :: ', error);

						return res.json({
							status: 'database_error'
						});
					}

					/**
					 * Insert page uri and page type into the resources collection
					 */
					let newResource = {
						pageId: ObjectID(newItem._id),
						uri: postData.uri,
						type: 'page'
					};

					resourcesCollection.insertOne(newResource, (error, newResource) => {
						if (error) {
							console.log(apiUrl + '/pages - new resource: ', error);
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
					title: postData.title,
					content: postData.content,
					keywords: postData.keywords,
					googleDescription: postData.googleDescription,
					uri: postData.uri,
					featuredImage: JSON.parse(postData.featuredImage),

					modifiedBy: postData.modifiedByFirstName + ' ' + postData.modifiedByLastName,
					modifiedCount: postData.modifiedCount,
					authorId: postData.authorId,
					authorFirstName: postData.authorFirstName,
					authorLastName: postData.authorLastName,
					createdAt: postData.createdAt,
					updatedAt: now
				};

				pagesCollection.update({
					_id: ObjectID(postData._id)
				}, updateItem, {}, function (error, result) {
					if (error) {
						console.log('api :: error :: /pages :: set :: ', error);

						return res.json({
							status: 'database_error'
						});
					}

					/**
									 * Update page uri in resources collection
									 */
					let updateResource = {
						pageId: ObjectID(postData._id),
						uri: postData.uri,
						type: 'page'
					};

					resourcesCollection.update({
						pageId: ObjectID(postData._id)
					}, updateResource, {}, function (error, result) {
						if (error) {
							console.log(apiUrl + '/pages - update resource: ', error);
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

				pagesCollection.deleteOne({
					_id: ObjectID(postData._id)
				}, (error, result) => {

					if (error) {
						console.log('api :: error :: /pages :: remove :: ', error);

						return res.json({
							status: 'database_error'
						});
					}

					//Delete page in resources - URI
					resourcesCollection.deleteOne({
						pageId: ObjectID(postData._id)
					}, (error, result) => {

						if (error) {
							console.log(apiUrl + '/pages - remove resource: ', error);
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


				pagesCollection.findOne({
					_id: ObjectID(postData._id)
				}, function (error, item) {

					if (error) {
						console.log('api :: error :: /pages :: get :: ', error);

						return res.json({
							status: 'database_error'
						});
					}
					else {
						if (item) {
							return res.json({
								status: 'item_fetched',
								return: 'page',
								data: item
							});
						}
						else {
							return res.json({
								status: 'no_item',
								return: 'page',
								data: {}
							});
						}
					}
				});

				break;
		}

	});

};