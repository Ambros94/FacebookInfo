/**
 * Created by lambrosini on 19/12/15.
 */
"use strict";

var userPostCollection = 'userFeed';
var userAnalysisCollection = 'userAnalysis';

var dbPromise = require('../app/MongoManager');
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

module.exports = {

    analyzeTaggedPhotos: function () {
        return "analyzePosts";
    },
    analyzeUploadedPhotos: function () {
        return "analyzePosts";
    },
    analyzePosts: function (email) {
        dbPromise.then(function (db) {// Here i have the database
            var postCollection = db.collection(userPostCollection);
            /*
             Analyze the feed from user, by email identified
             */
            postCollection.findOne({email: email}, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    /**************************************
                     Calculate total likes on the feed
                     Find the most successful post
                     ***************************************/

                    const feedReport = new AnalysisReport();

                    /*
                     Launch all getLikes Promises
                     */
                    let likesPromise = [];
                    let posts = [];

                    for (var postId in result.feed) {
                        let post = result.feed[postId];
                        if (typeof post.message != 'undefined') {
                            feedReport.usedWords += post.message;
                        }
                        posts.push(post);
                        likesPromise.push(fb.getLikesAsync(post));
                    }
                    /*
                     Waits for every promise, compute statistics
                     */

                    Promise.all(likesPromise).then(function (results) {
                        /*
                         Utility init
                         */
                        let totalLikes = 0,
                            bestPost = {likesCount: -1, post: -1};
                        /*
                         Collect promises results
                         */
                        var likesByPerson = {};

                        results.forEach(function (likesArray, index, array) {
                            let likesCount = Object.keys(likesArray).length;
                            /*
                             Calculate likes by person
                             */
                            for (var i in likesArray) {
                                let likerName = likesArray[i].name.replace('.', '');
                                if (typeof likesByPerson[likerName] === 'undefined') {
                                    likesByPerson[likerName] = 0;
                                }
                                likesByPerson[likerName]++;
                            }
                            /*
                             Substitute facebook first page likes with all likes
                             */
                            posts[index].likes = likesArray;
                            /*
                             Increments total likes counter
                             */
                            totalLikes += likesCount;
                            /*
                             Find the most successful post
                             */
                            if (likesCount > bestPost.likesCount) {
                                bestPost.likesCount = likesCount;
                                bestPost.post = posts[index];
                            }
                        });
                        /*
                         Store results in the report
                         */
                        feedReport.likesByPerson = likesByPerson;
                        feedReport.bestElement = bestPost;
                        feedReport.likesCount = totalLikes;
                        return feedReport;
                    }).then(function () {
                        /*
                         Group posts by period
                         */
                        var groupedByMonthYear = _.groupBy(posts, groupByMonthYear);
                        let keys = Object.keys(groupedByMonthYear);
                        for (let i = 0; i < keys.length; i++) {
                            let key,
                                likesInPeriod = _.reduce(groupedByMonthYear[key = keys[i]], function (memo, item) {
                                    if (typeof item.likes.length === 'undefined')
                                        return memo;
                                    else
                                        return memo + item.likes.length;
                                }, 0);
                            groupedByMonthYear[key] = likesInPeriod;
                        }
                        feedReport.periodGroupedLikes = groupedByMonthYear;
                    }).then(function () {
                        /*
                         Inserts analysis in the database
                         */
                        var analysisCollection = db.collection(userAnalysisCollection);
                        analysisCollection.update({email: email}, {
                            email: email,
                            analysisfeed: feedReport
                        }, {upsert: true}).then(function () {
                            console.log("User analysis correctly updated");
                        }).catch(function (err) {
                            console.log("Cannot upsert feedReport", err);
                        });
                    }).catch(function (err) {
                        console.error(err);
                    });
                }
            });

        }).catch(function (err) {
            console.log(err);
        });
    }
};