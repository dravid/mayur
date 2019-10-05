import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from '../../../layouts/AdminLayout';
import { Statistic, Card, Row, Col, Icon } from 'antd';
import {
	XYPlot,
	LineSeries,
	VerticalGridLines,
	HorizontalGridLines,
	XAxis,
	YAxis,
	MarkSeries,
	VerticalBarSeries,
	GradientDefs,
	ArcSeries,
	AreaSeries,
	RadialChart,
	RadarChart,
	DiscreteColorLegend,
	LabelSeries
} from 'react-vis';
import Item from 'antd/lib/list/Item';

const moment = require('moment');
const newDate = moment(new Date()).utc().format('DD.MM.YYYY HH:mm');

class Statistics extends React.Component {

	static async getInitialProps({ req, res, query }) {

		let session = await NextAuth.init({ req });

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}
		if (res && session && session.csrfToken) {
		}

		//GET USERS
		let users = [];
		let usersResponse = await fetch(`${siteUrl}/api/v1/users?${noCache}`);
		if (usersResponse.status === 200) {
			users = await usersResponse.json();
		}

		//GET POSTS
		let posts = [];
		let postsResponse = await fetch(`${siteUrl}/api/v1/posts?${noCache}`);
		if (postsResponse.status === 200) {
			posts = await postsResponse.json();
		}

