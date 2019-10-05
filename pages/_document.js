import Document, { Head, Main, NextScript } from 'next/document';
import React from 'react';

import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
const { siteUrl } = publicRuntimeConfig;

export default class DefaultDocument extends Document {
	static async getInitialProps(props) {
		return await Document.getInitialProps(props);
	}

	render() {

		return (
			<html lang={this.props.__NEXT_DATA__.props.lang || 'en'}>
				<Head>
					{/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}
				</Head>
				<body itemScope itemType="http://schema.org/WebPage">
					<meta itemProp="Shop" content="Shop" />
					<Main />
					<NextScript />
				</body>
				<script src={siteUrl + "/static/styles/admin/jquery.min.js"}></script>
				<script src={siteUrl + "/static/styles/admin/jquery.dataTables.min.js"}></script>
				<script src={siteUrl + "/static/styles/admin/bootstrap/bootstrap.min.js"}></script>
			</html>
		);
	}
}

