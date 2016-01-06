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
        /*
         Check if the authenticated user has accepted terms & conditions
         */
        let email = req.user.facebook.email;
        if (Session.hasAcceptedTerms(email)) {
            res.render('admin.ejs', {
                user: req.user
            });
        }
        else {
            res.redirect('/login/terms');
        }

    });

    /////////////////////////////////////////////
    /////////////// Admin Pages /////////////////
    /////////////////////////////////////////////

    app.get('/admin', isAdmin, function (req, res) {
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
        res.redirect('/profile');
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

    /////////////////////////////////////////////
    ///////////////// Analysis //////////////////
    /////////////////////////////////////////////

    /*
     Return users data
     */
    app.get('/userStats', function (req, res) {
        var userArray = [];
        //Todo, far fare al modulo delle query
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

    /*
     Analyze email idenfied user, if necessary (defined by policy)
     */
    app.get('/analyzeUser/:email', isLoggedIn, function (req, res) {
        /*
         * Params mapping on local variables
         */
        var email = req.params.email;
        var token = req.user.facebook.token;
        res.send({email});
        var lastAnalysis = Session.lastAnalysis(email);
        /*
         Delta , expressed in ms, between last analysis and now
         */
        var ms = moment.duration(moment.utc(moment(moment(), "DD/MM/YYYY HH:mm:ss").diff(moment(lastAnalysis, "DD/MM/YYYY HH:mm:ss"))).format("HH:mm:ss"));
        if (ms == 0 || (ms / 1000 / 60) > Session.betweenAnalysisTime) {
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
        res.redirect('/');
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
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

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
        successRedirect: '/profile', // redirect to the secure profile section
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
            res.redirect('/profile');
        });
    });

    /*
     Unlink facebook accounts
     */
    app.get('/unlink/facebook', isLoggedIn, function (req, res) {
        var user = req.user;
        user.facebook.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
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
            console.log("He is an admin", req.user.local.email);
            return next();
        }
        else {
            res.redirect('/');
        }
    }

};