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
			session: this.props.session
		};
	}

	hideMessages = () => {
		$('#invalid_email').css('display', 'none');
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

	handleSignInSubmit = async (event) => {
		event.preventDefault();

		this.hideMessages();

		// Validation
		if (!isValidEmail(this.state.email)) {
			$('#invalid_email').css('display', 'inline');
			return false;
		}

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			email: this.state.email,
			actionType: 'forgot_password'
		};

		const encodedForm = await encodeForm(formData);

		fetch('/api/v1/forgot-password', {
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

				case 'no_mail':
					$('#sign_up_form').fadeOut(function () {
						$('#no_such_user').fadeIn();
					});
					break;

				case 'user_blocked':
					$('#sign_up_form').fadeOut(function () {
						$('#user_blocked').fadeIn();
					});
					break;

				case 'database_error':
					// 'We have some technical issues with database. Please try it later.';
					break;
				case 'send_email_error':
					$('#sign_up_form').fadeOut(function () {
						$('#send_email_error').fadeIn();
					});
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
						<title>Password recovery</title>
						<meta charSet="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
						<meta name="password_recovery" content="" />
						<link rel="stylesheet" href={siteUrl + "/static/styles/admin/quirk.css"} />
						<link rel="stylesheet" href={siteUrl + "/static/styles/admin/font-awesome.css"} />
					</Head>

					<div className="sign-overlay"></div>
					<div className="signpanel"></div>

					<div className="signup">

						{/* Recovery email sent - notification */}
						<div className="sign-up-message" id="verification_email_sent" style={{ display: 'none' }}>
							<h3 className="signtitle mb20">Email with a instructions <br />has been sent
									to your email address.</h3>
						</div>

						{/* No such email - notification */}
						<div className="sign-up-message" id="no_such_user" style={{ display: 'none' }}>
							<h3 className="signtitle mb20">There is no such e-mail in out database.<br />Please check for errors and try again.</h3>
						</div>

						{/* User is blocked - notification*/}
						<div className="sign-up-message" id="user_blocked" style={{ display: 'none' }}>
							<h3 className="signtitle mb20">This user is blocked.</h3>
						</div>

						{/* Email error - notification*/}
						<div className="sign-up-message" id="send_email_error" style={{ display: 'none' }}>
							<h3 className="signtitle mb20">Sorry, we have some e-mail server issues please try again.</h3>
						</div>

						<div className="row" id="sign_up_form">
							<div className="col-sm-5">
								<div className="panel">
									<div className="panel-heading">
										<h1 style={{ fontSize: 22 }}>PASSWORD RECOVERY</h1>
										<h4 style={{ fontSize: 19 }} className="panel-title">Please enter your e-mail address!</h4>
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

											<div className="auth-message">
												<p id="invalid_email" style={{ display: 'none' }}>Please input valid e-mail</p>
												<p id="system_error" style={{ display: 'none' }}>We have some technical issues. Please try it
													later</p>
											</div>

											<div className="form-group">
												<button className="btn btn-success btn-quirk btn-block">recover password</button>
											</div>
										</form>
									</div>

								</div>

							</div>

							<div className="col-sm-7">
								<div className="sign-sidebar">
									<h3 className="signtitle mb20">So you forgot your password ?</h3>
									<br />
									<h4 className="reason">1. Create associations.</h4>
									<p>We all have numbers that mean something to us: birthdays, anniversaries, a favorite NASCAR driver’s number or the number of 10-cent wings you can devour on all-you-can-eat wings night. The secret to remembering new numbers is to find connections between the number you want to remember and the numeric memories that are already firmly lodged in your brain.</p>
									<br />
									<h4 className="reason">2. Learn actively.</h4>
									<p>Our muscles have better memories than our brains, so don’t just think the password. Say it out loud at least three times. When you say it, your brain has to tell the muscles of your mouth how to say it and your ear has to hear the words and pass them along. It forces you to use a lot more of your brain. And don’t stop there</p>
									<hr className="invisible" />
									<div className="form-group">
										<a href="/auth/sign-in"
											className="btn btn-default btn-quirk btn-stroke btn-stroke-thin btn-block btn-sign">Already a
											member? Sign In Now!</a>
									</div>
								</div>

							</div>
						</div>
					</div>

				</div>
			);
		}
	}
}