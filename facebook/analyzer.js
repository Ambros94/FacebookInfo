/**
 * Created by lambrosini on 19/12/15.
 */
"use strict";

var db = require('../app/MongoManager').monk;
var dbPromise = require('../app/MongoManager').dbPromise;
var collections = require('../app/MongoManager').collections;
var Sessions = require('../app/session');
var query = require('../app/QueryManager');

var _ = require('underscore');
var fb = require('./crawler');

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

var analyzeUploadedPhotos = function (email) {
    return analyzeData({
        email: email,
        sourceCollection: collections.userUploaded,
        destinationCollection: collections.userUploadedAnalysis
    })
};
var analyzeTaggedPhotos = function (email) {
    return analyzeData({
        email: email,
        sourceCollection: collections.userTagged,
        destinationCollection: collections.userTaggedAnalysis
    })
};
var analyzePosts = function (email) {
    return analyzeData({
        email: email,
        sourceCollection: collections.userPost,
        destinationCollection: collections.userPostAnalysis
    })
};

var wordComparator = function (a, b) {
    return a.word === b.word;
};
var likerComparator = function (a, b) {
    return a.name === b.name;
};

var contains = function (array, element, comparator) {
    for (var i = 0; i < array.length; i++) {
        var e = array[i];
        if (comparator(e, element) === true) {
            return i;
        }
    }

    return -1;
};

var computeTotalAnalysis = function (email) {
    let report = new AnalysisReport();
    /**
     * Tagged Photos
     */

    let sourceCollection = db.get(collections.userTaggedAnalysis);
    return sourceCollection.findOne({email: email}).then(function (taggedReport) {
        report = taggedReport.analysis;
        sourceCollection = db.get(collections.userUploadedAnalysis);
        return sourceCollection.findOne({email: email});
    }).then(function (uploadedReport) {
        /**
         *  Uploaded photos
         */
        uploadedReport = uploadedReport.analysis;
        /*
         LikesCount
         */
        report.likesCount += uploadedReport.likesCount;
        /*
         Merge userWords
         */
        var i;
        uploadedReport.usedWords.forEach(function (word) {
            i = contains(report.usedWords, word, wordComparator);
            if (i === -1) // Word non present in the report
                report.usedWords.push(word);
            else
                report.usedWords[i].count += word.count;
        });
        /*
         Best Element
         */
        if (uploadedReport.bestElement.likesCount > report.bestElement.likesCount)
            report.bestElement = uploadedReport.bestElement;
        /*
         Likes by person
         */
        var i;
        uploadedReport.likesByPerson.forEach(function (liker) {
            i = contains(report.likesByPerson, liker, likerComparator);
            if (i === -1) // Word non present in the report
                report.likesByPerson.push(liker);
            else {
                report.likesByPerson[i].count += liker.count;

            }
        });

        /*
         Period grouped likes
         */
        let keys = Object.keys(uploadedReport.periodGroupedLikes);
        for (let i = 0; i < keys.length; i++) {
            let key;
            if (typeof report.periodGroupedLikes[key = keys[i]] === 'undefined')
                report.periodGroupedLikes[key] = uploadedReport.periodGroupedLikes[key];
            else {
                report.periodGroupedLikes[key] += uploadedReport.periodGroupedLikes[key];
            }
        }
        /*
         Hour grouped likes
         */
        keys = Object.keys(uploadedReport.hourGroupedLikes);
        for (let i = 0; i < keys.length; i++) {
            let key;
            if (typeof report.hourGroupedLikes[key = keys[i]] === 'undefined')
                report.hourGroupedLikes[key] = uploadedReport.hourGroupedLikes[key];
            else {
                report.hourGroupedLikes[key] += uploadedReport.hourGroupedLikes[key];
            }
        }

        sourceCollection = db.get(collections.userPostAnalysis);
        return sourceCollection.findOne({email: email});
    }).then(function (feedReport) {

        /**
         Feed
         */
        feedReport = feedReport.analysis;
        /*
         LikesCount
         */
        report.likesCount += feedReport.likesCount;
        /*
         Merge userWords
         */
        var i;
        feedReport.usedWords.forEach(function (word) {
            if ((i = contains(report.usedWords, word, wordComparator)) === -1) // Word non present in the report
                report.usedWords.push(word);
            else {
                report.usedWords[i].count += word.count;
            }
        });
        /*
         Best Element
         */
        if (feedReport.bestElement.likesCount > report.bestElement.likesCount)
            report.bestElement = feedReport.bestElement;
        /*
         Likes by person
         */
        var i;
        feedReport.likesByPerson.forEach(function (liker) {
            if ((i = contains(report.likesByPerson, liker, likerComparator)) === -1) // Word non present in the report
                report.likesByPerson.push(liker);
            else {
                report.likesByPerson[i].count += liker.count;

            }
        });
        /*
         Period grouped likes
         */
        let keys = Object.keys(feedReport.periodGroupedLikes);
        for (let i = 0; i < keys.length; i++) {
            let key;
            if (typeof report.periodGroupedLikes[key = keys[i]] === 'undefined')
                report.periodGroupedLikes[key] = feedReport.periodGroupedLikes[key];
            else {
                report.periodGroupedLikes[key] += feedReport.periodGroupedLikes[key];
            }
        }
        /*
         Hour grouped likes
         */
        keys = Object.keys(feedReport.hourGroupedLikes);
        for (let i = 0; i < keys.length; i++) {
            let key;
            if (typeof report.hourGroupedLikes[key = keys[i]] === 'undefined')
                report.hourGroupedLikes[key] = feedReport.hourGroupedLikes[key];
            else {
                report.hourGroupedLikes[key] += feedReport.hourGroupedLikes[key];
            }
        }
        return dbPromise;
    }).then(function (db) {
        /*
         Sort the report
         */
        report.likesByPerson = report.likesByPerson.sort(function (a, b) {
            return b.count - a.count;
        });
        report.usedWords = report.usedWords.sort(function (a, b) {
            return b.count - a.count;
        });
        /*
         Store the report
         */
        var destinationCollection = db.collection(collections.userCompleteAnalysis);
        return destinationCollection.update({email: email}, {
            email: email,
            analysis: report
        }, {upsert: true});
    });


};


