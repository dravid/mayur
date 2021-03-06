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
								<h3 className="signtitle mb20">Hvala Vam na registraciji!</h3>
								<br />
								<h4 className="panel-title" style={{ fontSize: '16px' }}>Email sa verifikacionim linkom je poslat<br />na vašu mail adresu.</h4>
								<h4 className="panel-title" style={{ fontSize: '16px' }}>Molimo Vas verifikujte vašu mail adresu.</h4>
							</div>

						</div>

						<div className="sign-up-message" id="user_already_exists" style={{ display: 'none' }}>
							<h3 className="signtitle mb20">Ova email adresa već postoji.<br />Molim Vas ulogujte se <a style={{ color: 'white' }}
								href="/auth/sign-in">ovde</a>.
							</h3>
						</div>

						<div className="col-sm-3">
						</div>



						<div className="row" id="sign_up_form">
							<div className="col-sm-6">
								<div className="panel">
									<div className="panel-heading">
										<h1>MAGICMAGGOT</h1>
										<h4 className="panel-title">Kreirajte nalog!</h4>
									</div>
									<div className="panel-body">
										{/*<button className="btn btn-primary btn-quirk btn-fb btn-block">Sign Up Using Facebook</button>*/}
										{/*<div className="or">or</div>*/}
										<form id="signin" method="post" action="/auth/signin" onSubmit={this.handleSignInSubmit}>
											<input name="_csrf" type="hidden" value={this.state.session.csrfToken} />
											<input name="action_type" type="hidden" value="sign_up" />
											<div className="form-group mb15">
												<input type="text" className="form-control" style={{ border: 'none' }}
													placeholder="Unesite vaš email" name="email" value={this.state.email}
													onChange={this.handleEmailChange} />
											</div>
											<div className="form-group mb15">
												<input type="password" className="form-control" style={{ border: 'none' }}
													placeholder="Unesite vašu šifru" name="password" value={this.state.password}
													onChange={this.handlePasswordChange} />
											</div>
											<div className="form-group mb15" style={{ marginBottom: '0' }}>
												<input type="password" className="form-control" style={{ border: 'none' }}
													placeholder="Ponovite vašu šifru" name="repeatPassword"
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
												<p id="invalid_email" style={{ display: 'none' }}>Pogrešna šifra</p>
												<p id="invalid_password" style={{ display: 'none' }}>Šifra mora imati najmanje 8 karaktera</p>
												<p id="passwords_do_not_match" style={{ display: 'none' }}>Šifre se ne slažu</p>
												<p id="system_error" style={{ display: 'none' }}>Imamo nekih tehničkih problema. Molimo Vas pokušsajte ponovo</p>
											</div>

											<div className="form-group">
												<button className="btn btn-success btn-quirk btn-block">Kreiraj nalog</button>
											</div>
										</form>
									</div>

								</div>

							</div>

						</div>


						<div className="col-sm-3">
						</div>

					</div>

				</div>
			);
		}
	}
}