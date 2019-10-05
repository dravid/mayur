import React from 'react';
import {NextAuth} from 'next-auth/client';

export default class extends React.Component {

	static async getInitialProps({req, res, query}) {
		let session = await NextAuth.init({req});

		if (res && session && session.user) {
			res.redirect('/admin');
		}

		return {
			session: session,
			linkedAccounts: await NextAuth.linked({req}),
			providers: await NextAuth.providers({req})
		};
	}

	constructor(props) {
		super(props);
		this.state = {};
	}


	async componentDidMount() {

	}

	render() {
		if (this.props.session.user) {
			return null;
		} else {
			return (
				<div className="signwrapper">

					<div className="sign-overlay"></div>
					<div className="signpanel"></div>

					<div className="signup">

						<div className="sign-up-message" id="verification_email_sent"
						     style={{display: 'block', width: '500px', margin: 'auto'}}>
							{/*<h3 className="signtitle mb20">Thank you for signing up.<br/>Email with a verification link has been sent to your email address.</h3>*/}

							<div className="sign-sidebar">
								<h3 className="signtitle mb20">Your connection has been blocked!</h3>
								<br/>
								{/*<h4 className="panel-title" style={{fontSize: '16px'}}>Email with a verification link<br/>has been sent to your email address.</h4>*/}
								{/*<h4 className="panel-title" style={{fontSize: '16px'}}>Please verify your email by clicking on it.</h4>*/}
							</div>

						</div>

					</div>

				</div>
			);
		}
	}
}