'use strict';

const nextConfig = require('./next.config');
const next = require('next');
const nextAuth = require('next-auth');
const nextAuthConfig = require('./next-auth.config');
const request = require('request');
const bodyParser = require('body-parser');
const compression = require('compression');

const routes = {
	admin: require('./routes/admin'),
	account: require('./routes/account'),
	auth: require('./routes/auth'),
	frontend: require('./routes/frontend'),
	api: {
		v1: {
			common: require('./routes/api/v1/common'),
			auth: require('./routes/api/v1/auth'),
			users: require('./routes/api/v1/users'),
			posts: require('./routes/api/v1/posts'),
			pages: require('./routes/api/v1/pages'),
			categories: require('./routes/api/v1/categories'),
			subscriptions: require('./routes/api/v1/subscriptions'),
			logs: require('./routes/api/v1/logs'),
			conversations: require('./routes/api/v1/conversations'),
			menus: require('./routes/api/v1/menus'),
			imageupload: require('./routes/api/v1/imageupload'),
			contact: require('./routes/api/v1/contact'),
			orders: require('./routes/api/v1/orders'),
			importcsv: require('./routes/api/v1/importcsv'),
			resources: require('./routes/api/v1/resources'),
			products: {
				products: require('./routes/api/v1/products/products'),
				productsCategories: require('./routes/api/v1/products/productsCategories'),
				productsDescriptors: require('./routes/api/v1/products/productsDescriptors'),
				productsOrders: require('./routes/api/v1/products/productsOrders'),
			}
		}
	}
};

// Load environment variables from .env file if present
require('dotenv').load();

process.on('uncaughtException', function (err) {
	console.error('Uncaught Exception: ', err);
});

process.on('unhandledRejection', (reason, p) => {
	console.error('Unhandled Rejection: Promise:', p, 'Reason:', reason);
});

// Default when run with `npm start` is 'production' and default port is '80'
// `npm run dev` defaults mode to 'development' & port to '3000'
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || 80;

// Initialize Next.js
const nextApp = next({
	dir: '.',
	dev: (process.env.NODE_ENV === 'development')
});

