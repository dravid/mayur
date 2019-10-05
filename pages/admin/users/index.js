import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from './../../../layouts/AdminLayout.js';
import Link from 'next/link';
import fetch from 'isomorphic-fetch';
import Router from 'next/router';
import { Select } from 'antd';


const Option = Select.Option;

class Users extends React.Component {

	static async getInitialProps({ req, res, query }) {

		let session = await NextAuth.init({ req });

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}

		let usersResponse = await fetch(`${siteUrl}/api/v1/users?${noCache}`);
		let users = await usersResponse.json();
		users = users.error ? [] : users;

		return {
			users: users,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req })
		};
	}

	constructor(props) {
		super(props);

		this.state = {
			users: this.props.users,
			filteredUsers: this.props.users,
		};
		this.addUser = this.addUser.bind(this);

	}

	//Filter handlers

	addUser(e) {
		e.preventDefault();

		Router.push('/admin/users/new');
	}

	render() {


		let usersCount = this.state.users ? this.state.users.length : 0;

		return (
			<div style={{ position: 'relative' }}>

				<AdminLayout {...this.props}>

					<ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin"}><i className="fa fa-home mr5"></i> Home</a></li>
						<li className="active">Users</li>
					</ol>

					<div className="row">
						<div className="col-sm-12 col-md-12 col-lg-12 people-list">

							<div className="people-options clearfix">
								<div className="btn-toolbar pull-left">
								</div>

								<div className="btn-toolbar pull-left">
									<button type="button" className="btn btn-success btn-quirk" onClick={this.addUser}>Add User</button>
								</div>
								<span className="people-count pull-right">Showing <strong>1-{usersCount}</strong> of <strong>{usersCount}</strong> users</span>
							</div>

							{this.props.users.map((user, index) => {
									const browser = user.browser ? user.browser : 'Chrome';
									const os = user.os ? user.os : 'Windows';
									const firstName = user.firstName ? user.firstName : '';
									const lastName = user.lastName ? user.lastName : '';
									const email = user.email ? user.email : '';
									const phone = user.phone ? user.phone : '';
									const jobTitle = user.jobTitle ? user.jobTitle : '';
									const userUrl = "/admin/users/" + user._id;

									// Prepare full name
									let fullName = '';

									if (firstName.trim().length > 0 && lastName.trim().length > 0) {
										fullName = firstName + ' ' + lastName;
									}

									// Get location data
									const city = user.city ? user.city : '';
									const state = user.state ? user.state : '';
									const country = user.country ? user.country : '';

									// Build location string
									let locationArray = [];
									if (city.trim().length > 0) { locationArray.push(city); }
									if (state.trim().length > 0) { locationArray.push(state); }
									if (country.trim().length > 0) { locationArray.push(country); }
									let location = locationArray.join(', ');

									return (

										<div className="panel panel-profile list-view" key={index}>
											<div className="panel-heading">
												<div className="media">
													<div className="media-left">
														<Link href={userUrl}>
															<a href="">
																<img className="media-object img-circle" src="/static/images/common/photos/user1.png" alt="" />
															</a>
														</Link>
													</div>
													<div className="media-body">
														<h4 className="media-heading">{fullName.length > 0 ? fullName : user.email}</h4>
														<p className="media-usermeta"><i className="glyphicon glyphicon-briefcase"></i> {jobTitle}</p>
													</div>
												</div>

												<ul className="panel-options">
													<li><a className="tooltips" href="" data-toggle="tooltip" title="View Options"><i className="glyphicon glyphicon-option-vertical"></i></a></li>
												</ul>
											</div>

											<div className="panel-body people-info">
												<div className="row">
													<div className="col-sm-4">
														<div className="info-group">
															<label>Location</label>
															{location.length > 0 ? location : <span>&nbsp;</span>}
														</div>
													</div>
													<div className="col-sm-4">
														<div className="info-group">
															<label>Email</label>
															{email}
														</div>
													</div>
													<div className="col-sm-4">
														<div className="info-group">
															<label>Phone</label>
															{phone.length > 0 ? phone : <span>&nbsp;</span>}
														</div>
													</div>
												</div>

												<div className="row">
													<div className="col-sm-4">
														<div className="info-group">
															<label>Operating System</label>
															<h4>{os}</h4>
														</div>
													</div>
													<div className="col-sm-4">
														<div className="info-group">
															<label>Browser</label>
															<h4>{browser}</h4>
														</div>
													</div>
													<div className="col-sm-4">
														<div className="info-group">
															<label>Social</label>
															<div className="social-account-list">
																<i className="fa fa-facebook-official"></i>
																<i className="fa fa-twitter"></i>
																<i className="fa fa-dribbble"></i>
															</div>
														</div>
													</div>
												</div>

											</div>
										</div>

									);
								})}


						</div>

					</div>


				</AdminLayout>


			</div>
		);
	}
}

export default Users;