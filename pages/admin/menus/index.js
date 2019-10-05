import React, { Component } from "react";
import { NextAuth } from "next-auth/client";
import getConfig from "next/config";
import Link from "next/link";
import Router from 'next/router';
import { encodeForm } from '../../../utils/api-utils';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import AdminLayout from "../../../layouts/AdminLayout";
import { Select, Button, Menu, Checkbox, Icon, Row, Col, Collapse, Input } from "antd";
import SortableTree from 'react-sortable-tree';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";

const moment = require("moment");
const newDate = moment(new Date()).format("DD.MM.YYYY HH:mm");

//Ant-design
const MenuItemGroup = Menu.ItemGroup;
const SubMenu = Menu.SubMenu;
const CheckboxGroup = Checkbox.Group;
const Panel = Collapse.Panel;
const Option = Select.Option;

// Link selector
const selectBefore = (
  <Select defaultValue="http://" style={{ width: 90 }}>
    <Option value="http://">http://</Option>
    <Option value="https://">https://</Option>
  </Select>
);

class Statistics extends React.Component {
  rootSubmenuKeys = ["sub1", "sub2", "sub3", "sub4"];

  static async getInitialProps({ req, res, query }) {
    let session = await NextAuth.init({ req });

    if (res && session && !session.user) {
      res.redirect("/auth/sign-in");
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

    //GET PAGES
    let pages = [];
    let pagesResponse = await fetch(`${siteUrl}/api/v1/pages?${noCache}`);
    if (pagesResponse.status === 200) {
      pages = await pagesResponse.json();
    }

    //GET CATEGORIES
    let categories = [];
    let categoriesResponse = await fetch(
      `${siteUrl}/api/v1/categories?${noCache}`
    );
    if (categoriesResponse.status === 200) {
      categories = await categoriesResponse.json();
    }

    //GET MENUS
    let menus = [];
    let menusResponse = await fetch(
      `${siteUrl}/api/v1/menus?${noCache}`
    );
    if (menusResponse.status === 200) {
      menus = await menusResponse.json();
    }

    return {
      menus: menus,
      posts: posts,
      users: users,
      pages: pages,
      categories: categories,
      session: session,
      linkedAccounts: await NextAuth.linked({ req }),
      providers: await NextAuth.providers({ req }),
      query: query
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      pages: this.props.pages,
      posts: this.props.posts,
      users: this.props.users,
      categories: this.props.categories,
      menus: this.props.menus,
      previousPages: [],
      previousPost: [],
      //Menu for edit
      menu: [],

      //check-boxes
      checkedPages: [],
      checkedPosts: [],
      checkedCategories: [],
      //Link
      linkUrl: "",
      linkDescription: "",

      //Menu
      menuName: "",
      menuDescription: "",

      selectedMenu: [],

      treeData: []


    };
    this.addMenu = this.addMenu.bind(this);
    this.updateMenu = this.updateMenu.bind(this);

  }

  async componentDidMount() {

    if (this.props.query._id && this.props.query._id !== "new") {
      // FETCH MENU-ID FOR EDIT 
      const formData = {
        _csrf: this.props.session.csrfToken,
        _id: this.props.query._id,
        action: 'getOne',
      };

      const encodedForm = await encodeForm(formData);

      await fetch(`${siteUrl}/api/v1/menus`, {
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
            menu: response.data,
            selectedMenu: response.data.name,
            treeData: response.data.menuData,
          });
        }
      }, 400);
    }
  }

  //ADD TO MENU
  //PAGES
  onChangePages = checkedValues => {
    this.setState({ checkedPages: checkedValues });

  };

  //add to menu
  addPages = () => {
    //Indexing pages
    const indexedPages = {};
    this.state.pages.map((page) => {
      indexedPages[page._id] = page;
    });
    //Pushing to Menu
    let newArray = [];
    this.state.checkedPages.forEach(page => {
      newArray.push({ title: `PAGE - ${indexedPages[page].title.length > 40 ? indexedPages[page].title.slice(0, 40) : indexedPages[page].title}`, _id: indexedPages[page]._id, uriPage: indexedPages[page].uri, type: 'page' })
    })
    let treeData = [...this.state.treeData];
    let found = false;
    //Removing items from treeData if they are unchecked
    for (var i = 0; i < treeData.length; i++) {
      for (var j = 0; j < this.state.pages.length; j++) {
        let object = document.getElementById(this.state.pages[j]._id);
        if (object.checked == false && object.value == treeData[i]._id) {
          found = true;
          break;
        }
        else {
          found = false;
        }
      }
      if (found) {
        treeData.splice(i, 1);
        i--;
      }
    }
    //Removing duplicate items from treeData
    for (let i = 0; i < treeData.length; i++) {
      for (let j = i + 1; j < treeData.length; j++) {
        if (treeData[i].title == treeData[j].title) {
          treeData.splice(j, 1);
          j--;
        }
      }
    }
    for (let i = 0; i < treeData.length; i++) {
      for (let j = 0; j < newArray.length; j++) {
        if (treeData[i].title == newArray[j].title) {
          newArray.splice(j, 1);
          j--;
        }
      }
    }
    this.setState({ treeData: [...treeData, ...newArray] });
  }


  //POSTS
  onChangePosts = checkedValues => {
    this.setState({ checkedPosts: checkedValues });
  };
  addPosts = () => {
    //Indexing posts
    const indexedPosts = {};
    this.state.posts.map((post) => {
      indexedPosts[post._id] = post;
    });
    //Pushing to Menu
    let newArray = [];
    this.state.checkedPosts.forEach((post) => {
      newArray.push({
        title: `POST - ${indexedPosts[post].title.length > 40 ? indexedPosts[post].title.slice(0, 40) : indexedPosts[post].title}`,
        _id: indexedPosts[post]._id, uriPost: indexedPosts[post].uri, type: 'post'
      })
    })
    console.log(this.state.posts[0].title);
    let found = false;
    let treeData = [...this.state.treeData];
    //Removing items from treeData if they are unchecked
    for (let i = 0; i < treeData.length; i++) {
      for (let j = 0; j < this.state.posts.length; j++) {
        let object = document.getElementById(this.state.posts[j]._id);
        if (object.checked == false && object.value == treeData[i]._id) {
          found = true;
          break;
        }
        else {
          found = false;
        }
      }
      if (found) {
        treeData.splice(i, 1);
        i--;
      }
    }
    //Removing duplicate items from treeData
    for (let i = 0; i < treeData.length; i++) {
      for (let j = i + 1; j < treeData.length; j++) {
        if (treeData[i].title == treeData[j].title) {
          treeData.splice(j, 1);
          j--;
        }
      }
    }
    for (let i = 0; i < treeData.length; i++) {
      for (let j = 0; j < newArray.length; j++) {
        if (treeData[i].title == newArray[j].title) {
          newArray.splice(j, 1);
          j--;
        }
      }
    }
    this.setState({ treeData: [...treeData, ...newArray] });
  }

  //CATEGORIES
  onChangeCategories = checkedValues => {
    this.setState({ checkedCategories: checkedValues });
  };
  addCategories = () => {
    //Indexing categories
    const indexedCategories = {};
    this.state.categories.map((category) => {
      indexedCategories[category._id] = category;
    });
    //Pushing to Menu
    let newArray = [];
    this.state.checkedCategories.forEach(category => {
      newArray.push({
        title: `CATEGORY - ${indexedCategories[category].categoryName.length > 40 ? indexedCategories[category].categoryName.slice(0, 40) : indexedCategories[category].categoryName}`,
        _id: indexedCategories[category]._id, type: 'category'
      })
    })
    let treeData = [...this.state.treeData];
    let found = false;
    //Removing items from treeData if they are unchecked
    for (let i = 0; i < treeData.length; i++) {
      for (let j = 0; j < this.state.categories.length; j++) {
        let object = document.getElementById(this.state.categories[j]._id);
        if (object.checked == false && object.value == treeData[i]._id) {
          found = true;
          break;
        }
        else {
          found = false;
        }
      }
      if (found) {
        treeData.splice(i, 1);
        i--;
      }
    }
    //Removing duplicate items from treeData
    for (let i = 0; i < treeData.length; i++) {
      for (let j = i + 1; j < treeData.length; j++) {
        if (treeData[i].title == treeData[j].title) {
          treeData.splice(j, 1);
          j--;
        }
      }
    }
    for (let i = 0; i < treeData.length; i++) {
      for (let j = 0; j < newArray.length; j++) {
        if (treeData[i].title == newArray[j].title) {
          newArray.splice(j, 1);
          j--;
        }
      }
    }
    //  this.setState({menuDataCategories: newArray})
    this.setState({ treeData: [...treeData, ...newArray] });
  }

  //LINKS
  addLink = () => {
    let newArray = [];
    newArray.push({ title: `LINK - ${this.state.linkDescription}`, linkUrl: this.state.linkUrl });
    // this.setState({menuDataLinks: newArray})
    let treeData = [...this.state.treeData];
    let found = false;
    for (let i = 0; i < treeData.length; i++) {
      if (treeData[i].title === `LINK - ${document.getElementById('link-1').value}`) {
        var index = i;
        found = true;
        break;
      }
      else {
        found = false;
      }
    }
    if (found) {
      treeData.splice(index, 1);
      newArray.pop();
      this.setState({ treeData: [...treeData, ...newArray] });
    }
    else {
      this.setState({ treeData: [...treeData, ...newArray] });
    }
  }

  //MENU SELECT
  //SELECT CATEGORY HANDLERS
  menusHandleChange = (selectedMenuId) => {
    const menuUrl = "/admin/menus/" + selectedMenuId;
    Router.push(menuUrl);
  }

  async addMenu(event) {

    const formData = {
      _csrf: await NextAuth.csrfToken(),
      name: this.state.menuName,
      description: this.state.menuDescription,
      action: 'add',
    };

    const encodedForm = Object.keys(formData).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
    }).join('&');

    fetch('/api/v1/menus', {
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
      else if (response.status === 'item_added') {
        console.log('item_added');
        console.log(response.data);
      }
      else {
        console.log('unknown_status');
      }
      //return to post list after update
      setTimeout(function () {
        window.location.href = '/admin/menus';
      }, 500)
    });
  }

  async updateMenu(event) {

    console.log('menu data: ', this.state.menu._id);
    const formData = {
      _csrf: await NextAuth.csrfToken(),
      _id: this.state.menu._id,
      name: this.state.menu.name,
      description: this.state.menu.description,
      menuData: JSON.stringify(this.state.treeData),
      action: 'set',
    };

    const encodedForm = Object.keys(formData).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
    }).join('&');

    fetch('/api/v1/menus', {
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
        alert('updated');
        console.log('item_updated');
        console.log(response.data);
      }
      else {
        console.log('unknown_status');
      }
      //return to post list after update
      setTimeout(function () {
        window.location.href = '/admin/menus';
      }, 500)
    });
  }


  render() {
    const users = this.state.users ? this.state.users : "";
    const pages = this.state.pages ? this.state.pages : "";
    const posts = this.state.posts ? this.state.posts : "";
    const categories = this.state.categories ? this.state.categories : "";
    const menus = this.state.menus ? this.state.menus : "";

    //Check if request is for new menu or edit existing via _id 
    const newMenu = (this.props.query._id === "new" || this.state.menus.length < 1) ? true : false;
    const menuExist = this.state.menus.length > 0 ? true : false;

    const treeData = this.state.treeData;

    // const menuData = Array.from(new Set(array1.concat(array2)));

    return (
      <AdminLayout {...this.props}>
        <ol className="breadcrumb breadcrumb-quirk">
          <li>
            <a href="/admin">
              <i className="fa fa-home mr5" /> Home > Admin{" "}
            </a>
          </li>
          <li className="active">Menus</li>
        </ol>

        <div className="row">
          {/* CENTER _CHILD CONTENT */}

          <div className="col-sm-12 col-md-12 col-lg-12 people-list text-center mx-auto">
            <div className="people-options clearfix">
              <div className="">
                {/* <Link href="/admin/posts">
                  <button type="button" className="btn btn-success btn-quirk">All posts</button>
                </Link> */}
              </div>
            </div>

            {/* CENTER MAIN CONTENT */}

            <div className="panel menus" style={{ padding: "30px" }}>

              <div className="menu_select panel text-left">

                <div>

                  <Select
                    mode="default"
                    placeholder="Select menu"
                    value={this.state.selectedMenu}
                    onChange={this.menusHandleChange}
                    style={{ width: '40%', height: 'auto', margin: '0px 10% 0px 0px' }}
                  >
                    {menus.map(item => (
                      <Select.Option
                        key={item._id}
                        value={item._id}
                        onSelect={this.selectedMenuHandler}
                      >
                        {item.name}
                      </Select.Option>
                    ))}
                  </Select>

                  <Link href="/admin/menus/new">
                    <Button type="primary" ghost className="">New Menu</Button>
                  </Link>

                </div>

              </div>


              <div className="row ">

                {/* MENU ITEMS */}
                <div className="col-sm-4 col-md-4 col-lg-4 panel text-left">

                  <label>ADD MENU ITEMS</label>

                  {/* CHECK IF MENU EXISTS */}
                  {menuExist
                    ?
                    <div className="panel" style={{ padding: '20px 30px 0px 0px' }}>

                      {/* COLLAPSE */}
                      <Collapse accordion>

                        {/* PAGES CHECK BOX*/}
                        <Panel header="Pages" key="1">
                          <Checkbox.Group
                            style={{ width: "100%" }}
                            onChange={this.onChangePages}
                          >
                            {pages.map(item => (
                              <Row key={item._id}>
                                <Checkbox id={item._id} value={item._id}>
                                  {item.title.length > 35
                                    ? `${item.title.slice(0, 35)}...`
                                    : item.title}
                                </Checkbox>
                              </Row>
                            ))}
                          </Checkbox.Group>
                          <Button
                            onClick={this.addPages}
                            block>Add/Remove to menu</Button>
                        </Panel>
                        {/* ----------------------------- */}

                        {/* POSTS CHECK BOX*/}
                        <Panel header="Posts" key="2">
                          <Checkbox.Group
                            style={{ width: "100%" }}
                            onChange={this.onChangePosts}
                          >
                            {posts.map(item => (
                              <Row key={item._id}>
                                <Checkbox id={item._id} value={item._id}>
                                  {item.title.length > 35
                                    ? `${item.title.slice(0, 35)}...`
                                    : item.title}
                                </Checkbox>
                              </Row>
                            ))}
                          </Checkbox.Group>
                          <Button
                            onClick={this.addPosts}
                            block>Add/Remove to menu</Button>
                        </Panel>
                        {/* ----------------------------- */}

                        {/* LINKS */}
                        <Panel header="Links" key="3">
                          <div style={{ marginBottom: 16 }}>
                            <Input
                              addonBefore={selectBefore}
                              // addonAfter={selectAfter}
                              placeholder="site link"
                              value={this.state.linkUrl}
                              onChange={event => this.setState({ linkUrl: event.target.value })}
                            />
                          </div>
                          <Input id="link-1"
                            placeholder="Links text"
                            value={this.state.linkDescription}
                            onChange={event => this.setState({ linkDescription: event.target.value })}
                          />
                          <Button
                            onClick={this.addLink}
                            block>Add/Remove to menu</Button>
                        </Panel>
                        {/* ---------------------------- */}

                        {/* CATEGORIES CHECK BOX*/}
                        <Panel header="Categories" key="4">
                          <Checkbox.Group
                            style={{ width: "100%" }}
                            onChange={this.onChangeCategories}
                          >
                            {categories.map(item => (
                              <Row key={item._id}>
                                <Checkbox id={item._id} value={item._id}>
                                  {item.categoryName}
                                </Checkbox>
                              </Row>
                            ))}
                          </Checkbox.Group>
                          <Button
                            onClick={this.addCategories}
                            block>Add/Remove to menu</Button>
                        </Panel>

                      </Collapse>

                    </div>
                    :
                    <div style={{ padding: "10% 0px" }}>
                      <h2>NO MENUES</h2>
                    </div>
                  }

                  {/* ------------------ */}
                </div>


                {/* MENU SECTION */}
                <div className="col-sm-6 col-md-6 col-lg-6 panel text-left">

                  {/* New Menu - Edit Menu  */}
                  {newMenu
                    ?
                    <div className="text-left">
                      <label>ADD MENU</label>
                      <div>
                        <Input
                          style={{ width: '100%', margin: '20px 0px 10px 0px' }}
                          placeholder="Menu name"
                          value={this.state.menuName}
                          onChange={event => this.setState({ menuName: event.target.value })}
                        />
                        <textarea
                          style={{ width: '100%', margin: '10px 0px' }}
                          placeholder="Description"
                          value={this.state.menuDescription}
                          onChange={event => this.setState({ menuDescription: event.target.value })}
                        >
                        </textarea>
                        <Button block onClick={this.addMenu} >Add menu</Button>
                      </div>
                    </div>
                    :
                    <div className="text-left" style={{ minHeight: '60vh' }}>
                      <label>MENU STRUCTURE</label>
                      <br />

                      <div style={{ height: '100%', width: '100%', minHeight: '200px' }}>

                        <SortableTree
                          treeData={treeData}
                          onChange={treeData => this.setState({ treeData })}
                          isVirtualized={false}
                          maxDepth={5}
                          rowHeight={30}
                          onDrop={console.log('tree state after drop', this.state.treeData)}
                        />
                      </div>

                      <Button style={{ margin: '20px 0px 10px 0px' }} block onClick={this.updateMenu}>Update menu</Button>
                    </div>
                  }
                </div>
              </div>

            </div>
          </div>
          {/*--------------------- CENTER END -----------------------*/}
        </div>
      </AdminLayout>
    );
  }
}

export default Statistics;