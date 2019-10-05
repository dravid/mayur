'use strict';

const fs = require('fs-extra')
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();
const moment = require('moment');


const imagePath = "static/images/"
const apiUrl = '/api/v1';
let db;
let postsCollection;
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
	postsCollection = db.collection('posts');
	resourcesCollection = db.collection('resources');
});

module.exports = (expressApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	//fetch all posts
	expressApp.get(apiUrl + '/posts', (req, res) => {

		if (validRequest(req.query)) {

			postsCollection.find({}).sort({}).toArray(function (error, items) {
				if (error) {
					console.log(apiUrl + '/posts: ', error);
					return res.status(500).json({ error: 'db_error' });
				}
				return res.status(200).json(items);
			});

		}
		else {
			return res.status(403).json({ error: 'forbidden' });
		}

	});

	// GET PAGE BY URI
	expressApp.get(apiUrl + '/posts/:uri', (req, res) => {

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
				postsCollection.findOne({
					uri: req.params.uri
				}, function (error, item) {
					if (error) {
						console.log(apiUrl + '/posts/:uri ', error);
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

	expressApp.get(apiUrl + '/posts/:_id', (req, res) => {

		if (validRequest(req.query)) {

			if (req.params._id === 'new') {
				/**
				 * New post
				 */
				return res.status(200).json({});
			} else {
				/**
				 * Existing post
				 */
				console.dir(req.params)

				postsCollection.findOne({
					_id: ObjectID(req.params._id),
				}, function (error, item) {
					if (error) {
						console.log(apiUrl + '/posts/:_id ', error);
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



	/**
	 * Private API endpoint: Posts
	 * 
	 * 
	 */
	expressApp.post(apiUrl + '/posts', (req, res) => {

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

				postsCollection.find(filters).sort(sort).toArray(function (error, items) {

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


			case 'add':
				let newItem = {
					title: postData.title,
					content: postData.content,
					keywords: postData.keywords,
					categories: postData.categories.split(","),
					googleDescription: postData.googleDescription,
					uri: postData.uri,
					featuredImage: JSON.parse(postData.featuredImage),

					authorId: postData.authorId,
					authorFirstName: postData.authorFirstName,
					authorLastName: postData.authorLastName,
					createdAt: now
				};

				postsCollection.insertOne(newItem, (error, results) => {

					if (error) {
						console.log('api :: error :: /posts :: add :: ', error);

						return res.json({
							status: 'database_error'
						});
					}

					/**
					 * Insert post uri and page type into the resources collection
					 */
					let newResource = {
						postId: ObjectID(newItem._id),
						uri: postData.uri,
						type: 'post'
					};

					resourcesCollection.insertOne(newResource, (error, newResource) => {
						if (error) {
							console.log(apiUrl + '/posts - new resource: ', error);
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
					categories: postData.categories.split(","),
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

				postsCollection.update({
					_id: ObjectID(postData._id)
				}, updateItem, {}, function (error, result) {
					if (error) {
						console.log('api :: error :: /posts :: set :: ', error);

						return res.json({
							status: 'database_error'
						});
					}

					/**
									 * Update post uri in resources collection
									 */
					let updateResource = {
						postId: ObjectID(postData._id),
						uri: postData.uri,
						type: 'post'
					};

					resourcesCollection.update({
						postId: ObjectID(postData._id)
					}, updateResource, {}, function (error, result) {
						if (error) {
							console.log(apiUrl + '/posts - update resource: ', error);
							return res.status(500).json({ error: 'db_error' });
						}

						return res.json({
							status: 'items_updated',
							return: 'result',
							data: result
						});
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

					//Delete post in resources - URI
					resourcesCollection.deleteOne({
						postId: ObjectID(postData._id)
					}, (error, result) => {

						if (error) {
							console.log(apiUrl + '/posts - remove resource: ', error);
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