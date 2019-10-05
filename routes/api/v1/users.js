'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const uuid = require('uuid/v4');
const nodemailer = require('nodemailer');
require('dotenv').load();
const log = require('simple-node-logger').createSimpleFileLogger('debug.log');

function validRequest(query) {
	return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

const apiUrl = '/api/v1';
let db;
let usersCollection;
let blockedIpAddressesCollection;
let logsCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

MongoClient.connect(mongoUrl, (err, mongoClient) => {
	if (err) {
		throw new Error(err);
	}

	db = mongoClient.db(process.env.MONGO_DB);
	usersCollection = db.collection('users');
	blockedIpAddressesCollection = db.collection('blockedIpAddresses');
	logsCollection = db.collection('logs');
});

module.exports = (expressApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	/**
	 * Private API endpoint: Users
	 */

	/*
	expressApp.get(apiUrl + '/users', (req, res) => {
		// if (req.user) {
			usersCollection.find({

			}).then(users => {
				if (!users) {
					return res.status(500).json({error: 'db_error'});
				}
				console.log(users);
				res.json(users);
			}).catch(error => {
				console.log(error);
				return res.status(500).json({error: 'unknown_error'});
			});
		// }
		// else {
		// 	return res.status(403).json({error: 'auth_error'});
		// }
	});

	*/

	expressApp.get(apiUrl + '/users/:_id', (req, res) => {

		if (validRequest(req.query)) {

			if (req.params._id === 'new') {
				/**
				 * New user
				 */
				return res.status(200).json({});
			} else {
				/**
				 * Existing user
				 */
				usersCollection.findOne({
					_id: ObjectID(req.params._id)
				}, function (error, item) {
					if (error) {
						console.log(apiUrl + '/users/:_id ', error);
						return res.status(500).json({ error: 'db_error' });
					}

					// if (item.password !== null) {
					// 	delete item.password;
					// }

					return res.status(200).json(item);

				});
			}

		}
		else {
			return res.status(403).json({ error: 'forbidden' });
		}

	});

	expressApp.get(apiUrl + '/users', (req, res) => {


		// console.log('--------- SERVER -------------');
		// console.log(req.connection._httpMessage.locals._csrf);
		// console.log(req.session.cookie._expires);
		// session.csrfToken = req.connection._httpMessage.locals._csrf
		// session.expires = req.session.cookie._expires

		// let ipInfo = req.ipInfo;
		// let xForwardedFor = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '');
		// let ip = xForwardedFor || req.connection.remoteAddress;
		// ipInfo['express_ip'] = req.ip;
		// ipInfo['express_ip_ip'] = ip;

		// log.info(ipInfo);

		if (validRequest(req.query)) {

			/*
			console.log('***********');
			console.log(req.ip);
			console.log('***********');
			console.log(req.hostname);
			console.log('***********');

			const ipInfo = req.ipInfo;
			console.log(ipInfo);
			*/

			usersCollection.find({}).sort({}).toArray(function (error, items) {
				if (error) {
					console.log(apiUrl + '/users: ', error);
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
	 * Private API endpoint: Users
	 */
	expressApp.post(apiUrl + '/users', (req, res) => {

		let now = new Date();
		let postData = req.body;

		// Parameters for `get`
		let filters = {};
		let sort = {};

		switch (postData.action) {

			case 'get':

				filters = postData.filters ? postData.filters : {};
				sort = postData.sort ? postData.sort : {};

				usersCollection.find(filters).sort(sort).toArray(function (error, items) {

					if (error) {
						console.log('api :: error :: /users :: get :: ', error);

						return res.json({
							status: 'database_error'
						});
					}
					else {
						if (items.length > 0) {
							return res.json({
								status: 'items_fetched',
								return: 'users',
								data: items
							});
						}
						else {
							return res.json({
								status: 'no_items',
								return: 'users',
								data: []
							});
						}
					}
				});

				break;

			case 'set':

				// console.log(postData);

				// Convert boolean values

				let updateItem = {
					firstName: postData.firstName ? postData.firstName : "Missing",
					lastName: postData.lastName ? postData.lastName : "Missing",
					email: postData.email ? postData.email : "Missing",
					phone: postData.phone ? postData.phone : "Missing",

					role: postData.role ? postData.role : "user",

					legalType: postData.legalType ? postData.legalType : "private",

					country: postData.country ? postData.country : "Missing",
					state: postData.state ? postData.state : "Missing",
					city: postData.city ? postData.city : "Missing",
					address: postData.address ? postData.address : "Missing",
					zip: postData.zip ? postData.zip : "Missing",

					company: postData.company ? postData.company : "Missing",
					jobTitle: postData.jobTitle ? postData.jobTitle : "Missing",
					description: postData.description ? postData.description : "Missing",

					// agency: postData.agency ? postData.agency : "Not selected",
					// gender: postData.gender ? postData.gender : "Not selected",
					// facebookUrl: postData.facebookUrl ? postData.facebookUrl : "",
					// twitterUrl: postData.twitterUrl ? postData.twitterUrl : "",

					ip: postData.ip ? postData.ip : "Not detected",
					userBlockByEmail: postData.userBlockByEmail,
					userBlockByIpAddress: postData.userBlockByIpAddress,

					createdAt: postData.createdAt,
					updatedBy: postData.moderatorId,
					updatedAt: now
				};

				/**
				 * Block user by IP
				 * if that option is checked
				 * Actions:
				 * - Get user's IP
				 * - Upsert IP to collection blockedIpAddresses
				 * - Set `blockedByIpAddress` to true for all users that have the same ip
				 */
				if (postData.userBlockByIpAddress === true && postData.ip && postData.ip.trim().length > 0) {
					blockedIpAddressesCollection.updateOne({
						ip: postData.ip
					}, {
							$set: {
								ip: postData.ip
							}
						}, {
							upsert: true
						}, function (error, result) {
							if (error) {
								console.log('api :: error :: /users :: set :: blockedByIpAddress :: ', error);
							}

							usersCollection.updateMany({
								ip: postData.ip
							}, {
									$set: {
										userBlockByIpAddress: true
									}
								}, {}, function (error, result) {
									if (error) { console.log('api :: error :: /users :: set :: set :: blockedByIpAddress :: ', error); }
									// console.log('################ BLOCK #####################');
								});
						});
				}

				/**
				 * Unblock user by IP (and all other users that have the same ip)
				 * if that option is checked
				 * Actions:
				 * - Get user's IP
				 * - Remove IP from collection `blockedIpAddresses`
				 * - Set `blockedByIpAddress` to false for all users that have the same ip
				 */
				if (postData.userBlockByIpAddress === false && postData.ip && postData.ip.trim().length > 0) {
					blockedIpAddressesCollection.deleteMany({
						ip: postData.ip
					}, (error, result) => {
						if (error) { console.log('api :: error :: /users :: set :: remove :: blockedByIpAddress :: ', error); }

						usersCollection.updateMany({
							ip: postData.ip
						}, {
								$set: {
									userBlockByIpAddress: false
								}
							}, {}, function (error, result) {
								if (error) { console.log('api :: error :: /users :: set :: set :: blockedByIpAddress :: ', error); }
								// console.log('################ UNBLOCK #####################');
							});

					});
				}

				/**
				 * Change password only if criteria satisfied
				 */
				if (postData.password.trim().length > 0) {
					updateItem.password = postData.password;
				}

				/**
				 * Get user to check for differences
				 */
				usersCollection.findOne({
					_id: ObjectID(postData._id)
				}, function (error, previousUserData) {
					if (error) { console.log('api :: error :: /users :: getOne :: ', error); }

					console.log('OLD USER DATA -----------------------');
					// console.log(previousUserData);

					let changes = [];

					for (let key in previousUserData) {
						if (previousUserData.hasOwnProperty(key) && updateItem.hasOwnProperty(key)) {
							if (previousUserData[key] !== updateItem[key] && key !== 'updatedAt' && key !== 'description') {
								// console.log(key, ' changed from => ', previousUserData[key], ' to => ', updateItem[key]);

								changes.push({
									field: key,
									previousValue: previousUserData[key],
									currentValue: updateItem[key]
								});
							}
						}
					}

					/**
					 * Insert changes into `log` collection if there are changes at all
					 */
					if (changes.length > 0) {
						let log = {
							moderator: {
								id: postData.moderatorId,
								firstName: postData.moderatorFirstName,
								lastName: postData.moderatorLastName
							},
							changes: changes,
							action: 'update',
							entity: 'user',
							ownerId: postData._id,
							createdAt: now
						};

						logsCollection.insertOne(log, (error, results) => {
							if (error) { console.log('api :: error :: /users :: insert log :: ', error); }
						});
					}

					/**
					 * Finally update user
					 */
					usersCollection.updateOne({
						_id: ObjectID(postData._id)
					}, {
							$set: updateItem
						}, {}, function (error, updatedUser) {
							if (error) {
								console.log('api :: error :: /users :: set :: ', error);
								return res.status(500).json({ code: 'db_error', message: error });
							}

							// return res.json({
							// 	status: 'items_updated',
							// 	return: 'result',
							// 	data: result
							// });


							// console.log('NEW USER DATA ******************');
							// console.log(updatedUser);

							return res.status(200).json(updatedUser);
						});
				});

				break;

			case 'add':
				let newItem = {
					firstName: postData.firstName ? postData.firstName : "Missing",
					lastName: postData.lastName ? postData.lastName : "Missing",
					email: postData.email ? postData.email : "Missing",
					phone: postData.phone ? postData.phone : "Missing",

					role: postData.role ? postData.role : "user",

					legalType: postData.legalType ? postData.legalType : "private",

					country: postData.country ? postData.country : "Missing",
					state: postData.state ? postData.state : "Missing",
					city: postData.city ? postData.city : "Missing",
					address: postData.address ? postData.address : "Missing",
					zip: postData.zip ? postData.zip : "Missing",

					company: postData.company ? postData.company : "Missing",
					jobTitle: postData.jobTitle ? postData.jobTitle : "Missing",
					description: postData.description ? postData.description : "Missing",

					// agency: postData.agency ? postData.agency : "Not selected",
					// gender: postData.gender ? postData.gender : "Not selected",
					// facebookUrl: postData.facebookUrl ? postData.facebookUrl : "",
					// twitterUrl: postData.twitterUrl ? postData.twitterUrl : "",

					ip: postData.ip ? postData.ip : "Not detected",
					userBlockByEmail: postData.userBlockByEmail,
					userBlockByIpAddress: postData.userBlockByIpAddress,

					createdAt: now,
					updatedAt: now

				};

				// if (postData.password.trim().length > 0) {
				newItem.password = postData.password;
				// }

				usersCollection.insertOne(newItem, (error, results) => {
					if (error) {
						console.log('api :: error :: /users :: add :: ', error);
						return res.status(500).json({ error: 'db_error' });
					}

					return res.status(200).json(newItem);
				});

				break;

			case 'remove':

				usersCollection.deleteOne({
					_id: ObjectID(postData._id)
				}, (error, result) => {

					if (error) {
						console.log('api :: error :: /users :: remove :: ', error);

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

				if (postData._id === 'new') {
					/**
					 * New user
					 */
					return res.status(200).json({});
				} else {
					/**
					 * Existing user
					 */
					usersCollection.findOne({
						_id: ObjectID(postData._id)
					}, function (error, item) {

						if (error) {
							console.log('api :: error :: /users :: getOne :: ', error);
							return res.status(500).json({ error: 'db_error' });
						}

						return res.status(200).json(item);
					});
				}

				break;
		}

	});

	/**
	 * API endpoint: Users
	 */
	// expressApp.post(apiUrl + '/users', (req, res) => {
	//
	// 	let form = req.body;
	//
	// 	usersCollection.find({}).sort({
	// 		email: 1
	// 	}).toArray(function(error, results) {
	//
	// 		console.log('results API API ***************');
	// 		console.log(results);
	//
	// 		if (error) {
	// 			console.log('api :: error :: /users :: ', error);
	// 			return res.json({
	// 				status: 'database_error'
	// 			});
	// 		}
	// 		else {
	// 			if (results.length > 0) {
	//
	// 				return res.json({
	// 					status: 'users_fetched',
	// 					return: 'users',
	// 					data: results
	// 				});
	// 			}
	// 			else {
	// 				return res.json({
	// 					status: 'zero_users_fetched',
	// 					return: 'users',
	// 					data: results
	// 				});
	// 			}
	// 		}
	// 	});
	//
	// });

};