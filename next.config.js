const devUrl = 'http://localhost:3300';
const prodUrl = 'http://unishop.concordsoft.solutions';
const cacheBusterRandom = 'Forbiden info';
const cacheBuster = 'Forbiden info';
const withPlugins = require('next-compose-plugins');
const optimizedImages = require('next-optimized-images');
const withCss = require('@zeit/next-css');
const withPurgeCss = require('next-purgecss');

const nextConfig = {
	publicRuntimeConfig: {
		weatherApi: '',
		mapBoxApi: '',
		devUrl: devUrl,
		prodUrl: prodUrl,
		withCss: withCss(withPurgeCss()),
		siteUrl: (process.env.NODE_ENV !== 'production') ? devUrl : prodUrl,
		cacheBusterRandom: 'Forbiden info',
		cacheBuster: 'Forbiden info',
		noCache: cacheBusterRandom + '=' + cacheBuster,
		constants: {
			signUp: {
				userExists: 'user_exists',
				verificationEmailSent: 'verification_email_sent'
			}
		}
	},
	cssLoaderOptions: {
		importLoaders: 1,
		localIdentName: "[local]_[hash:base64:5]"
	},
	jest: {
		"moduleFileExtensions": [
		"json"
		]
		},
	onDemandEntries: {
		maxInactiveAge: 1000 * 60 * 60,
		pagesBufferLength: 5
	},
	webpack: config => config
};


module.exports = withPlugins([
	[optimizedImages, {
		// these are the default values so you don't have to provide them if they are good enough for your use-case.
		// but you can overwrite them here with any valid value you want.
		inlineImageLimit: 32768,
		imagesFolder: 'images',
		imagesName: '[name]-[hash].[ext]',
		handleImages: ['jpeg', 'png', 'webp'],
		optimizeImages: true,
		optimizeImagesInDev: true,
		mozjpeg: {
			quality: 70,
		},
		optipng: {
			optimizationLevel: 3,
		},
		webp: {
			preset: 'default',
			quality: 60,
		},
	}],
	[withCss],
	[withPurgeCss, {
		purgeCss: {
			whitelist: () => ['body']
		}
	}],
], nextConfig);