// Add next-auth to next app
nextApp.prepare().then(() => {

	// Load configuration and return config object
	return nextAuthConfig();
}).then(nextAuthOptions => {

	// Pass Next.js App instance and NextAuth options to NextAuth
	// Note We do not pass a port in nextAuthOptions, because we want to add some
	// additional routes before Express starts (if you do pass a port, NextAuth
	// tells NextApp to handle default routing and starts Express automatically).
	return nextAuth(nextApp, nextAuthOptions);
}).then(nextAuthOptions => {

	// Get Express and instance of Express from NextAuth
	const express = nextAuthOptions.express;
	const expressApp = nextAuthOptions.expressApp;

	//MIDDLEWARE**************************************************************

	expressApp.set('trust proxy', true);
	expressApp.use(bodyParser.urlencoded({
		limit: '5mb',
		parameterLimit: 100000,
		type: '*/x-www-form-urlencoded',
		extended: true
	}));
	expressApp.use(bodyParser.json({ limit: '5mb' }));
	expressApp.use(compression());

	// Add Expires header to /static/ folder
	expressApp.get('/*', function (req, res, next) {
		if (req.url.indexOf("/static/") === 0
			// || req.url.indexOf("/static/styles/") === 0 || req.url.indexOf("/static/") === 0
		) {
			res.setHeader("Cache-Control", "public, max-age=2592000");
			// res.setHeader("Cache-Control", "public, max-age=31104000");  //1 year
		}
		next();
	});

	// Serve fonts from ionicon npm module
	expressApp.use('/fonts/ionicons', express.static('./node_modules/ionicons/dist/fonts'));

	/**
	 * Remove trailing slash middleware
	 */
	expressApp.use(function (req, res, next) {
		if (req.url.substr(-1) === '/' && req.url.length > 1) {
			let query = req.url.slice(req.path.length);
			res.redirect(301, req.path.slice(0, -1) + query);
		}
		else {
			next();
		}
	});

	// Add API routes
	routes.api.v1.common(expressApp);
	routes.api.v1.auth(expressApp);
	routes.api.v1.users(expressApp);
	routes.api.v1.posts(expressApp);
	routes.api.v1.pages(expressApp);
	routes.api.v1.categories(expressApp);
	routes.api.v1.subscriptions(expressApp);
	routes.api.v1.logs(expressApp);
	routes.api.v1.conversations(expressApp);
	routes.api.v1.menus(expressApp);
	routes.api.v1.imageupload(expressApp);
	routes.api.v1.contact(expressApp);
	routes.api.v1.orders(expressApp);
	routes.api.v1.importcsv(expressApp);
	routes.api.v1.resources(expressApp);
	routes.api.v1.products.products(expressApp);
	routes.api.v1.products.productsCategories(expressApp);
	routes.api.v1.products.productsDescriptors(expressApp);
	routes.api.v1.products.productsOrders(expressApp);

	// Add admin routes
	routes.admin(expressApp, nextApp);

	// Add auth routes
	routes.auth(expressApp, nextApp);

	// Add account management route - reuses functions defined for NextAuth
	routes.account(expressApp, nextAuthOptions.functions);

	// Add frontend routes
	routes.frontend(expressApp, nextApp);

	expressApp.get('/foo', function (req, res) {
	});

	/**
	 * Products and categories routes
	 */
	// TODO: handle this case (only products)
	// expressApp.get('/proizvodi', (req, res) => {
	// 	return nextApp.render(req, res, '/_products', req.params);
	// });

	// expressApp.get('/proizvodi/*', (req, res) => {
	// 	// Remove `/proizvodi/` from uri query
	// 	let uri = req.url.substring(11);
	// 	let apiUrl = nextConfig.publicRuntimeConfig.serverUrl + '/api/v1/resource-type' + '?uri=' + uri;
	//
	// 	request.get(apiUrl, function(error, response, body) {
	// 		if (error) {
	// 			// TODO: handle this case (request error)
	// 			return nextApp.render(req, res, '/_product', req.params);
	// 		}
	//
	// 		let resource = JSON.parse(body);
	//
	// 		if (resource && resource.type) {
	// 			if (resource.type === 'product_category') {
	// 				return nextApp.render(req, res, '/_products', req.params);
	// 			}
	// 			else if (resource.type === 'container_category') {
	// 				return nextApp.render(req, res, '/_categories', req.params);
	// 			}
	// 			else if (resource.type === 'product') {
	// 				// const queryParams = { title: 'NASLOV' };
	// 				// req.params.push({foo: 'bar'});
	// 				// req.params['foo'] = 'bar';
	// 				//req.foofice = 'barkovic';
	// 				// res.foofice = 'bbbbbbbbb';
	// 				// const queryParams = Object.assign({}, req.params, req.query);
	// 				return nextApp.render(req, res, '/_product', req.params);
	// 				// return nextApp.render(req, res, '/_product', queryParams);
	// 			}
	// 			else {
	// 				// TODO: handle this case (resourceType does not exist)
	// 				return nextApp.render(req, res, '/_product', req.params);
	// 			}
	// 		} else {
	// 			// TODO: handle this case (resource does not exist)
	// 			return nextApp.render(req, res, '/_product', req.params);
	// 		}
	// 	});
	// });

	// Default catch-all handler to allow Next.js to handle all other routes
	expressApp.all('*', (req, res) => {

		const noCache = process.env.CACHE_BUSTER_RANDOM + '=' + process.env.CACHE_BUSTER;
		const uri = req.url.substring(1);

		let apiUrl = process.env.SERVER_URL + '/api/v1/resources?' + noCache + '&uri=' + uri;


		request.get(apiUrl, function (error, response, body) {
			if (error) {
				console.log(error);
			}
			let resource = JSON.parse(body);

			//Catch requests for "page" type and send to page.js else let nextApp handle it 
			if (resource && resource.type && resource.type === 'page') {
				return nextApp.render(req, res, '/page', req.params);
			} else {
				let nextRequestHandler = nextApp.getRequestHandler();
				return nextRequestHandler(req, res);
			}
		});
	});

	expressApp.listen(process.env.PORT, err => {
		if (err) {
			throw err;
		}
		console.log('> Ready on http://localhost:' + process.env.PORT + ' [' + process.env.NODE_ENV + ']');
	});
}).catch(err => {
	console.log('An error occurred, unable to start the server');
	console.log(err);
});
