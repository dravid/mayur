import React from 'react';
import { NextAuth } from 'next-auth/client';
import SignInForm from '../../components/auth/sign-in-form';
import Head from 'next/head';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl } = publicRuntimeConfig;

export default class extends React.Component {

	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		if (res && session && session.user) {
			res.redirect('/admin');
		}

		return {
			ip: req && req.ip ? req.ip : '',
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req })
		};
	}

	constructor(props) {
		super(props);
		this.state = {
			session: this.props.session
		};
	}

	async componentDidMount() {

	}

	render() {
		if (this.props.session.user) {
			return null;
		} else {
			return (
				<div className="signwrapper">

					<Head>
						<title>Sign in</title>
						<meta charSet="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
						<meta name="description" content="" />
						<meta name="author" content="" />
						<link rel="stylesheet" href={siteUrl + "/static/styles/admin/quirk.css"} />
						<link rel="stylesheet" href={siteUrl + "/static/styles/admin/font-awesome.css"} />
					</Head>

					<div className="sign-overlay"></div>
					<div className="signpanel"></div>

					<SignInForm {...this.props} />

				</div>
			);
		}
	}
}