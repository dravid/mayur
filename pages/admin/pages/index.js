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

class Pages extends React.Component {
	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		let pages = [];
		let pagesResponse = await fetch(`${siteUrl}/api/v1/pages?${noCache}`);
		if (pagesResponse.status === 200) {
			pages = await pagesResponse.json();
		}

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		return {
			pages: pages,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
		};
	}
	constructor(props) {
		super(props);
		this.state = {
			pages: this.props.pages,
			filterFirstName: '',
			filterTitle: '',
			selectedInTable: [],
		};

		this.deletePageHandler = this.deletePageHandler.bind(this);
		this.addPage = this.addPage.bind(this);
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

	async addPage(event) {
		event.preventDefault();
		Router.push('/admin/pages/new');
	}

	async deletePageHandler(_id, uri) {
		const formData = {
			_csrf: this.props.session.csrfToken,
			_id: _id,
			uri: uri,
			type: "pages",
			action: "remove"
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
			if (response.status === 'database_error') {
				notificationMessage('error', 'Greska', 'Doslo je do greske u sistemu');
				console.log('database_error');
			}
			else if (response.status === 'item_deleted') {
				notificationMessage('success', 'Uspeh', 'Stranica je uspesno obrisana.');
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
		const textConfirm = 'Jeste sigurni da zelite da obrisete stranicu?';

		const columnsShipments = [
			{
				title: 'Naslov',
				dataIndex: 'title',
				...this.getColumnSearchProps('title'),
			},
			{
				title: 'Kreirano',
				dataIndex: 'createdAt',
				...this.getColumnSearchProps('createdAt'),
			},
			{
				title: 'Izmenjeno',
				dataIndex: 'updatedAt',
				...this.getColumnSearchProps('updatedAt'),
			},
			{
				title: 'Ime',
				dataIndex: 'authorFirstName',
				...this.getColumnSearchProps('authorFirstName'),
			},
			{
				title: 'Prezime',
				dataIndex: 'authorLastName',
				...this.getColumnSearchProps('authorLastName'),
			},
			{
				title: 'Akcija',
				render: (text, record) => (
					<div style={{ display: 'inline-flex' }}>
						<a href={"/" + record.uri}>
							<Button size="small" icon="eye"></Button>
						</a>
						<a icon="edit" href={"/admin/pages/" + record._id}>
							<Button size="small" icon="edit"></Button>
						</a>
						<Popconfirm placement="left" title={textConfirm}
							onConfirm={() => this.deletePageHandler(record._id, record.uri)} okText="Da"
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
						<li className="active">Pages</li>
					</ol>

					<div className="row">
						<div className="col-sm-8 col-md-9 col-lg-10 people-list">

							<div className="people-options clearfix">

								<div className="btn-toolbar pull-left">
									<button type="button" className="btn btn-success btn-quirk" onClick={this.addPage}>Add page</button>
								</div>

								<span className="people-count pull-right">Showing <strong>1-10</strong> of <strong>{this.state.pages ? this.state.pages.length : ''}</strong> pages</span>
							</div>

							{/* START CENTER CONTENT */}

							<div className="panel">
								<div className="panel-body">
									<div className="table-responsive">

										<Table
											size="small"
											style={{minHeight: 400}}
											pagination={{ defaultPageSize: 10, position: "top", showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100', '200', '500'] }}
											rowSelection={rowSelectionTable}
											bordered
											dataSource={this.state.pages}
											columns={columnsShipments}
											rowKey="_id" />

									</div>
								</div>
							</div>
						</div>

						{/* END CENTER CONTENT */}

						{/* SIDE PANEL		 */}

						<div className="col-sm-4 col-md-3 col-lg-2">
							<div className="panel">

								<div className="panel panel-primary list-announcement">

									<div className="panel-heading">
										<h4 className="panel-title">Latest pages</h4>
									</div>

									<div className="panel-body">

										<ul className="list-unstyled mb20">

											{/* LAST 3 PAGES */}
											{this.state.pages.slice((this.state.pages.length ? (this.state.pages.length - 3) : ''), (this.state.pages.length ? this.state.pages.length : ''))
												.map((page, index) => {
													const title = page.title ? page.title : '';
													const createdAt = page.createdAt ? page.createdAt : '';
													const pageUrl = "/admin/pages/" + page._id;

													return (
														<li key={index}>
															<a href={pageUrl}> <h5 style={{ fontSize: '15px', color: '#259dab' }}>{title.length > 40 ? `${title.slice(0, 40).toUpperCase()}...` : title.toUpperCase()}</h5></a>
															<p>{page.googleDescription ? page.googleDescription : ""}</p>
															<small >{createdAt}</small>
														</li>
													);
												})}
											{/* ----------END LAST PAGES--------- */}

										</ul>
									</div>

								</div>

							</div>
						</div>

						{/* --------END SIDE PANEL---------- */}
					</div>

				</AdminLayout>
			</div>
		);
	}
}

export default Pages;