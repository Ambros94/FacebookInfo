/**
 * Created by lambrosini on 19/12/15.
 */
"use strict";

var db = require('../app/MongoManager').monk;
var collections = require('../app/MongoManager').collections;
var Sessions = require('../app/session');
var query = require('../app/QueryManager');

var _ = require('underscore');
var fb = require('./crawler');

var groupByMonthYear = function (item) {
    return item.created_time.substring(0, 7);
};
var groupByHour = function (item) {
    return item.created_time.substring(11, 13);
};
var stringFilter = function (string) {
    let array = string.split(' ');
    for (var i = array.length - 1; i >= 0; i--) {
        array[i] = array[i].replace(/(\r\n|\n|\r|\\)/gm, "").replace(/[.,-\/!$%\^&\*;:{}=\-_`~()]/g, "");
        if (array[i].length <= 3) {
            array.splice(i, 1);
        }
    }
    return array;
};
var importantWords = function (words, limit) {
    limit = typeof limit !== 'undefined' ? limit : 10;
    words = _.groupBy(words, function (item) {
        return item;
    });
    let keys = Object.keys(words),
        wordsArray = [];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        wordsArray.push({word: key, count: words[key].length});
    }
    wordsArray = wordsArray.sort(function (a, b) {
        return b.count - a.count;
    });
    return wordsArray.slice(0, limit);
};

class AnalysisReport {
    constructor() {
        var likesCount;
        var bestElement;
        var periodGroupedLikes;
        var likesByPerson;
        var usedWords;
        var hourGroupedLikes;
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

    /*
     Analyze the feed from user, by email identified
     */
    let sourceCollection = db.get(sourceCollectionName);
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


            var userWords = [];

            for (var photoId in result.data) {
                let photo = result.data[photoId];
                /*
                 Calc used words
                 */
                if (sourceCollectionName === collections.userPost && typeof photo.message != 'undefined') {
                    userWords = userWords.concat(stringFilter(photo.message));
                }
                if ((sourceCollectionName === collections.userTagged || sourceCollectionName === collections.userUploaded) && typeof photo.name != 'undefined') {
                    userWords = userWords.concat(stringFilter(photo.name));
                }
                photos.push(photo);
                likesPromise.push(fb.getLikesAsync(photo));
            }
            /*
             Takes 50 most important words and maps it in [ { word: 'auguri', count: 40 } , ...]
             */
            userWords = importantWords(userWords, 50);
            report.usedWords = userWords;
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
                        let likerName = likesArray[i].name.replace('.', '');
                        let likerId = likesArray[i].id;
                        if (typeof likesByPerson[likerId] === 'undefined') {
                            likesByPerson[likerId] = {name: likerName, count: 0};
                        }
                        likesByPerson[likerId].count++;
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
                 Convert likesByPersonObj in likesByPersonArray
                 */
                var likesByPersonArray = [];
                let keys = Object.keys(likesByPerson);
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    likesByPersonArray.push({id: key, name: likesByPerson[key].name, count: likesByPerson[key].count});
                }
                /*
                Sort likesByPersonArray by likesCount
                 */
                likesByPersonArray = likesByPersonArray.sort(function (a, b) {
                    return b.count - a.count;
                });
                /*
                 Store results in the report
                 */
                report.likesByPerson = likesByPersonArray;
                report.bestElement = bestPost;
                report.likesCount = totalLikes;
                return report;
            }).then(function () {
                /*
                 Group posts by period
                 */
                let groupedByMonthYear = _.groupBy(photos, groupByMonthYear);
                let keys = Object.keys(groupedByMonthYear);
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
                 Group post by hour
                 */
                let groupedByHour = _.groupBy(photos, groupByHour);
                let keys = Object.keys(groupedByHour);
                for (let i = 0; i < keys.length; i++) {
                    var key,
                        likesInPeriod = _.reduce(groupedByHour[key = keys[i]], function (memo, item) {
                            if (typeof item.likes.length === 'undefined')
                                return memo;
                            else
                                return memo + item.likes.length;
                        }, 0);
                    groupedByHour[key] = likesInPeriod;
                }
                report.hourGroupedLikes = groupedByHour;
                console.log(report);
            }).then(function () {
                /*
                 Inserts analysis in the database
                 */
                let destinationCollection = db.get(destinationCollectionName);

                destinationCollection.findAndModify({
                    "query": {"email": email},
                    "update": {
                        email: email,
                        analysis: report
                    },
                    "upsert": true,
                    "new": true
                }, function (err, doc) {
                    if (err) {
                        res.send("There was a problem adding the information to the database.");
                    }
                    else {
                        //console.log(doc);
                        console.log("Analysis stored");

                    }
                });



            }).catch(function (err) {
                console.error(err);
            });
        }
    });


};

var analyzeUploadedPhotos = function (email) {
    analyzeDatas({
        email: email,
        sourceCollection: collections.userUploaded,
        destinationCollection: collections.userUploadedAnalysis
    })
};
var analyzeTaggedPhotos = function (email) {
    analyzeDatas({
        email: email,
        sourceCollection: collections.userTagged,
        destinationCollection: collections.userTaggedAnalysis
    })
};
var analyzePosts = function (email) {
    analyzeDatas({
        email: email,
        sourceCollection: collections.userPost,
        destinationCollection: collections.userPostAnalysis
    })
};

var analyzeUser = function (email, token) {
    Sessions.updateState(email, "No analysis");
    if (token) {
        fb.init(token);
        Sessions.updateState(email, "Post downloading");
        fb.getPosts().then(function (result) {
            /*
             Store the feed
             */
            return query.storeUserFeed(email, result);
        }).then(function (res) {
            console.log("Store result :",res);
            Sessions.updateState(email, "Uploaded photos downlading");
            /*
             Get uploaded photos
             */
            return fb.getPhotos('uploaded');
        }).catch(function (err) {
            console.log("Error during photo downloading", err);
        }).then(function (res) {
            console.log("Downloaded photos",res);

            /*
             Store uploaded photos
             */
            return query.storeUserUploadedPhotos(email, res);
        }).then(function (res) {
            console.log("store result",res);

            Sessions.updateState(email, "Tagged photos downloading");
            /*
             Get tagged photos
             */
            return fb.getPhotos('tagged');
        }).then(function (res) {
            console.log(res);

            /*
             Store tagged photos
             */
            return query.storeUserTaggedPhotos(email, res)
        }).then(function (res) {
            console.log(res);

            Sessions.updateState(email, "Looking at your posts");
            /*
             Feed analysis
             */
            return analyzePosts(email);
        }).then(function () {

            Sessions.updateState(email, "Looking at your photos");
            /*
             Tagged photos analysis
             */
            return analyzeTaggedPhotos(email);
        }).then(function () {
            /*
             Uploaded photo analysis
             */
            analyzeUploadedPhotos(email);
            Sessions.updateState(email, "Analysis completed");
        }).catch(function (err) {
            Sessions.updateState(email, "Cannot analyze, try later");
            console.log("Error during downloading or analiyis", err);
        });
    }
};


module.exports = {
    analyzeUploadedPhotos,
    analyzeTaggedPhotos,
    analyzePosts,
    analyzeUser
};

