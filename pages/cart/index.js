import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import { encodeForm } from '../../utils/api-utils';
import Head from 'next/head';


class Cart extends React.Component {

  static async getInitialProps({ req, res, query }) {

    return {
      session: await NextAuth.init({ req }),
      linkedAccounts: await NextAuth.linked({ req }),
      providers: await NextAuth.providers({ req })
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      user: this.props.session.user ? this.props.session.user : {},
      selectedItems: '',
      shippingPrice: 0,
      shippingOption: '',
      tax: 1.2,
      paymentOption: '',
      orderNote: '',
    };
  }


  async componentDidMount() {

    //Get logged user data
    if (this.props.session && this.props.session.user) {

      console.log('FETCHIIIING')
      // Fetch user
      const formData = {
        _csrf: this.props.session.csrfToken,
        _id: this.props.session.user.id,
        action: 'getOne'
      };

      await fetch(`${siteUrl}/api/v1/users`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData)
      }).then(async res => {
        if (res.status === 200) {
          this.setState({ user: await res.json() });
        }
        else {
          this.setState({ user: {} });
        }
      });
    }

    let itemsToBasket = [];
    let values;
    let discount = 1;

    for (var key in sessionStorage) {

      if (key.length == 24) {
        // console.log(key); 
        for (let i = 0; this.state.products.length > i; i++) {
          if (this.state.products[i]._id === key) {
            let product = this.state.products[i];
            values = JSON.parse(sessionStorage[key]);
            discount = (product.discount && (product.discount > 0)) ? ((100 - (product.discount)) / 100) : 1;
            product['qty'] = values[1];
            product['tax'] = Number(this.state.tax * 100 - 100).toFixed(0);
            product['totalPrice'] = Number(values[1] * values[2] * discount * this.state.tax).toFixed(0);
            product['totalPrice'] = Number(values[1] * values[2] * discount).toFixed(0);
            itemsToBasket.push(product);
            // quantity = JSON.parse(sessionStorage[key]);
            // itemsToBasket.push(this.state.products[i], quantity[1])
          }
        }
      }
    }
    this.setState({
      selectedItems: itemsToBasket
    });

    //Fetch product
    const formData = {
      _csrf: this.props.session.csrfToken,
      _id: '5d540cf4bc4ece62682bd1da',
      action: 'getOne',
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
      if (response.status === 'item_fetched') {

        console.log('====================================');
        console.log(response);
        console.log('====================================');

        this.setState({
          selectedItems: response.data
        });
      }
    });
  }

  render() {

    console.log('==========LOGGED USER===========');
    console.log(this.state.user);
    console.log('====================================');

    console.log('==========TEST PRODUCT===========');
    console.log(this.state.selectedItems);
    console.log('====================================');

    let items = this.state.selectedItems ? this.state.selectedItems : [];

    return (

      <React.Fragment >
        <Head>
          <link rel="stylesheet" href={siteUrl + "/static/styles/bootstrap/bootstrap.min.css"} />
        </Head>

        <div className="container">
          <table className="table table-hover">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Slika</th>
                <th scope="col">Proizvod</th>
                <th scope="col">Cena</th>
                <th scope="col">Velicina</th>
                <th scope="col">Kolicina</th>
                <th scope="col">Ukloni</th>
                <th scope="col">ukupno</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr>
                  <th scope="row">{index}</th>
                  <td>Mark</td>
                  <td>Otto</td>
                  <td>@mdo</td>
                </tr>
              ))};
            </tbody>
          </table>
        </div>
      </React.Fragment>
    );
  }
}


export default Cart;