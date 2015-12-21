/* QueryManager.js
 *
 *  Lets user to select and insert data
 *
 * */
"use strict";

var dbPromise = require('../app/MongoManager');
var userPostCollection = 'userFeed';

var storeUserFeed = function (email, feed) {
    return new Promise(function (resolve,reject){
        dbPromise.then(function (db) {
            var collection = db.collection(userPostCollection);
            collection.update({email: email}, {email: email, feed: feed}, {upsert: true}).then(function () {
                resolve("User feed correctly stored");
            }).catch(function (err) {
                reject(err);
            })
        }).catch(function (err) {
            reject(err);
        });
    });

};
var storeUserUploadedPhotos = function (email, photos) {
    dbPromise.then(function (db) {// Here i have the database
        var collection = db.collection(userPostCollection);
        collection.update({email: email}, {email: email, uploaded_photos: photos}, {upsert: true}).then(function () {
            return "UploadedPhotosCorrectly updated";
        }).catch(function (err) {
            console.error(err);
        })
    }).catch(function (err) {
        console.log("QueryManager :" + err);
    });
};
var storeUserTaggedPhotos = function (email, photos) {
    dbPromise.then(function (db) {// Here i have the database
        var collection = db.collection(userPostCollection);
        collection.update({email: email}, {email: email, tagged_photos: photos}, {upsert: true}).then(function () {
            console.log("Tagged photos stored correctly stored");
        }).catch(function (err) {
            console.error(err);
        })
    }).catch(function (err) {
        console.log("QueryManager :" + err);
    });
};

module.exports = {storeUserFeed, storeUserTaggedPhotos, storeUserUploadedPhotos};