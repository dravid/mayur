'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const uuid = require('uuid/v4');
const nodemailer = require('nodemailer');
require('dotenv').load();

const apiUrl = '/api/v1';
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;

let db;
let usersCollection;
let locationsCollection;
let logsCollection;

MongoClient.connect(mongoUrl, (err, mongoClient) => {
	if (err) {
		throw new Error(err);
	}

	db = mongoClient.db(process.env.MONGO_DB);
	usersCollection = db.collection('users');
	locationsCollection = db.collection('locations');
	logsCollection = db.collection('logs');
});

module.exports = (expressApp) => {

	if (expressApp === null) {
		throw new Error('Error: expressApp option must be an express server instance');
	}

	/**
	 * API endpoint: Sign up
	 */
	expressApp.post(apiUrl + '/sign-up', (req, res) => {

		let form = req.body;

		// TODO: form validation

		usersCollection.findOne({

			email: form.email

		}, (err, existingUser) => {

			if (err) {
				console.log(err);

				return res.json({
					status: 'database_error'
				});
			}

			if (!existingUser) {
				/**
				 * New user
				 * - Persist to the database
				 * - Send verification email
				 * - Return message that verification email has been sent
				 */

				const emailToken = uuid();
				const emailVerificationUrl = process.env.SERVER_URL + process.env.EMAIL_VERIFICATION_PATH + '/' + emailToken;

				usersCollection.insertOne({
					email: form.email,
					password: form.password,
					role: 'user',
					browser: form.browser,
					os: form.os,
					city: "",
					state: "",
					country: "",
					firstName: "",
					lastName: "",
					ip: "",
					gender: "",
					blockedByEmail: false,
					blockedByIpAddress: false,
					emailVerified: false,
					emailToken: emailToken
				}, (err, newUser) => {

					if (err) {
						console.log(err);

						return res.json({
							status: 'database_error'
						});
					}

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
						to: form.email,

						// Subject of the message. Nodemailer is unicode friendly ✔
						subject: "Please verify your account",

						// HTML body
						html: `Thank you for your registration!<br><br>Use the link below to verify your email:<br><a href="${emailVerificationUrl}">Verify email</a>`

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
								status: 'verification_email_sent',
								return: null,
								data: null
							});
						}
					});

					/*
					// Direct transport

					let transporter = nodemailer.createTransport({
						service: process.env.EMAIL_SERVICE,
						auth: {
							user: process.env.EMAIL_FROM,
							pass: process.env.EMAIL_PASSWORD
						}
					});

					let emailMessage = `
										Thank you for your registration!<br><br>
										Use the link below to verify your email:<br>
										${emailVerificationUrl}
									`;

					const mailOptions = {
						from: process.env.EMAIL_FROM,
						to: process.env.EMAIL_FROM,
						subject: 'Verify your account',
						html: emailMessage
					};

					transporter.sendMail(mailOptions, function(err, info) {

						if (err) {

							console.log(err);

							return res.json({
								status: 'send_email_error'
							});

						}
						else {
							// console.log(info);

							return res.json({
								status: 'verification_email_sent',
								return: null,
								data: null
							});
						}

					});
					*/
				});
			}
			else {

				/**
				 * Existing user
				 * - Return message that user already exists
				 */

				return res.json({
					status: 'user_already_exists',
					return: 'existingUser',
					data: existingUser
				});

			}

		});

	});

	/**
	 * API endpoint: Sign in
	 */
	expressApp.post(apiUrl + '/sign-in', (req, res) => {

		let form = req.body;
		let now = new Date();

		// TODO: form validation

		usersCollection.findOne({

			email: form.email,
			password: form.password

		}, (err, existingUser) => {

			if (err) {
				console.log(err);

				return res.json({
					status: 'database_error'
				});
			}

			if (!existingUser) {

				/**
				 * E-mail and/or password doesn't match
				 * - Return message about wrong credentials
				 */

				return res.json({
					status: 'wrong_credentials',
					return: null,
					data: null
				});
			}
			else {

				/**
				 * Check if user is blocked by e-mail
				 */
				if (existingUser.hasOwnProperty('blockedByEmail') && existingUser.blockedByEmail === true) {
					/**
					 * User is blocked by e-mail
					 */
					return res.json({
						status: 'user_blocked',
						return: 'null',
						data: null
					});
				} else {
					/**
					 * Insert changes into `log` collection if there are changes at all
					 */
					let log = {
						moderator: {
							id: existingUser._id.toString(),
							firstName: existingUser.firstName ? existingUser.firstName : '',
							lastName: existingUser.lastName ? existingUser.lastName : '',
						},
						changes: [],
						action: 'sign_in',
						entity: 'user',
						ownerId: existingUser._id.toString(),
						createdAt: now
					};

					logsCollection.insertOne(log, (error, results) => {
						if (error) { console.log('api :: error :: /sign-in :: insert log :: ', error); }
					});

					/**
					 * E-mail and password match
					 * - Return message that access is granted
					 */
					return res.json({
						status: 'access_granted',
						return: 'null',
						data: null
					});
				}

			}

		});
	});


	/**
	 * API endpoint: Forgot password 
	 */
	expressApp.post(apiUrl + '/forgot-password', (req, res) => {

		let form = req.body;
		let now = new Date();
		const passwordToken = uuid();
		const passwordRecoveryUrl = process.env.SERVER_URL + process.env.PASSWORD_RECOVERY_PATH + '/' + passwordToken;

		usersCollection.findOne({

			email: form.email,

		}, (err, existingUser) => {

			if (err) {
				console.log(err);

				return res.json({
					status: 'database_error'
				});
			}

			if (!existingUser) {

				/**
				 * Requested email not in user collection
				 */

				return res.json({
					status: 'no_mail',
					return: null,
					data: null
				});
			}
			else {

				//Insert password-reset Token 
				usersCollection.updateOne({
					email: form.email,
				}, {
						$set: {
							passwordToken: passwordToken
						}
					}
				)

				/**
				 * Check if user is blocked by e-mail
				 */
				if (existingUser.hasOwnProperty('blockedByEmail') && existingUser.blockedByEmail === true) {
					/**
					 * User is blocked by e-mail
					 */
					return res.json({
						status: 'user_blocked',
						return: 'null',
						data: null
					});
				} else {
					/**
					 * Insert changes into `log` collection if there are changes at all
					 */
					let log = {
						moderator: {
							id: existingUser._id.toString(),
							firstName: existingUser.firstName ? existingUser.firstName : '',
							lastName: existingUser.lastName ? existingUser.lastName : '',
						},
						changes: [],
						action: 'password_recovery',
						entity: 'user',
						ownerId: existingUser._id.toString(),
						createdAt: now
					};

					logsCollection.insertOne(log, (error, results) => {
						if (error) { console.log('api :: error :: /forgot-password :: insert log :: ', error); }
					});



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
						to: form.email,

						// Subject of the message. Nodemailer is unicode friendly ✔
						subject: "Please reset your password",

						// HTML body
						html: `Please use link below to reset your password:<br><br><br><a href="${passwordRecoveryUrl}">Reset password</a>`

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
								status: 'verification_email_sent',
								return: null,
								data: null
							});
						}
					});


					/**
					 * E-mail password recovery sent
					 */
					return res.json({
						status: 'verification_email_sent',
						return: 'null',
						data: null
					});
				}

			}

		});
	});



};