import React, { Component } from 'react';
import dynamic from 'next/dynamic';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout';
import { encodeForm } from '../../../utils/api-utils';
import { Input, Select, message, Upload, Icon, Modal, notification, Button } from 'antd';
import Editor from '../../../components/common/Editor';
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

const { TextArea } = Input;
const Option = Select.Option;
const moment = require('moment');
const newDate = moment(new Date()).format('DD.MM.YYYY HH:mm');

const notificationAddSuccess = type => {
	notification[type]({
		message: 'Success',
		description:
			'Product successfully created.',
		duration: 0.65,
		placement: "bottomRight"
	});
};

const notificationUpdateSuccess = type => {
	notification[type]({
		message: 'Success',
		description:
			'Product successfully updated.',
		duration: 0.65,
		placement: "bottomRight"
	});
};

class Product extends React.Component {

	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		//Check if user is signed in - if not redirect to sign in form
		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		//Fetch all products from DB to check if Product name and code is unique
		let products = [];
		let productsResponse = await fetch(`${siteUrl}/api/v1/products/products?${noCache}`);
		if (productsResponse.status === 200) {
			products = await productsResponse.json();
		}

		//Fetch all productsCategories from DB
		let productsCategories = [];
		let productsCategoriesResponse = await fetch(`${siteUrl}/api/v1/products/productsCategories?${noCache}`);
		if (productsCategoriesResponse.status === 200) {
			productsCategories = await productsCategoriesResponse.json();
		}

		//Fetch all productsDescriptors from DB
		let productsDescriptors = [];
		let productsDescriptorsResponse = await fetch(`${siteUrl}/api/v1/products/productsDescriptors?${noCache}`);
		if (productsDescriptorsResponse.status === 200) {
			productsDescriptors = await productsDescriptorsResponse.json();
		}

