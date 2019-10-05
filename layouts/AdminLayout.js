import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import $ from 'jquery';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();
const { siteUrl } = publicRuntimeConfig;

import { NextAuth } from 'next-auth/client';
import Router from 'next/router';


class AdminLayout extends React.Component {

	static async getInitialProps({ req, res, query }) {
		let session = await NextAuth.init({ req });

		if (res && session && !session.user) {
			res.redirect('/auth/sign-in');
		}

		// if (res && session && session.user) {
		// 	res.redirect('/admin');
		// }

		return {
			// namespacesRequired: [],
			session: session,
			linkedAccounts: await NextAuth.linked({ req }),
			providers: await NextAuth.providers({ req })
		};
	}

	constructor(props) {
		super(props);

	}

	handleSignOutSubmit = async (event) => {
		event.preventDefault();

		NextAuth.signout().then(() => {
			Router.push('/auth/sign-in');
		}).catch(err => {
			Router.push('/auth/error?action=signout');
		});
	}


	componentDidMount() {

		// JQUERY - START
		$('#menuToggle').click(function () {

			var collapsedMargin = $('.mainpanel').css('margin-left');
			var collapsedLeft = $('.mainpanel').css('left');

			if (collapsedMargin === '220px' || collapsedLeft === '220px') {
				toggleMenu(-220, 0);
			} else {
				toggleMenu(0, 220);
			}

		});

		function toggleMenu(marginLeft, marginMain) {

			var emailList = ($(window).width() <= 768 && $(window).width() > 640) ? 320 : 360;

			if ($('.mainpanel').css('position') === 'relative') {

				$('.logopanel, .leftpanel').animate({ left: marginLeft }, 'fast');
				$('.headerbar, .mainpanel').animate({ left: marginMain }, 'fast');

				$('.emailcontent, .email-options').animate({ left: marginMain }, 'fast');
				$('.emailpanel').animate({ left: marginMain + emailList }, 'fast');

				if ($('body').css('overflow') == 'hidden') {
					$('body').css({ overflow: '' });
				} else {
					$('body').css({ overflow: 'hidden' });
				}

			} else {

				$('.logopanel, .leftpanel').animate({ marginLeft: marginLeft }, 'fast');
				$('.headerbar, .mainpanel').animate({ marginLeft: marginMain }, 'fast');

				$('.emailcontent, .email-options').animate({ left: marginMain }, 'fast');
				$('.emailpanel').animate({ left: marginMain + emailList }, 'fast');

			}

		}

		/****** PULSE A QUICK ACCESS PANEL ******/

		$('.panel-quick-page .panel').hover(function () {
			$(this).addClass('flip animated');
		}, function () {
			$(this).removeClass('flip animated');
		});

		// Date Today in Notification
		$('#todayDay').text(getDayToday());
		$('#todayDate').text(getDateToday());

		// Toggle Left Menu
		$('.nav-parent > a').on('click', function () {

			var gran = $(this).closest('.nav');
			var parent = $(this).parent();
			var sub = parent.find('> ul');

			if (sub.is(':visible')) {
				sub.slideUp(200);
				if (parent.hasClass('nav-active')) {
					parent.removeClass('nav-active');
				}
			} else {

				$(gran).find('.children').each(function () {
					$(this).slideUp();
				});

				sub.slideDown(200);
				if (!parent.hasClass('active')) {
					parent.addClass('nav-active');
				}
			}
			return false;

		});

		function closeVisibleSubMenu() {
			$('.leftpanel .nav-parent').each(function () {
				var t = jQuery(this);
				if (t.hasClass('nav-active')) {
					t.find('> ul').slideUp(200, function () {
						t.removeClass('nav-active');
					});
				}
			});
		}

		// Left Panel Toggles
		// $('.leftpanel-toggle').toggles({
		// 	on: true,
		// 	height: 22
		// });
		// $('.leftpanel-toggle-off').toggles({ height: 22 });

		// Tooltip
		// $('.tooltips').tooltip({ container: 'body'});

		// Popover
		// $('.popovers').popover();

		// Add class everytime a mouse pointer hover over it
		$('.nav-due > li').hover(function () {
			$(this).addClass('nav-hover');
		}, function () {
			$(this).removeClass('nav-hover');
		});

		// Prevent dropdown from closing when clicking inside
		$('#noticeDropdown').on('click', '.nav-tabs a', function () {
			// set a special class on the '.dropdown' element
			$(this).closest('.btn-group').addClass('dontClose');
		});

		$('#noticePanel').on('hide.bs.dropdown', function (e) {
			if ($(this).hasClass('dontClose')) {
				e.preventDefault();
			}
			$(this).removeClass('dontClose');
		});

		// Close panel
		$('.panel-remove').click(function () {
			$(this).closest('.panel').fadeOut(function () {
				$(this).remove();
			});
		});

		// Minimize panel
		$('.panel-minimize').click(function () {
			var parent = $(this).closest('.panel');

			parent.find('.panel-body').slideToggle(function () {
				var panelHeading = parent.find('.panel-heading');

				if (panelHeading.hasClass('min')) {
					panelHeading.removeClass('min');
				} else {
					panelHeading.addClass('min');
				}

			});

		});

		/* Get the current day today */
		function getDayToday() {
			// Get Date Today
			var d_names = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
			var d = new Date();
			var curr_day = d.getDay();

			return d_names[curr_day];
		}

		/* Get the current date today */
		function getDateToday() {
			var m_names = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September",
				"October", "November", "December");

			var d = new Date();
			var curr_date = d.getDate();
			var sup = "";

			if (curr_date == 1 || curr_date == 21 || curr_date == 31) {
				sup = "st";
			} else if (curr_date == 2 || curr_date == 22) {
				sup = "nd";
			} else if (curr_date == 3 || curr_date == 23) {
				sup = "rd";
			} else {
				sup = "th";
			}

			var curr_month = d.getMonth();
			var curr_year = d.getFullYear();

			return curr_date + sup + " " + m_names[curr_month] + " " + curr_year;
		}

