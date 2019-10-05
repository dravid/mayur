import React, { Component } from 'react';
import dynamic from 'next/dynamic';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout';
import { encodeForm } from '../../../utils/api-utils';
import { Input, Select, message, Upload, Button, Icon, Modal, notification } from 'antd';
import Link from "next/link"
import { transliterate as tr, slugify } from 'transliteration';

const JoditEditor = dynamic(
	() => import('jodit-react'),
	{
		ssr: false
	}
);
dynamic(
	() => import('jodit'),
	{
		ssr: false
	}
);

const Option = Select.Option;
const moment = require('moment');
const newDate = moment(new Date()).format('DD.MM.YYYY HH:mm');

const notificationMessage = (type, message, description) => {
	notification[type]({
		message: message,
		description: description,
		duration: 1.5,
		placement: "bottomRight"
	});
};

class NewPage extends React.Component {

	static async getInitialProps({ req, res, query }) {

		let session = await NextAuth.init({ req });
		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		//Get pages to check if uri is unique
		let pages = [];
		let pagesResponse = await fetch(`${siteUrl}/api/v1/pages?${noCache}`);
		if (pagesResponse.status === 200) {
			pages = await pagesResponse.json();
		}

		return {
			pages: pages,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);
		this.state = {

			pages: this.props.pages,

			title: '',
			content: '',  //editor content
			timeCreated: '',
			keywords: '',
			googleDescription: "",
			modifiedCount: 0,
			authorId: "",
			authorFirstName: "",
			authorLastName: "",
			uri: "",

			//featured image
			previewVisible: false,
			previewImage: '',
			fileList: [],
		};
		this.updatePage = this.updatePage.bind(this);
		this.addPage = this.addPage.bind(this);
	}

	//EDITOR CONFIG
	updateContent = (value) => {
		this.setState({ content: value })
	}
	jodit;
	setRef = jodit => this.jodit = jodit;

	config = {
		readonly: false, // all options from https://xdsoft.net/jodit/doc/
		"toolbarAdaptive": false,
		"uploader": {
			"insertImageAsBase64URI": true
		},
	}
	//-------------