		return {
			products: products,
			productsCategories: productsCategories,
			productsDescriptors: productsDescriptors,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);
		this.state = {

			products: this.props.products,
			productsCategories: this.props.productsCategories,
			productsDescriptors: this.props.productsDescriptors,

			//Product info
			name: '',
			uri: '',
			productCode: '',
			seo: '',
			description: '',  //description

			category: '',
			selectSubCategory: [''],
			subCategory: '',

			descriptor1: '',
			selectSubDescriptor1: [''],
			subDescriptor1: '',
			descriptor2: '',
			selectSubDescriptor2: [''],
			subDescriptor2: '',
			descriptor3: '',
			selectSubDescriptor3: [''],
			subDescriptor3: '',
			descriptor4: '',
			selectSubDescriptor4: [''],
			subDescriptor4: '',
			descriptor5: '',
			selectSubDescriptor5: [''],
			subDescriptor5: '',

			price: '',
			discount: '',

			supply: '',
			sku: '',
			active: true,

			//Image paths
			imageNames: [],

			//Add-update info
			modifiedCount: 0,
			authorId: '',
			authorFirstName: '',
			authorLastName: '',
			createdAt: '',

			//featured image
			previewVisible: false,
			previewImage: '',
			fileList: [],


		};
	}

	//EDITOR CONFIG
	updateContent = (value) => {
		this.setState({ description: value })
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

	//FEATURED IMAGE HANDLERS
	imageHandleCancel = () => this.setState({ previewVisible: false })

	imageHandlePreview = (file) => {
		this.setState({
			previewImage: file.url || file.thumbUrl,
			previewVisible: true,
		});
	}

	imageHandleChange = ({ fileList }) => this.setState({ fileList })



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
	//-----------------------//


	componentDidMount = async () => {


		if (this.props.query._id && this.props.query._id !== "new" && this.props.query._id.length === 24) {
			// Fetch Product-ID for edit unless request is for NEW product
			const formData = {
				_csrf: this.props.session.csrfToken,
				_id: this.props.query._id,
				action: 'getOne',
			};

			const encodedForm = await encodeForm(formData);

			let pages = await fetch(`${siteUrl}/api/v1/products/products`, {
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
						name: response.data.name ? response.data.name : "",
						uri: response.data.uri ? response.data.uri : "",
						productCode: response.data.productCode ? response.data.productCode : "",
						seo: response.data.seo ? response.data.seo : "",
						description: response.data.description ? response.data.description : "",

						category: response.data.category ? response.data.category : "",
						subCategory: response.data.subCategory ? response.data.subCategory : "",

						descriptor1: response.data.descriptor1 ? response.data.descriptor1 : "",
						subDescriptor1: response.data.subDescriptor1 ? response.data.subDescriptor1 : "",
						descriptor2: response.data.descriptor2 ? response.data.descriptor2 : "",
						subDescriptor2: response.data.subDescriptor2 ? response.data.subDescriptor2 : "",
						descriptor3: response.data.descriptor3 ? response.data.descriptor3 : "",
						subDescriptor3: response.data.subDescriptor3 ? response.data.subDescriptor3 : "",
						descriptor4: response.data.descriptor4 ? response.data.descriptor4 : "",
						subDescriptor4: response.data.subDescriptor4 ? response.data.subDescriptor4 : "",
						descriptor5: response.data.descriptor5 ? response.data.descriptor5 : "",
						subDescriptor5: response.data.subDescriptor5 ? response.data.subDescriptor5 : "",

						price: response.data.price ? response.data.price : "",
						discount: response.data.discount ? response.data.discount : "",

						supply: response.data.supply ? response.data.supply : "",
						sku: response.data.sku ? response.data.sku : "",
						active: response.data.active ? response.data.active : true,

						//Image paths
						fileList: response.data.images ? response.data.images : "",

						//Original creator
						authorId: response.data.authorId ? response.data.authorId : '',
						authorFirstName: response.data.authorFirstName ? response.data.authorFirstName : '',
						authorLastName: response.data.authorLastName ? response.data.authorLastName : '',
						createdAt: response.data.createdAt ? response.data.createdAt : '',

						//Updated times
						modifiedCount: response.data.modifiedCount ? response.data.modifiedCount : "",
					});
				}
			}, 100);

		}
	}


	addProduct = async (event) => {
		event.preventDefault();

		// Product name is required
		if (!this.state.name || this.state.name.trim().length <= 0) {
			alert('Please insert product name!');
			return false;
		}

		// Product code is required
		if (!this.state.productCode || this.state.productCode.trim().length <= 0) {
			alert('Please insert product code!');
			return false;
		}

		// Check if product name is unique
		let uniqueCheck = this.state.products.filter((item) => (item.name.toLowerCase() === this.state.name.toLowerCase()));
		if (uniqueCheck.length >= 1) {
			alert('Product name must be unique!');
			return false;
		}

		let images = [];

		for (let i = 0; i < this.state.fileList.length; i++) {
			this.state.fileList[i].thumbUrl = "/" + this.state.fileList[i].response.path;
			images.push(this.state.fileList[i]);
		}

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			name: this.state.name,
			uri: slugify(this.state.name),
			productCode: this.state.productCode,
			seo: this.state.seo,
			description: this.state.description,

			category: this.state.category,
			subCategory: this.state.subCategory,

			descriptor1: this.state.descriptor1,
			subDescriptor1: this.state.subDescriptor1,
			descriptor2: this.state.descriptor2,
			subDescriptor2: this.state.subDescriptor2,
			descriptor3: this.state.descriptor3,
			subDescriptor3: this.state.subDescriptor3,
			descriptor4: this.state.descriptor4,
			subDescriptor4: this.state.subDescriptor4,
			descriptor5: this.state.descriptor5,
			subDescriptor5: this.state.subDescriptor5,

			price: this.state.price,
			discount: this.state.discount,

			supply: this.state.supply,
			sku: this.state.sku,
			active: this.state.active,

			//Images
			// images: JSON.stringify(this.state.fileList),
			images: JSON.stringify(images),

			//Creator info
			authorId: this.props.session.user.id,
			authorFirstName: this.props.session.user.firstName,
			authorLastName: this.props.session.user.lastName,
			action: 'add',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/products/products', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			//return await res.json();
			let response = await res.json();

			if (response.status === 'database_error') {
				console.log('database_error');
			}
			else if (response.status === 'item_added') {
				notificationAddSuccess('success');
				console.log('item_added');
			}
			else {
				console.log('unknown_status');
			}

			//return to products list after add method 
			setTimeout(function () {
				window.location.href = '/admin/products';
			}, 600)

		});
	}


	updateProduct = async () => {

		// Product name is required
		if (!this.state.name || this.state.name.trim().length <= 0) {
			alert('Please insert product name!');
			return false;
		}

		// Product code is required
		if (!this.state.productCode || this.state.productCode.trim().length <= 0) {
			alert('Please insert product code!');
			return false;
		}

		let images = [];

		for (let i = 0; i < this.state.fileList.length; i++) {
			this.state.fileList[i].thumbUrl = "/" + this.state.fileList[i].response.path;
			images.push(this.state.fileList[i]);
		}

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			_id: this.props.query._id,
			name: this.state.name,
			uri: this.state.uri,
			productCode: this.state.productCode,
			seo: this.state.seo,
			description: this.state.description,

			category: this.state.category,
			subCategory: this.state.subCategory,

			descriptor1: this.state.descriptor1,
			subDescriptor1: this.state.subDescriptor1,
			descriptor2: this.state.descriptor2,
			subDescriptor2: this.state.subDescriptor2,
			descriptor3: this.state.descriptor3,
			subDescriptor3: this.state.subDescriptor3,
			descriptor4: this.state.descriptor4,
			subDescriptor4: this.state.subDescriptor4,
			descriptor5: this.state.descriptor5,
			subDescriptor5: this.state.subDescriptor5,

			price: this.state.price,
			discount: this.state.discount,

			supply: this.state.supply,
			sku: this.state.sku,
			active: this.state.active,

			//Images
			images: JSON.stringify(this.state.fileList),

			//Original creator info
			authorId: this.props.session.user.id,
			authorFirstName: this.props.session.user.firstName,
			authorLastName: this.props.session.user.lastName,
			createdAt: this.state.createdAt,

			//Updated by info
			modifiedByFirstName: this.props.session.user.firstName,
			modifiedByLastName: this.props.session.user.lastName,
			modifiedCount: this.state.modifiedCount ? ++this.state.modifiedCount : 1,
			action: 'set',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/products/products', {
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
			else if (response.status === 'item_updated') {
				notificationUpdateSuccess('success');
				console.log('item_updated');
			}
			else {
				console.log('unknown_status');
			}

			// return to products list after update
			setTimeout(function () {
				window.location.href = '/admin/products';
			}, 600)
		});
	}

	categorySelectHandler = (category) => {
		let subcategories = this.state.productsCategories.filter((item) => (item.category.toLowerCase().includes(category.toLowerCase())));
		this.setState({ selectSubCategory: subcategories[0].subCategory });
	}

	descriptorSelectHandler1 = (descriptor) => {
		let subdescriptors = this.state.productsDescriptors.filter((item) => (item.descriptor.toLowerCase().includes(descriptor.toLowerCase())));
		this.setState({ selectSubDescriptor1: subdescriptors[0].subDescriptor });
	}

	descriptorSelectHandler2 = (descriptor) => {
		let subdescriptors = this.state.productsDescriptors.filter((item) => (item.descriptor.toLowerCase().includes(descriptor.toLowerCase())));
		this.setState({ selectSubDescriptor2: subdescriptors[0].subDescriptor });
	}

	descriptorSelectHandler3 = (descriptor) => {
		let subdescriptors = this.state.productsDescriptors.filter((item) => (item.descriptor.toLowerCase().includes(descriptor.toLowerCase())));
		this.setState({ selectSubDescriptor3: subdescriptors[0].subDescriptor });
	}

	descriptorSelectHandler4 = (descriptor) => {
		let subdescriptors = this.state.productsDescriptors.filter((item) => (item.descriptor.toLowerCase().includes(descriptor.toLowerCase())));
		this.setState({ selectSubDescriptor4: subdescriptors[0].subDescriptor });
	}

	descriptorSelectHandler5 = (descriptor) => {
		let subdescriptors = this.state.productsDescriptors.filter((item) => (item.descriptor.toLowerCase().includes(descriptor.toLowerCase())));
		this.setState({ selectSubDescriptor5: subdescriptors[0].subDescriptor });
	}

	skuHandler = () => {
		this.setState({ sku: slugify(this.state.productCode + this.state.subDescriptor1 + this.state.subDescriptor2 + this.state.subDescriptor3 + this.state.subDescriptor4 + this.state.subDescriptor5) })
	}

	render() {

		// Check if new Page or edit
		const isNew = this.props.query._id === "new" ? true : false;

		//image control
		const { previewVisible, previewImage, fileList } = this.state;
		const uploadButton = (
			<div>
				<Icon type="plus" />
				<div className="ant-upload-text">Upload</div>
			</div>
		);


		let images = this.props.images ? this.props.images : [];

		const categorySelected = this.state.category.length > 0 ? true : false;
		const descriptorSelected1 = this.state.descriptor1.length > 0 ? true : false;
		const descriptorSelected2 = this.state.descriptor2.length > 0 ? true : false;
		const descriptorSelected3 = this.state.descriptor3.length > 0 ? true : false;
		const descriptorSelected4 = this.state.descriptor4.length > 0 ? true : false;
		const descriptorSelected5 = this.state.descriptor5.length > 0 ? true : false;

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

				{isNew
					? <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin/products"}><i className="fa fa-home mr5"></i> Home > Products</a></li>
						<li className="active">New Product</li>
					</ol>
					: <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin/products"}><i className="fa fa-home mr5"></i> Home > Products</a></li>
						<li className="active">Edit Product</li>
					</ol>
				}
				<div className="row">
					<div className="col-sm-12 col-md-6 col-lg-6 people-list">

						<div className="people-options clearfix">
							<div className="btn-toolbar pull-left">
								<Link href="/admin/products">
									<button type="button" className="btn btn-success btn-quirk">All products</button>
								</Link>
							</div>
						</div>


						{/* CENTER _CHILD CONTENT */}

						{/* Product Name */}
						<div className="panel" style={{ padding: '30px', width: '100%', display: 'inline-block' }}>

							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Input
									addonBefore="Product Name"
									value={this.state.name}
									placeholder="Product Name"
									onChange={(event) => { this.setState({ name: event.target.value }); }}
								/>
							</div>

							{/* SEO */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Input
									addonBefore="Product SEO"
									value={this.state.seo}
									placeholder="Product SEO"
									onChange={(event) => { this.setState({ seo: event.target.value }); }}
								/>
							</div>

							{/* Product code disabled on edit*/}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								{isNew ?
									<Input
										addonBefore="Product code"
										value={this.state.productCode}
										placeholder="Product code"
										onChange={(event) => { this.setState({ productCode: event.target.value }); }}
									/>
									:
									<Input
										disabled
										addonBefore="Product code"
										value={this.state.productCode}
										placeholder="Product code"
									/>
								}
							</div>

							{/* Content */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>

								{/* Content */}
								<JoditEditor
									style={{ minHeight: "350px" }}
									editorRef={this.setRef}
									value={this.state.description}
									config={this.config}
									onChange={this.updateContent}
								/>

							</div>

							{/* IMAGE UPLOAD */}

							{/* <div id="category_images" className="row" > */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Upload
									action="/api/v1/imageupload"
									accept=".jpg,.jpeg,.png,.bmp"
									name="myFile"
									headers={{
										uri: slugify(this.state.name),
										path: "products",
										type: "product",
										'X-CSRF-TOKEN': this.props.session.csrfToken,
									}}
									listType="upload"
									fileList={fileList}
									onPreview={this.imageHandlePreview}
									onChange={this.imageHandleChange}
								>
									{this.state.name.length >= 1 ? uploadButton : null}
								</Upload>
								<Modal visible={previewVisible} footer={null} onCancel={this.imageHandleCancel}>
									<img alt="example" style={{ width: '100%' }} src={previewImage} />
								</Modal>

							</div>

							{/* </div> */}

							{/* -------------------------------- */}

						</div>
					</div>
					{/* CENTER END */}

					{/* RIGHT SIDE_CHILD CONTENT	 */}

					{/* page INFO - SAVE */}
					<div className="col-sm-6 col-md-3 col-lg-3">

						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">User info</h4>
							</div>

							{isNew
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
										<li>{this.state.authorFirstName + " " + this.state.authorLastName}</li>
										<li className="mt5">Time created:</li>
										<li>{this.state.createdAt ? this.state.createdAt : ''}</li>
									</ul>
								</div>
							}
							{/* <div className="panel-footer"> */}
							{/* </div> */}

						</div>

						{/* Category select*/}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Category/Subcategory</h4>
							</div>

							<div className="panel-body">
								<Select
									showSearch
									style={{ width: '100%', marginBottom: 5 }}
									placeholder="Category"
									optionFilterProp="children"
									value={this.state.category ? this.state.category : null}
									onChange={(value) => {
										this.setState({ category: value });
										this.categorySelectHandler(value);
									}}
									filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								>
									{this.state.productsCategories.map((item, index) => (
										<Option key={index} value={item.category.toLowerCase()}>{item.category}</Option>
									))}
								</Select>
								{categorySelected ?
									<Select
										showSearch
										style={{ width: '100%' }}
										placeholder="Subcategory"
										optionFilterProp="children"
										value={this.state.subCategory ? this.state.subCategory : null}
										onChange={value => this.setState({ subCategory: value })}
										filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
									>
										{this.state.selectSubCategory.map((item, index) => (
											<Option key={index} value={item}>{item}</Option>
										))}
									</Select>
									: null}
							</div>

						</div>
						{/* --------------------- */}

						{/* Price and discount*/}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Price and discount</h4>
							</div>

							<div className="panel-body">
								<Input
									style={{ width: '100%', marginBottom: 5 }}
									type='number'
									value={this.state.price}
									placeholder="Product price"
									onChange={(event) => { this.setState({ price: event.target.value }); }}
								/>
								<Input
									style={{ width: '100%' }}
									type='number'
									value={this.state.discount}
									placeholder="Product discount"
									onChange={(event) => { this.setState({ discount: event.target.value }); }}
								/>
							</div>

						</div>
						{/* --------------------- */}

						{/* Supply */}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Supply quantity</h4>
							</div>

							<div className="panel-body">
								<Input
									style={{ width: '100%' }}
									type='number'
									min={0}
									max={9999999}
									value={this.state.supply}
									placeholder="Product supply"
									onChange={(event) => { this.setState({ supply: event.target.value }); }}
								/>
							</div>

						</div>
						{/* --------------------- */}



					</div>

					{/* RIGHT SIDE END 1 */}


					{/* RIGHT SIDE_CHILD CONTENT	2 */}
					<div className="col-sm-6 col-md-3 col-lg-3">


						{/* Descriptor 1 select*/}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Attribute 1 / Value</h4>
							</div>

							<div className="panel-body">
								<Select
									showSearch
									style={{ width: '100%' }}
									placeholder="Attribute 1"
									optionFilterProp="children"
									value={this.state.descriptor1 ? this.state.descriptor1 : null}
									onChange={(value) => {
										this.setState({ descriptor1: value });
										this.descriptorSelectHandler1(value);
									}}
									filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								>
									{this.state.productsDescriptors.map((item, index) => (
										<Option key={index} value={item.descriptor.toLowerCase()}>{item.descriptor}</Option>
									))}
								</Select>

								{descriptorSelected1 ?
									<Select
										showSearch
										style={{ width: '100%' }}
										placeholder="Attribute 1 value"
										optionFilterProp="children"
										value={this.state.subDescriptor1 ? this.state.subDescriptor1 : null}
										onChange={value => this.setState({ subDescriptor1: value }, this.skuHandler)}
										filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
									>
										{this.state.selectSubDescriptor1.map((item, index) => (
											<Option key={index} defaultValue={this.state.subDescriptor1} value={item}>{item}</Option>
										))}
									</Select>
									: null}

							</div>

						</div>
						{/* --------------------- */}

						{/* Descriptor 2 select*/}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Attribute 2 / Value</h4>
							</div>

							<div className="panel-body">
								<Select
									showSearch
									style={{ width: '100%' }}
									placeholder="Attribute 2"
									optionFilterProp="children"
									value={this.state.descriptor2 ? this.state.descriptor2 : null}
									onChange={(value) => {
										this.setState({ descriptor2: value });
										this.descriptorSelectHandler2(value);
									}}
									filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								>
									{this.state.productsDescriptors.map((item, index) => (
										<Option key={index} value={item.descriptor.toLowerCase()}>{item.descriptor}</Option>
									))}
								</Select>
								{descriptorSelected2 ?
									<Select
										showSearch
										style={{ width: '100%' }}
										placeholder="Attribute 2 value"
										optionFilterProp="children"
										value={this.state.subDescriptor2 ? this.state.subDescriptor2 : null}
										onChange={value => this.setState({ subDescriptor2: value }, this.skuHandler)}
										filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
									>
										{this.state.selectSubDescriptor2.map((item, index) => (
											<Option key={index} value={item}>{item}</Option>
										))}
									</Select>

									: null}
							</div>

						</div>
						{/* --------------------- */}

						{/* Descriptor 3 select*/}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Attribute 3 / Value</h4>
							</div>

							<div className="panel-body">
								<Select
									showSearch
									style={{ width: '100%' }}
									placeholder="Attribute 3"
									optionFilterProp="children"
									value={this.state.descriptor3 ? this.state.descriptor3 : null}
									onChange={(value) => {
										this.setState({ descriptor3: value });
										this.descriptorSelectHandler3(value);
									}}
									filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								>
									{this.state.productsDescriptors.map((item, index) => (
										<Option key={index} value={item.descriptor.toLowerCase()}>{item.descriptor}</Option>
									))}
								</Select>
								{descriptorSelected3 ?
									<Select
										showSearch
										style={{ width: '100%' }}
										placeholder="Attribute 3 value"
										optionFilterProp="children"
										value={this.state.subDescriptor3 ? this.state.subDescriptor3 : null}
										onChange={value => this.setState({ subDescriptor3: value }, this.skuHandler)}
										filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
									>
										{this.state.selectSubDescriptor3.map((item, index) => (
											<Option key={index} value={item}>{item}</Option>
										))}
									</Select>

									: null}
							</div>

						</div>
						{/* --------------------- */}

						{/* Descriptor 4 select*/}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Attribute 4 / Value</h4>
							</div>

							<div className="panel-body">
								<Select
									showSearch
									style={{ width: '100%' }}
									placeholder="Attribute 4"
									optionFilterProp="children"
									value={this.state.descriptor4 ? this.state.descriptor4 : null}
									onChange={(value) => {
										this.setState({ descriptor4: value });
										this.descriptorSelectHandler4(value);
									}}
									filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								>
									{this.state.productsDescriptors.map((item, index) => (
										<Option key={index} value={item.descriptor.toLowerCase()}>{item.descriptor}</Option>
									))}
								</Select>
								{descriptorSelected4 ?
									<Select
										showSearch
										style={{ width: '100%' }}
										placeholder="Attribute 4 value"
										optionFilterProp="children"
										value={this.state.subDescriptor4 ? this.state.subDescriptor4 : null}
										onChange={value => this.setState({ subDescriptor4: value }, this.skuHandler)}
										filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
									>
										{this.state.selectSubDescriptor4.map((item, index) => (
											<Option key={index} value={item}>{item}</Option>
										))}
									</Select>

									: null}
							</div>

						</div>
						{/* --------------------- */}

						{/* Descriptor 5 select*/}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Attribute 5 / Value</h4>
							</div>

							<div className="panel-body">
								<Select
									showSearch
									style={{ width: '100%' }}
									placeholder="Attribute 5"
									optionFilterProp="children"
									value={this.state.descriptor5 ? this.state.descriptor5 : null}
									onChange={(value) => {
										this.setState({ descriptor5: value });
										this.descriptorSelectHandler5(value);
									}}
									filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								>
									{this.state.productsDescriptors.map((item, index) => (
										<Option key={index} value={item.descriptor.toLowerCase()}>{item.descriptor}</Option>
									))}
								</Select>
								{descriptorSelected5 ?
									<Select
										showSearch
										style={{ width: '100%' }}
										placeholder="Attribute 5 value"
										optionFilterProp="children"
										value={this.state.subDescriptor5 ? this.state.subDescriptor5 : null}
										onChange={value => this.setState({ subDescriptor5: value }, this.skuHandler)}
										filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
									>
										{this.state.selectSubDescriptor5.map((item, index) => (
											<Option key={index} value={item}>{item}</Option>
										))}
									</Select>

									: null}
							</div>

						</div>
						{/* --------------------- */}

						{/* Product SKU */}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Product SKU</h4>
							</div>

							<div className="panel-body">
								<Input
									style={{ width: '100%' }}
									value={this.state.sku}
									placeholder="Product SKU"
									disabled
								/>
							</div>

						</div>
						{/* --------------------- */}


						{isNew
							? <button className="btn btn-success btn-quirk btn-block" onClick={this.addProduct}>SAVE</button>
							: <button className="btn btn-success btn-quirk btn-block" onClick={this.updateProduct}>UPDATE</button>
						}

					</div>

					{/* RIGHT SIDE END 2 */}

				</div>

				<style global jsx>{`
        #category_images {
					display: inline-flex;
					width: 100%;
					justify-content: start;
					align-items: end;
				}

				#category_images button {
					margin-right: 10px;
					margin-left: 10px;
				}
				
				#category_images .image_gallery {
					height: 100%;
				}
				#category_images .image_gallery img {
					margin: 10px;
					height: 90px;
					width: 120px;
				}


      `}</style>

			</AdminLayout >
		);
	}
}

export default Product;

