import React from 'react';
import Router from 'next/router';
import { NextAuth } from 'next-auth/client';
import { encodeForm } from '../../utils/api-utils';
import { isValidEmail } from '../../utils/form-utils';
import $ from 'jquery';

export default class extends React.Component {

	static async getInitialProps({ req }) {
		return {
			session: await NextAuth.init({ req }),
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

	componentDidMount = async () => {
		if (this.props.session.user) {
			Router.push(`/auth/`);
		}
	}

	hideMessages = () => {
		$('#wrong_credentials').css('display', 'none');
		$('#invalid_email').css('display', 'none');
		$('#system_error').css('display', 'none');
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

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			email: this.state.email,
			password: this.state.password
		};

		const encodedForm = await encodeForm(formData);

		fetch('/api/v1/sign-in', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			let response = await res.json();

			this.hideMessages();

			switch (response.status) {
				case 'user_blocked':
					setTimeout(function () {
						window.location.href = '/auth/forbidden';
					}, 500);
					break;

				case 'wrong_credentials':
					$('#wrong_credentials').css('display', 'inline');
					break;

				case 'access_granted':
					NextAuth.signin({
						email: this.state.email,
						password: this.state.password
					}).then(authenticated => {
						// Router.push(`/auth/callback`);
						// Router.push(`/admin`);
						setTimeout(function () {

							window.location.href = '/';
							// window.location.reload();
							// Router.push('/auth/callback')
						}, 500);
					}).catch(() => {
						$('#wrong_credentials').css('display', 'inline');
					});
					break;

				case 'database_error':
					$('#system_error').css('display', 'inline');
					break;
			}

		});
	}

	render() {
		if (this.props.session.user) {
			return null;
		} else {
			let title = this.props.title ? this.props.title : 'Welcome! Please sign in.';

			return (
				<div className="panel signin">
					<div style={{ textAlign: 'center' }} className="panel-heading">
						<img style={{ width: '250px' }} src='/static/images/logo.png' />
						<h4 className="panel-title" dangerouslySetInnerHTML={{ __html: title }} />
					</div>
					<div className="panel-body">
						{/*<button className="btn btn-primary btn-quirk btn-fb btn-block">Connect with Facebook</button>*/}
						{/*<div className="or">or</div>*/}
						<form id="signin" method="post" action="/auth/signin" onSubmit={this.handleSignInSubmit}>
							<input name="_csrf" type="hidden" value={this.state.session.csrfToken} />
							<div className="form-group mb10">
								<div className="input-group">
									<span className="input-group-addon"><i className="glyphicon glyphicon-user"></i></span>
									<input type="text" className="form-control" style={{ border: 'none' }} placeholder="Enter Your Email"
										name="email" value={this.state.email} onChange={this.handleEmailChange} />
								</div>
							</div>
							<div className="form-group nomargin">
								<div className="input-group">
									<span className="input-group-addon"><i className="glyphicon glyphicon-lock"></i></span>
									<input type="password" className="form-control" style={{ border: 'none' }}
										placeholder="Enter Your Password" name="password" value={this.state.password}
										onChange={this.handlePasswordChange} />
								</div>
							</div>
							<div style={{ marginBottom: '30px' }}>
								{/*<a href="" className="forgot">Forgot password?</a>*/}
							</div>
							<div className="form-group">
								<button className="btn btn-success btn-quirk btn-block">Sign In</button>
							</div>
						</form>

						{/*<hr className="invisible"/>*/}

						<div className="auth-message">
							<p id="wrong_credentials" style={{ display: 'none' }}>Invalid email or password</p>
							<p id="invalid_email" style={{ display: 'none' }}>Please input valid e-mail</p>
							<p id="system_error" style={{ display: 'none' }}>We have some technical issues. Please try it later</p>
						</div>

						<div className="form-group">
							<a href="/auth/forgot-password"
								className="btn btn-default btn-quirk btn-stroke btn-stroke-thin btn-block btn-sign">
								Forgot your password ?
							</a>
						</div>
						<div className="form-group">
							<a href="/auth/sign-up"
								className="btn btn-default btn-quirk btn-stroke btn-stroke-thin btn-block btn-sign">
								Not a member? Sign up now!
							</a>
						</div>
					</div>
				</div>
			);
		}
	}
}