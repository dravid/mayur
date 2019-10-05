'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const uuid = require('uuid/v4');
const nodemailer = require('nodemailer');
require('dotenv').load();

const apiUrl = '/api/v1';
let db;
let usersCollection;
let blockedIpAddressesCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

MongoClient.connect(mongoUrl, (err, mongoClient) => {
	if (err) {
		throw new Error(err);
	}

	db = mongoClient.db(process.env.MONGO_DB);
	usersCollection = db.collection('users');
	blockedIpAddressesCollection = db.collection('blockedIpAddresses');
});

module.exports = (expressApp, nextApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	/**
	 * API endpoint: sign in
	 */
	expressApp.get('/auth/sign-in', async (req, res) => {
		// const ipInfo = req.ipInfo;
		// let xForwardedFor = (req.headers['x-forwarded-for'] || '').replace(/:\d+$/, '');
		// let ip = xForwardedFor || req.connection.remoteAddress;
		//
		// ipInfo['express_ip'] = req.ip;
		// ipInfo['express_ip_ip'] = ip;
		//
		// res.send(ipInfo);

		if (req.ip) {
			/**
			 * Check if IP is blocked
			 */
			blockedIpAddressesCollection.findOne({
				ip: req.ip
			}, function (error, item) {

				if (error) {
					console.log('api :: error :: /users :: getOne :: ', error);
					res.status(204).redirect('/');
				}

				if (item) {
					return nextApp.render(req, res, '/auth/forbidden', req.params);
				}
				else {
					return nextApp.render(req, res, '/auth/sign-in', req.params);
				}
			});
		}

	});

	/**
	 * API endpoint: sign in
	 */
	expressApp.get('/auth/sign-up', async (req, res) => {

		if (req.ip) {
			/**
			 * Check if IP is blocked
			 */
			blockedIpAddressesCollection.findOne({
				ip: req.ip
			}, function (error, item) {

				if (error) {
					console.log('api :: error :: /users :: getOne :: ', error);
					res.status(204).redirect('/');
				}

				if (item) {
					return nextApp.render(req, res, '/auth/forbidden', req.params);
				}
				else {
					return nextApp.render(req, res, '/auth/sign-up', req.params);
				}
			});
		}

	});

	/**
	 * API endpoint: E-mail verification
	 */
	expressApp.get('/auth/email-verification', (req, res) => {
		res.status(204).redirect('/auth/sign-up');
	});

	expressApp.get('/auth/email-verification/:token', async (req, res) => {

		usersCollection.findOne({
			emailToken: req.params.token
		}, (err, user) => {

			if (err) {
				console.log(err);
				res.status(204).redirect('/auth/sign-up');
			}

			if (!user) {
				/**
				 * User with given emailVerificationToken does not exist
				 * - Redirect to sign up page
				 */

				res.status(204).redirect('/auth/sign-up');
			}
			else {
				/**
				 * User with given emailVerificationToken exists
				 * - Update user data field `emailVerified` and remove field `emailToken`
				 * - Redirect to email verification page
				 */

				usersCollection.updateOne({
					_id: ObjectID(user._id)
				}, {
						$set: {
							emailVerified: true,
							passwordToken: ''
						}
					}, function (error, response) {
						if (error) {
							console.log(error);
							res.status(204).redirect('/auth/sign-up');
						}
						console.log('AFTER ');
						return nextApp.render(req, res, '/auth/email-verification', req.params);
					});
			}

		});

	});



	/**
 * API endpoint: Password-recovery verification
 */
	expressApp.get('/auth/password-recovery', (req, res) => {
		res.status(204).redirect('/auth/sign-up');
	});


	let temporaryPassword = Math.random().toString(36).slice(2);

	expressApp.get('/auth/password-recovery/:token', async (req, res) => {

		usersCollection.findOne({
			passwordToken: req.params.token
		}, (err, user) => {

			if (err) {
				console.log(err);
				res.status(204).redirect('/auth/sign-up');
			}

			if (!user) {
				/**
				 * User with given password recovery token does not exist
				 * - Redirect to sign up page
				 */

				res.status(204).redirect('/auth/sign-up');
			}
			else {
				/**
				 * User with given token exists
				 * - Create random temporary password and send it to the user
				 * - 
				 */

				usersCollection.updateOne({
					_id: ObjectID(user._id)
				}, {
						$set: {
							password: temporaryPassword,
							passwordToken: ''

						}
					}, function (error, response) {
						if (error) {
							console.log(error);
							res.status(204).redirect('/auth/sign-up');
						}
						console.log('Sending email with new password');

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
							to: user.email,

							// Subject of the message. Nodemailer is unicode friendly ✔
							subject: "Temporary password.",

							// HTML body
							html: `Here is your temporary password, please change it in user settings.<br /> <br /> ${temporaryPassword}`

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

						console.log('FINISH ');
						return nextApp.render(req, res, '/auth/password-recovery', req.params);
					});
			}

		});

	});

};