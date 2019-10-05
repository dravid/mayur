'use strict';

const MongoClient = require('mongodb').MongoClient;

let usersCollection;
if (process.env.MONGO_URI) {
	// Connect to MongoDB Database and return user connection
	MongoClient.connect(process.env.MONGO_URI, (err, mongoClient) => {
		if (err) {
			throw new Error(err);
		}
		const dbName = process.env.MONGO_URI.split('/').pop().split('?').shift();
		const db = mongoClient.db(dbName);
		usersCollection = db.collection('users');
	});
}

module.exports = (expressApp, nextApp) => {

	if (expressApp === null) {
		throw new Error('expressApp option must be an express server instance');
	}

	//POSTS 
	expressApp.get('/admin/posts/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/posts', req.params);
		}
	});

	expressApp.get('/admin/posts/:id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/posts/edit', req.params);
		}
	});
	// -------------

	//PAGES
	expressApp.get('/admin/pages/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/pages', req.params);
		}
	});

	expressApp.get('/admin/pages/:id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/pages/edit', req.params);
		}
	});
	// ---------------------------

	//CATEGORIES
	expressApp.get('/admin/categories/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/categories', req.params);
		}
	});

	expressApp.get('/admin/categories/:_id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/categories', req.params);
		}
	});
	// ---------------------------


	//USERS
	expressApp.get('/admin/users/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/users', req.params);
		}
	});

	expressApp.get('/admin/users/:_id', function (req, res, query) {
		let checkIfAdmin = (req.user && req.user.role === "admin" || req.user && req.user.role === "user") ? "admin" : "notAdmin";
		if (req.params._id === "new") {
			checkIfAdmin = req.user && req.user.role === "admin" ? "admin" : "notAdmin";
		}
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/users/edit', req.params);
		}
	});

	expressApp.get('/admin/userList', (req, res) => {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}

		const page = (req.query.page && parseInt(req.query.page) > 0) ? parseInt(req.query.page) : 1;
		const sort = (req.query.sort) ? { [req.query.sort]: 1 } : {};

		let size = 10;
		if (req.query.size
			&& parseInt(req.query.size) > 0
			&& parseInt(req.query.size) < 500) {
			size = parseInt(req.query.size);
		}

		const skip = (size * (page - 1) > 0) ? size * (page - 1) : 0;

		let response = {
			users: [],
			page: page,
			size: size,
			sort: req.params.sort,
			total: 0
		};

		if (req.params.sort) {
			response.sort = req.params.sort;
		}
		let result;
		return new Promise(function (resolve, reject) {
			result = usersCollection.find().skip(skip).sort(sort).limit(size);

			result.toArray((err, users) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(users);
				}
			});
		}).then(users => {
			response.users = users;
			return result.count();
		}).then(count => {
			response.total = count;
			return res.json(response);
		}).catch(err => {
			return res.status(500).json(err);
		});
	});
	// ------------------------------

	//MENUS
	expressApp.get('/admin/menus/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/menus', req.params);
		}
	});

	expressApp.get('/admin/menus/:_id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/menus', req.params);
		}
	});
	// ---------------------------

	//STATISTICS
	expressApp.get('/admin/statistics/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/statistics', req.params);
		}
	});
	// ----------------------------

	//SUBSCRIPTIONS
	expressApp.get('/admin/subscriptions/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/subscriptions', req.params);
		}
	});
	// -----------------------

	//PRODUCTS
	expressApp.get('/admin/products/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/products', req.params);
		}
	});

	expressApp.get('/admin/products/:_id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/products/edit', req.params);
		}
	});

	expressApp.get('/admin/products/categories', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/products/categories', req.params);
		}
	});

	expressApp.get('/admin/products/categories/:_id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/products/categories', req.params);
		}
	});

	expressApp.get('/admin/products/descriptors', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/products/descriptors', req.params);
		}
	});

	expressApp.get('/admin/products/descriptors/:_id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/products/descriptors', req.params);
		}
	});

	//MESSAGES
	expressApp.get('/admin/messages/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/messages', req.params);
		}
	});

	expressApp.get('/admin/messages/:_id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/messages/edit', req.params);
		}
	});

	//ORDERS
	expressApp.get('/admin/orders/', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/orders', req.params);
		}
	});

	expressApp.get('/admin/orders/:_id', function (req, res) {
		let checkIfAdmin = (req.user && req.user.role === "admin") ? "admin" : "notAdmin";
		if (checkIfAdmin !== "admin") {
			return res.status('403').send(console.log('For admin eyes only')).end();
		}
		else {
			return nextApp.render(req, res, '/admin/orders/edit', req.params);
		}
	});


};
