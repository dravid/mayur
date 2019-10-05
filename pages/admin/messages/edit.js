import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout';
import { encodeForm } from '../../../utils/api-utils';
import { Input, Select, message, Upload, Icon, Modal } from 'antd';
import Link from "next/link"

const { TextArea } = Input;
const moment = require('moment');
const newDate = moment(new Date()).format('DD.MM.YYYY HH:mm');

class ShowMessage extends React.Component {

	static async getInitialProps({ req, res, query }) {

		let session = await NextAuth.init({ req });
		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		return {
			namespacesRequired: [],
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);
		this.state = {

			firstName: '',
			lastName: '',
			dateOfBirth: '',
			email: '',
			phone: '',
			subject: '',
			message: '',
			timeCreated: ''

		};
	}

	async componentDidMount() {

		console.log(this.props.query)
		// FETCH Message-ID  
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: this.props.query._id,
			action: 'getOne',
		};

		const encodedForm = await encodeForm(formData);

		let pages = await fetch(`${siteUrl}/api/v1/contact`, {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			let response = await res.json();
			if (response.status === 'item_fetched') {
				this.setState({
					firstName: response.data.firstName,
					lastName: response.data.lastName,
					name: response.data.name,
					dateOfBirth: response.data.dateOfBirth,
					email: response.data.email,
					phone: response.data.phone,
					subject: response.data.subject,
					message: response.data.message,
					timeCreated: response.data.createdAt,
				});
			}
		}, 10);
	}


	render() {

		return (

			<AdminLayout {...this.props}>

				<ol className="breadcrumb breadcrumb-quirk">
					<li><a href={siteUrl + "/admin/messages"}><i className="fa fa-home mr5"></i> Home > Messages</a></li>
					<li className="active">Show Message</li>
				</ol>

				<div className="row">
					<div className="col-sm-12 col-md-12 col-lg-12 people-list">

						<div className="people-options clearfix">
							<div className="btn-toolbar pull-left">
								<Link href="/admin/messages">
									<button type="button" className="btn btn-success btn-quirk">All messages</button>
								</Link>
							</div>
						</div>

						{/* CENTER _CHILD CONTENT */}

						<div className="panel" style={{ padding: '30px', width: '100%', minHeight: "576px" }}>
							{this.state.firstName && this.state.firstName.length > 1 ?
								<Input
									style={{ margin: "0px 0px 5px 0px", width: "100%" }}
									disabled
									addonBefore="First name:"
									type='text'
									size="large"
									className="mb-2"
									value={this.state.firstName}
									placeholder="First Name"
								/>
								: null}

							{this.state.lastName && this.state.lastName.length > 1 ?
								<Input
									style={{ margin: "0px 0px 5px 0px", width: "100%" }}
									disabled
									addonBefore="Last name:"
									type='text'
									size="large"
									className="mb-2"
									value={this.state.lastName}
									placeholder="Last Name"
								/>
								: null}

							{this.state.name && this.state.name.length > 1 ?
								<Input
									style={{ margin: "0px 0px 5px 0px", width: "100%" }}
									disabled
									addonBefore="Name:"
									type='text'
									size="large"
									className="mb-2"
									value={this.state.name}
									placeholder="Name"
								/>
								: null}

							{this.state.dateOfBirth && this.state.dateOfBirth.length > 1 ?
								<Input
									style={{ margin: "0px 0px 5px 0px", width: "100%" }}
									disabled
									addonBefore="Date of birth:"
									type='text'
									size="large"
									className="mb-2"
									value={this.state.dateOfBirth}
									placeholder="Date Of Birth"
								/>
								: null}

							{this.state.email && this.state.email.length > 1 ?
								<Input
									style={{ margin: "0px 0px 5px 0px", width: "100%" }}
									disabled
									addonBefore="Email:"
									type='text'
									size="large"
									className="mb-2"
									value={this.state.email}
									placeholder="Email"
								/>
								: null}

							{this.state.phone && this.state.phone.length > 1 ?
								<Input
									style={{ margin: "0px 0px 5px 0px", width: "100%" }}
									disabled
									addonBefore="Phone:"
									type='text'
									size="large"
									className="mb-2"
									value={this.state.phone}
									placeholder="Phone"
								/>
								: null}

							{this.state.subject && this.state.subject.length > 1 ?
								<Input
									style={{ margin: "0px 0px 5px 0px", width: "100%" }}
									disabled
									addonBefore="Subject:"
									type='text'
									size="large"
									className="mb-2"
									value={this.state.subject}
									placeholder="Subject"
								/>
								: null}

							<TextArea
								style={{ margin: "0px 0px 5px 0px", width: "100%" }}
								disabled
								type='text'
								size="large"
								placeholder="Message"
								value={this.state.message}
								autosize={{ minRows: 2, maxRows: 6 }}
							/>

							<Input
								style={{ margin: "0px 0px 5px 0px", width: "100%" }}
								disabled
								addonBefore="Time sent:"
								type='text'
								size="large"
								className="mb-2"
								value={this.state.createdAt}
								placeholder="Time"
							/>

						</div>
					</div>
					{/* CENTER END */}

				</div>
			</AdminLayout >
		);
	}
}

export default ShowMessage;

