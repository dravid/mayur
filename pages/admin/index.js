import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl } = publicRuntimeConfig;

import AdminLayout from '../../layouts/AdminLayout';

class Admin extends React.Component {

	static async getInitialProps({ req, res, query }) {

		let session = await NextAuth.init({ req });

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}

		return {
			// namespacesRequired: [],
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req })
		};
	}

	render() {

		return (
			<AdminLayout {...this.props}>

				<div className="container-fluid text-center"
					style={{ height: 'calc(100vh - 110px)' }}>

					<img src="/static/images/logo.png" style={{ height: 120, width: 180 }} />

				</div>

			</AdminLayout>
		);
	}
}

export default Admin;