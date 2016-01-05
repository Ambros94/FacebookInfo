/* MongoManager.js
 *
 *  Handles Database Connection
 *
 * */

// Connection URL. This is where your mongodb server is running.
var url = require('../config/database').url;

//Driver used for upsert
var mongodb = require('mongodb');

//Driver used for remove and foreach
var monk = require('monk')(url);

var dbPromise = new Promise(function (resolve, reject) {
    mongodb.MongoClient.connect(url, function (err, db) {
        if (err) {
            reject(err);
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection established to', url);
            resolve(db);
        }
    });
});

module.exports = {
    dbPromise,
    monk,
    collections: {
        users: 'users',
        userPost: 'userFeed',
        userUploaded: 'userUploaded',
        userTagged: 'userTagged',
        userPostAnalysis: 'userPostAnalysis',
        userTaggedAnalysis: 'userTaggedAnalysis',
        userUploadedAnalysis: 'userUploadedAnalysis'
    }
};