		/* This function will reposition search form to the left panel when viewed
		 * in screens smaller than 767px and will return to top when viewed higher
		 * than 767px
		 */
		function reposition_searchform() {
			if ($('.searchform').css('position') == 'relative') {
				$('.searchform').insertBefore('.leftpanelinner .userlogged');
			} else {
				$('.searchform').insertBefore('.header-right');
			}
		}

		/* This function allows top navigation menu to move to left navigation menu
		 * when viewed in screens lower than 1024px and will move it back when viewed
		 * higher than 1024px
		 */
		function reposition_topnav() {
			if ($('.nav-horizontal').length > 0) {

				// top navigation move to left nav
				// .nav-horizontal will set position to relative when viewed in screen below 1024
				if ($('.nav-horizontal').css('position') == 'relative') {

					if ($('.leftpanel .nav-bracket').length == 2) {
						$('.nav-horizontal').insertAfter('.nav-bracket:eq(1)');
					} else {
						// only add to bottom if .nav-horizontal is not yet in the left panel
						if ($('.leftpanel .nav-horizontal').length == 0) {
							$('.nav-horizontal').appendTo('.leftpanelinner');
						}
					}

					$('.nav-horizontal').css({ display: 'block' }).addClass('nav-pills nav-stacked nav-bracket');

					$('.nav-horizontal .children').removeClass('dropdown-menu');
					$('.nav-horizontal > li').each(function () {

						$(this).removeClass('open');
						$(this).find('a').removeAttr('class');
						$(this).find('a').removeAttr('data-toggle');

					});

					if ($('.nav-horizontal li:last-child').has('form')) {
						$('.nav-horizontal li:last-child form').addClass('searchform').appendTo('.topnav');
						$('.nav-horizontal li:last-child').hide();
					}

				} else {
					// move nav only when .nav-horizontal is currently from leftpanel
					// that is viewed from screen size above 1024
					if ($('.leftpanel .nav-horizontal').length > 0) {

						$('.nav-horizontal').removeClass('nav-pills nav-stacked nav-bracket').appendTo('.topnav');
						$('.nav-horizontal .children').addClass('dropdown-menu').removeAttr('style');
						$('.nav-horizontal li:last-child').show();
						$('.searchform').removeClass('searchform').appendTo('.nav-horizontal li:last-child .dropdown-menu');
						$('.nav-horizontal > li > a').each(function () {

							$(this).parent().removeClass('nav-active');

							if ($(this).parent().find('.dropdown-menu').length > 0) {
								$(this).attr('class', 'dropdown-toggle');
								$(this).attr('data-toggle', 'dropdown');
							}

						});
					}

				}

			}
		}

