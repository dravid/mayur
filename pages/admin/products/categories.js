import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout';
import { encodeForm } from '../../../utils/api-utils';
import { Input, Select, message, Button, Icon, Popconfirm, notification, Upload, Modal } from 'antd';
import Link from "next/link"
import SortableTree, { changeNodeAtPath, removeNodeAtPath, addNodeUnderParent } from 'react-sortable-tree';
import Head from 'next/head';
import { transliterate as tr, slugify } from 'transliteration';

const Option = Select.Option;
const moment = require('moment');

const notificationMessage = (type, message, description) => {
	notification[type]({
		message: message,
		description: description,
		duration: 1.5,
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
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);
		this.state = {

			categories: this.props.productsCategories ? this.props.productsCategories : [],
			createdAt: '',

			treeData: [{
				title: '',
				level: 1,
				path: ''
			}],
			title: '',

			searchString: '',
			searchFocusIndex: 0,
			searchFoundCount: null,

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

	componentDidMount = async () => {
		if (this.props.query._id && this.props.query._id !== "new" && this.props.query._id.length === 24) {
			// Fetch Products Category-ID for edit unless request is for NEW category
			const formData = {
				_csrf: this.props.session.csrfToken,
				_id: this.props.query._id,
				action: 'getOne',
			};
			const encodedForm = await encodeForm(formData);
			await fetch(`${siteUrl}/api/v1/products/productsCategories`, {
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
						treeData: response.data.category ? response.data.category : [],
						fileList: response.data.featuredImage ? response.data.featuredImage : [],
						createdAt: response.data.createdAt
					});
					notificationMessage('success', "Uspeh", "Kategorija je spremna za izmenu");
				}
			});
		}
	}

	addCategory = async (event) => {
		event.preventDefault();
		const formData = {
			_csrf: await NextAuth.csrfToken(),
			category: JSON.stringify(this.state.treeData),
			featuredImage: JSON.stringify(this.state.fileList),
			createdAt: this.state.createdAt,
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
				notificationMessage('error', 'Greska', 'Doslo je do greske u sistemu');
			}
			else if (response.status === 'item_added') {
				notificationMessage('success', 'Uspeh', 'Kategorija je uspesno dodata');
				setTimeout(function () {
					window.location.reload();
				}, 1000);
			}
			else {
				console.log('unknown_status');
			}
		});
	}

	updateCategory = async () => {
		const formData = {
			_csrf: await NextAuth.csrfToken(),
			_id: this.props.query._id,
			category: JSON.stringify(this.state.treeData),
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
				notificationMessage('error', 'Greska', 'Doslo je do greske u sistemu');
			}
			else if (response.status === 'item_updated') {
				notificationMessage('success', 'Uspeh', 'Kategorija je uspesno izmenjena');
				setTimeout(function () {
					window.location.href = '/admin/products/categories/new';
				}, 1000);
			}
			else {
				console.log('unknown_status');
			}
		});
	}

	deleteCategoryHandler = async (id) => {
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: id,
			action: "remove"
		};
		const encodedForm = await encodeForm(formData);
		await fetch(`${siteUrl}/api/v1/products/productsCategories`, {
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
			if (response.status === 'item_deleted') {
				notificationMessage('success', 'Uspeh', 'kategorija je uspesno obrisana.');
				setTimeout(function () {
					window.location.reload();
				}, 1000);
				console.log('Item_deleted')
			}
			else {
				console.log('unknown_status');
			}
		});
	}

	categoryEdit = async (id) => {
		window.location.href = '/admin/products/categories/' + id;
	}

	render() {

		const getNodeKey = ({ treeIndex }) => treeIndex;

		// Check if new Page or edit
		const isNew = (this.props.query._id && this.props.query._id === "new") ? true : false;
		const textConfirm = 'This action will delete category, are you sure?';

		//image control
		const { previewVisible, previewImage, fileList } = this.state;
		const uploadButton = (
			<div>
				<Icon type="plus" />
				<div className="ant-upload-text">Upload</div>
			</div>
		);

		//SEARCH THE TREE
		const { searchString, searchFocusIndex, searchFoundCount } = this.state;

		// Case insensitive search of `node.title`
		const customSearchMethod = ({ node, searchQuery }) =>
			searchQuery &&
			node.title.toLowerCase().indexOf(searchQuery.toLowerCase()) > -1;

		const selectPrevMatch = () =>
			this.setState({
				searchFocusIndex:
					searchFocusIndex !== null
						? (searchFoundCount + searchFocusIndex - 1) % searchFoundCount
						: searchFoundCount - 1,
			});

		const selectNextMatch = () =>
			this.setState({
				searchFocusIndex:
					searchFocusIndex !== null
						? (searchFocusIndex + 1) % searchFoundCount
						: 0,
			});
		//----END OF SEARCH

		return (

			<AdminLayout {...this.props}>

				<Head>
					<link rel="stylesheet" href={siteUrl + "/static/styles/admin/react-sortable.css"} />
				</Head>

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
					<div className="col-sm-12 col-md-4 col-lg-4 people-list">


						{/* LEFT _CHILD CONTENT */}
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
													<Button style={{ width: "75%" }} size="small">{item.category && item.category[0].title ? item.category[0].title : 'Error'}</Button>
												</Link>
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
					{/* page INFO - SAVE */}
					<div className="col-sm-12 col-md-8 col-lg-8">

						{/* ADD PRODUCTS SUBCATEGORIES */}
						<div className="panel panel-primary" style={{ minHeight: '133px' }}>

							<div className="panel-heading">
								<h4 className="panel-title">Category tree</h4>
							</div>

							<div className="panel-body" >

								<div style={{ height: '100%', width: "100%" }}>

									{/* Search form */}
									<form
										style={{ display: 'inline-block', marginBottom: "10px" }}
										onSubmit={event => {
											event.preventDefault();
										}}
									>
										<Input
											id="find-box"
											addonBefore="Search"
											type="text"
											size="small"
											placeholder="Search..."
											style={{ width: '70%' }}
											value={searchString}
											onChange={event =>
												this.setState({ searchString: event.target.value })
											}
										/>

										<Button
											type="button"
											icon="caret-left"
											size="small"
											disabled={!searchFoundCount}
											onClick={selectPrevMatch}
										>
										</Button>

										<Button
											type="submit"
											icon="caret-right"
											size="small"

											disabled={!searchFoundCount}
											onClick={selectNextMatch}
										>
										</Button>

										<span>
											&nbsp;
											&nbsp;
            {searchFoundCount > 0 ? searchFocusIndex + 1 : 0}
											&nbsp;/&nbsp;
            {searchFoundCount || 0}
										</span>
									</form>
									{/* End of search form */}

									<SortableTree
										treeData={this.state.treeData}
										onChange={treeData => this.setState({ treeData })}
										// Custom comparison for matching during search.
										// This is optional, and defaults to a case sensitive search of
										// the title and subtitle values.
										// see `defaultSearchMethod` in https://github.com/frontend-collective/react-sortable-tree/blob/master/src/utils/default-handlers.js
										searchMethod={customSearchMethod}
										//
										// The query string used in the search. This is required for searching.
										searchQuery={searchString}
										//
										// When matches are found, this property lets you highlight a specific
										// match and scroll to it. This is optional.
										searchFocusOffset={searchFocusIndex}
										//
										// This callback returns the matches from the search,
										// including their `node`s, `treeIndex`es, and `path`s
										// Here I just use it to note how many matches were found.
										// This is optional, but without it, the only thing searches
										// do natively is outline the matching nodes.
										searchFinishCallback={matches =>
											this.setState({
												searchFoundCount: matches.length,
												searchFocusIndex:
													matches.length > 0 ? searchFocusIndex % matches.length : 0,
											})
										}
										style={{ width: '100%' }}
										isVirtualized={false}
										maxDepth={10}
										rowHeight={34}

										generateNodeProps={({ node, path }) => ({
											title: (
												<div style={{ maxWidth: '270px' }}>

													<Input
														addonBefore="Category"
														size="small"
														style={{ fontSize: '12px', width: '65%' }}
														value={node.title}
														onChange={event => {
															const title = event.target.value;
															const value = event.target.value;

															this.setState(state => ({
																treeData: changeNodeAtPath({
																	treeData: state.treeData,
																	path,
																	getNodeKey,
																	newNode: { ...node, title, path, value },
																}),
															}));
														}}
													/>
													<Input
														addonBefore="Level"
														size="small"
														style={{ fontSize: '12px', width: '35%' }}
														value={node.level}
														onChange={event => {
															const level = event.target.value;
															this.setState(state => ({
																treeData: changeNodeAtPath({
																	treeData: state.treeData,
																	path,
																	getNodeKey,
																	newNode: { ...node, level, path },
																}),

															}));
														}}
													/>
												</div>
											),
											buttons: [
												<Button
													icon="delete"
													size="small"
													onClick={() =>
														this.setState(state => ({
															treeData: removeNodeAtPath({
																treeData: state.treeData,
																path,
																getNodeKey,
															}),
														}))
													}
												/>,
												<Button
													icon="plus"
													size="small"
													id={path.length === 1 ? 'btn_add_parent' : 'btn_add_children'}
													onClick={() =>
														this.setState(state => ({
															treeData: addNodeUnderParent({
																treeData: state.treeData,
																parentKey: path[path.length - 1],
																expandParent: true,
																getNodeKey,
																newNode: {
																	title: '',
																	level: +(path.length + 1),
																	path: path,
																	value: ''
																},
															}).treeData,
														}))}
												/>,
												<Button
													className="btn btn-danger"
													size="small"
													icon="select"
													onClick={() => console.log('Selected', node)}
												/>,
											],

										}
										)
										}
									/>
								</div>

							</div>

							<div style={{ padding: '10px 20px', minHeight: 130 }}>
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
									<img alt="category_image" style={{ width: "100%" }} src={previewImage} />
								</Modal>
							</div>

						</div>

						{isNew
							? <button className="btn btn-success btn-quirk btn-block" onClick={this.addCategory}>SAVE</button>
							: <button className="btn btn-success btn-quirk btn-block" onClick={this.updateCategory}>UPDATE</button>
						}

					</div>

					{/* RIGHT SIDE END  */}

				</div>
			</AdminLayout >
		);
	}
}

export default Product;