		return {
			posts: posts,
			users: users,
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req }),
			query: query
		};
	}

	constructor(props) {
		super(props);
		this.state = {
			graph: [],
		};
	}

	get_random_color = () => {
		return "#" + (Math.round(Math.random() * 0XFFFFFF)).toString(16);
	}

	render() {

		const users = this.props.users ? this.props.users : '';

		//BY COUNTRY
		//Get users by country
		let groupByCountry = users.reduce((acc, it) => {
			acc[it.country] = acc[it.country] + 1 || 1;
			return acc;
		}, {});
		//Sort desc
		let groupByCountrySorted = {};
		Object.keys(groupByCountry).sort(function (a, b) { return groupByCountry[b] - groupByCountry[a] })
			.map(key => groupByCountrySorted[key] = groupByCountry[key]);

		//Check if Country exist, Iterate and prepare for chart
		let chartDataUsersByCountry = [];
		for (var key in groupByCountrySorted) {
			if (groupByCountrySorted.hasOwnProperty(key)) {
				chartDataUsersByCountry.push({
					x: key ? key : "Unknown", y: groupByCountrySorted[key]
				});
			}
		}
		//show only first 8 
		chartDataUsersByCountry ? chartDataUsersByCountry = chartDataUsersByCountry.slice(0, 8) : chartDataUsersByCountry = '';
		//---------------------------------------

		//BY CITY
		//Get users by city
		let groupByCity = users.reduce((acc, it) => {
			acc[it.city] = acc[it.city] + 1 || 1;
			return acc;
		}, {});
		//Sort desc.
		let groupByCitySorted = {};
		Object.keys(groupByCity).sort(function (a, b) { return groupByCity[b] - groupByCity[a] })
			.map(key => groupByCitySorted[key] = groupByCity[key]);

		//Check if City exist, Iterate and prepare for bar chart
		let chartDataUsersByCity = [];
		for (var key in groupByCitySorted) {
			if (groupByCitySorted.hasOwnProperty(key)) {
				chartDataUsersByCity.push({
					x: key ? key : "Unknown", y: groupByCitySorted[key]
				});
			}
		}

		//show only first 8 
		chartDataUsersByCity ? chartDataUsersByCity = chartDataUsersByCity.slice(0, 8) : chartDataUsersByCity = "";
		//---------------------------------

		//BY OS
		//Get users by OS
		let groupByOs = users.reduce((acc, it) => {
			acc[it.os] = acc[it.os] + 1 || 1;
			return acc;
		}, {});

		//Sort desc.
		let groupByOsSorted = {};
		Object.keys(groupByOs).sort(function (a, b) { return groupByOs[b] - groupByOs[a] })
			.map(key => groupByOsSorted[key] = groupByOs[key]);

		//Check if OS exist, Iterate and prepare for pie chart
		let chartDataUsersByOs = [];
		let colorOsLegend = [];
		for (var key in groupByOsSorted) {
			let rndColor = this.get_random_color();
			if (groupByOsSorted.hasOwnProperty(key)) {
				chartDataUsersByOs.push({
					angle: groupByOsSorted[key], radius: 20, label: (key && key !== "undefined") ? key : "Unknown", subLabel: (key && key !== "undefined") ? key : "Unknown", labelsAboveChildren: true, color: `${rndColor}`,
				});
				//Legend for Users by OS 
				colorOsLegend.push({
					title: ((key && key !== "undefined") ? key : "Unknown") + " " + groupByOsSorted[key], color: `${rndColor}`
				})
			}
		}

		chartDataUsersByOs ? chartDataUsersByOs = chartDataUsersByOs : chartDataUsersByOs = "";

		//Legend for OS 

		// let colorLegend = chartDataUsersByOs.map(x => { ({ title: `${x.label} ${x.angle}`, color: "#79C7E3" }) });

		//--------------------------------

		const myDataRadial = [{ angle: 1, radius: 20 }, { angle: 2, label: 'Super Custom label', subLabel: 'With annotation', radius: 20 },
		{ angle: 7, radius: 20, label: 'Alt Label', subLabel: 'Sub Label only', showLabels: true }, { angle: 3, radius: 20 }, { angle: 5, radius: 20, subLabel: 'Sub Label only', className: 'custom-class' }];

		//BY GENDER
		let groupByGender = users.reduce((acc, it) => {
			acc[it.gender] = acc[it.gender] + 1 || 1;
			return acc;
		}, {});

		let groupByGenderSorted = {};
		Object.keys(groupByGender).sort(function (a, b) { return groupByGender[b] - groupByGender[a] })
			.map(key => groupByGenderSorted[key] = groupByGender[key]);
		let chartDataUsersByGender = [];
		let colorGenderLegend = [];
		for (var key in groupByGenderSorted) {
			let rndColor = this.get_random_color();
			if (groupByGenderSorted.hasOwnProperty(key)) {
				chartDataUsersByGender.push({
					angle: groupByGenderSorted[key], radius: 20, label: (key && key !== "undefined") ? key : "Unknown", subLabel: (key && key !== "undefined") ? key : "Unknown", labelsAboveChildren: true, color: `${rndColor}`,
				});
				//Legend for Users by Gender
				colorGenderLegend.push({
					title: ((key && key !== "undefined") ? key : "Unknown") + " " + groupByGenderSorted[key], color: `${rndColor}`
				})
			}
		}
		chartDataUsersByGender ? chartDataUsersByGender = chartDataUsersByGender : chartDataUsersByGender = "";
		return (

			<AdminLayout {...this.props}>

				<ol className="breadcrumb breadcrumb-quirk">
					<li><a href="/admin"><i className="fa fa-home mr5"></i> Home > Admin </a></li>
					<li className="active">Statistics</li>
				</ol>

				<div className="row">
					<div className="col-sm-8 col-md-9 col-lg-10 people-list d-flex text-center mx-auto">
						<div className="people-options clearfix">
							<div className="">
								{/* <Link href="/admin/posts">
                  <button type="button" className="btn btn-success btn-quirk">All posts</button>
                </Link> */}
							</div>
						</div>

						{/* CENTER _CHILD CONTENT */}

						<div className="panel" style={{ padding: '30px' }}>

							{/* TOP  */}
							<div className="row">

								{/* TOP LEFT */}
								<div className="col-sm-12 col-md-12 col-lg-6">
									<div className="panel">

										<div className="panel-heading">
											<h4 className="panel-title">User statistics</h4>
											<p>Active / Inactive users</p>
										</div>

										<div className="panel-body">
											<div style={{ background: '#ECECEC', padding: '15px' }}>

												<Row gutter={16}>
													<Col span={12}>
														<Card>
															<Statistic
																title="Active in last 30 days"
																value={`100%  (${this.props.users.length})`}
																precision={2}
																valueStyle={{ color: '#3f8600' }}
																prefix={<Icon type="arrow-up" />}
															// suffix="%"
															/>
														</Card>
													</Col>
													<Col span={12}>
														<Card>
															<Statistic
																title="Idle"
																value={`0%  (0)`}
																precision={2}
																valueStyle={{ color: '#cf1322' }}
																prefix={<Icon type="arrow-down" />}
															// suffix="%"
															/>
														</Card>
													</Col>
												</Row>

											</div>
										</div>
									</div>
								</div>

								{/* TOP RIGHT */}
								<div className="col-sm-12 col-md-12 col-lg-6">
									<div className="panel">

										<div className="panel-heading">
											<h4 className="panel-title">Posts</h4>
											<p>Posts published</p>
										</div>

										<div className="panel-body">

											<div style={{ background: '#ECECEC', padding: '15px' }}>

												<Row gutter={16}>
													<Col span={12}>
														<Card>
															<Statistic
																title="Published in last 30 days"
																value={`20%  (${this.props.posts.length})`}
																precision={2}
																valueStyle={{ color: '#3f8600' }}
																prefix={<Icon type="arrow-up" />}
															// suffix="%"
															/>
														</Card>
													</Col>
													<Col span={12}>
														<Card>
															<Statistic
																title="Published total"
																value={`100%  (${this.props.posts.length + 16})`}
																precision={2}
																valueStyle={{ color: '#3f8600' }}
																prefix={<Icon type="arrow-up" />}
															// suffix="%"
															/>
														</Card>
													</Col>
												</Row>

											</div>

										</div>

									</div>
								</div>
							</div>

							{/* MIDDLE  */}
							<div className="row">

								{/* MIDDLE LEFT */}
								<div className="col-sm-12 col-md-12 col-lg-6">
									<div className="panel">
										<div className="panel-heading" >
											<h4 className="panel-title" >USERS BY COUNTRY</h4>
											<p>Users by country and activity in last 30 days.</p>
										</div>
										<div className="panel-body">

											<XYPlot
												className="clustered-stacked-bar-chart-example"
												xType="ordinal"
												stackBy="y"
												width={430}
												height={350}
											>
												<DiscreteColorLegend
													// style={{ position: 'sticky'}}
													orientation="horizontal"
													items={[
														{
															title: 'Active',
															color: '#12939A'
														},
														{
															title: 'Total',
															color: '#79C7E3'
														}
													]}
												/>
												<VerticalGridLines />
												<HorizontalGridLines />
												<XAxis />
												<YAxis />
												<VerticalBarSeries
													stroke="red"
													cluster="total"
													color="#12939A"
													data={chartDataUsersByCountry}
												/>
											</XYPlot>

										</div>
									</div>
								</div>

								{/* MIDDLE RIGHT */}
								<div className="col-sm-12 col-md-12 col-lg-6">
									<div className="panel">
										<div className="panel-heading">
											<h4 className="panel-title">USERS BY CITY</h4>
											<p>Users by city and activity in last 30 days.</p>
										</div>
										<div className="panel-body">

											<XYPlot
												className="clustered-stacked-bar-chart-example"
												xType="ordinal"
												stackBy="y"
												width={430}
												height={350}
											>
												<DiscreteColorLegend
													// style={{ position: 'absolute', left: '45%', top: '5%' }}
													orientation="horizontal"
													items={[
														{
															title: 'Active',
															color: '#12939A'
														},
														{
															title: 'Total',
															color: '#79C7E3'
														}
													]}
												/>
												<VerticalGridLines />
												<HorizontalGridLines />
												<XAxis />
												<YAxis />
												<VerticalBarSeries
													stroke="red"
													cluster="total"
													color="#12939A"
													data={chartDataUsersByCity}
												/>

											</XYPlot>

										</div>
									</div>
								</div>
							</div>

							{/* BOTTOM  */}
							<div className="row">

								{/* BOTTOM LEFT */}
								<div className="col-sm-12 col-md-12 col-lg-6">
									<div className="panel">
										<div className="panel-heading">
											<h4 className="panel-title">USERS BY OS</h4>
											<p>Users by OS used</p>
										</div>
										<div className="panel-body">

											<RadialChart
												stroke="white"
												data={chartDataUsersByOs}
												style={{
													strokeWidth: 2,
												}}
												lebels={{ color: 'white' }}
												colorType="literal"
												width={400}
												height={400} />
											<DiscreteColorLegend
												// style={{ position: 'absolute', left: '75%', top: '0%', textAlign: "left" }}
												orientation="vertical"
												strokeWidth={2}
												colorType="literal"
												items={colorOsLegend}
											/>
										</div>
									</div>
								</div>

								{/* BOTTOM RIGHT */}
								<div className="col-sm-12 col-md-12 col-lg-6">
									<div className="panel">
										<div className="panel-heading">
											<h4 className="panel-title">USERS BY GENDER</h4>
											<p>Users by Gender</p>
										</div>
										<div className="panel-body">

											<RadialChart
												stroke={"white"}
												data={chartDataUsersByGender}
												style={{
													strokeWidth: 2,
												}}
												lebels={{ color: 'white' }}
												colorType="literal"
												width={400}
												height={400} />
											<div>
												<DiscreteColorLegend
													// style={{ position: 'absolute', left: '75%', top: '0%', textAlign: "left" }}
													orientation="vertical"
													strokeWidth={2}
													colorType="literal"
													items={colorGenderLegend}
												/>
											</div>
										</div>
									</div>

								</div>
							</div>

						</div>

					</div>

					{/* CENTER END */}

					{/* SIDE CONTENT	 */}
					<div className="col-sm-4 col-md-3 col-lg-2">

						<div className="panel">
							<ul className="panel-options">
								<li><a><i className="glyphicon glyphicon-option-vertical"></i></a></li>
							</ul>
							<div className="panel-heading">
								<h4 className="panel-title">Total Earnings</h4>
							</div>
							<div className="panel-body">
								<h3 className="earning-amount">$1,543.03</h3>
								<h4 className="earning-today">Today's Earnings</h4>

								<ul className="list-group">
									<li className="list-group-item">This Week <span className="pull-right">$12,320.34</span></li>
									<li className="list-group-item">This Month <span className="pull-right">$37,520.34</span></li>
								</ul>
								<hr className="invisible" />
								<p>Total items sold this month: 325</p>
							</div>
						</div>
					</div>
					{/*----------- SIDE END--------------- */}
				</div>

			</AdminLayout>
		);
	}
}

export default Statistics;
