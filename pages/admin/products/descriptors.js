import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout';
import { encodeForm } from '../../../utils/api-utils';
import { Input, Select, message, Button, Icon, List } from 'antd';
import Link from "next/link"

const Option = Select.Option;
const moment = require('moment');
const newDate = moment(new Date()).format('DD.MM.YYYY HH:mm');

class Product extends React.Component {

	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		//Check if user is signed in - if not redirect to sign in form
		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		//Fetch all productsDescriptors from DB
		let productsDescriptors = [];
		let productsDescriptorsResponse = await fetch(`${siteUrl}/api/v1/products/productsDescriptors?${noCache}`);
		if (productsDescriptorsResponse.status === 200) {
			productsDescriptors = await productsDescriptorsResponse.json();
		}

		return {
			productsDescriptors: productsDescriptors,
			session: session,
			// namespacesRequired: [],
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);
		this.state = {

			descriptors: this.props.productsDescriptors,
			createdAt: '',

			descriptor: '',
			subDescriptor: [''],

		};
	}

	handleText = i => e => {
		let subDescriptor = [...this.state.subDescriptor]
		subDescriptor[i] = e.target.value
		this.setState({
			subDescriptor
		})
	}

	handleDelete = i => e => {
		e.preventDefault()
		if (this.state.subDescriptor.length >= 2) {
			let subDescriptor = [
				...this.state.subDescriptor.slice(0, i),
				...this.state.subDescriptor.slice(i + 1)
			]
			this.setState({
				subDescriptor
			})
		}
	}

	addSubDescriptor = e => {
		e.preventDefault()
		let subDescriptor = this.state.subDescriptor.concat([''])
		this.setState({
			subDescriptor
		})
	}

	componentDidMount = async () => {

		if (this.props.query._id && this.props.query._id !== "new" && this.props.query._id.length === 24) {

			// Fetch Products descriptor-ID for edit unless request is for NEW descriptor
			const formData = {
				_csrf: this.props.session.csrfToken,
				_id: this.props.query._id,
				action: 'getOne',
			};

			const encodedForm = await encodeForm(formData);

			let pages = await fetch(`${siteUrl}/api/v1/products/productsDescriptors`, {
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
						descriptor: response.data.descriptor ? response.data.descriptor : '',
						subDescriptor: response.data.subDescriptor ? response.data.subDescriptor : [],
						createdAt: response.data.createdAt
					});
				}
			});

		}
	}

	addDescriptor = async (event) => {
		event.preventDefault();

		// descriptor name is required
		if (!this.state.descriptor || this.state.descriptor.trim().length <= 0) {
			alert('Please insert descriptor!');
			return false;
		}

		// Check if descriptor is unique
		let check = this.state.descriptors.filter((item) => (item.descriptor === this.state.descriptor));
		if (check.length >= 1) {
			alert('Descriptor already exists!');
			return false;
		}

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			descriptor: this.state.descriptor,
			subDescriptor: this.state.subDescriptor,
			createdAt: this.state.createdAt,
			action: 'add',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/products/productsDescriptors', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			let response = await res.json();

			if (response.status === 'database_error') {
				console.log('database_error');
			}
			else if (response.status === 'item_added') {
				console.log('item_added');
				window.location.reload();
			}
			else {
				console.log('unknown_status');
			}
		});
	}

	updateDescriptor = async () => {

		// descriptor name is required
		if (!this.state.descriptor || this.state.descriptor.trim().length <= 0) {
			alert('Please insert descriptor!');
			return false;
		}

		// Check if descriptor is unique 
		let check = '';
		check = this.state.descriptors.filter((item) =>
			(item.descriptor === this.state.descriptor)
			&& (item._id !== this.props.query._id)
		);

		if (check.length >= 1) {
			alert('Descriptor with that name already exist!');
			return false;
		};

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			_id: this.props.query._id,

			descriptor: this.state.descriptor,
			subDescriptor: this.state.subDescriptor,
			createdAt: this.state.createdAt,

			action: 'set',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/products/productsDescriptors', {
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
				console.log('database_error');
			}
			else if (response.status === 'item_updated') {
				console.log('item_updated');
				window.location.reload();
			}
			else {
				console.log('unknown_status');
			}

			// return to descriptors list after update
			setTimeout(function () {
				window.location.href = '/admin/products/descriptors/new';
			})
		});
	}

	deleteDescriptorHandler = async (id) => {
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: id,
			action: "remove"
		};

		const encodedForm = await encodeForm(formData);

		let pages = await fetch(`${siteUrl}/api/v1/products/productsDescriptors`, {
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
				console.log('Item_deleted')
				window.location.reload();
			}
		});
	}

	descriptorEdit = async (id) => {
		window.location.href = '/admin/products/descriptors/' + id;
	}

	render() {

		// Check if new Page or edit
		const isNew = (this.props.query._id === "new") ? true : false;
		const descriptor = this.state.descriptor.length > 0 ? true : false;


		return (

			<AdminLayout {...this.props}>

				{isNew
					? <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin"}><i className="fa fa-home mr5"></i> Home > Products > Descriptors</a></li>
						<li className="active">New Descriptor</li>
					</ol>
					: <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin"}><i className="fa fa-home mr5"></i> Home > Products > Descriptors</a></li>
						<li className="active">Edit Descriptor</li>
					</ol>
				}
				<div className="row">
					<div className="col-sm-6 col-md-6 col-lg-6 people-list">


						{/* LEFT _CHILD CONTENT */}

						{/* PRODUCT descriptor */}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Add Descriptor</h4>
							</div>

							<div className="panel-body">
								<div style={{ margin: '5px 0px', width: "100%", display: "inline-block" }}>

									{isNew ?
										<Input
											id="productdescriptor"
											type='text'
											size="small"
											className="mb-2"
											value={this.state.descriptor}
											placeholder="Add descriptor"
											onChange={(event) => { this.setState({ descriptor: event.target.value }); }}
										/>
										: <Input
											id="productdescriptor"
											disabled
											type='text'
											size="small"
											className="mb-2"
											value={this.state.descriptor}
											placeholder="Add descriptor"
											onChange={(event) => { this.setState({ descriptor: event.target.value }); }}
										/>
									}
								</div>
							</div>

						</div>
						{/* -------------------------- */}

						{/* DESCRIPTOR LIST */}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">All descriptors</h4>
							</div>

							<div className="panel-body">


								<div style={{ margin: '5px 0px', width: "100%", display: "inline-block" }}>
									{this.state.descriptors.map((item, index) => {

										const descriptorUrl = '/admin/products/descriptors/' + item._id;
										return (
											<div key={index}>
												<Link href={descriptorUrl}>
													<Button style={{ width: "85%" }} size="small">{item.descriptor}</Button>
												</Link>
												<Button style={{ marginLeft: '10px' }}
													type="default"
													size="small"
													icon="delete"
													onClick={() => this.deleteDescriptorHandler(item._id)} />
											</div>
										)
									})}
								</div>

							</div>

						</div>
						<Link href="/admin/products/descriptors/new">
							<button className="btn btn-success btn-quirk btn-block">Add new</button>
						</Link>
						{/* -------------------------- */}


					</div>
					{/* LEFT END */}

					{/* RIGHT SIDE CONTENT	 */}

					{/* page INFO - SAVE */}
					<div className="col-sm-6 col-md-6 col-lg-6">


						{/* ADD PRODUCTS SUBdescriptors */}
						<div className="panel panel-primary" style={{ minHeight: '133px' }}>

							<div className="panel-heading">
								<h4 className="panel-title">Add descriptor value</h4>
							</div>

							<div className="panel-body">

								{descriptor ?
									this.state.subDescriptor.map((subDescriptor, index) => (
										<span key={index} style={{ width: "100%", display: "inline-block", margin: '5px 0px' }}>
											<Input
												style={{ width: '60%' }}
												key={index}
												type="text"
												size="small"
												className="mb-2"
												placeholder="Add subdescriptor"
												onChange={this.handleText(index)}
												value={subDescriptor}
											/>
											<Button style={{ marginLeft: '10px' }} type="default" size="small" icon="delete" onClick={this.handleDelete(index)} />
											<Button style={{ marginLeft: '10px' }} type="default" size="small" icon="plus-circle" onClick={this.addSubDescriptor} />
										</span>
									))
									: null}

							</div>
							{/* -------------------------- */}

						</div>

						{isNew
							? <button className="btn btn-success btn-quirk btn-block" onClick={this.addDescriptor}>SAVE</button>
							: <button className="btn btn-success btn-quirk btn-block" onClick={this.updateDescriptor}>UPDATE</button>
						}

					</div>

					{/* RIGHT SIDE END  */}

				</div>
			</AdminLayout >
		);
	}
}

export default Product;