var analyzeData = function (args) {
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
             Calculate total likes
             Find the most successful post
             ***************************************/
            const report = new AnalysisReport();
            /*
             Launch all getLikes Promises
             */
            var likesPromise = [];
            var photos = [];
            var likesByPersonArray = [];
            /*
             Utility init
             */
            var totalLikes = 0,
                bestPost = {likesCount: -1, post: -1};
            /*
             Collect promises results
             */
            var likesByPerson = {};
            var likerPromises = [];

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
            /*******************************************************************
             DOWNLOAD ALL LIKES, NOT ONLY FIRST 25 and LAUNCH LikerDataPromises
             *******************************************************************/
            Promise.all(likesPromise).then(function (results) {
                results.forEach(function (likesArray, index) {
                    /*
                     Calculate likes by person
                     */
                    for (var i in likesArray) {
                        let likerName = likesArray[i].name.replace('.', '');
                        let likeId = likesArray[i].id;
                        if (typeof likesByPerson[likerName] === 'undefined') {
                            likerPromises.push(fb.getLikerDataAsync(likeId));
                            likesByPerson[likerName] = {name: likerName, count: 0};
                        }
                        likesByPerson[likerName].count++;
                    }
                    /*
                     Substitute facebook first page likes with all likes
                     */
                    photos[index].likes = likesArray;
                    /*
                     Increments total likes counter
                     */
                    let likesCount = Object.keys(likesArray).length;
                    totalLikes += likesCount;
                    /*
                     Find the most successful post
                     */
                    if (likesCount > bestPost.likesCount) {
                        bestPost.likesCount = likesCount;
                        bestPost.post = photos[index];
                    }
                });
                return Promise.all(likerPromises);


            }).then(function (likerData) {
                /************************
                 DOWNLOAD ALL LikersData and Start Best Liker Photos download
                 ************************/

                likerData.forEach(function (likerData) {
                    let likerName = likerData.name.replace('.', '');
                    if (typeof likesByPerson[likerName] === 'undefined')
                        likesByPerson[likerName] = {};
                    likesByPerson[likerName].profileLink = likerData.link;
                });

                /*
                 Convert likesByPersonObj in likesByPersonArray
                 */
                let keys = Object.keys(likesByPerson);
                for (let i = 0; i < keys.length; i++) {
                    let key = keys[i];
                    likesByPersonArray.push({
                        id: key,
                        name: likesByPerson[key].name,
                        count: likesByPerson[key].count,
                        profileLink: likesByPerson[key].profileLink
                    });
                }
                /*
                 Sort likesByPersonArray by likesCount
                 */
                likesByPersonArray = likesByPersonArray.sort(function (a, b) {
                    return b.count - a.count;
                });
                /*
                 Downloads first 5 likes person photos
                 */
                var profilePhotoPromises = [];
                for (var i = 0; i < 5; i++) {
                    profilePhotoPromises.push(fb.getProfilePhoto(likesByPersonArray[i].profileLink));
                }
                return Promise.all(profilePhotoPromises);


            }).then(function (profilePhotoArray) {
                profilePhotoArray.forEach(function (profilePhoto, index) {
                    likesByPersonArray[index].profilePhoto = profilePhoto;
                });
                /*
                 Store results in the report
                 */
                report.likesByPerson = likesByPersonArray;
                report.bestElement = bestPost;
                report.likesCount = totalLikes;
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
                return dbPromise;
            }).then(function (db) {
                /*
                 Inserts analysis in the database
                 */
                var destinationCollection = db.collection(destinationCollectionName);
                return destinationCollection.update({email: email}, {
                    email: email,
                    analysis: report
                }, {upsert: true});

            }).catch(function (err) {
                console.error(err);
            });


        }
    });
};

