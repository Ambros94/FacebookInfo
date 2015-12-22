/* MongoManager.js
 *
 *  Handles Database Connection
 *
 * */


var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = require('../config/database').url;

module.exports = {
    dbPromise: new Promise(function (resolve, reject) {
        MongoClient.connect(url, function (err, db) {
            if (err) {
                reject(err);
                console.log('Unable to connect to the mongoDB server. Error:', err);
            } else {
                console.log('Connection established to', url);
                resolve(db);
            }
        });
    }),
    collections: {
        userPost: 'userFeed',
        userUploaded: 'userUploaded',
        userTagged: 'userTagged',
        userPostAnalysis: 'userPostAnalysis',
        userTaggedAnalysis: 'userTaggedAnalysis',
        userUploadedAnalysis: 'userUploadedAnalysis'
    }
}
;



