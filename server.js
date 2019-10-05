const { createServer } = require('http');
const httpProxy = require('http-proxy');
const { parse } = require('url');
const next = require('next');

const nextI18NextMiddleware = require('next-i18next/middleware')
const nextI18next = require('./utils/i18n')

// const PORT = parseInt(process.env.PORT, 10) || 3000;

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer();
const target = 'http://localhost:3001';

app.prepare().then(() => {
	createServer((req, res) => {
		const parsedUrl = parse(req.url, true);
		const { pathname, query } = parsedUrl;

		switch (pathname) {

			/**
			 * Site routes
			 */
			case '/':
				app.render(req, res, '/', query);
				break;

			case '/login':
				app.render(req, res, '/login', query);
				break;

			case '/profile':
				app.render(req, res, '/profile', query);
				break;

			case '/admin/pages/all-pages':
				app.render(req, res, '/admin/pages/AllPages', query);
				break;

			case '/admin/pages/add-new':
				app.render(req, res, '/admin/pages/AddNew', query);
				break;

			case '/admin/users':
				app.render(req, res, '/admin/users/list', query);
				break;

			/**
			 * API routes
			 */
			case '/api/login.js':
				proxy.web(req, res, { target }, error => {
					console.log('Error!', error);
				});
				break;

			case '/api/profile.js':
				proxy.web(req, res, { target }, error => console.log('Error!', error));
				break;

			default:
				handle(req, res, parsedUrl);
				break;
		}
	}).listen(3000, err => {
		if (err) {
			throw err;
		}
		console.log('> Ready on http://localhost:3000');
	});
});

// (async () => {
// 	await app.prepare()
// 	const server = express()

// 	server.use(nextI18NextMiddleware(nextI18next))

// 	server.get('*', (req, res) => handle(req, res))

// 	await server.listen(port)
// 	console.log(`> Ready on http://localhost:${port}`) // eslint-disable-line no-console
// })()

/*
const next = require("next");
const routes = require("./routes");
const PORT = parseInt(process.env.PORT, 10) || 3000;
const app = next({dev: process.env.NODE_ENV !== "production"});
const handler = routes.getRequestHandler(app);

const express = require("express");

app.prepare().then(() => {
	express().use(handler).listen(PORT, () => process.stdout.write(`Point your browser to: http://localhost:${PORT}\n`));
});
*/