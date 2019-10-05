import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout';
import { encodeForm } from '../../../utils/api-utils';
import { Input, Select, message, Popconfirm, Icon, Modal, notification } from 'antd';
import Link from "next/link"

const notificationUpdateSuccess = type => {
	notification[type]({
		message: 'Success',
		description:
			'Order status successfully updated.',
		duration: 1,
		placement: "bottomRight"
	});
};

const { TextArea } = Input;
const Option = Select.Option;
const moment = require('moment');
const newDate = moment(new Date()).format('DD.MM.YYYY HH:mm');

class Orders extends React.Component {

	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		//Check if user is signed in - if not redirect to sign in form
		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		// Get order data
		let order = {};
		let orderResponse = await fetch(`${siteUrl}/api/v1/orders/${query._id}?${noCache}`);
		if (orderResponse.status === 200) {
			order = await orderResponse.json();
		}

		return {
			order: order,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);
		this.state = {

			order: this.props.order,
			orderStatus: this.props.order.orderStatus,

		};
	}

	componentDidMount = async () => {

	}

	updateProduct = async () => {


		const formData = {
			_csrf: await NextAuth.csrfToken(),
			_id: this.props.query._id,
			orderStatus: this.state.orderStatus,

			//Updated by info
			modifiedByFirstName: this.props.session.user.firstName,
			modifiedByLastName: this.props.session.user.lastName,
			modifiedCount: this.state.order && this.state.order.modifiedCount ? ++this.state.order.modifiedCount : 1,
			action: 'update_status',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/orders', {
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
				notificationUpdateSuccess('success');
				console.log('item_updated');
			}
			else {
				console.log('unknown_status');
			}

			// return to orders list after update
			setTimeout(function () {
				window.location.href = '/admin/orders';
			}, 600)
		});
	}


	render() {

		// Check if new Page or edit
		const newProduct = this.props.query.id === "new" ? true : false;
		const orderStatusValues = ['pending', 'transport', 'waiting', 'finished']


		return (

			<AdminLayout {...this.props}>

				{newProduct
					? <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin/orders"}><i className="fa fa-home mr5"></i> Home > Orders</a></li>
						<li className="active">New Product</li>
					</ol>
					: <ol className="breadcrumb breadcrumb-quirk">
						<li><a href={siteUrl + "/admin/orders"}><i className="fa fa-home mr5"></i> Home > Orders</a></li>
						<li className="active">Edit Product</li>
					</ol>
				}
				<div className="row">
					<div className="col-sm-12 col-md-6 col-lg-6 people-list">

						<div className="people-options clearfix">
							<div className="btn-toolbar pull-left">
								<Link href="/admin/orders">
									<button type="button" className="btn btn-success btn-quirk">All orders</button>
								</Link>
							</div>
						</div>


						{/* CENTER _CHILD CONTENT */}

						{/* User Name */}
						<div className="panel" style={{ padding: '30px', width: '100%', display: 'inline-block' }}>


							{/* Order number */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Input
									addonBefore="Order No"
									disabled
									type='text'
									size="default"
									className="mb-2"
									value={this.state.order.orderNumber}
									placeholder="Order Number"
								// onChange={(event) => { this.setState({ productCode: event.target.value }); }}
								/>
							</div>

							{/*  User name */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Input
									addonBefore="User name"
									disabled
									type='text'
									size="default"
									className="mb-2"
									value={this.state.order.user.firstName + " " + this.state.order.user.lastName}
									placeholder="User Name"
								// onChange={(event) => { this.setState({ name: event.target.value }); }}
								/>
							</div>

							{/* Order price */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Input
									addonBefore="Order price"
									disabled
									type='text'
									size="default"
									className="mb-2"
									value={this.state.order.orderPrice}
									placeholder="Order Price"
								// onChange={(event) => { this.setState({ seo: event.target.value }); }}
								/>
							</div>

							{/* Shipping option */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Input
									addonBefore="Shipping option"
									disabled
									type='text'
									size="default"
									className="mb-2"
									value={this.state.order.shippingOption.length > 1 ? this.state.order.shippingOption : "Not selected"}
									placeholder="Shipping option"
								// onChange={(event) => { this.setState({ seo: event.target.value }); }}
								/>
							</div>

							{/* Shipping option */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Input
									addonBefore="Shipping price"
									disabled
									type='text'
									size="default"
									className="mb-2"
									value={this.state.order.shippingPrice}
									placeholder="Shipping price"
								// onChange={(event) => { this.setState({ seo: event.target.value }); }}
								/>
							</div>

							{/* Total price */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Input
									addonBefore="Total price"
									disabled
									type='text'
									size="default"
									className="mb-2"
									value={this.state.order.totalPrice}
									placeholder="Total Price"
								// onChange={(event) => { this.setState({ seo: event.target.value }); }}
								/>
							</div>

							{/* Order status */}
							<div style={{ margin: '10px 0px', width: "100%", display: "inline-block" }}>
								<Select
									showSearch
									style={{ width: '100%', marginBottom: 5 }}
									size="default"
									placeholder="Status"
									optionFilterProp="children"
									value={this.state.orderStatus ? this.state.orderStatus : null}
									onChange={(value) => {
										this.setState({ orderStatus: value });
									}}
									filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
								>
									{orderStatusValues.map((item, index) => (
										<Option key={index} value={item.toLowerCase()}>{item.toUpperCase()}</Option>
									))}
								</Select>
							</div>

						</div>
					</div>
					{/* CENTER END */}

					{/* RIGHT SIDE_CHILD CONTENT	 */}

					<div className="col-sm-12 col-md-6 col-lg-6 people-list">

						<div className="people-options clearfix">
							<div className="btn-toolbar pull-left">
								<button type="button" className="btn btn-success btn-quirk">Order List Details</button>
							</div>
						</div>


						{/* CENTER _CHILD CONTENT */}


						<div className="panel" style={{ padding: '30px', width: '100%', display: 'inline-block' }}>


							{this.state.order.orderList.map((item, index) => (
								<Input.Group key={item._id} style={{ marginBottom: 20 }}>
									<Input addonBefore="Code" style={{ width: '50%' }} defaultValue={item.productCode} disabled />
									<Input addonBefore="SKU" style={{ width: '50%' }} defaultValue={item.sku} disabled />
									<Input addonBefore="Name" style={{ width: '50%' }} defaultValue={item.name} disabled />
									<Input addonBefore="Category" style={{ width: '50%' }} defaultValue={item.category} disabled />
									<Input addonBefore="SubCategory" style={{ width: '50%' }} defaultValue={item.subCategory} disabled />
									<Input addonBefore="Price" style={{ width: '50%' }} defaultValue={item.price} disabled />
									<Input addonBefore="Discount" style={{ width: '50%' }} defaultValue={`${item.discount}%`} disabled />
									<Input addonBefore="Quantity" style={{ width: '50%' }} defaultValue={item.qty} disabled />
									<Input addonBefore="Tax" style={{ width: '50%' }} defaultValue={`${item.tax}%`} disabled />
									<Input addonBefore="Total price" style={{ width: '50%' }} defaultValue={item.totalPrice} disabled />

								</Input.Group>
							))}





						</div>
					</div>

					{/* RIGHT SIDE END 1 */}

					{newProduct
						? <button className="btn btn-success btn-quirk btn-block" onClick={this.addProduct}>SAVE</button>
						: <button className="btn btn-success btn-quirk btn-block" onClick={this.updateProduct}>UPDATE</button>
					}



				</div>
			</AdminLayout >
		);
	}
}

export default Orders;

