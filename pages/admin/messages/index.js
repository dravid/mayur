import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;

import Link from "next/link";

import AdminLayout from './../../../layouts/AdminLayout.js';
import { encodeForm } from './../../../utils/api-utils.js';
import { Input, notification, Popconfirm, Upload, Modal, Icon } from 'antd';

const notificationMessage = (type, message, description) => {
	notification[type]({
		message: message,
		description: description,
		duration: 1.5,
		placement: "bottomRight"
	});
};

class Messages extends React.Component {
	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		let messages = [];
		let messagesResponse = await fetch(`${siteUrl}/api/v1/contact?${noCache}`);
		if (messagesResponse.status === 200) {
			messages = await messagesResponse.json();
		}

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		return {
			messages: messages,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
		};
	}
	constructor(props) {
		super(props);
		this.state = {
			messages: this.props.messages,
			filterFirstName: '',
			filterSubject: '',
		};

	}

	async componentDidMount() {


		await setTimeout(function () {
			$('#example').DataTable();
		}, 500);
	}

	deleteMessageHandler = async (_id) => {
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: _id,
			type: "messages",
			action: "remove"
		};

		const encodedForm = await encodeForm(formData);

		let messages = await fetch(`${siteUrl}/api/v1/contact`, {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			let response = await res.json();

			if (response.status === 'database_error') {
				notificationMessage('error', 'Greska', 'Doslo je do greske u sistemu');
				console.log('database_error');
			}

			if (response.status === 'item_deleted') {
				notificationMessage('success', 'Uspeh', 'Poruka je uspesno obrisana.')
			}
			else {
				console.log('unknown_status');
			}
			setTimeout(function () {
				window.location.reload();
			}, 700)
		});
	}

	render() {

		const textConfirm = 'This action will delete message, are you sure?';

		return (
			<div style={{ position: 'relative' }}>
				<AdminLayout {...this.props}>

					<ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin"}><i className="fa fa-home mr5"></i> Home</a></li>
						<li className="active">Messages</li>
					</ol>

					<div className="row">
						<div className="col-sm-12 col-md-12 col-lg-12 people-list">

							<div className="people-options clearfix">


								{/* <div className="btn-group pull-right people-pager">
									<button type="button" className="btn btn-default"><i className="fa fa-chevron-left"></i></button>
									<button type="button" className="btn btn-default"><i className="fa fa-chevron-right"></i></button>
								</div> */}

								<span className="people-count pull-right">Showing <strong>1-10</strong> of <strong>{this.state.messages ? this.state.messages.length : ''}</strong> messages</span>
							</div>

							{/* START CENTER CONTENT */}

							<div className="panel">
								<div className="panel-body">
									<div className="table-responsive">

										<table id="example" className="table table-bordered table-striped-col">

											<thead>

												<tr>
													<th>Name</th>
													<th>Subject</th>
													<th>Email</th>
													<th>Text</th>
													<th>Date</th>
													<th>Action</th>
												</tr>

											</thead>

											<tbody>

												{/* RENDER PAGES */}

												{this.props.messages
													.map((message, index) => {
														const subject = message.subject ? message.subject : '';
														const createdAt = message.createdAt ? message.createdAt : '';
														const firstName = message.firstName ? message.firstName : '';
														const email = message.email ? message.email : '';
														const lastName = message.lastName ? message.lastName : '';
														const text = message.message ? message.message : '';
														const messageUrl = "/admin/messages/" + message._id;
														const name = message.name ? message.name : '';

														let fullName = '';

														// Full name

														if (firstName.length > 1 && lastName.length > 1) {

															if (firstName && firstName !== 'undefined' && firstName.trim().length > 0) {
																fullName += firstName + ' ';
															}
															if (lastName && lastName !== 'undefined' && lastName.trim().length > 0) {
																fullName += lastName;
															}
														}
														else {
															fullName = name;
														}
														//------------

														return (
															<tr key={index}>
																<td>{fullName}</td>
																<td>{subject.length > 0 ? subject : 'No subject'}</td>
																<td >{email}</td>
																<td >{text.slice(0, 25)}</td>
																<td>{createdAt}</td>
																<td className="text-info">

																	{/* Show message */}
																	<Link href={messageUrl}>
																		<i className="glyphicon glyphicon-eye-open controls" />
																	</Link>

																	{/* Delete message */}
																	<Popconfirm placement="left" title={textConfirm}
																		onConfirm={() => this.deleteMessageHandler(message._id)} okText="Yes"
																		cancelText="No">
																		<i className="glyphicon glyphicon-trash controls" />
																	</Popconfirm>

																</td>
															</tr>
														);
													})}

												{/* -----------END RENDER PAGES-------- */}

											</tbody>
										</table>

									</div>
								</div>
							</div>
						</div>


						{/* END CENTER CONTENT */}

					</div>

				</AdminLayout>
			</div>
		);
	}
}

export default Messages;