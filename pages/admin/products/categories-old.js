import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout';
import { encodeForm } from '../../../utils/api-utils';
import { Input, Select, message, Button, Icon, Modal, Upload, notification, Popconfirm } from 'antd';
import Link from "next/link"
import { transliterate as tr, slugify } from 'transliteration';

const Option = Select.Option;
const moment = require('moment');
const newDate = moment(new Date()).format('DD.MM.YYYY HH:mm');


const notificationAddSuccess = type => {
	notification[type]({
		message: 'Success',
		description:
			'Category successfully created.',
		duration: 1,
		placement: "bottomRight"
	});
};

const notificationUpdateSuccess = type => {
	notification[type]({
		message: 'Success',
		description:
			'Category successfully updated.',
		duration: 1,
		placement: "bottomRight"
	});
};

const notificationDeleteSuccess = type => {
	notification[type]({
		message: 'Success',
		description:
			'Category successfully deleted.',
		duration: 1,
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

		//Fetch all productsCategories from DB
		let productsCategories = [];
		let productsCategoriesResponse = await fetch(`${siteUrl}/api/v1/products/productsCategories?${noCache}`);
		if (productsCategoriesResponse.status === 200) {
			productsCategories = await productsCategoriesResponse.json();
		}

		return {
			productsCategories: productsCategories,
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

			categories: this.props.productsCategories,
			createdAt: '',

			category: '',
			subCategory: [''],
			group: [''],

			//featured image
			previewVisible: false,
			previewImage: '',
			fileList: [],

		};
	}

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

	//Subcategory handles
	handleSubcategory = i => e => {
		let subCategory = [...this.state.subCategory]
		subCategory[i] = e.target.value
		this.setState({
			subCategory
		})
	}


	handleSubcategoryDelete = i => e => {
		e.preventDefault()
		if (this.state.subCategory.length >= 2) {
			let subCategory = [
				...this.state.subCategory.slice(0, i),
				...this.state.subCategory.slice(i + 1)
			]
			this.setState({
				subCategory
			})
		}
	}

	addSubCategory = e => {
		e.preventDefault()
		let subCategory = this.state.subCategory.concat([''])
		this.setState({
			subCategory
		})
	}
	//----------End of subcategory handles----------


	//Group handles
	handleGroup = i => e => {
		let group = [...this.state.group]
		group[i] = e.target.value
		this.setState({
			group
		})
	}

	handleGroupDelete = i => e => {
		e.preventDefault()
		if (this.state.group.length >= 2) {
			let group = [
				...this.state.group.slice(0, i),
				...this.state.group.slice(i + 1)
			]
			this.setState({
				group
			})
		}
	}

	addGroup = e => {
		e.preventDefault()
		let group = this.state.group.concat([''])
		this.setState({
			group
		})
	}
	//----------End of group handles----------



	componentDidMount = async () => {

		if (this.props.query._id && this.props.query._id !== "new" && this.props.query._id.length === 24) {

			// Fetch Products Category-ID for edit unless request is for NEW category
			const formData = {
				_csrf: this.props.session.csrfToken,
				_id: this.props.query._id,
				action: 'getOne',
			};

			const encodedForm = await encodeForm(formData);

			let pages = await fetch(`${siteUrl}/api/v1/products/productsCategories`, {
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
						category: response.data.category ? response.data.category : '',
						subCategory: response.data.subCategory ? response.data.subCategory : [],
						fileList: response.data.featuredImage ? response.data.featuredImage : [],
						createdAt: response.data.createdAt
					});
				}
			});

		}
	}

	addCategory = async (event) => {
		event.preventDefault();

		// Category name is required
		if (!this.state.category || this.state.category.trim().length <= 0) {
			alert('Please insert category!');
			return false;
		}

		// Check if category is unique
		let check = this.state.categories.filter((item) => (item.category === this.state.category));
		if (check.length >= 1) {
			alert('Category with that name already exists, category name must be unique!');
			return false;
		}

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			category: this.state.category,
			subCategory: this.state.subCategory,
			featuredImage: JSON.stringify(this.state.fileList),
			action: 'add',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/products/productsCategories', {
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
				notificationAddSuccess('success');
				console.log('item_added');
			}
			else {
				console.log('unknown_status');
			}
			setTimeout(function () {
				window.location.reload();
			}, 700)
		});
	}


	updateCategory = async () => {

		// Category name is required
		if (!this.state.category || this.state.category.trim().length <= 0) {
			alert('Please insert category!');
			return false;
		}

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			_id: this.props.query._id,
			category: this.state.category,
			subCategory: this.state.subCategory,
			featuredImage: JSON.stringify(this.state.fileList),
			createdAt: this.state.createdAt,

			action: 'set',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/products/productsCategories', {
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

			// return to categories list after update
			setTimeout(function () {
				window.location.href = '/admin/products/categories/new';
			}, 700)
		});
	}

	deleteCategoryHandler = async (id) => {
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: id,
			action: "remove"
		};

		const encodedForm = await encodeForm(formData);

		let pages = await fetch(`${siteUrl}/api/v1/products/productsCategories`, {
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
			if (response.status === 'item_deleted') {
				notificationDeleteSuccess('success')
				console.log('Item_deleted')
			}
			else {
				console.log('unknown_status');
			}
			setTimeout(function () {
				window.location.reload();
			}, 700)
		});
	}

	categoryEdit = async (id) => {
		window.location.href = '/admin/products/categories/' + id;
	}



	render() {

		// Check if new Page or edit
		const isNew = (this.props.query._id === "new") ? true : false;
		const category = this.state.category && this.state.category.length > 0 ? true : false;
		const subCategory = this.state.subCategory && this.state.subCategory.length > 1 ? true : false;

		//image control
		const { previewVisible, previewImage, fileList } = this.state;
		const uploadButton = (
			<div>
				<Icon type="plus" />
				<div className="ant-upload-text">Upload</div>
			</div>
		);

		const textConfirm = 'This action will delete category, are you sure?';


		return (

			<AdminLayout {...this.props}>

				{isNew
					? <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin"}><i className="fa fa-home mr5"></i> Home > Products > Categories</a></li>
						<li className="active">New Category</li>
					</ol>
					: <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin"}><i className="fa fa-home mr5"></i> Home > Products > Categories</a></li>
						<li className="active">Edit Category</li>
					</ol>
				}

				<div className="row">
					<div className="col-sm-12 col-md-6 col-lg-6 people-list">


						{/* LEFT _CHILD CONTENT */}

						{/* PRODUCT CATEGORY */}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">Add Category</h4>
							</div>

							<div className="panel-body">
								<div style={{ margin: '5px 0px', width: "100%", display: "inline-block" }}>

									<Input
										addonBefore="Category"
										value={this.state.category}
										placeholder="Add category"
										onChange={(event) => { this.setState({ category: event.target.value }); }}
									/>

								</div>

								<div className="panel-heading">
									<h4 className="panel-title">Category image</h4>
								</div>

								<div className="panel-body">

									<Upload
										action="/api/v1/imageupload"
										accept=".jpg,.jpeg,.png,.bmp"
										name="myFile"
										headers={{
											uri: slugify(this.state.category),
											path: "products",
											type: "product_category",
											'X-CSRF-TOKEN': this.props.session.csrfToken,
										}}
										listType="picture-card"
										fileList={fileList}
										onPreview={this.imageHandlePreview}
										onChange={this.imageHandleChange}
									>
										{fileList.length >= 1 ? null : uploadButton}
									</Upload>
									<Modal visible={previewVisible} footer={null} onCancel={this.imageHandleCancel}>
										<img alt="example" style={{ width: '100%' }} src={previewImage} />
									</Modal>
								</div>


							</div>

						</div>
						{/* -------------------------- */}

						{/* CATEGORY LIST */}
						<div className="panel panel-primary">

							<div className="panel-heading">
								<h4 className="panel-title">All categories</h4>
							</div>

							<div className="panel-body">


								<div style={{ margin: '5px 0px', width: "100%", display: "inline-block" }}>
									{this.state.categories.map((item, index) => {

										const categoryUrl = '/admin/products/categories/' + item._id;
										return (
											<div key={index}>
												<Link href={categoryUrl}>
													<Button style={{ width: "85%" }} size="small">{item.category}</Button>
												</Link>


												{/* Delete category */}
												<Popconfirm placement="left" title={textConfirm}
													onConfirm={() => this.deleteCategoryHandler(item._id)} okText="Yes"
													cancelText="No">
													<Button style={{ marginLeft: '10px' }}
														type="default"
														size="small"
														icon="delete"
													/>
												</Popconfirm>


											</div>
										)
									})}
								</div>

							</div>

						</div>
						<Link href="/admin/products/categories/new">
							<button className="btn btn-success btn-quirk btn-block">Add new</button>
						</Link>
						{/* -------------------------- */}


					</div>
					{/* LEFT END */}

					{/* RIGHT SIDE CONTENT	 */}

					<div className="col-sm-12 col-md-6 col-lg-6">


						{/* ADD PRODUCTS SUBCATEGORIES */}
						<div className="panel panel-primary" style={{ minHeight: '133px' }}>

							<div className="panel-heading">
								<h4 className="panel-title">Add subcategory</h4>
							</div>

							<div className="panel-body">

								{category ?
									this.state.subCategory.map((subCategory, index) => (
										<span key={index} style={{ width: "100%", display: "inline-block", margin: '5px 0px' }}>
											<Input
												style={{ width: '65%' }}
												addonBefore="Name"
												key={index}
												type="text"
												size="small"
												className="mb-2"
												placeholder="Add subcategory"
												onChange={this.handleSubcategory(index)}
												value={subCategory}
											/>
											<Button style={{ marginLeft: '10px' }} type="default" size="small" icon="delete" onClick={this.handleSubcategoryDelete(index)} />
											<Button style={{ marginLeft: '10px' }} type="default" size="small" icon="plus-circle" onClick={this.addSubCategory} />
										</span>
									))
									: null}

							</div>
							{/* -------------------------- */}

						</div>

						{isNew
							? <button className="btn btn-success btn-quirk btn-block" onClick={this.addCategory}>SAVE</button>
							: <button className="btn btn-success btn-quirk btn-block" onClick={this.updateCategory}>UPDATE</button>
						}

					</div>

					{/* RIGHT SIDE END  */}


				</div>

				<style global jsx>{`


      `}</style>


			</AdminLayout >
		);
	}
}

export default Product;