	async componentDidMount() {

		if (this.props.query.id !== "new") {
			// FETCH Page-ID FOR EDIT 
			const formData = {
				_csrf: this.props.session.csrfToken,
				_id: this.props.query.id,
				action: 'getOne',
			};

			const encodedForm = await encodeForm(formData);

			let pages = await fetch(`${siteUrl}/api/v1/pages`, {
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
						title: response.data.title,
						content: response.data.content,
						keywords: response.data.keywords,
						googleDescription: response.data.googleDescription,
						uri: response.data.uri ? response.data.uri : "",
						fileList: response.data.featuredImage ? response.data.featuredImage : [],
						authorId: response.data.authorId,
						authorFirstName: response.data.authorFirstName,
						authorLastName: response.data.authorLastName,
						modifiedCount: response.data.modifiedCount,
						timeCreated: response.data.createdAt,
					});
				}
			});
			notificationMessage('success', 'Uspeh', 'Strana je spremana za editovanje');
		}
	}

	//FEATURED IMAGE HANDLERS
	imageHandleCancel = () => this.setState({ previewVisible: false })

	imageHandlePreview = (file) => {
		this.setState({
			previewImage: file.url || file.thumbUrl,
			previewVisible: true,
		});
	}

	imageHandleChange = ({ fileList }) => { this.setState({ fileList }) }

	beforeUpload = (file) => {
		if (file.type == "") {
			if (file.name.indexOf(".jpg") == -1
				&& file.name.indexOf(".jpeg") == -1
				&& file.name.indexOf(".png") == -1) {
				message.error('not image');
				return false;
			} else {
				return true;
			}
		} else {
			const valid = file.type.indexOf('jpg') != -1;
			if (!valid) {
				message.error('error！');
			}
			return valid;
		}
	}
	// -----------------------//

	// ADD Page
	async addPage(event) {
		event.preventDefault();

		// Title is required
		if (!this.state.title || this.state.title.trim().length <= 0) {
			alert('Please insert title for the page!');
			return false;
		}

		// Uri is required
		if (!this.state.uri || this.state.uri.trim().length <= 0) {
			alert('Please insert uri/slug for the page!');
			return false;
		}

		// Check if uri is unique
		let uniqueCheck = this.state.pages.filter((item) => (item.uri === (slugify(this.state.uri))));
		if (uniqueCheck.length >= 1) {
			alert('Uri must be unique!');
			return false;
		}

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			title: this.state.title,
			content: this.state.content,
			keywords: this.state.keywords,
			googleDescription: this.state.googleDescription,
			uri: slugify(this.state.uri),
			featuredImage: JSON.stringify(this.state.fileList),
			authorId: this.props.session.user.id,
			authorFirstName: this.props.session.user.firstName,
			authorLastName: this.props.session.user.lastName,
			action: 'add',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/pages', {
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
			else if (response.status === 'item_added') {
				console.log('item_added');
				notificationMessage('success', 'Uspeh', 'Stranica je uspesno dodata.');
				setTimeout(function () {
					window.location.reload();
				}, 1000);
			}
			else {
				console.log('unknown_status');
			}
		});
	}

	// UPDATE pages
	async updatePage() {

		if (!this.state.title || this.state.title.trim().length <= 0) {
			alert('Please insert title for the page!');
			return false;
		}

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			_id: this.props.query.id,
			title: this.state.title,
			content: this.state.content,
			keywords: this.state.keywords,
			googleDescription: this.state.googleDescription,
			uri: this.state.uri,
			featuredImage: JSON.stringify(this.state.fileList),
			authorId: this.state.authorId,
			authorFirstName: this.state.authorFirstName,
			authorLastName: this.state.authorLastName,
			modifiedByFirstName: this.props.session.user.firstName,
			modifiedByLastName: this.props.session.user.lastName,
			modifiedCount: this.state.modifiedCount ? ++this.state.modifiedCount : 1,
			createdAt: this.state.timeCreated,
			action: 'set',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/pages', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			console.log(res);

			let response = await res.json();

			if (response.status === 'database_error') {
				notificationMessage('error', 'Greska', 'Doslo je do greske u sistemu');
				console.log('database_error');
			}
			else if (response.status === 'item_updated') {
				console.log('item_updated');
				notificationMessage('success', 'Uspeh', 'Stranica je uspesno izmenjena.');
				setTimeout(function () {
					window.location.reload();
				}, 1000);
			}
			else {
				console.log('unknown_status');
			}
		});
	}

	render() {

		// Check if new Page or edit
		const newPage = this.props.query.id === "new" ? true : false;

		//image control
		const { previewVisible, previewImage, fileList } = this.state;
		const uploadButton = (
			<div>
				<Icon type="plus" />
				<div className="ant-upload-text">Upload</div>
			</div>
		);

		let fullName = '';

		if (this.props.session && this.props.session.user) {
			if (this.props.session.user.firstName) {
				fullName += this.props.session.user.firstName + ' ';
			}
			if (this.props.session.user.lastName) {
				fullName += this.props.session.user.lastName;
			}
		}

		return (

			<AdminLayout {...this.props}>

				{newPage
					? <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin/pages"}><i className="fa fa-home mr5"></i> Home > pages</a></li>
						<li className="active">New Page</li>
					</ol>
					: <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin/pages"}><i className="fa fa-home mr5"></i> Home > pages</a></li>
						<li className="active">Edit Page</li>
					</ol>
				}
				<div className="row">
					<div className="col-sm-8 col-md-9 col-lg-9 people-list">

						<div className="people-options clearfix">
							<div className="btn-toolbar pull-left">
								<Link href="/admin/pages">
									<button type="button" className="btn btn-success btn-quirk">All pages</button>
								</Link>
							</div>
						</div>


						{/* CENTER _CHILD CONTENT */}

						{/* title */}
						<div className="panel" style={{ padding: '30px', width: '100%', minHeight: "700px" }}>
							<Input
								style={{ margin: "0px 0px 5px 0px", width: "100%" }}
								id="pageTitle"
								type='text'
								size="large"
								className="mb-2"
								value={this.state.title}
								placeholder="Title"
								onChange={(event) => { this.setState({ title: event.target.value }); }}
							/>

							<p style={{ marginTop: 5 }}>{siteUrl + "/" + slugify(this.state.uri)}</p>

							{/* URI */}
							{newPage ?
								<Input
									style={{ margin: "5px 0px", width: "100%" }}
									id="pageUri"
									type='text'
									size="large"
									className="mb-2"
									value={this.state.uri}
									placeholder="Uri / slug"
									onChange={(event) => { this.setState({ uri: event.target.value }); }}
								/>
								: null
							}

							{/* keywords */}
							<Input
								style={{ margin: "5px 0px", width: "100%" }}
								id="pageKeywords"
								type='text'
								size="large"
								className="mb-2"
								value={this.state.keywords}
								placeholder="Keywords"
								onChange={(event) => { this.setState({ keywords: event.target.value }); }}
							/>

							{/* Google desription */}
							<Input
								style={{ margin: "5px 0px", width: "100%" }}
								id="pageGoogleDescription"
								type='text'
								size="large"
								className="mb-2"
								value={this.state.googleDescription}
								placeholder="Google description"
								onChange={(event) => { this.setState({ googleDescription: event.target.value }) }}
							/>

							{/* Content */}
							<JoditEditor
								style={{ minHeight: "350px" }}
								editorRef={this.setRef}
								value={this.state.content}
								config={this.config}
								onChange={this.updateContent}
							/>

						</div>
					</div>
					{/* CENTER END */}

					{/* RIGHT SIDE_CHILD CONTENT	 */}

					{/* page INFO - SAVE */}
					<div className="col-sm-4 col-md-3 col-lg-3">

						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Page info</h4>
							</div>

							{newPage
								? <div className="panel-body">
									<ul className="list-unstyled">
										<li className="mt5">Created by:</li>
										<li>{fullName}</li>
										<li className="mt5">Time created:</li>
										<li>{newDate}</li>
									</ul>
								</div>
								: <div className="panel-body">
									<ul className="list-unstyled">
										<li className="mt5">Created by:</li>
										<li>{fullName}</li>
										<li className="mt5">Time created:</li>
										<li>{this.state.timeCreated ? this.state.timeCreated : ''}</li>
									</ul>
								</div>
							}

						</div>

						{/* FEATURED IMAGE */}

						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Featured image</h4>
							</div>

							<div className="panel-body">

								{/* IMAGE UPLOAD */}
								<div className="clearfix" style={{ margin: "20px 0px" }}>
									<Upload
										action="/api/v1/imageupload"
										accept=".jpg,.jpeg,.png,.bmp"
										name="myFile"
										headers={{
											uri: slugify(this.state.uri),
											path: "pages",
											type: "page",
											'X-CSRF-TOKEN': this.props.session.csrfToken,
										}}
										listType="picture-card"
										fileList={fileList}
										defaultFileList={[...fileList]}
										onPreview={this.imageHandlePreview}
										onChange={this.imageHandleChange}
									>
										{fileList.length >= 1 ? null : uploadButton}
									</Upload>
									<Modal visible={previewVisible} footer={null} onCancel={this.imageHandleCancel}>
										<img alt="example" style={{ width: '100%' }} src={previewImage} />
									</Modal>

								</div>
								{/* -------------------------------- */}

							</div>

						</div>

						{/* --------------------------------- */}
						{newPage
							? <button className="btn btn-success btn-quirk btn-block" onClick={this.addPage}>SAVE</button>
							: <button className="btn btn-success btn-quirk btn-block" onClick={this.updatePage}>UPDATE</button>
						}

					</div>

					{/* RIGHT SIDE END */}


				</div>
			</AdminLayout >
		);
	}
}

export default NewPage;

