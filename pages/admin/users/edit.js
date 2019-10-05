import React, { Component } from 'react';
import Link from 'next/link';
import { NextAuth } from 'next-auth/client';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;

import AdminLayout from './../../../layouts/AdminLayout.js';
import fetch from 'isomorphic-fetch';
import $ from 'jquery';
import { encodeForm } from './../../../utils/api-utils.js';
import { isValidEmail, isValidPassword } from './../../../utils/form-utils.js';

const moment = require('moment');

class NewPage extends React.Component {

	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}

		// Get user data
		let user = {};
		let userResponse = await fetch(`${siteUrl}/api/v1/users/${query._id}?${noCache}`);
		if (userResponse.status === 200) {
			user = await userResponse.json();
		}

		// Get user's logs (query params: action', entity, ownerId)
		let logs = [];
		let logsResponse = await fetch(`${siteUrl}/api/v1/logs?${noCache}&ownerId=${user._id}`);
		if (logsResponse.status === 200) {
			logs = await logsResponse.json();
		}

		// Get user's posts (query params: action', entity, userId)
		let posts = [];
		let postsResponse = await fetch(`${siteUrl}/api/v1/posts?${noCache}&authorId=${user._id}`);
		if (postsResponse.status === 200) {
			posts = await postsResponse.json();
		}


		return {
			reqq: query._id,
			posts: posts,
			ip: req.ip ? req.ip : '',
			user: user,
			logs: logs,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);

		this.state = {
			session: this.props.session,
			ip: this.props.ip,
			user: this.props.user,
			logs: this.props.logs,
			posts: this.props.posts,
			userBlockByEmail: false,
			userBlockByIpAddress: false,
			userFullName: this.props.user.firstName + ' ' + this.props.user.lastName,

			//user post controls
			postSliceControl: 60,

		};

	}

	async componentDidMount() {


		// Fetch user
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: this.props.query._id,
			action: 'getOne'
		};

		await fetch(`${siteUrl}/api/v1/users`, {
			credentials: 'include',
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
				"Accept": "application/json"
			},
			body: JSON.stringify(formData)
		}).then(async res => {

			if (res.status === 200) {
				this.setState({ user: await res.json() });
			}
			else {
				this.setState({ user: {} });
			}
			this.setState({ userBlockByEmail: this.state.user.userBlockByEmail === "true" ? true : false, userBlockByIpAddress: this.state.user.userBlockByIpAddress === "true" ? true : false })

		});
	}

	userBlockByEmailHandler = () => {
		this.setState({ userBlockByEmail: !this.state.userBlockByEmail });
	}

	userBlockByIpAddressHandler = () => {
		this.setState({ userBlockByIpAddress: !this.state.userBlockByIpAddress });
	}

	addUser = async (e) => {
		e.preventDefault();

		if (!isValidEmail($('#userEmail').val())) {
			alert('Please insert valid e-mail!');
			return false;
		}
		if (!isValidPassword($('#userPassword').val())) {
			alert('Please insert valid password!. Password must have at least 8 characters.');
			return false;
		}

		let self = this;

		let firstName = $('#userFirstName').val();
		let lastName = $('#userLastName').val();
		let email = $('#userEmail').val();
		let phone = $('#userPhone').val();

		let password = $('#userPassword').val();
		let role = $('#userRole').val();

		let legalType = $('#legalType').val();

		let country = $('#userCountry').val();
		let state = $('#userState').val();
		let city = $('#userCity').val();
		let address = $('#userAddress').val();
		let zip = $('#userZip').val();

		let company = $('#userCompany').val();
		let jobTitle = $('#userJobTitle').val();
		let description = $('#userDescription').val();

		// let agency = $('#userAgency').val();
		// let role = $('#userRole').val();
		// let facebookUrl = $('#userFacebookUrl').val();
		// let twitterUrl = $('#userTwitterUrl').val();


		let ip = $('#ipAddress').val();

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			firstName: firstName,
			lastName: lastName,
			email: email,
			phone: phone,

			password: password,
			role: role,

			legalType: legalType,

			country: country,
			state: state,
			city: city,
			address: address,
			zip: zip,

			company: company,
			jobTitle: jobTitle,
			description: description,

			// gender: gender,
			// facebookUrl: facebookUrl,
			// twitterUrl: twitterUrl,
			// agency: agency,

			ip: ip,
			userBlockByEmail: this.state.userBlockByEmail,
			userBlockByIpAddress: this.state.userBlockByIpAddress,
			action: 'add',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/users', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async response => {

			if (response.status === 200) {

				let newUser = await response.json();

				setTimeout(function () {
					window.location.href = '/admin/users/' + newUser._id;
				}, 500);

			}
			else {

				// self.setState({
				// 	user: {}
				// });

				alert('We have technical difficulties! Please try later.');

			}

		});

	}

	updateProfile = async (e) => {
		e.preventDefault();

		if (!isValidEmail($('#userEmail').val())) {
			alert('Please insert valid e-mail!');
			return false;
		}

		if (!isValidPassword($('#userPassword').val())) {
			alert('Please insert valid password!. Password must have at least 8 characters.');
			return false;
		}

		let self = this;

		let moderatorId = '';
		let moderatorFirstName = '';
		let moderatorLastName = '';

		if (self.props.session && self.props.session.user) {
			let moderator = self.props.session.user;

			moderatorId = moderator.id ? moderator.id : '';
			moderatorFirstName = moderator.firstName ? moderator.firstName : '';
			moderatorLastName = moderator.lastName ? moderator.lastName : '';
		}

		let firstName = $('#userFirstName').val();
		let lastName = $('#userLastName').val();
		let email = $('#userEmail').val();
		let phone = $('#userPhone').val();

		let password = $('#userPassword').val();
		let role = $('#userRole').val();

		let legalType = $('#legalType').val();

		let state = $('#userState').val();
		let country = $('#userCountry').val();
		let city = $('#userCity').val();
		let address = $('#userAddress').val();
		let zip = $('#userZip').val();

		let company = $('#userCompany').val();
		let jobTitle = $('#userJobTitle').val();
		let description = $('#userDescription').val();


		// let agency = $('#userAgency').val();
		// let facebookUrl = $('#userFacebookUrl').val();
		// let twitterUrl = $('#userTwitterUrl').val();

		let ip = $('#ipAddress').val();

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			_id: this.props.query._id,

			firstName: firstName,
			lastName: lastName,
			email: email,
			phone: phone,

			password: password,
			role: role,

			legalType: legalType,

			country: country,
			state: state,
			city: city,
			address: address,
			zip: zip,

			company: company,
			jobTitle: jobTitle,
			description: description,

			// gender: gender,
			// facebookUrl: facebookUrl,
			// twitterUrl: twitterUrl,
			// agency: agency,

			ip: ip,
			userBlockByEmail: this.state.userBlockByEmail,
			userBlockByIpAddress: this.state.userBlockByIpAddress,

			moderatorId: moderatorId,
			moderatorFirstName: moderatorFirstName,
			moderatorLastName: moderatorLastName,

			createdAt: this.state.user.createdAt,

			action: 'set'
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/users', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async response => {

			console.log(response);

			if (response.status === 200) {

				let updatedUser = await response.json();

				setTimeout(function () {
					window.location.href = siteUrl + '/';
				}, 500);

			}
			else {

				// self.setState({
				// 	user: {}
				// });

				alert('We have technical difficulties! Please try later.');

				setTimeout(function () {
					window.location.href = siteUrl + '/';
				}, 300);
			}

		});

	}


	//USER POSTS CONTROLS
	deletePostHandler = async (_id, uri) => {
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: _id,
			uri: uri,
			action: "remove"
		};

		const encodedForm = await encodeForm(formData);

		let posts = await fetch(`${siteUrl}/api/v1/posts`, {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			let response = await res.json();
			console.log(response);

			if (response.status === 'item_deleted') {
				console.log("removed");
				window.location.reload();
				// window.location.href = '/admin/posts';
			}
		});
	}

	showPostControl = () => {
		if (this.state.postSliceControl === 60) {
			this.setState({ postSliceControl: 999999 });
			console.log(this.state.postSliceControl);
		}
		else {
			this.setState({ postSliceControl: 60 });
			console.log(this.state.postSliceControl);
		}
	}

	//END OF USER POSTS CONTROLS


	render() {


		let firstName = this.state.user && this.state.user.firstName ? this.state.user.firstName : '';
		let lastName = this.state.user && this.state.user.lastName ? this.state.user.lastName : '';
		let email = this.state.user && this.state.user.email ? this.state.user.email : '';
		let phone = this.state.user && this.state.user.phone ? this.state.user.phone : '';

		let password = this.state.user && this.state.user.password ? this.state.user.password : '';
		let role = this.state.user && this.state.user.role ? this.state.user.role : 'user';

		let legalType = this.state.user && this.state.user.legalType ? this.state.user.legalType : 'private';

		let country = this.state.user && this.state.user.country ? this.state.user.country : '';
		let state = this.state.user && this.state.user.state ? this.state.user.state : '';
		let city = this.state.user && this.state.user.city ? this.state.user.city : '';
		let address = this.state.user && this.state.user.address ? this.state.user.address : '';
		let zip = this.state.user && this.state.user.zip ? this.state.user.zip : '';

		let company = this.state.user && this.state.user.company ? this.state.user.company : '';
		let jobTitle = this.state.user && this.state.user.jobTitle ? this.state.user.jobTitle : '';
		let description = this.state.user && this.state.user.description ? this.state.user.description : '';

		// let gender = this.state.user && this.state.user.gender ? this.state.user.gender : '';
		// let facebookUrl = this.state.user && this.state.user.facebookUrl ? this.state.user.facebookUrl : '';
		// let twitterUrl = this.state.user && this.state.user.twitterUrl ? this.state.user.twitterUrl : '';
		// let agency = this.state.user && this.state.user.agency ? this.state.user.agency : '';

		let ipAddress = this.state.user && this.state.user.ip ? this.state.user.ip : '';


		// Build location string
		let locationArray = [];
		let location = '';

		if (city.trim().length > 0) { locationArray.push(city); }
		if (state.trim().length > 0) { locationArray.push(state); }
		if (country.trim().length > 0) { locationArray.push(country); }

		location = locationArray.join(', ');

		//Posts
		const posts = this.state.posts ? this.state.posts : [];

		// Check if new user
		let newUser = this.props.query && this.props.query._id === "new" ? true : false;

		//Check if admin

		let adminRights = this.props.session && this.props.session.user.role === 'admin' ? true : false;

		return (
			<AdminLayout {...this.props}>

				<div className="row profile-wrapper">
					<div className="col-xs-12 col-md-3 col-lg-2 profile-left">
						<div className="profile-left-heading">
							<ul className="panel-options">
								<li><a><i className="glyphicon glyphicon-option-vertical"></i></a></li>
							</ul>
							<a href="" className="profile-photo"><img className="img-circle img-responsive" src={require("../../../static/images/common/photos/profilepic.png")} alt="profile" /></a>
							<h2 className="profile-name" style={{ margin: '10px 0 6px 0' }}>{firstName} {lastName}</h2>
							<h4 className="profile-designation">{email}</h4>
							{/* <h4 className="profile-designation">{agency}</h4> */}


							<ul className="list-group">
								<li className="list-group-item">Posts <a href="#">{posts ? posts.length : 0}</a></li>
								{/*<li className="list-group-item">Following <a href="people-directory.html">541</a></li>*/}
								{/*<li className="list-group-item">Followers <a href="people-directory-grid.html">32,434</a></li>*/}
							</ul>

							{/*<button className="btn btn-danger btn-quirk btn-block profile-btn-follow">Follow</button>*/}

						</div>
						<div className="profile-left-body">
							<h4 className="panel-title">About Me</h4>
							{description}
							{/*<p>Social media ninja. Pop culture enthusiast. Zombie fanatic. General tv evangelist.</p>*/}
							{/*<p>Alcohol fanatic. Explorer. Passionate reader. Entrepreneur. Lifelong coffee advocate. Avid bacon aficionado. Travel evangelist.</p>*/}

							<hr className="fadeout" />

							<h4 className="panel-title">Location</h4>
							<p><i className="glyphicon glyphicon-map-marker mr5"></i> {location}</p>

							<hr className="fadeout" />

							<h4 className="panel-title">Company</h4>
							<p><i className="glyphicon glyphicon-briefcase mr5"></i> {company}</p>

							<hr className="fadeout" />

							<h4 className="panel-title">Contacts</h4>
							<p><i className="glyphicon glyphicon-phone mr5"></i> {phone}</p>

							<hr className="fadeout" />

							<h4 className="panel-title">Social</h4>
							<ul className="list-inline profile-social">
								<li><a href=""><i className="fa fa-facebook-official"></i></a></li>
								<li><a href=""><i className="fa fa-twitter"></i></a></li>
								<li><a href=""><i className="fa fa-dribbble"></i></a></li>
								<li><a href=""><i className="fa fa-linkedin"></i></a></li>
							</ul>

						</div>
					</div>
					<div className="col-md-6 col-lg-8 profile-right">
						<div className="profile-right-body">


							{newUser ?
								<ul className="nav nav-tabs nav-justified nav-line">
									<li className="active" style={{ width: '1%' }}>
										<a href="#edit_profile" data-toggle="tab">
											<strong>New User</strong>
										</a>
									</li>
								</ul>
								:
								<ul className="nav nav-tabs nav-justified nav-line">
									<li className="active">
										<a href="#edit_profile" data-toggle="tab">
											<strong>Edit Profile</strong>
										</a>
									</li>
									<li><a href="#logs" data-toggle="tab"><strong>Logs</strong></a></li>
									<li><a href="#posts" data-toggle="tab"><strong>Posts</strong></a></li>
									{/* <li><a href="#orders" data-toggle="tab"><strong>Orders</strong></a></li> */}
									{/*<li><a href="#places" data-toggle="tab"><strong>Places</strong></a></li>*/}
								</ul>
							}


							<div className="tab-content">

								<div className="tab-pane active" id="edit_profile">

									{newUser ?
										<h4 className="panel-title">New User</h4>
										:
										<h4 className="panel-title">Edit Profile</h4>
									}

									<hr style={{ visibility: 'hidden' }} />

									<form id="basicForm" action="form-validation.html" className="form-horizontal" noValidate="novalidate">

										<div className="form-group">
											<label className="col-sm-3 control-label">First Name</label>
											<div className="col-sm-8">
												<input id="userFirstName" defaultValue={firstName} type="text" name="name" className="form-control uni-input" placeholder="First Name" required={true}
													aria-required="true" aria-invalid="true" />
												{/* <label id="name-error" className="error" htmlFor="name">This field is required.</label> */}
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Last Name</label>
											<div className="col-sm-8">
												<input id="userLastName" defaultValue={lastName} type="text" name="name" className="form-control uni-input" placeholder="Last Name" required={true}
													aria-required="true" aria-invalid="true" />
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Email</label>
											<div className="col-sm-8">
												<input id="userEmail" defaultValue={email} type="email" name="email" className="form-control uni-input" placeholder="E-mail" required={true}
													aria-required="true" />
												{/*<label id="email-error" className="error" htmlFor="email">This field is required.</label>*/}
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Phone</label>
											<div className="col-sm-8">
												<input id="userPhone" defaultValue={phone} type="text" name="name" className="form-control uni-input" placeholder="Phone" required="" aria-required="true"
													aria-invalid="true" />
												{/*<label id="name-error" className="error" htmlFor="name">This field is required.</label>*/}
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Password</label>
											<div className="col-sm-8">
												<input id="userPassword" defaultValue={password} type="password" name="password" className="form-control uni-input" placeholder="Password" required=""
													aria-required="true" />
												{/*<label id="email-error" className="error" htmlFor="email">This field is required.</label>*/}
											</div>
										</div>

										{adminRights ?
											<div className="form-group">
												<label className="col-sm-3 control-label">Role</label>
												<div className="col-sm-8">

													<div className="form-group">
														<select id="userRole" defaultValue={role} className="form-control" style={{ width: '100%', marginTop: '-14px' }} data-placeholder="User Role...">
															<option value="admin">Admin</option>
															<option value="user">User</option>
															<option value="agency">Agency</option>
														</select>
													</div>

												</div>
											</div>
											:
											<div className="form-group">
												<label className="col-sm-3 control-label">Role</label>
												<div className="col-sm-8">

													<div className="form-group">
														<select id="userRole" defaultValue={role} disabled className="form-control" style={{ width: '100%', marginTop: '-14px' }} data-placeholder="User Role...">
															<option value="user">User</option>
														</select>
													</div>

												</div>
											</div>
										}

										<div className="form-group">
											<label className="col-sm-3 control-label">Legal type</label>
											<div className="col-sm-8">

												<div className="form-group">
													<select id="legalType" defaultValue={legalType} className="form-control" style={{ width: '100%', marginTop: '-14px' }} data-placeholder="User legal type...">
														<option value="private">Private</option>
														<option value="corporate">Corporate</option>
													</select>
												</div>

											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Country</label>
											<div className="col-sm-8">
												<input id="userCountry" defaultValue={country} type="text" name="name" className="form-control uni-input" placeholder="Country" required=""
													aria-required="true" aria-invalid="true" />
												{/*<label id="name-error" className="error" htmlFor="name">This field is required.</label>*/}
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">State</label>
											<div className="col-sm-8">
												<input id="userState" defaultValue={state} type="text" name="name" className="form-control uni-input" placeholder="State" required="" aria-required="true"
													aria-invalid="true" />
												{/*<label id="name-error" className="error" htmlFor="name">This field is required.</label>*/}
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">City</label>
											<div className="col-sm-8">
												<input id="userCity" defaultValue={city} type="text" name="name" className="form-control uni-input" placeholder="City" required="" aria-required="true"
													aria-invalid="true" />
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Address</label>
											<div className="col-sm-8">
												<input id="userAddress" defaultValue={address} type="text" name="name" className="form-control uni-input" placeholder="Address" required="" aria-required="true"
													aria-invalid="true" />
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Zip code</label>
											<div className="col-sm-8">
												<input id="userZip" defaultValue={zip} type="text" name="name" className="form-control uni-input" placeholder="Zip code" required="" aria-required="true"
													aria-invalid="true" />
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Company</label>
											<div className="col-sm-8">
												<input id="userCompany" defaultValue={company} type="text" name="name" className="form-control uni-input" placeholder="Company" required=""
													aria-required="true" aria-invalid="true" />
												{/*<label id="name-error" className="error" htmlFor="name">This field is required.</label>*/}
											</div>
										</div>

										<div className="form-group">
											<label className="col-sm-3 control-label">Job Title</label>
											<div className="col-sm-8">
												<input id="userJobTitle" defaultValue={jobTitle} type="text" name="name" className="form-control uni-input" placeholder="Job Title" required=""
													aria-required="true" aria-invalid="true" />
												{/*<label id="name-error" className="error" htmlFor="name">This field is required.</label>*/}
											</div>
										</div>


										<div className="form-group">
											<label className="col-sm-3 control-label">Description</label>
											<div className="col-sm-8">
												<textarea id="userDescription" defaultValue={description} className="form-control" rows="3"
													placeholder="About me" data-autosize-on="true"
													style={{ overflow: 'hidden', overflowWrap: 'break-word', resize: 'horizontal', height: '100px' }}>
												</textarea>
											</div>
										</div>


										{/* <div className="form-group">
											<label className="col-sm-3 control-label">Gender</label>
											<div className="col-sm-8">

												<div className="form-group">
													<select id="userGender" defaultValue={gender} className="form-control" style={{ width: '100%', marginTop: '-14px' }} data-placeholder="Gender...">
														<option value="">Choose gender</option>
														<option value="male">Male</option>
														<option value="female">Female</option>
													</select>
												</div>

											</div>
										</div> */}

										{/* <div className="form-group">
											<label className="col-sm-3 control-label">Facebook URL</label>
											<div className="col-sm-8">
												<input id="userFacebookUrl" defaultValue={facebookUrl} type="text" name="name" className="form-control uni-input" placeholder="Facebook URL" required=""
													aria-required="true" aria-invalid="true" />
												<label id="name-error" className="error" htmlFor="name">This field is required.</label>
											</div>
										</div> */}

										{/* <div className="form-group">
											<label className="col-sm-3 control-label">Twitter URL</label>
											<div className="col-sm-8">
												<input id="userTwitterUrl" defaultValue={twitterUrl} type="text" name="name" className="form-control uni-input" placeholder="Twitter URL" required=""
													aria-required="true" aria-invalid="true" />
												<label id="name-error" className="error" htmlFor="name">This field is required.</label>
											</div>
										</div> */}

										{/* <div className="form-group">
											<label className="col-sm-3 control-label">Agency name</label>
											<div className="col-sm-8">
												<input id="userAgency" defaultValue={agency} type="text" name="name" className="form-control uni-input" placeholder="Agency name" required=""
													aria-required="true" aria-invalid="true" />
											</div>
										</div> */}

										{/* <div className="form-group">
											<label className="col-sm-3 control-label">Site</label>
											<div className="col-sm-8">
												<input id="userSite" defaultValue={site} type="text" name="name" className="form-control uni-input" placeholder="Site" required="" aria-required="true"
													aria-invalid="true" />
												<label id="name-error" className="error" htmlFor="name">This field is required.</label>
											</div>
										</div> */}

										{adminRights ?
											<div className="form-group">
												<label className="col-sm-3 control-label">IP address:</label>
												<div className="col-sm-8">
													<input id="ipAddress" defaultValue={ipAddress} type="text" name="name" className="form-control uni-input" placeholder="IP address" required=""
														aria-required="true" aria-invalid="true" />
													{/*<label id="name-error" className="error" htmlFor="name">This field is required.</label>*/}
												</div>
											</div>
											: null}

										{adminRights ?
											<div className="form-group">
												<label className="col-sm-3 control-label">Block User</label>
												<div className="col-sm-8" style={{ marginTop: '10px' }}>

													<label className="ckbox ckbox-success">
														<input id="userBlockByEmail" type="checkbox" value={this.state.userBlockByEmail} checked={this.state.userBlockByEmail} onChange={this.userBlockByEmailHandler} /><span>By E-mail</span>
													</label>

													<label className="ckbox ckbox-success">
														<input id="userBlockByIpAddress" type="checkbox" value={this.state.userBlockByIpAddress} checked={this.state.userBlockByIpAddress} onChange={this.userBlockByIpAddressHandler} /><span>By IP address {ipAddress}</span>
													</label>

												</div>
											</div>
											: null}


										<hr style={{ visibility: 'hidden' }} />


										<hr style={{ visibility: 'hidden' }} />


										<div className="row">
											<div className="col-sm-9 col-sm-offset-3">

												{newUser ?
													<button className="btn btn-success btn-quirk btn-wide mr5" onClick={this.addUser}>Add New User</button>
													:
													<button className="btn btn-success btn-quirk btn-wide mr5" onClick={this.updateProfile}>Update Profile</button>
												}

											</div>
										</div>

									</form>


								</div>



								<div className="tab-pane" id="logs">


									{this.state.logs.map((log, index) => {

										let logDate = log.createdAt ? moment(log.createdAt).format('DD.MM.YYYY HH:mm') : '';
										let subTitle = '';
										subTitle = log.action === 'update' ? 'Changed by: ' : '';
										subTitle = log.action === 'sign_in' ? 'Sign in: ' : '';

										return (

											<div className="panel panel-post-item" key={index}>

												<div className="panel-heading">
													<div className="media">
														{/*<div className="media-left">*/}
														{/*<a href="#">*/}
														{/*<img alt="" src="../../../static/images/common/photos/profilepic.png" className="media-object img-circle"/>*/}
														{/*</a>*/}
														{/*</div>*/}
														<div className="media-body">
															<h4 className="media-heading">{subTitle}{log.moderator.firstName} {log.moderator.lastName}</h4>
															<p className="media-usermeta">
																<span className="media-time">{logDate}</span>
															</p>
														</div>
													</div>
												</div>

												{log.changes.length > 0 ?
													(
														<div className="panel-body">
															<p>Data changed:</p>
															{log.changes.map((change, changeIndex) => {
																let previousValue = change.previousValue === true ? 'true' : change.previousValue;
																let currentValue = change.currentValue === false ? 'false' : change.currentValue;

																return (
																	<div style={{ width: '100%' }} key={changeIndex}>
																		<span style={{ fontWeight: 'bold' }}>{change.field}</span> from <span style={{ fontWeight: 'bold' }}>{previousValue}</span> to <span
																			style={{ fontWeight: 'bold' }}>{currentValue}</span></div>
																);
															})}
														</div>
													)
													:
													null
												}

											</div>
										);

									})}

								</div>


								{/* USER POSTS */}
								<div className="tab-pane" id="posts" style={{ visibility: newUser ? 'hidden' : 'visible' }}>

									{posts.map((post, index) => {
										// posts.slice((this.state.posts ? (this.state.posts.length - 5) : ''), (this.state.posts ? this.state.posts.length : '')).map((post, index) => {
										const title = post.title ? post.title : '';
										const createdAt = post.createdAt ? post.createdAt : '';
										const description = post.googleDescription ? post.googleDescription : "";
										const categories = post.categories ? post.categories : "Uncategories";
										const postUrl = "/blog/" + post.uri;
										const editUrl = "/admin/posts/" + post._id;

										return (
											<div className="panel panel-post-item" key={index}>
												<div className="panel-heading">
													<div className="media">
														<div className="media-left">
															<a href="#">
																<img alt="" src="../../../static/images/common/photos/profilepic.png" className="media-object img-circle" />
															</a>
														</div>
														<div className="media-body">
															<h4 className="media-heading">{firstName} {lastName}</h4>
															<p className="media-usermeta">
																<span className="media-time">{createdAt}</span>
															</p>
														</div>
													</div>
												</div>


												<div className="panel-body" style={{ border: "1px solid #ccc", padding: "20px" }}>


													<h3>{title.length > 60 ? `${title.toUpperCase().slice(0, 60)}...` : title.toUpperCase()}</h3>

													<p>{description}</p>
													<p style={{ fontSize: "11px" }}>Category: {categories}</p>

													{/* POST CONTROLS */}
													<div style={{ float: 'right' }} className="text-info">

														{/* Show post */}
														<Link href={postUrl}>
															<i className="glyphicon glyphicon-eye-open controls" />
														</Link>

														{/* Edit post */}
														<Link href={editUrl}>
															<i className="glyphicon glyphicon-edit controls" />
														</Link>

														{/* Delete post */}
														<i className="glyphicon glyphicon-trash controls" onClick={() => this.deletePostHandler(page._id, page.uri)} />


													</div>

												</div>

											</div>

										);
									})}

								</div>

								{/* ----------END USER POSTS---------------- */}


								{/* USER ORDERS */}
								{/* <div className="tab-pane" id="orders" style={{ visibility: newUser ? 'hidden' : 'visible' }}>

									<h4 className="panel-title">Messages</h4>

									<div className="panel panel-post-item">
										<div className="panel-heading">
											<div className="media">
												<div className="media-left">
													<a href="#">
														<img alt="" src="../../../static/images/common/photos/profilepic.png" className="media-object img-circle" />
													</a>
												</div>
												<div className="media-body">
													<h4 className="media-heading">Barbara Balashova</h4>
													<p className="media-usermeta">
														<span className="media-time">July 06, 2015 8:30am</span>
													</p>
												</div>
											</div>

										</div>

										<div className="panel-body">
											<p>As a web designer it’s your job to help users find their way to what they’re looking for. It can be easy to put the needs of your users to one side, but
												knowing your users, understanding their roles, goals, motives and behavior will confirm how you structure your navigation model. <a
													href="http://goo.gl/QTccRE" target="_blank">#information</a> <a href="http://goo.gl/QTccRE" target="_blank">#design</a></p>
											<p>Source: <a href="http://goo.gl/QTccRE" target="_blank">http://goo.gl/QTccRE</a></p>

										</div>
										<div className="panel-footer">
											<ul className="list-inline">
												<li><a href=""><i className="glyphicon glyphicon-heart"></i> Like</a></li>
												<li><a><i className="glyphicon glyphicon-comment"></i> Comments (0)</a></li>
												<li className="pull-right">5 liked this</li>
											</ul>
										</div>
										<div className="form-group">
											<input type="text" className="form-control" placeholder="Write some comments" />
										</div>
									</div>


								</div> */}
								{/* ----------END MESSAGES----------------- */}


							</div>
						</div>

					</div>

				</div>


			</AdminLayout>
		);
	}
}

export default NewPage;