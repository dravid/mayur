import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout.js';
import { encodeForm } from '../../../utils/api-utils.js';
import { notification, Popconfirm, Icon, Table, Input, Button } from 'antd';

const notificationMessage = (type, message, description) => {
	notification[type]({
		message: message,
		description: description,
		duration: 1.5,
		placement: "bottomRight"
	});
};

class Subscriptions extends React.Component {

	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });
		let subscriptions = [];
		let subscriptionsResponse = await fetch(`${siteUrl}/api/v1/subscriptions?${noCache}`);
		if (subscriptionsResponse.status === 200) {
			subscriptions = await subscriptionsResponse.json();
		}

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}

		if (res && session && session.csrfToken) {
		}

		return {
			session: session,
			subscriptions: subscriptions,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);
		this.state = {
			subscriptions: this.props.subscriptions,

			subscriptionName: '',
			description: '',
			price: '',
			limit: '',
			duration: '',

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

	addSubscription = async (event) => {
		const formData = {
			_csrf: await NextAuth.csrfToken(),
			subscriptionName: this.state.subscriptionName,
			description: this.state.description,
			price: this.state.price,
			limit: this.state.limit,
			duration: this.state.duration,
			action: 'add',
		};

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/subscriptions', {
			credentials: 'include',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: encodedForm
		}).then(async res => {

			console.log(res);

			//return await res.json();
			let response = await res.json();

			if (response.status === 'database_error') {
				notificationMessage('error', 'Greska', 'Doslo je do greske u sistemu');
				console.log('database_error');
			}
			else if (response.status === 'item_added') {
				console.log('Item successfully added');
				notificationMessage('success', "Uspeh", "Paket je uspesno dodat");
			}
			else {
				console.log('unknown_status');
			}
			//return to post list after update
			setTimeout(function () {
				window.location.reload();
			}, 500)
		});
	}

	updateSubscription = async () => {

		const formData = {
			_csrf: await NextAuth.csrfToken(),
			_id: this.props.query.id,
			subscriptionName: this.state.subscriptionName,
			description: this.state.description,
			price: this.state.price,
			limit: this.state.limit,
			duration: this.state.duration,
			action: 'set',
		};
		console.log(formData);

		const encodedForm = Object.keys(formData).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
		}).join('&');

		fetch('/api/v1/subscriptions', {
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
			else if (response.status === 'item_set') {
				notificationMessage('success', 'Uspeh', 'Paket je uspesno izmenjen');
				console.log('item_updated');
			}
			else {
				console.log('unknown_status');
			}
			setTimeout(function () {
				window.location.reload();
			}, 500)
		});
	}

	// DELETE SUBSCRIPTIONS
	deleteSubscriptionHandler = async (id) => {
		const formData = {
			_csrf: this.props.session.csrfToken,
			id: id,
			action: "remove"
		};
		const encodedForm = await encodeForm(formData);

		let subscriptions = await fetch(`${siteUrl}/api/v1/subscriptions`, {
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
			else if (response.status === 'item_deleted') {
				notificationMessage('success', 'Uspeh', 'Paket je uspesno obrisan');
			}
			else {
				console.log('unknown_status');
			}
			setTimeout(function () {
				window.location.reload();
			}, 500)
		});
	}

	render() {

		const textConfirm = 'Jeste sigurni da zelite da obrisete paket?';

		const columnsShipments = [
			{
				title: 'Ime paketa',
				dataIndex: 'name',
				...this.getColumnSearchProps('name'),
			},
			{
				title: 'Opis',
				dataIndex: 'description',
				...this.getColumnSearchProps('description'),
			},
			{
				title: 'Cena',
				dataIndex: 'price',
				...this.getColumnSearchProps('price'),
			},
			{
				title: 'Broj oglasa',
				dataIndex: 'limit',
				...this.getColumnSearchProps('limit'),
			},
			// {
			// 	title: 'Broj slika',
			// 	dataIndex: 'limit',
			// 	...this.getColumnSearchProps('limit'),
			// },
			{
				title: 'Trajanje',
				dataIndex: 'duration',
				...this.getColumnSearchProps('duration'),
			},
			{
				title: 'Akcija',
				render: (text, record) => (
					<div>

						<a icon="edit" href={"/admin/subscriptions/" + record._id}>
							<Button size="small" icon="edit"></Button>
						</a>

						<Popconfirm placement="left" title={textConfirm}
							onConfirm={() => this.deleteSubscriptionHandler(record._id)} okText="Da"
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
						<li className="active">Subscriptions</li>
					</ol>

					<div className="row">

						{/* LEFT */}
						<div className="col-sm-7 col-md-7 col-lg-8 people-list">

							<div className="people-options clearfix">

								<div className="btn-toolbar pull-left">
								</div>

								<span className="people-count pull-right">Showing <strong>1-10</strong> of <strong>{this.state.subscriptions ? this.state.subscriptions.length : ''}</strong> subscriptions</span>
							</div>

							{/* START CATEGORY CONTENT */}

							<div className="panel">
								<div className="panel-body">
									<div className="table-responsive">

										<Table
											size="small"
											pagination={{ defaultPageSize: 10, position: "top", showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000', '2000', '5000'] }}
											rowSelection={rowSelectionTable}
											bordered
											dataSource={this.props.subscriptions}
											columns={columnsShipments}
											rowKey="_id" />

									</div>
								</div>
							</div>
						</div>

						{/* END SUBSCRIPTION LIST */}

						{/*RIGHT */}

						<div className="col-sm-5 col-md-5 col-lg-4">

							<div className="panel panel-primary">

								<div className="panel-heading">
									<h4 className="panel-title">Add new subscription</h4>
								</div>
								<div className="panel-body">
									<div className="form-group">
										<label className="control-label center-block">SUBSCRIPTION NAME:</label>
										<input
											type="text"
											className="form-control"
											placeholder="Subscription name"
											value={this.state.subscriptionName}
											onChange={(event) => { this.setState({ subscriptionName: event.target.value }) }}
										/>
									</div>
									<div className="form-group">
										<label className="control-label center-block">DESCRIPTION:</label>
										<input
											type="text"
											className="form-control"
											placeholder="Description"
											value={this.state.description}
											onChange={(event) => { this.setState({ description: event.target.value }); }}
										/>
									</div>
									<div className="form-group">
										<label className="control-label center-block">PRICE:</label>
										<input
											type="text"
											className="form-control"
											placeholder="Price"
											value={this.state.price}
											onChange={(event) => { this.setState({ price: event.target.value }) }}
										/>
									</div>
									<div className="form-group">
										<label className="control-label center-block">LIMIT:</label>
										<input
											type="text"
											className="form-control"
											placeholder="Limit"
											value={this.state.limit}
											onChange={(event) => { this.setState({ limit: event.target.value }) }}
										/>
									</div>
									<div className="form-group">
										<label className="control-label center-block">DURATION:</label>
										<input
											type="text"
											className="form-control"
											placeholder="Duration"
											value={this.state.duration}
											onChange={(event) => { this.setState({ duration: event.target.value }) }}
										/>
									</div>

									<div className="panel-footer">
										<button className="btn btn-success btn-quirk btn-block" onClick={this.addSubscription}>SAVE</button>
									</div>
								</div>
							</div>

						</div>

					</div>

				</AdminLayout>
			</div>
		);
	}
}

export default Subscriptions;