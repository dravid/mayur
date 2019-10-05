import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;

import Link from "next/link";
import Router from 'next/router';

import AdminLayout from './../../../layouts/AdminLayout.js';
import { encodeForm } from './../../../utils/api-utils.js';
import { Input, notification, Popconfirm, Upload, Modal, Icon } from 'antd';

const notificationDeleteSuccess = type => {
	notification[type]({
		message: 'Success',
		description:
			'Order successfully deleted.',
		duration: 1,
		placement: "bottomRight"
	});
};

class ShowOrders extends React.Component {
	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		//Check if user is signed in - if not redirect to sign in form
		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		//Fetch all orders from DB
		let orders = [];
		let ordersResponse = await fetch(`${siteUrl}/api/v1/orders?${noCache}`);
		if (ordersResponse.status === 200) {
			orders = await ordersResponse.json();

		}

		return {
			orders: orders,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
		};
	}
	constructor(props) {
		super(props);
		this.state = {
			orders: this.props.orders,
			filterProductName: '',
			filterProductCode: '',
		};
	}


	componentDidMount = async () => {

		//Load table with delay so jquery can load first 
		await setTimeout(function () {
			$('#example').DataTable();
		}, 600);
	}

	deleteProductHandler = async (_id) => {
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: _id,
			type: "orders",
			action: "remove"
		};

		const encodedForm = await encodeForm(formData);

		let pages = await fetch(`${siteUrl}/api/v1/orders`, {
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
				console.log("removed");
			}
			else {
				console.log('unknown_status');
			}
			setTimeout(function () {
				window.location.reload();
			}, 700)
		});

	}

	render() {

		const orders = this.state.orders;
		const textConfirm = 'This action will delete order, are you sure?';

		return (
			<div style={{ position: 'relative' }}>
				<AdminLayout {...this.props}>

					<ol className="breadcrumb breadcrumb-quirk">
						<li><a href="/"><i className="fa fa-home mr5"></i> Home</a></li>
						<li className="active">Orders</li>
					</ol>

					<div className="row">
						<div className="col-sm-12 col-md-12 col-lg-12 people-list">

							<div className="people-options clearfix">


								<span className="people-count pull-right">Showing <strong>1-10</strong> of <strong>{this.state.orders ? this.state.orders.length : ''}</strong> orders</span>
							</div>


							{/* START CENTER CONTENT */}

							<div className="panel">
								<div className="panel-body">
									<div className="table-responsive">

										<table id="example" className="table table-bordered table-striped-col">

											<thead>

												<tr>
													<th>Order Number</th>
													<th>Buyer</th>
													<th>Total Price</th>
													<th>Order status</th>
													<th>Order date</th>
													<th>Action</th>
												</tr>

											</thead>

											<tbody>

												{/* RENDER ORDERS TABLE */}

												{this.props.orders.map((order, index) => {
													const orderNumber = order.orderNumber ? order.orderNumber : '';
													const buyer = order.user.firstName + " " + order.user.lastName;
													const totalPrice = order.totalPrice ? order.totalPrice : '';
													const orderStatus = order.orderStatus ? order.orderStatus : '';
													const orderDate = order.createdAt ? order.createdAt : '';

													const editUrl = "/admin/orders/" + order._id;

													return (
														<tr key={index}>
															<td>{orderNumber}</td>
															<td>{buyer}</td>
															<td>{totalPrice}</td>
															<td >{orderStatus}</td>
															<td >{orderDate}</td>

															{/* Controls */}
															<td className="text-info">

																{/* Edit product */}
																<Link href={editUrl}>
																	<i className="glyphicon glyphicon-edit controls" />
																</Link>

																{/* Delete product */}
																<Popconfirm placement="left" title={textConfirm}
																	onConfirm={() => this.deleteProductHandler(order._id)} okText="Yes"
																	cancelText="No">
																	<i className="glyphicon glyphicon-trash controls" />
																</Popconfirm>

															</td>
														</tr>
													);
												})}

												{/* -----------END RENDER PAGES-------- */}

											</tbody>
										</table>

									</div>
								</div>
							</div>
						</div>


						{/* END CENTER CONTENT */}


					</div>

				</AdminLayout>
			</div>
		);
	}
}

export default ShowOrders;