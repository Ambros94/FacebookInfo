/**
 * Created by lambrosini on 19/12/15.
 */
"use strict";


var dbPromise = require('../app/MongoManager').dbPromise;
var collections = require('../app/MongoManager').collections;
var _ = require('underscore');
var fb = require('./crawler');

var groupByMonthYear = function (item) {
    return item.created_time.substring(0, 7);
};

class AnalysisReport {
    constructor() {
        var likesCount;
        var bestElement;
        var periodGroupedLikes;
        var likesByPerson;
        var usedWords;
    }
}

var analyzeDatas = function (args) {
    if (!(args && args.email && args.sourceCollection && args.destinationCollection)) {
        console.log("Parametri sbagliati");
        return null;
    }
    let email = args.email,
        sourceCollectionName = args.sourceCollection,
        destinationCollectionName = args.destinationCollection;

    dbPromise.then(function (db) {
        /*
         Analyze the feed from user, by email identified
         */
        let sourceCollection=db.collection(sourceCollectionName);
        console.log(sourceCollectionName);
        sourceCollection.findOne({email: email}, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                /**************************************
                 Calculate total likes on the feed
                 Find the most successful post
                 ***************************************/
                const report = new AnalysisReport();
                /*
                 Launch all getLikes Promises
                 */
                var likesPromise = [];
                var photos = [];

                for (var photoId in result.data) {
                    let photo = result.data[photoId];
                    if (typeof photo.message != 'undefined') {
                        report.usedWords += photo.message;
                    }
                    photos.push(photo);
                    likesPromise.push(fb.getLikesAsync(photo));
                }
                /*
                 Waits for every promise, compute statistics
                 */

                Promise.all(likesPromise).then(function (results) {
                    /*
                     Utility init
                     */
                    var totalLikes = 0,
                        bestPost = {likesCount: -1, post: -1};
                    /*
                     Collect promises results
                     */
                    var likesByPerson = {};

                    results.forEach(function (likesArray, index) {
                        let likesCount = Object.keys(likesArray).length;
                        /*
                         Calculate likes by person
                         */
                        for (var i in likesArray) {
                            //noinspection JSUnfilteredForInLoop
                            let likerName = likesArray[i].name.replace('.', '');
                            if (typeof likesByPerson[likerName] === 'undefined') {
                                likesByPerson[likerName] = 0;
                            }
                            likesByPerson[likerName]++;
                        }
                        /*
                         Substitute facebook first page likes with all likes
                         */
                        photos[index].likes = likesArray;
                        /*
                         Increments total likes counter
                         */
                        totalLikes += likesCount;
                        /*
                         Find the most successful post
                         */
                        if (likesCount > bestPost.likesCount) {
                            bestPost.likesCount = likesCount;
                            bestPost.post = photos[index];
                        }
                    });
                    /*
                     Store results in the report
                     */
                    report.likesByPerson = likesByPerson;
                    report.bestElement = bestPost;
                    report.likesCount = totalLikes;
                    return report;
                }).then(function () {
                    /*
                     Group posts by period
                     */
                    var groupedByMonthYear = _.groupBy(photos, groupByMonthYear);
                    var keys = Object.keys(groupedByMonthYear);
                    for (let i = 0; i < keys.length; i++) {
                        var key,
                            likesInPeriod = _.reduce(groupedByMonthYear[key = keys[i]], function (memo, item) {
                                if (typeof item.likes.length === 'undefined')
                                    return memo;
                                else
                                    return memo + item.likes.length;
                            }, 0);
                        groupedByMonthYear[key] = likesInPeriod;
                    }
                    report.periodGroupedLikes = groupedByMonthYear;
                }).then(function () {
                    /*
                     Inserts analysis in the database
                     */
                    let destinationCollection=db.collection(destinationCollectionName);
                    destinationCollection.update({email: email}, {
                        email: email,
                        analysis: report
                    }, {upsert: true}).then(function () {
                        console.log("Report correctly stored");
                    }).catch(function (err) {
                        console.log("Cannot upsert tagged_photos", err);
                    });
                }).catch(function (err) {
                    console.error(err);
                });
            }
        });

    }).catch(function (err) {
        console.log(err);
    });

};

module.exports = {
    analyzeUploadedPhotos: function (email) {
        analyzeDatas({
            email: email,
            sourceCollection: collections.userUploaded,
            destinationCollection: collections.userUploadedAnalysis
        })
    },

    analyzeTaggedPhotos: function (email) {
        analyzeDatas({
            email: email,
            sourceCollection: collections.userTagged,
            destinationCollection: collections.userTaggedAnalysis
        })
    },

    analyzePosts: function (email) {
        analyzeDatas({
            email: email,
            sourceCollection: collections.userPost,
            destinationCollection: collections.userPostAnalysis
        })
    }
};