		// JQUERY - END

	}

	render() {

		let profileUrl = '/';
		let userEmail = '';
		let userFirstName = '';
		let userLastName = '';
		let userRole = 'user';
		let loggedUser = this.props.session && this.props.session.user ? this.props.session.user : '';

		if (this.props.session && this.props.session.user) {
			let userData = this.props.session.user;

			profileUrl = userData.id ? '/admin/users/' + userData.id : '/';
			userEmail = userData.email ? userData.email : '';
			userFirstName = userData.firstName ? userData.firstName : '';
			userLastName = userData.lastName ? userData.lastName : '';
		}

		if (this.props.session && this.props.session.user && this.props.session.user.role) {
			userRole = this.props.session.user.role;
		}

		return (
			<React.Fragment>

				<Head>
					<title>{userRole === "admin" ? 'Admin' : 'User'}</title>
					<meta charSet="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
					<meta name="description" content="" />
					<meta name="author" content="" />

					<link rel="stylesheet" href={siteUrl + "/static/styles/admin/quirk.css"} />
					<link rel="stylesheet" href={siteUrl + "/static/styles/admin/jodit.min.css"} />
					<link rel="stylesheet" href={siteUrl + "/static/styles/admin/custom.css"} />
				</Head>

				<header>

					<div className="headerpanel">

						<div className="logopanel">
							<a href="/"><img src={require('../static/images/logo.png')} alt="logo-mayur" style={{ height: 30 }} /></a>
						</div>

						<div className="headerbar">

							<a id="menuToggle" className="menutoggle"><i className="fa fa-bars" /></a>

							{/* SEARCH INPUT */}
							{/* <div className="searchpanel">
								<div className="input-group">
									<input type="text" className="form-control" placeholder="Search for..." />
									<span className="input-group-btn">
										<button className="btn btn-default" type="button"><i className="fa fa-search"></i></button>
									</span>
								</div>
							</div> */}

							<div className="header-right">

								<ul className="headermenu">

									<li>
										<div className="btn-group">

											<button type="button" className="btn btn-logged" data-target="#profile_menu" data-toggle="collapse">
												<img src={siteUrl + '/static/images/common/photos/loggeduser.png'} alt="" />
												{userFirstName} {userLastName}
												<span className="caret"></span>
											</button>

											<ul id="profile_menu" className="dropdown-menu pull-right">

												<li>
													<Link href={profileUrl}>
														<a><i className="glyphicon glyphicon-user"></i> My Profile</a>
													</Link>
												</li>

												<li><a onClick={this.handleSignOutSubmit} href="#"><i
													className="glyphicon glyphicon-log-out"></i> Log Out</a></li>

											</ul>
										</div>
									</li>
								</ul>
							</div>
						</div>

					</div>
				</header>

				<section>

					<div className="leftpanel">

						<div className="leftpanelinner">

							<div className="media leftpanel-profile">

								<div className="media-left">

									<a href="#">
										<img src={siteUrl + '/static/images/common/photos/loggeduser.png'} alt=""
											className="media-object img-circle" />
									</a>

								</div>

								<div className="media-body">

									<h4 className="media-heading">{userFirstName} {userLastName}
										<a data-toggle="collapse"
											data-target="#loguserinfo"
											className="pull-right">
											<i className="fa fa-angle-down"></i>
										</a>
									</h4>

									<div style={{ maxWidth: '125px', overflow: 'hidden', fontSize: '1.07rem' }}>{userEmail}</div>
								</div>
							</div>

							<div className="leftpanel-userinfo collapse" id="loguserinfo">

								<h5 className="sidebar-title">Role</h5>

								{/* ROLE */}
								<address>
									{loggedUser.role.toUpperCase()}
								</address>

								<ul className="list-group">

									{/* EMAIL */}
									<li className="list-group-item">
										<label className="pull-left">Email</label>
										<span className="pull-right">{loggedUser.email ? loggedUser.email : 'No email in database for this user, please edit and add email address'}</span>
									</li>

									<li className="list-group-item">
										<label className="pull-left">Social</label>
										<div className="social-icons pull-right">
											<a href="#"><i className="fa fa-facebook-official"></i></a>
											<a href="#"><i className="fa fa-twitter"></i></a>
											<a href="#"><i className="fa fa-pinterest"></i></a>
										</div>
									</li>

								</ul>
							</div>

							<ul className="nav nav-tabs nav-justified nav-sidebar">

								<li className="tooltips active col-6" data-toggle="tooltip" title="Main Menu"><a data-toggle="tab"
									data-target="#mainmenu"><i
										className="tooltips fa fa-ellipsis-h"></i></a>
								</li>

								<li className="tooltips col-6" data-toggle="tooltip" title="Log Out"><a onClick={this.handleSignOutSubmit}
									href="#"><i
										className="fa fa-sign-out"></i></a></li>

							</ul>

							<div className="tab-content">

								<div className="tab-pane active" id="mainmenu">

									<h5 className="sidebar-title">{userRole === 'admin' ? 'Admin menu' : 'User menu'}</h5>
									<ul className="nav nav-pills nav-stacked nav-quirk">

										{/*<li className="nav-parent">*/}
										{/*<a href=""><i className="fa fa-check-square"></i> <span>Authentication</span></a>*/}
										{/*<ul className="children">*/}
										{/*<li>*/}
										{/*<a href="/auth/sign-in">Sing in</a>*/}
										{/*</li>*/}
										{/*<li>*/}
										{/*<a href="/auth/sign-up">Sing up</a>*/}
										{/*</li>*/}
										{/*</ul>*/}
										{/*</li>*/}

										{/* USER CONTROL - ADMIN ONLY */}
										{userRole === 'admin' ?
											(
												<li className="nav-parent"><a href=""><i className="fa fa-file-text"></i> <span>Users</span></a>
													<ul className="children">
														<li><a href="/admin/users">All Users</a></li>
														<li><a href="/admin/users/new">Add User</a></li>
													</ul>
												</li>
											)
											: null}

										{/* POSTS ADMIN ALL */}
										{userRole === 'admin' ?
											<li className="nav-parent"><a href=""><i className="fa fa-suitcase"></i> <span>Posts</span></a>
												<ul className="children">
													<li><a href="/admin/posts">All posts</a></li>
													<li><a href="/admin/posts/new">New post</a></li>
													<li><a href="/admin/categories">Categories</a></li>
												</ul>
											</li>
											: null}

										{/* PAGES ADMIN ALL */}
										{userRole === 'admin' ?
											<li className="nav-parent"><a href=""><i className="fa fa-file-text"></i> <span>Pages</span></a>
												<ul className="children">
													<li><a href="/admin/pages">All pages</a></li>
													<li><a href="/admin/pages/new">New page</a></li>
												</ul>
											</li>
											: null}

										{/* PRODUCTS ADMIN ALL - USER ADD NEW*/}
										{userRole === 'admin' ?
											<li className="nav-parent"><a href=""><i className="fa fa-shopping-cart"></i> <span>Products</span></a>
												<ul className="children">
													<li><a href="/admin/products">All products</a></li>
													<li><a href="/admin/products/new">New product</a></li>
													<li><a href="/admin/products/categories/new">Categories</a></li>
													<li><a href="/admin/products/descriptors/new">Descriptors (size, color...)</a></li>
												</ul>
											</li>
											: null}

										{/* PRODUCTS ADMIN ALL - USER ADD NEW*/}
										{userRole === 'admin' ?
											<li className="nav-parent"><a href=""><i className="fa fa-money"></i> <span>Orders</span></a>
												<ul className="children">
													<li><a href="/admin/orders">All orders</a></li>
													<li><a href="/admin/orders/new">New order</a></li>
												</ul>
											</li>
											: null}

										{/* IMPORTCSV - */}
										{userRole === 'admin' ?
											<li className="nav-parent"><a href=""><i className="fa fa-money"></i> <span>ImportCSV</span></a>
												<ul className="children">
													<li><a href="/admin/importcsv/">ImportCSV</a></li>
												</ul>
											</li>
											: null}

										{/* STATISTICS ADMIN ONLY*/}
										{userRole === 'admin' ?
											<li className="nav-parent"><a href=""><i className="fa fa-bar-chart"></i>
												<span>Statistics</span></a>
												<ul className="children">
													<li><a href="/admin/statistics">Statistics</a></li>
												</ul>
											</li>
											: null}

										{/* MESSAGES ADMIN ONLY*/}
										{userRole === 'admin' ?
											<li className="nav-parent"><a href=""><i className="fa fa-envelope"></i>
												<span>Messages</span></a>
												<ul className="children">
													<li><a href="/admin/messages">Show messages</a></li>
												</ul>
											</li>
											: null}

										{/* MENUS */}
										{userRole === 'admin' ?
											<li className="nav-parent"><a href=""><i className="fa fa-newspaper-o"></i>
												<span>Menus</span></a>
												<ul className="children">
													<li><a href="/admin/menus">Menus</a></li>
												</ul>
											</li>
											: null}

									</ul>
								</div>

								{/* <div className="tab-pane" id="settings">

									<h5 className="sidebar-title">General Settings</h5>

									<ul className="list-group list-group-settings">

										<li className="list-group-item">
											<h5>Daily Newsletter</h5>
											<small>Get notified when someone else is trying to access your account.</small>
											<div className="toggle-wrapper">
												<div className="leftpanel-toggle toggle-light success"></div>
											</div>
										</li>

										<li className="list-group-item">
											<h5>Call Phones</h5>
											<small>Make calls to friends and family right from your account.</small>
											<div className="toggle-wrapper">
												<div className="leftpanel-toggle-off toggle-light success"></div>
											</div>
										</li>

									</ul>

									<h5 className="sidebar-title">Security Settings</h5>

									<ul className="list-group list-group-settings">

										<li className="list-group-item">
											<h5>Login Notifications</h5>
											<small>Get notified when someone else is trying to access your account.</small>
											<div className="toggle-wrapper">
												<div className="leftpanel-toggle toggle-light success"></div>
											</div>
										</li>

										<li className="list-group-item">
											<h5>Phone Approvals</h5>
											<small>Use your phone when login as an extra layer of security.</small>
											<div className="toggle-wrapper">
												<div className="leftpanel-toggle toggle-light success"></div>
											</div>
										</li>

									</ul>

								</div> */}

							</div>

						</div>

					</div>

					<div className="mainpanel">

						<div className="contentpanel">

							{this.props.children}

						</div>
					</div>

					<link rel="stylesheet" href={siteUrl + "/static/styles/admin/font-awesome.css"} />
					{/* <link rel="stylesheet" href={siteUrl + "/static/styles/admin/snow.css"} /> */}
					<link rel="stylesheet" href={siteUrl + "/static/styles/admin/react-sortable.css"} />
					<link rel="stylesheet" href={siteUrl + "/static/styles/admin/antd.css"} />

				</section>

			</React.Fragment>
		);
	}
}

export default AdminLayout;