var analyzeUser = function (email, token) {
    Sessions.updateState(email, "No analysis");
    fb.init(token);
    Sessions.updateState(email, "Post downloading");
    fb.getPosts().then(function (result) {
        /*
         Store the feed
         */
        return query.storeUserFeed(email, result);
    }).then(function (res) {
        //console.log("Store result :",res);
        Sessions.updateState(email, "Uploaded photos downloading");
        /*
         Get uploaded photos
         */
        return fb.getPhotos('uploaded');
    }).catch(function (err) {
        //console.log("Error during photo downloading", err);
    }).then(function (res) {
        //console.log("Downloaded photos",res);
        /*
         Store uploaded photos
         */
        return query.storeUserUploadedPhotos(email, res);
    }).then(function (res) {
        //console.log("store result",res);
        Sessions.updateState(email, "Tagged photos downloading");
        /*
         Get tagged photos
         */
        return fb.getPhotos('tagged');
    }).then(function (res) {
        //console.log(res);
        /*
         Store tagged photos
         */
        return query.storeUserTaggedPhotos(email, res)
    }).then(function (res) {
        //console.log(res);
        Sessions.updateState(email, "Looking at your posts");
        /*
         Feed analysis
         */
        return analyzePosts(email);
    }).then(function () {
        console.log("Post analyzed");
        Sessions.updateState(email, "Looking at your photos");
        /*
         Tagged photos analysis
         */
        return analyzeTaggedPhotos(email);
    }).then(function () {
        console.log("Tagged photos analyzed");
        /*
         Uploaded photo analysis
         */
        return analyzeUploadedPhotos(email);
    }).then(function () {
        console.log("Uploaded photo analyzed");
        Sessions.updateState(email, "Computing the final analysis");
        return computeTotalAnalysis(email);
    }).then(function () {
        Sessions.updateState(email, "Analysis completed");
        Sessions.analysisCompleted(email);
    }).catch(function (err) {
        Sessions.updateState(email, "Cannot analyze, try later");
        console.log("Error during downloading or analysis", err);
    });
};


module.exports = {
    analyzeUploadedPhotos,
    analyzeTaggedPhotos,
    analyzePosts,
    analyzeUser,
    computeTotalAnalysis
};
