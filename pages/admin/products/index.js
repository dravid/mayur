import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;

import Link from "next/link";
import Router from 'next/router';

import AdminLayout from './../../../layouts/AdminLayout.js';
import { encodeForm } from './../../../utils/api-utils.js';

import { notification, Popconfirm, Icon, Table, Input, Button } from 'antd';

const notificationMessage = (type, message, description) => {
	notification[type]({
		message: message,
		description: description,
		duration: 1.5,
		placement: "bottomRight"
	});
};

class ShowProducts extends React.Component {
	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		//Check if user is signed in - if not redirect to sign in form
		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		//Fetch all products from DB
		let products = [];
		let productsResponse = await fetch(`${siteUrl}/api/v1/products/products?${noCache}`);
		if (productsResponse.status === 200) {
			products = await productsResponse.json();
		}

		return {
			products: products,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
		};
	}
	constructor(props) {
		super(props);
		this.state = {
			products: this.props.products,
			filterProductName: '',
			filterProductCode: '',
			selectedInTable: [],
		};
	}

	//TABLE FILTERS HANDLER
	getColumnSearchProps = dataIndex => ({
		filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
			<div style={{ padding: 8 }}>
				<Input
					ref={node => {
						this.searchInput = node;
					}}
					placeholder={`Search ${dataIndex}`}
					value={selectedKeys[0]}
					onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
					onPressEnter={() => this.handleSearch(selectedKeys, confirm)}
					style={{ width: 188, marginBottom: 8, display: 'block' }}
				/>
				<Button
					type="primary"
					onClick={() => this.handleSearch(selectedKeys, confirm)}
					icon="search"
					size="small"
					style={{ width: 90, marginRight: 8 }}
				>
					Trazi
				</Button>
				<Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
					Resetuj
				</Button>
			</div>
		),
		filterIcon: filtered => (
			<Icon type="search" style={{ color: filtered ? 'red' : undefined }} />
		),
		onFilter: (value, record) =>
			record[dataIndex]
				.toString()
				.toLowerCase()
				.includes(value.toLowerCase()),
		onFilterDropdownVisibleChange: visible => {
			if (visible) {
				setTimeout(() => this.searchInput.select());
			}
		},
	});

	handleSearch = (selectedKeys, confirm) => {
		confirm();
		this.setState({ searchText: selectedKeys[0] });
	};

	handleReset = clearFilters => {
		clearFilters();
		this.setState({ searchText: '' });
	};
	//-------------END OF TABLE FILTER HANDLERS

	deleteProductHandler = async (_id, productCode) => {
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: _id,
			productCode: productCode,
			type: "products",
			action: "remove"
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

			if (response.status === 'database_error') {
				notificationMessage('error', 'Greska', 'Doslo je do greske u sistemu');
				console.log('database_error');
			}
			else if (response.status === 'item_deleted') {
				notificationMessage('success', 'Uspeh', 'Proizvod je uspesno obrisan.');
				setTimeout(function () {
					window.location.reload();
				}, 1000);
				console.log("removed");
			}
			else {
				console.log('unknown_status');
			}
		});
	}

	render() {

		const textConfirm = 'Jeste sigurni da zelite da obrisete proizvod?';

		const columnsShipments = [
			{
				title: 'Ime proizvoda',
				dataIndex: 'name',
				...this.getColumnSearchProps('name'),
			},
			{
				title: 'Sifra proizvoda',
				dataIndex: 'productCode',
				...this.getColumnSearchProps('productCode'),
			},
			{
				title: 'Sku',
				dataIndex: 'sku',
				...this.getColumnSearchProps('sku'),
			},
			{
				title: 'Kategorija',
				dataIndex: 'category',
				...this.getColumnSearchProps('category'),
			},
			{
				title: 'Cena',
				dataIndex: 'price',
				...this.getColumnSearchProps('price'),
			},
			{
				title: 'Popust',
				dataIndex: 'discount',
				...this.getColumnSearchProps('discount'),
			},
			{
				title: 'Zaliha',
				dataIndex: 'supply',
			},
			{
				title: 'Akcija',
				render: (text, record) => (
					<div>

						<a href={"/product/" + record.uri}>
							<Button size="small" icon="eye"></Button>
						</a>

						<a icon="edit" href={"/admin/products/" + record._id}>
							<Button size="small" icon="edit"></Button>
						</a>

						<Popconfirm placement="left" title={textConfirm}
							onConfirm={() => this.deleteProductHandler(record._id)} okText="Da"
							cancelText="Ne">
							<Button size="small" icon="delete"></Button>
						</Popconfirm>
					</div>
				),
			},
		];

		//Selected row(s) in shipments table
		const rowSelectionTable = {
			onChange: (selectedRowKeys, selectedRows) => {
				this.setState({ selectedInTable: selectedRows });
				console.log("Selected Objects :", selectedRows);
			},
			getCheckboxProps: record => ({
				name: record.name,
			}),
		};

		return (
			<div style={{ position: 'relative' }}>
				<AdminLayout {...this.props}>

					<ol className="breadcrumb breadcrumb-quirk">
						<li><a href="/"><i className="fa fa-home mr5"></i> Home</a></li>
						<li className="active">Products</li>
					</ol>

					<div className="row">
						<div className="col-sm-12 col-md-12 col-lg-12 people-list">

							<div className="people-options clearfix">

								<div className="btn-toolbar pull-left">
									<Link href="/admin/products/new">
										<button type="button" className="btn btn-success btn-quirk"
										>Add product</button>
									</Link>
								</div>

								<span className="people-count pull-right">Showing <strong>1-10</strong> of <strong>{this.state.products ? this.state.products.length : ''}</strong> products</span>
							</div>


							{/* START CENTER CONTENT */}

							<div className="panel">
								<div className="panel-body">
									<div className="table-responsive">

										<Table
											size="small"
											pagination={{ defaultPageSize: 10, position: "top", showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000', '2000', '5000'] }}
											rowSelection={rowSelectionTable}
											bordered
											dataSource={this.props.products}
											columns={columnsShipments}
											rowKey="_id" />

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

export default ShowProducts;