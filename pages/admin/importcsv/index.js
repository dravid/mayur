import React, { Component } from 'react';
import { NextAuth } from 'next-auth/client';

import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
const { siteUrl, noCache } = publicRuntimeConfig;
import { transliterate as tr, slugify } from 'transliteration';
import {Upload, message, Button, Icon, notification, Spin} from 'antd';
import Link from "next/link";
import Router from 'next/router';
// const { Spin, Icon } = 'antd';

const antIcon = <Icon type="loading" style={{ fontSize: 24 }} spin />;


import AdminLayout from './../../../layouts/AdminLayout.js';
import { encodeForm } from './../../../utils/api-utils.js';

const notificationUpdateSuccess = type => {
    notification[type]({
        message: 'Success',
        description:
            'Imported successfuly',
        duration: 2,
        style: {marginTop: 100}
        // placement: "bottomRight"
    });
};

class ShowImportCSV extends React.Component {
    static async getInitialProps({ req, res, query }) {
        let session = await NextAuth.init({ req });

        //Check if user is signed in - if not redirect to sign in form
        if (res && session && !session.user) {
            res.redirect('/auth/sign-in');
        }
        if (res && session && session.csrfToken) {
        }

        // //Fetch all orders from DB
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
            //featured image
            previewVisible: false,
            previewImage: '',
            fileList: [],
            orders: this.props.orders,
            filterProductName: '',
            filterProductCode: '',
            title: 'testtest',
            //for loading...
            loading: false,
            iconLoading: false,
        };
        this.imortCSV=this.imortCSV.bind(this);
    }


    componentDidMount = async () => {

        //Load table with delay so jquery can load first
        await setTimeout(function () {
            $('#example').DataTable();
        }, 600);
    }


     imortCSV = async (_id) =>  {

         if(this.state.fileList.length===1){
             if(this.state.fileList[0].name === 'mayur.csv'){
                 //set this for loading button...
                 this.setState({ loading: true });
                 //empty upload list...
                 // this.state.fileList = [];
                 let orders = [];

                 const formData = {
                     _csrf: await NextAuth.csrfToken()//this.props.session.csrfToken,
                      // _id: this.props.session.user.id,
                 };

                 const encodedForm = Object.keys(formData).map((key) => {
                     return encodeURIComponent(key) + '=' + encodeURIComponent(formData[key]);
                 }).join('&');

                 // const encodedForm = await encodeForm(formData);

                fetch('/api/v1/importcsv', {
                    credentials: 'include',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                        // "Content-Type": "application/json",
                        // "Accept": "application/json"
                    },
                    body: encodedForm
                }).then(async res => {

                     if (res.status === 200) {
                         setTimeout(function () {
                               notificationUpdateSuccess('success');
                         }, 2000)
                         setTimeout(function () {
                             window.location.href = '/admin/importcsv';
                         }, 2000)
                     }
                 });

             }else{

                 alert('Please upload file with name: mayur.csv');
             }

         }else{
             alert('Please upload file with name: mayur.csv');
         }

    }


    imageHandleChange = ({fileList}) => {
        this.setState({fileList})
         console.log("File list: ", fileList)
    }




    render() {
        const orders = this.state.orders;
        const uploadButton = (
            <div>
                    <Icon type="plus"/>
                <div className="ant-upload-text">UPLOAD</div>
            </div>
        );

        const {previewVisible, previewImage, fileList} = this.state;
        return (

            <div style={{ position: 'relative' }}>
                <AdminLayout {...this.props}>


                    <ol className="breadcrumb breadcrumb-quirk">
                        <li><a href="/"><i className="fa fa-home mr5"></i> Home</a></li>
                        <li className="active">ImportCSV</li>
                    </ol>

                    <div className="row">

                        {/* END CENTER CONTENT */}
                        <Upload
                            action="/api/v1/fileupload"
                            accept=".csv"
                            name="uploadFileCSV"
                            headers={{
                                uri: slugify(this.state.title),
                                path: "data",
                                type: "data",
                                'X-CSRF-TOKEN': this.props.session.csrfToken,
                            }}
                            fileList={fileList}
                            defaultFileList={[...fileList]}
                            //onPreview={this.imageHandlePreview}
                            onChange={this.imageHandleChange}
                        >
                            {this.state.fileList.length < 1 ? uploadButton : null}
                        </Upload>

                        {/*{this.state.fileList.length !== 0 ? <Button type="primary" loading={this.state.loading} onClick={() => this.imortCSV('Proslo')}>Import CSV</Button>   : null}*/}
                        {/*{this.state.fileList.length !== 0 ? <Spin indicator={antIcon} /> : null}*/}
                        <br />
                            <Button type="primary" loading={this.state.loading} onClick={() =>{this.imortCSV('Proslo');}}>
                                Import CSV
                        </Button>

                    </div>

                </AdminLayout>
            </div>
        );
    }
}

export default ShowImportCSV;