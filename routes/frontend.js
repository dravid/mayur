'use strict';

const MongoClient = require('mongodb').MongoClient;
const fs = require('fs-extra')

const { DESTINATION, createSitemap } = require("../sitemap");


let pagesCollection;
let postsCollection;
let resourcesCollection;

if (process.env.MONGO_URI) {
	// Connect to MongoDB Database and return user connection
	MongoClient.connect(process.env.MONGO_URI, (err, mongoClient) => {
		if (err) {
			throw new Error(err);
		}
		const dbName = process.env.MONGO_URI.split('/').pop().split('?').shift();
		const db = mongoClient.db(dbName);

		postsCollection = db.collection('posts');
		pagesCollection = db.collection('pages');
		resourcesCollection = db.collection('resources');
	});
}

//Device detection
var MobileDetect = require('mobile-detect');

module.exports = (expressApp, nextApp) => {

	if (expressApp === null) {
		throw new Error('expressApp option must be an express server instance');
	}

	//Send device info to custom route ---> this.props.router.query.isMobile  (use withRouter from 'next/router')
	expressApp.get('/', function (req, res) {

		const md = new MobileDetect(req.headers['user-agent']);
		// console.log(md.mobile());          // 'Sony'
		// console.log(md.phone());           // 'Sony'
		// console.log(md.tablet());          // null
		// console.log(md.userAgent());       // 'Safari'
		// console.log(md.os());              // 'AndroidOS'
		// console.log(md.is('iPhone'));      // false
		// console.log(md.is('bot'));         // false
		// console.log(md.version('Webkit'));         // 534.3
		// console.log(md.versionStr('Build'));       // '4.1.A.0.562'
		// console.log(md.match('playstation|xbox')); // false

		req.params['isMobile'] = !!md.mobile();

		return nextApp.render(req, res, '/index', req.params);
	});


	expressApp.get('/blog', function (req, res) {
		return nextApp.render(req, res, '/blog', req.params);
	});

	expressApp.get('/blog/:uri', function (req, res) {
		return nextApp.render(req, res, '/blog/post', req.params);
	});


	//ROBOTS.TXT
	expressApp.get('/robots.txt', (req, res) => {
		nextApp.serveStatic(req, res, path.resolve('./static/robots.txt'))
	})

	expressApp.get('/product/:uri', function (req, res) {
		return nextApp.render(req, res, '/product', req.params);
	});

	//SITEMAP.XML
	expressApp.get('/sitemap.xml', function (req, res) {
		res.header("Content-Type", "application/xml");
		(async function sendXML() {
			let xmlFile = await createSitemap();
			// Send it to the browser
			res.send(xmlFile);
			// Create a file on the selected destination
			fs.writeFileSync(DESTINATION, xmlFile);
		})();
	});

};
