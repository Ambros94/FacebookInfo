"use strict";
// Facebook Graph Requests library
var graph = require('fbgraph');

// Facebook access token, mandatory do do graph requests
var access_token;

/*
 * Execute the requested GraphApi request, and it resursively call itself until there are no further request
 */

var graphRecursiveRequests = function (requestText, mainResolve, mainReject, results) {

    graph.get(requestText, function (err, response) {
        if (err) {// Someting in the GraphApi request has gone wrong
            console.error(err);
            mainReject(err);
        }
        addPosts(response, results);

        if (response.paging && response.paging.next) {//A tail request exists
            var nextRequest = response.paging.next;
            graphRecursiveRequests(nextRequest, mainResolve, mainReject, results);
        } else {
            mainResolve(results);
        }
    });
};

var addPosts = function (response, posts) {
    response.data.forEach(function (post) {
        posts[post.id] = post;
    });
};
var getLikes = function (post) {
    return new Promise(function (resolve, reject) {
        var likes = [];
        post.likes.data.forEach(function (item) {
            likes.push(item);
        });
        graphRecursiveLikeRequests(post.likes.paging.next, resolve, reject, likes);
    });
};

var graphRecursiveLikeRequests = function (requestText, mainResolve, mainReject, likes) {

    graph.get(requestText, function (err, response) {
        if (err) {// Someting in the GraphApi request has gone wrong
            console.error(err, requestText);
            mainReject(err);
        }
        addLikes(likes,response);
        if (response.paging && response.paging.next) {//A tail request exists
            var nextRequest = response.paging.next;
            graphRecursiveRequests(nextRequest, mainResolve, mainReject, likes);
        } else {
            mainResolve(likes);
        }
    });
};

var addLikes = function (store, response) {
    response.data.forEach(function (like) {
        store.push(like);
    });
};

module.exports = {
    init: function (token) {
        access_token = token;
        graph.setAccessToken(token);
    },
    /*
     Returnes the complete user FEED
     */
    getPosts: function () {
        if (typeof access_token === 'undefined') {
            console.log("You must inizialize access_token first");
            return;
        }
        var response;
        var requestText = "/me/feed?limit=200";
        var p = new Promise(function (resolve, reject) {
            var posts = {};
            response = graphRecursiveRequests(requestText, resolve, reject, posts);
        });
        return p;
    },
    /*
     Returnes the complete user PHOTOS
     */
    getPhotos: function (type) {
        if (typeof access_token === 'undefined') {
            console.log("You must inizialize access_token first");
            return;
        }
        var response;
        if (type === 'tagged') {
            var requestText = "/me/photos/tagged";
        } else if (type === 'uploaded') {
            var requestText = "/me/photos/uploaded";
        } else {
            console.log("Invalid getPhotos parameter")
        }
        var p = new Promise(function (resolve, reject) {
            var photos = {};
            graphRecursiveRequests(requestText, resolve, reject, photos);
        });
        return p;
    },


    getFirstPosts: function () {
        var requestText = "/me/feed?limit=1";
        var p = new Promise(function (resolve, reject) {
            var posts = {};
            graph.get(requestText, function (err, response) {
                if (err) {// Something in the GraphApi request has gone wrong
                    console.error(err);
                    reject(err);
                }
                addPosts(response, posts);// Store the posts in the result array
                resolve(posts);
            });
        });
        return p;
    },
    /*
     Returnes likes for a given post
     */
    getLikesAsync: function (post) {
        if (!post.likes) {// If i do not have any likes
            return {};
        }
        if (post.likes.paging && post.likes.paging.next) {
            return getLikes(post);
        }
        return post.likes.data;
    }
};
