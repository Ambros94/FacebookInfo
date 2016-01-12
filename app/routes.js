"use strict";
var analyzer = require('../facebook/analyzer');
var Session = require('./session');
var collections = require('./MongoManager.js').collections;
var monk = require('./MongoManager.js').monk;
var query = require('./QueryManager.js');
var moment = require('moment');


module.exports = function (app, passport) {

    /////////////////////////////////////////////
    //////////////// User pages /////////////////
    /////////////////////////////////////////////

    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    /*
     User profile (MAIN PAGE)
     */
    app.get('/profile', isLoggedIn, function (req, res) {
        var analysisResult;
        /*
         Check if the authenticated user has accepted terms & conditions
         */
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            var analysis = monk.get(collections.userCompleteAnalysis);
            analysis.find({}, {stream: true})
                .each(function (item) {
                    //console.log(item.email + "  :  " + req.user.facebook.email)
                    if (typeof item !== 'undefined' && item.email == email) {
                        analysisResult = item;
                    }
                })
                .error(function () {
                    res.send({
                        data: [{
                            "_id": '',
                            "email": "",
                            "analysis": {
                                "usedWords": [{"word": ""}],
                                "likesByPerson": [{
                                    "id": "",
                                    "name": "",
                                    "count": 0,
                                    "profileLink": "",
                                    "profilePhoto": ""
                                }],
                                "bestElement": {
                                    "likesCount": 0,
                                    "post": {
                                        "id": "",
                                        "created_time": "",
                                        "from": {"name": "", "id": ""},
                                        "height": 0,
                                        "icon": "",
                                        "images": [{"height": 0, "source": "", "whidth": 0}],
                                        "link": "",
                                        "name": "",
                                        "picture": "",
                                        "source": "",
                                        "updated-time": "",
                                        "width": 0,
                                        "tags": {
                                            data: [{"id": "", "name": "", "created_time": "", "x": 0, "y": 0}],
                                            "paging": {"cursor": {"before": "", "after": ""}}
                                        },
                                        "comments": {
                                            "data": [{
                                                "created_time": "",
                                                "from": {"name": "", "id": ""},
                                                "message": "",
                                                "can_remove": false,
                                                "like_count": 0,
                                                "user_like": false,
                                                "id": ""
                                            }], "paging": {"cursor": {"before": "", "after": ""}}
                                        },
                                        "likes": [{"id": "", "name": ""}]
                                    }
                                },
                                "likesCount": 0,
                                "periodGroupedLikes": {"2016-01": 0},
                                "hourGroupedLikes": {"0": 0}
                            }
                        }]
                    });
                })
                .success(function () {
                    res.render('user.ejs', {
                        user: req.user,
                        lastAnalysis: Session.lastAnalysis(req.user.facebook.email),
                        countAnalysis: Session.analysisCount(req.user.facebook.email),
                        data: analysisResult
                    });
                });


        }
        else {
            res.redirect('/login/terms');
        }
    });

    /*
     User profile (MAIN PAGE)
     */
    app.get('/profile/:email', isAdmin, function (req, res) {
        var analysisResult;
        /*
         Check if the authenticated user has accepted terms & conditions
         */
        let email=req.params.email;
        console.log("email", email);
        var analysis = monk.get(collections.userCompleteAnalysis);
        analysis.find({}, {stream: true})
            .each(function (item) {
                console.log(item.email, email, item.email == email);
                if (typeof item !== 'undefined' && item.email == email) {
                    analysisResult = item;
                }
            })
            .error(function () {
                res.send({
                    data: [{
                        "_id": '',
                        "email": "",
                        "analysis": {
                            "usedWords": [{"word": ""}],
                            "likesByPerson": [{
                                "id": "",
                                "name": "",
                                "count": 0,
                                "profileLink": "",
                                "profilePhoto": ""
                            }],
                            "bestElement": {
                                "likesCount": 0,
                                "post": {
                                    "id": "",
                                    "created_time": "",
                                    "from": {"name": "", "id": ""},
                                    "height": 0,
                                    "icon": "",
                                    "images": [{"height": 0, "source": "", "whidth": 0}],
                                    "link": "",
                                    "name": "",
                                    "picture": "",
                                    "source": "",
                                    "updated-time": "",
                                    "width": 0,
                                    "tags": {
                                        data: [{"id": "", "name": "", "created_time": "", "x": 0, "y": 0}],
                                        "paging": {"cursor": {"before": "", "after": ""}}
                                    },
                                    "comments": {
                                        "data": [{
                                            "created_time": "",
                                            "from": {"name": "", "id": ""},
                                            "message": "",
                                            "can_remove": false,
                                            "like_count": 0,
                                            "user_like": false,
                                            "id": ""
                                        }], "paging": {"cursor": {"before": "", "after": ""}}
                                    },
                                    "likes": [{"id": "", "name": ""}]
                                }
                            },
                            "likesCount": 0,
                            "periodGroupedLikes": {"2016-01": 0},
                            "hourGroupedLikes": {"0": 0}
                        }
                    }]
                });
            })
            .success(function () {
                console.log(Session.lastAnalysis(email));
                res.render('user.ejs', {
                    user: req.user,
                    lastAnalysis: Session.lastAnalysis(email),
                    countAnalysis: Session.analysisCount(email),
                    data: analysisResult
                });
            });

    });


    /////////////////////////////////////////////
    /////////////// Admin Pages /////////////////
    /////////////////////////////////////////////

    app.get('/admin', isLoggedIn, function (req, res) {
        res.render('control-panel.ejs', {
            user: req.user
        });
    });


    /////////////////////////////////////////////
    /////////// Terms and conditions ////////////
    /////////////////////////////////////////////

    /*
     Shows terms and conditions,
     on decline : Redirect to '/',
     on accept : Redirects to '/terms_accepted'
     */
    app.get('/login/terms', function (req, res) {
        res.render('terms_conditions.ejs', {});
    });

    /*
     Users agreed terms, now can login, so is redirected to his profile page
     */
    app.get('/terms_accepted', function (req, res) {
        Session.acceptTerms(req.user.facebook.email);
        res.redirect('/analyzing');
    });

    /////////////////////////////////////////////
    /////////////// Ajax routes /////////////////
    /////////////////////////////////////////////

    /*
     Return user analysis state for the current logged user
     */
    app.get('/getState', isLoggedIn, function (req, res) {
        var email = req.user.facebook.email;
        var state = Session.getState(email);
        res.send({state});
    });
    /*
     Return user analysis state for the email identified user
     */
    app.get('/getState/:email', isLoggedIn, function (req, res) {
        /*
         * Params mapping on local variables
         */
        var email = req.params.email;
        var state = Session.getState(email);
        res.send({state});
    });
    /*
     Clear email identified user data
     */
    app.get('/clearUser/:email', isLoggedIn, function (req, res) {
        /*
         * Params mapping on local variables
         */
        var email = req.params.email;
        query.clearUser(email);
        console.log("Data cleared {" + email + "}");
        res.send({email});
    });

    /*
     Get updated wordsCloud data
     */

    app.get('/overall', isLoggedIn, function (req, res) {
        var analysisResult;
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            var analysis = monk.get(collections.userCompleteAnalysis);
            analysis.find({}, {stream: true})
                .each(function (item) {
                    //console.log(item.email + "  :  " + req.user.facebook.email)
                    if (typeof item !== 'undefined' && item.email == email) {
                        analysisResult = item;
                    }
                })
                .error(function () {
                    res.send({
                        data: [{
                            "_id": '',
                            "email": "",
                            "analysis": {
                                "usedWords": [{"word": ""}],
                                "likesByPerson": [{
                                    "id": "",
                                    "name": "",
                                    "count": 0,
                                    "profileLink": "",
                                    "profilePhoto": ""
                                }],
                                "bestElement": {
                                    "likesCount": 0,
                                    "post": {
                                        "id": "",
                                        "created_time": "",
                                        "from": {"name": "", "id": ""},
                                        "height": 0,
                                        "icon": "",
                                        "images": [{"height": 0, "source": "", "whidth": 0}],
                                        "link": "",
                                        "name": "",
                                        "picture": "",
                                        "source": "",
                                        "updated-time": "",
                                        "width": 0,
                                        "tags": {
                                            data: [{"id": "", "name": "", "created_time": "", "x": 0, "y": 0}],
                                            "paging": {"cursor": {"before": "", "after": ""}}
                                        },
                                        "comments": {
                                            "data": [{
                                                "created_time": "",
                                                "from": {"name": "", "id": ""},
                                                "message": "",
                                                "can_remove": false,
                                                "like_count": 0,
                                                "user_like": false,
                                                "id": ""
                                            }], "paging": {"cursor": {"before": "", "after": ""}}
                                        },
                                        "likes": [{"id": "", "name": ""}]
                                    }
                                },
                                "likesCount": 0,
                                "periodGroupedLikes": {"2016-01": 0},
                                "hourGroupedLikes": {"0": 0}
                            }
                        }]
                    });
                })
                .success(function () {
                    res.send({
                        data: analysisResult
                    });
                });
        }
        else {
            res.redirect('/login/terms');
        }
    });

    app.get('/wordsCloud', isLoggedIn, function (req, res) {
        var analysisResult;
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            var analysis = monk.get(collections.userCompleteAnalysis);
            analysis.find({}, {stream: true})
                .each(function (item) {
                    if (typeof item.analysis !== 'undefined' && item.email == email) {
                        analysisResult = item.analysis.usedWords;
                    }
                })
                .error(function () {
                    res.send({data: [{word: '', count: 0}]});
                })
                .success(function () {
                    res.send({
                        data: analysisResult
                    });
                });
        }
        else {
            res.redirect('/login/terms');
        }
    });

    app.get('/getTotalAnalysisData', isLoggedIn, function (req, res) {
        var analysisResult;
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            var analysis = monk.get(collections.userCompleteAnalysis);
            analysis.find({}, {stream: true})
                .each(function (item) {
                    //console.log(item.email + "  :  " + req.user.facebook.email)
                    if (typeof item.analysis !== 'undefined' && item.email == email) {
                        analysisResult = item.analysis;
                    }
                })
                .error(function () {
                    res.send({data: {'': 0}});
                })
                .success(function () {
                    res.send({
                        data: analysisResult
                    });
                });
        }
        else {
            res.redirect('/login/terms');
        }
    });

    app.get('/getFeedsAnalysisData', isLoggedIn, function (req, res) {
        var analysisResult;
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            var analysis = monk.get(collections.userPostAnalysis);
            analysis.find({}, {stream: true})
                .each(function (item) {
                    //console.log(item.email + "  :  " + req.user.facebook.email)
                    if (typeof item.analysis !== 'undefined' && item.email == email) {
                        analysisResult = item.analysis;
                    }
                })
                .error(function () {
                    res.send({data: {'': 0}});
                })
                .success(function () {
                    res.send({
                        data: analysisResult
                    });
                });
        }
        else {
            res.redirect('/login/terms');
        }
    });

    app.get('/getUploadedAnalysisData', isLoggedIn, function (req, res) {
        var analysisResult;
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            var analysis = monk.get(collections.userUploadedAnalysis);
            analysis.find({}, {stream: true})
                .each(function (item) {
                    //console.log(item.email + "  :  " + req.user.facebook.email)
                    if (typeof item.analysis !== 'undefined' && item.email == email) {
                        analysisResult = item.analysis;
                    }
                })
                .error(function () {
                    res.send({data: {'': 0}});
                })
                .success(function () {
                    res.send({
                        data: analysisResult
                    });
                });
        }
        else {
            res.redirect('/login/terms');
        }
    });

    app.get('/getTaggedAnalysisData', isLoggedIn, function (req, res) {
        var analysisResult;
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            var analysis = monk.get(collections.userTaggedAnalysis);
            analysis.find({}, {stream: true})
                .each(function (item) {
                    //console.log(item.email + "  :  " + req.user.facebook.email)
                    if (typeof item.analysis !== 'undefined' && item.email == email) {
                        analysisResult = item.analysis;
                    }
                })
                .error(function () {
                    res.send({data: {'': 0}});
                })
                .success(function () {
                    res.send({
                        data: analysisResult
                    });
                });
        }
        else {
            res.redirect('/login/terms');
        }
    });

    /////////////////////////////////////////////
    ///////////////// Analysis //////////////////
    /////////////////////////////////////////////

    /*
     Return users data
     */
    app.get('/userStats', function (req, res) {
        var userArray = [];
        /*
         Using monk because fires a success event on query complete
         */
        var users = monk.get(collections.users);
        users.find({}, {stream: true})
            .each(function (user) {
                if (typeof user.facebook !== 'undefined') {
                    /*
                     [id , name , email , lastAnalysis , analysisCount , button , button];
                     */
                    let email = user.facebook.email;
                    userArray.push([user.facebook.id, user.facebook.name, email, Session.lastAnalysis(email), Session.analysisCount(email), 'Analyze', 'Clear']);
                }
            })
            .error(function (err) {
                res.send(err);
            })
            .success(function () {
                res.send({data: userArray});

            });

    });

    app.get('/analyzing', function (req, res) {
        res.render('waiting.ejs');
    });
    /*
     Analyze email idenfied user, if necessary (defined by policy)
     */
    app.get('/analyzeUser/:email', isLoggedIn, function (req, res) {
        /*
         * Params mapping on local variables
         */
        var email = req.params.email;
        var token = "CAACEdEose0cBAGZCqfHwnWWzoZAP6uK0zGVIxH0xPTF0ESYVrrdr95i9s3JsAoDD12pCG6ZAEnXa1XXSVOzQUzyLq4UgkIhWcprP2NCH4kJ8OLYdQcMGwVpO7VhyyudnZCRWDz7e1gZCkZBsQyeZADOy6mJKI5cjn2DkSf85GfWH3bpJ1WSyZAC5qybbZAMIiOb8oIVZBANQR8ZCQZDZD";
        res.send({email});
        var lastAnalysis = Session.lastAnalysis(email);
        /*
         Delta , expressed in ms, between last analysis and now
         */
        var ms = moment.duration(moment.utc(moment(moment(), "DD/MM/YYYY HH:mm:ss").diff(moment(lastAnalysis, "DD/MM/YYYY HH:mm:ss"))).format("HH:mm:ss"));
        if (ms == 0 || (ms / 1000 / 60) > Session.betweenAnalysisTime) {
            console.log(email, token);
            console.log("I'm going to analyze");
            analyzer.analyzeUser(email, token);
        }
        else {
            console.log(" cannot do the analysis");
        }
    });

    /*
     Analyze current user, if necessary (defined by policy)
     */
    app.get('/analyzeUser', isLoggedIn, function (req, res) {
        res.redirect('/analyzeUser/' + req.user.facebook.email);
    });

    /*
     Force an analysis for email identified user (only for admins)
     */
    app.get('/forceAnalysis/:email', isAdmin, function (req, res) {
        var email = req.params.email;
        var token = req.user.facebook.token;
        res.send("Forced analysis started");
        analyzer.analyzeUser(email, token);
    });

    app.get('/overall', isLoggedIn, function (req, res) {
        var analysisResult;
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            var analysis = monk.get(collections.userCompleteAnalysis);
            analysis.find({}, {stream: true})
                .each(function (item) {
                    //console.log(item.email + "  :  " + req.user.facebook.email)
                    if (typeof item !== 'undefined' && item.email == email) {
                        analysisResult = item;
                    }
                })
                .error(function (err) {
                    console.log(err);
                    res.send({
                        data: [{
                            "_id": '',
                            "email": "",
                            "analysis": {
                                "usedWords": [{"word": ""}],
                                "likesByPerson": [{
                                    "id": "",
                                    "name": "",
                                    "count": 0,
                                    "profileLink": "",
                                    "profilePhoto": ""
                                }],
                                "bestElement": {
                                    "likesCount": 0,
                                    "post": {
                                        "id": "",
                                        "created_time": "",
                                        "from": {"name": "", "id": ""},
                                        "height": 0,
                                        "icon": "",
                                        "images": [{"height": 0, "source": "", "whidth": 0}],
                                        "link": "",
                                        "name": "",
                                        "picture": "",
                                        "source": "",
                                        "updated-time": "",
                                        "width": 0,
                                        "tags": {
                                            data: [{"id": "", "name": "", "created_time": "", "x": 0, "y": 0}],
                                            "paging": {"cursor": {"before": "", "after": ""}}
                                        },
                                        "comments": {
                                            "data": [{
                                                "created_time": "",
                                                "from": {"name": "", "id": ""},
                                                "message": "",
                                                "can_remove": false,
                                                "like_count": 0,
                                                "user_like": false,
                                                "id": ""
                                            }], "paging": {"cursor": {"before": "", "after": ""}}
                                        },
                                        "likes": [{"id": "", "name": ""}]
                                    }
                                },
                                "likesCount": 0,
                                "periodGroupedLikes": {"2016-01": 0},
                                "hourGroupedLikes": {"0": 0}
                            }
                        }]
                    });
                })
                .success(function () {
                    res.send({
                        data: analysisResult
                    });
                });
        }
        else {
            res.redirect('/login/terms');
        }
    });


    /////////////////////////////////////////////
    /////////////// Authentication //////////////
    /////////////////////////////////////////////

    /*
     Admin login form
     */
    app.get('/admin/login', function (req, res) {
        res.render('admin_login.ejs', {message: req.flash('loginMessage')});
    });

    /*
     Admin login post
     */
    app.post('/admin/login', passport.authenticate('local-login', {

        successRedirect: '/admin', // redirect to the secure profile section
        failureRedirect: '/admin/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    /*
     Login, for admin and normal users
     */
    app.get('/logout', function (req, res) {
        req.logout();
        res.render('index.ejs', {message: "Logged out successfully"});
    });

    /*
     Admin sign-up form
     */
    app.get('/admin/signup', function (req, res) {
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    /*
     Admin sign-up post
     */
    app.post('/admin/signup', passport.authenticate('local-signup', {
        successRedirect: '/admin', // redirect to the secure admin section
        failureRedirect: '/admin/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    /*
     Facebook login (send to facebook to do the authentication)
     */
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email', 'user_about_me', 'user_photos', 'user_friends', 'user_likes', 'user_posts']}));

    /*
     Handles facebook callback
     */
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    /////////////////////////////////////////////
    //////////// Account LINKING //////////////
    /////////////////////////////////////////////

    // locally --------------------------------
    app.get('/connect/local', function (req, res) {
        res.render('connect-local.ejs', {message: req.flash('loginMessage')});
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/admin', // redirect to the secure profile section
        failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', {scope: 'email'}));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
        passport.authorize('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));


    /////////////////////////////////////////////
    //////////// Account UNLINKING //////////////
    /////////////////////////////////////////////
    /*
     * used to unlink accounts. for social accounts, just remove the token
     * for local account, remove email and password
     *user account will stay active in case they want to reconnect in the future
     */

    /*
     Unlink local accounts
     */
    app.get('/unlink/local', isLoggedIn, function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/admin');
        });
    });

    /*
     Unlink facebook accounts
     */
    app.get('/unlink/facebook', isLoggedIn, function (req, res) {
        var user = req.user;
        user.facebook.token = undefined;
        user.save(function (err) {
            res.redirect('/admin');
        });
    });

    /////////////////////////////////////////////
    //////////// Utility functions //////////////
    /////////////////////////////////////////////

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        // If the User is not logged in i redirect him on the homepage
        res.redirect('/');
    }

    function isAdmin(req, res, next) {
        if (typeof req.user !== 'undefined' && typeof req.user.local !== 'undefined' && typeof req.user.local.email !== 'undefined') {// HE is an admin
            return next();
        }
        else {
            res.redirect('/');
        }
    }

};