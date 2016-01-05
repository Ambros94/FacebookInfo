/* QueryManager.js
 *
 *  Lets user to select and insert data
 *
 * */
"use strict";

var db = require('../app/MongoManager').monk;
var dbPromise = require('../app/MongoManager').dbPromise;
var collections = require('../app/MongoManager').collections;

var storeUserFeed = function (email, feed) {
    return new Promise(function (resolve, reject) {
        dbPromise.then(function (db) {
            var collection = db.collection(collections.userPost);
            return collection.update({email: email}, {email: email, data: feed}, {upsert: true}).then(function (res) {
                console.log("User feed correctly stored");
                resolve("User feed correctly stored");
            }).catch(function (err) {
                console.log("Impossible to store feed");
                reject(err);
            })
        }).catch(function (err) {
            console.error("storeUserFeed :" + err);
            reject(err);
        });
    });
};

var storeUserUploadedPhotos = function (email, photos) {
    return new Promise(function (resolve, reject) {
        dbPromise.then(function (db) {// Here i have the database
            var collection = db.collection(collections.userUploaded);
            collection.update({email: email}, {email: email, data: photos}, {upsert: true}).then(function (res) {
                resolve("User uploaded correctly stored");
                console.log("UploadedPhotosCorrectly updated");
            }).catch(function (err) {
                console.log("Impossible to add user storage", err);
                reject(err);

            })
        }).catch(function (err) {
            console.log("storeUserUploadedPhotos :" + err);
        });
    });
};

var storeUserTaggedPhotos = function (email, photos) {
    return new Promise(function (resolve, reject) {
        dbPromise.then(function (db) {// Here i have the database
            var collection = db.collection(collections.userTagged);
            collection.update({email: email}, {email: email, data: photos}, {upsert: true}).then(function (res) {
                resolve("User tagged correctly stored");
                console.log("Tagged photos stored correctly stored");
            }).catch(function (err) {
                console.log("Impossibile to store tagged", err);
                reject(err);

            })
        }).catch(function (err) {
            console.error("storeUserTaggedPhotos :" + err);
        });
    });
};
var clearUser = function (email) {
    var collection = db.get(collections.userTagged);
    collection.remove({email: email}, function (err) {
        if (err)
            console.err(err);
    });
    collection = db.get(collections.userTaggedAnalysis);
    collection.remove({email: email}, function (err) {
        if (err)
            console.err(err);
    });
    collection = db.get(collections.userPost);
    collection.remove({email: email}, function (err) {
        if (err)
            console.err(err);
    });
    collection = db.get(collections.userPostAnalysis);
    collection.remove({email: email}, function (err) {
        if (err)
            console.err(err);
    });
    collection = db.get(collections.userUploaded);
    collection.remove({email: email}, function (err) {
        if (err)
            console.err(err);
    });
    collection = db.get(collections.userUploadedAnalysis);
    collection.remove({email: email}, function (err) {
        if (err)
            console.err(err);
    });

};

module.exports = {storeUserFeed, storeUserTaggedPhotos, storeUserUploadedPhotos, clearUser};
