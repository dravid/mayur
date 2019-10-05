'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
require('dotenv').load();
const moment = require('moment');

const apiUrl = '/api/v1';
let db;
let ordersCollection;
let productsCollection;
let resourcesCollection;
const mongoUrl = process.env.MONGO_HOST + '/' + process.env.MONGO_DB;


function validRequest(query) {
    return (query[process.env.CACHE_BUSTER_RANDOM] && process.env.CACHE_BUSTER && query[process.env.CACHE_BUSTER_RANDOM] === process.env.CACHE_BUSTER);
}

MongoClient.connect(mongoUrl, (err, mongoClient) => {

    if (err) {
        throw new Error(err);
    }

    db = mongoClient.db(process.env.MONGO_DB);
    ordersCollection = db.collection('orders');
    productsCollection = db.collection('products');
    resourcesCollection = db.collection('resources');
});


module.exports = (expressApp) => {

    if (expressApp === null) {
        throw new Error('Error: expressApp option must be an express server instance');
    }

    function slugMy(text) {
        let charCodeZ = String.fromCharCode(381);//Ž
        let charCodez = String.fromCharCode(382);//ž
        let charCodeS = String.fromCharCode(352);//Š
        let charCodes = String.fromCharCode(353);//š
        let charCodeC1 = String.fromCharCode(268);//Č
        let charCodec2 = String.fromCharCode(269);//č
        let charCodeC3 = String.fromCharCode(262);//Ć
        let charCodec4 = String.fromCharCode(263);//ć
        let charCodeDz = String.fromCharCode(453);//DŽ
        let charCodedz = String.fromCharCode(454);//dž
        let charCodeD = String.fromCharCode(271);//Đ
        let charCoded = String.fromCharCode(272);//đ
        let myText = text.toString().toLowerCase()
            .replace(charCodez, 'z')
            .replace(charCodes, 's')
            .replace(charCodec2, 'c')
            .replace(charCodec4, 'c')
            .replace(charCodedz, 'dz')
            .replace(charCoded, 'd')
            .replace(/\s+/g, '-')        // Replace spaces with -
            .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
            .replace(/\-\-+/g, '-')      // Replace multiple - with single -
            .replace(/^-+/, '')          // Trim - from start of text
            .replace(/-+$/, '');         // Trim - from end of text

        //
        // let date = moment(this.date)
        //     , formatted = date.format('YYYY[-]MM[-]DD[-]');

        return myText;

    }

    //change key in object
    function renameKeys(obj, newKeys) {
        const keyValues = Object.keys(obj).map(key => {
            const newKey = newKeys[key] || key;
            return { [newKey]: obj[key] };
        });
        return Object.assign({}, ...keyValues);
    }
    //exemple
    // const obj = { a: "1", b: "2" };
    // const newKeys = { a: "A", c: "C" };
    // const renamedObj = renameKeys(obj, newKeys);
    // console.log(renamedObj);
    // {A:"1", b:"2"}





    expressApp.post(apiUrl + '/importcsv', (req, res) => {


        let now = moment(new Date()).format('DD.MM.YYYY HH:mm');

        const csv = require('csv-parser')
        const fs = require('fs')
        const results = [];

        fs.createReadStream('static/csv/mayur.csv')
            .pipe(csv({ separator: ',' }))
            .on('data', (data) => results.push(data))
            .on('end', () => {



                for (let i = 0; i < results.length; i++) {

                    // Change key in object...for reading
                    const newKeys = { 'Akcijska cena': 'Akcijskacena' };
                    const resultNewKeyAkcijskaCena = renameKeys(results[i], newKeys);

                    let uriName = results[i].Artikal !== undefined ? results[i].Artikal : '';
                    let uriNameSlug = '';
                    if (uriName !== '') {
                        uriNameSlug = slugMy(uriName);
                    }

                    let productIDUpdate = results[i].Sifra !== undefined ? results[i].Sifra : '';

                    let newItem = {
                        name: results[i].Artikal !== undefined ? results[i].Artikal : '',
                        // uri: results[i].uri !== undefined ? results[i].uri : '',///jus for now
                        uri: results[i].Artikal !== undefined ? uriNameSlug : '',//juse this becouse uri is slugify.. of name
                        productCode: results[i].Sifra !== undefined ? results[i].Sifra : '',
                        seo: results[i].seo !== undefined ? results[i].seo : '',
                        description: results[i].description !== undefined ? results[i].description : '',
                        category: results[i].Klasifikator !== undefined ? results[i].Klasifikator : 'other',
                        subCategory: results[i].Podklasifikator !== undefined ? results[i].Podklasifikator : 'other',
                        group: results[i].Grupa !== undefined ? results[i].Grupa : 'other',
                        amount: results[i].Kolicina !== undefined ? results[i].Kolicina : '',



                        // descriptor1: postData.descriptor1 ? JSON.parse(postData.descriptor1) : "",
                        // descriptor2: postData.descriptor2 ? JSON.parse(postData.descriptor2) : "",
                        // descriptor3: postData.descriptor3 ? JSON.parse(postData.descriptor3) : "",
                        // descriptor4: postData.descriptor4 ? JSON.parse(postData.descriptor4) : "",
                        // descriptor5: postData.descriptor5 ? JSON.parse(postData.descriptor5) : "",

                        subDescriptor1: results[i].subDescriptor1 !== undefined ? results[i].subDescriptor1 : '',
                        descriptor2: results[i].descriptor2 !== undefined ? results[i].descriptor2 : '',
                        subDescriptor2: results[i].subDescriptor2 !== undefined ? results[i].subDescriptor2 : '',
                        descriptor3: results[i].descriptor3 !== undefined ? results[i].descriptor3 : '',
                        subDescriptor3: results[i].subDescriptor3 !== undefined ? results[i].subDescriptor3 : '',
                        descriptor4: results[i].descriptor4 !== undefined ? results[i].descriptor4 : '',
                        subDescriptor4: results[i].subDescriptor4 !== undefined ? results[i].subDescriptor4 : '',
                        descriptor5: results[i].descriptor5 !== undefined ? results[i].descriptor5 : '',
                        subDescriptor5: results[i].subDescriptor5 !== undefined ? results[i].subDescriptor5 : '',

                        price: results[i].Cena !== undefined ? results[i].Cena : '',
                        salePrice: resultNewKeyAkcijskaCena.Akcijskacena !== undefined ? resultNewKeyAkcijskaCena.Akcijskacena : '',
                        discount: results[i].discount !== undefined ? results[i].discount : 0,
                        supply: results[i].supply !== undefined ? results[i].supply : '',
                        sku: results[i].sku !== undefined ? results[i].sku : '',
                        active: results[i].active !== undefined ? results[i].active : '',
                        //Images
                        images: results[i].images !== undefined ? JSON.parse(results[i].images) : "",
                        //Creator info
                        authorId: results[i].authorId !== undefined ? results[i].authorId : '',
                        authorFirstName: results[i].authorFirstName !== undefined ? results[i].authorFirstName : '',
                        authorLastName: results[i].authorLastName !== undefined ? results[i].authorLastName : '',
                        createdAt: now,
                        updatedAt: now
                    };

                    // console.log('new Item...');
                    // console.log(newItem);
                    /**
                     * Insert product into the `resources` collection
                     */
                    let newResource = {
                        productId: results[i].Sifra !== undefined ? results[i].Sifra : '',
                        uri: results[i].Artikal !== undefined ? uriNameSlug : '',
                        category: results[i].category !== undefined ? results[i].category : 'other',
                        subCategory: results[i].subCategory !== undefined ? results[i].subCategory : 'other',
                        productCode: results[i].Sifra !== undefined ? results[i].Sifra : '',
                        sku: results[i].sku !== undefined ? results[i].sku : '',
                        type: "products"
                    };



                    let productCodeFind = results[i].Sifra !== undefined ? results[i].Sifra : '';
                    // productCodeFind = '10030';
                    // productCodeFind = '100304444';

                    productsCollection.findOne({

                        productCode: productCodeFind

                    }, (err, existingUser) => {

                        if (err) {
                            console.log(err);

                            return res.json({
                                status: 'database_error'
                            });
                        }

                        if (!existingUser) {
                            //old ligic
                            productsCollection.insertOne(newItem, (error, res) => {

                                if (error) {
                                    // console.log('api :: error :: /products :: add :: ', error);

                                    return res.json({
                                        status: 'database_error'
                                    });
                                }

                                resourcesCollection.insertOne(newResource, (error, res) => {

                                    if (error) {

                                        // console.log(apiUrl + '/products - new resource: ', error);
                                        return res.status(500).json({ error: 'db_error' });
                                    }

                                });
                            });
                        } else {



                            productsCollection.updateOne({
                                productCode: productIDUpdate
                            }, {
                                    $set: {
                                        name: newItem.name,
                                        uri: newItem.uri,
                                        category: newItem.category,
                                        subCategory: newItem.subCategory,
                                        price: newItem.price,
                                        salePrice: newItem.salePrice,
                                        discount: newItem.discount,
                                        group: newItem.group,
                                        amount: newItem.amount,
                                        updatedAt: newItem.updatedAt
                                    }
                                }, {}, function (error, updatedUser) {
                                    if (error) {
                                        console.log('api :: error :: /users :: set :: ', error);
                                        return res.status(500).json({ code: 'db_error', message: error });
                                    }

                                    ////////////////////////////////////   update resource collection   ///////////////////////////////



                                    resourcesCollection.updateOne({
                                        productId: productIDUpdate
                                    }, {
                                            $set: {
                                                name: newResource.name,
                                                uri: newResource.uri,
                                                category: newResource.category,
                                                subCategory: newResource.subCategory,
                                                sku: newResource.sku,
                                                type: "products"
                                            }
                                        }, {}, function (error, updatedUser) {
                                            if (error) {
                                                console.log('api :: error :: /users :: set :: ', error);
                                                return res.status(500).json({ code: 'db_error', message: error });
                                            }
                                        });
                                    //////////////////////////////////////////////////////////////////
                                });
                        }
                    });
                }
            });
        return res.status(200).json({});
    });
};