import React from 'react';
import { NextAuth } from 'next-auth/client';
import { encodeForm } from './../../utils/api-utils.js';
import { isValidEmail, isValidPassword } from './../../utils/form-utils.js';
import $ from 'jquery';
import Head from 'next/head';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl } = publicRuntimeConfig;
let platform = require('platform');

export default class extends React.Component {

	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		if (res && session && session.user) {
			res.redirect('/admin');
		}

		return {
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req })
		};
	}

	constructor(props) {
		super(props);
		this.state = {
			email: '',
			password: '',
			repeatPassword: '',
			session: this.props.session
		};
	}

	hideMessages = () => {
		$('#invalid_email').css('display', 'none');
		$('#invalid_password').css('display', 'none');
		$('#passwords_do_not_match').css('display', 'none');
		$('#system_error').css('display', 'none');
	}

	componentDidMount = async () => {
		// if (this.props.session.user) {
		// 	Router.push(`/auth/`);
		// }
	}

	handleEmailChange = (event) => {
		this.hideMessages();

		this.setState({
			email: event.target.value
		});
	}

	handlePasswordChange = (event) => {
		this.hideMessages();

		this.setState({
			password: event.target.value
		});
	}

	handleRepeatPasswordChange = (event) => {
		this.hideMessages();

		this.setState({
			repeatPassword: event.target.value
		});
	}

	handleSignInSubmit = async (event) => {
		event.preventDefault();

		this.hideMessages();

		// Validation
		if (!isValidEmail(this.state.email)) {
			$('#invalid_email').css('display', 'inline');
			return false;
		}

		if (!isValidPassword(this.state.password)) {
			$('#invalid_password').css('display', 'inline');
			return false;
		}

		if (this.state.password !== this.state.repeatPassword) {
			$('#passwords_do_not_match').css('display', 'inline');
			return false;
		}

		//console.log(JSON.stringify(platform, null, 4));

		let browser = platform.name ? platform.name : '';
		let os = platform.os && platform.os.family ? platform.os.family : '';


		const formData = {
			_csrf: await NextAuth.csrfToken(),
			email: this.state.email,
			browser: browser,
			os: os,
			password: this.state.password,
			actionType: 'sign_up'
		};

		const encodedForm = await encodeForm(formData);

		fetch('/api/v1/sign-up', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			let response = await res.json();

			switch (response.status) {
				case 'verification_email_sent':
					$('#sign_up_form').fadeOut(function () {
						$('#verification_email_sent').fadeIn();
					});
					break;
				case 'user_already_exists':
					$('#sign_up_form').fadeOut(function () {
						$('#user_already_exists').fadeIn();
					});
					break;
				case 'database_error':
					// 'We have some technical issues with database. Please try it later.';
					break;
				case 'send_email_error':
					// 'We have some technical issues with email server. Please try it later.';
					break;
			}

		});

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
						<meta name="sign_in" content="" />
						<link rel="stylesheet" href={siteUrl + "/static/styles/admin/quirk.css"} />
						<link rel="stylesheet" href={siteUrl + "/static/styles/admin/font-awesome.css"} />
					</Head>

					<div className="sign-overlay"></div>
					<div className="signpanel"></div>

					<div className="signup">

						<div className="sign-up-message" id="verification_email_sent"
							style={{ display: 'none', width: '500px', margin: 'auto' }}>
							{/*<h3 className="signtitle mb20">Thank you for signing up.<br/>Email with a verification link has been sent to your email address.</h3>*/}

							<div className="sign-sidebar">
								<h3 className="signtitle mb20">Thank you for signing up!</h3>
								<br />
								<h4 className="panel-title" style={{ fontSize: '16px' }}>Email with a verification link<br />has been sent
									to your email address.</h4>
								<h4 className="panel-title" style={{ fontSize: '16px' }}>Please verify your email by clicking on it.</h4>
							</div>

						</div>

						<div className="sign-up-message" id="user_already_exists" style={{ display: 'none' }}>
							<h3 className="signtitle mb20">This email already exists.<br />Please login <a style={{ color: 'white' }}
								href="/auth/sign-in">here</a>.
							</h3>
						</div>

						<div className="row" id="sign_up_form">
							<div className="col-sm-5">
								<div className="panel">
									<div className="panel-heading">
										<h1>Quirk</h1>
										<h4 className="panel-title">Create an Account!</h4>
									</div>
									<div className="panel-body">
										{/*<button className="btn btn-primary btn-quirk btn-fb btn-block">Sign Up Using Facebook</button>*/}
										{/*<div className="or">or</div>*/}
										<form id="signin" method="post" action="/auth/signin" onSubmit={this.handleSignInSubmit}>
											<input name="_csrf" type="hidden" value={this.state.session.csrfToken} />
											<input name="action_type" type="hidden" value="sign_up" />
											<div className="form-group mb15">
												<input type="text" className="form-control" style={{ border: 'none' }}
													placeholder="Enter Your E-mail" name="email" value={this.state.email}
													onChange={this.handleEmailChange} />
											</div>
											<div className="form-group mb15">
												<input type="password" className="form-control" style={{ border: 'none' }}
													placeholder="Enter Your Password" name="password" value={this.state.password}
													onChange={this.handlePasswordChange} />
											</div>
											<div className="form-group mb15" style={{ marginBottom: '0' }}>
												<input type="password" className="form-control" style={{ border: 'none' }}
													placeholder="Repeat Your Password" name="repeatPassword"
													value={this.state.repeatPassword}
													onChange={this.handleRepeatPasswordChange} />
											</div>
											{/* BIRTH DATE */}
											{/*<div className="form-group mb20">*/}
											{/*<label className="ckbox">*/}
											{/*<input type="checkbox" name="checkbox"/>*/}
											{/*<span>Accept terms and conditions</span>*/}
											{/*</label>*/}
											{/*</div>*/}

											<div className="auth-message">
												<p id="invalid_email" style={{ display: 'none' }}>Please input valid e-mail</p>
												<p id="invalid_password" style={{ display: 'none' }}>Password must have minimum 8 characters</p>
												<p id="passwords_do_not_match" style={{ display: 'none' }}>Passwords do not match</p>
												<p id="system_error" style={{ display: 'none' }}>We have some technical issues. Please try it
													later</p>
											</div>

											<div className="form-group">
												<button className="btn btn-success btn-quirk btn-block">Create Account</button>
											</div>
										</form>
									</div>

								</div>

							</div>

							<div className="col-sm-7">
								<div className="sign-sidebar">
									<h3 className="signtitle mb20">Two Good Reasons to Love Quirk</h3>
									{/*<p>When it comes to websites or apps, one of the first impression you consider is the design. It needs to be high quality enough otherwise you will lose potential*/}
									{/*users*/}
									{/*due to bad design.</p>*/}
									{/*<p>Below are some of the reasons why you love Quirk.</p>*/}

									<br />

									<h4 className="reason">1. Attractive</h4>
									<p>When your website or app is attractive to use, your users will not simply be using it, they’ll look
										forward to using it. This means that you should fashion the
										look
										and feel of your interface for your users.</p>

									<br />

									<h4 className="reason">2. Responsive</h4>
									<p>Responsive Web design is the approach that suggests that design and development should respond to
										the user’s behavior and environment based on screen size,
										platform and orientation. This would eliminate the need for a different design and development phase
										for each new gadget on the market.</p>

									<hr className="invisible" />

									<div className="form-group">
										<a href="/auth/sign-in"
											className="btn btn-default btn-quirk btn-stroke btn-stroke-thin btn-block btn-sign">Already a
											member? Sign In Now!</a>
									</div>
								</div>

							</div>


							{/*<div className="col-sm-7">*/}

							{/*</div>*/}


						</div>
					</div>

				</div>
			);
		}
	}
}