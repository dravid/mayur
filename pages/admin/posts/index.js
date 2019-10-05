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

class Posts extends React.Component {
	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		let posts = [];
		let postsResponse = await fetch(`${siteUrl}/api/v1/posts?${noCache}`);
		if (postsResponse.status === 200) {
			posts = await postsResponse.json();
		}

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		return {
			posts: posts,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
		};
	}
	constructor(props) {
		super(props);
		this.state = {
			posts: this.props.posts,
			filterName: '',
			filterTitle: '',
			filterCategorie: '',
			selectedInTable: [],
		};
		this.deletePostHandler = this.deletePostHandler.bind(this);
		this.addPost = this.addPost.bind(this);
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

	async addPost(event) {
		event.preventDefault();
		Router.push('/admin/posts/new');
	}

	async deletePostHandler(_id, uri) {
		const formData = {
			_csrf: this.props.session.csrfToken,
			uri: uri,
			_id: _id,
			type: "posts",
			action: "remove"
		};

		const encodedForm = await encodeForm(formData);
		let posts = await fetch(`${siteUrl}/api/v1/posts`, {
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
				notificationMessage('success', 'Uspeh', 'Post je uspesno obrisan.');
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
		const textConfirm = 'Jeste sigurni da zelite da obrisete post?';

		const columnsShipments = [
			{
				title: 'Naslov',
				dataIndex: 'title',
				...this.getColumnSearchProps('title'),
			},
			{
				title: 'Kategorija',
				dataIndex: 'categories',
				...this.getColumnSearchProps('categories'),
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
						<a href={"/blog/" + record.uri}>
							<Button size="small" icon="eye"></Button>
						</a>
						<a icon="edit" href={"/admin/posts/" + record._id}>
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
						<li className="active">Posts</li>
					</ol>

					<div className="row">
						<div className="col-sm-8 col-md-9 col-lg-10 people-list">

							<div className="people-options clearfix">

								<div className="btn-toolbar pull-left">
									<button type="button" className="btn btn-success btn-quirk" onClick={this.addPost}>Add post</button>
								</div>

								<span className="people-count pull-right">Showing <strong>1-10</strong> of <strong>{this.state.posts ? this.state.posts.length : ''}</strong> posts</span>
							</div>

							{/* START CENTER CONTENT */}

							<div className="panel">
								<div className="panel-body">
									<div className="table-responsive">

										<Table
											size="small"
											style={{minHeight: 400}}
											pagination={{ defaultPageSize: 10, position: "top", showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100', '200', '500', '1000'] }}
											rowSelection={rowSelectionTable}
											bordered
											dataSource={this.state.posts}
											columns={columnsShipments}
											rowKey="_id" />

									</div>
								</div>
							</div>
						</div>

						{/* END CENTER CONTENT */}


						{/* SIDE PANEL   */}

						<div className="col-sm-4 col-md-3 col-lg-2"    >
							<div className="panel">

								<div className="panel panel-primary list-announcement">

									<div className="panel-heading">
										<h4 className="panel-title">Latest Posts</h4>
									</div>

									<div className="panel-body">

										<ul className="list-unstyled mb20">

											{/* RENDER 3 LAST POSTS */}
											{this.state.posts.slice((this.state.posts.length ? (this.state.posts.length - 3) : ''), (this.state.posts.length ? this.state.posts.length : ''))
												.map((post, index) => {
													const title = post.title ? post.title : '';
													const createdAt = post.createdAt ? post.createdAt : '';
													const postUrl = "/admin/posts/" + post._id;
													return (
														<li key={index}>
															<a href={postUrl}><h5 style={{ fontSize: '15px', color: '#259dab' }}>{title.length > 40 ? `${title.slice(0, 40).toUpperCase()}...` : title.toUpperCase()}</h5></a>
															<p>{post.googleDescription ? post.googleDescription : ""}</p>
															<small >{createdAt}</small>
														</li>
													);
												})}
											{/* -----------END RENDEL LAST POSTS-------- */}

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
export default Posts;