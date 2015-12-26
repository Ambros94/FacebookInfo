"use strict";
var fb = require('../facebook/crawler');
var db = require('./QueryManager');
var analyzer = require('../facebook/analyzer');
var Session = require('./session');

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
            res.render('profile.ejs', {
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
        console.log(Session.hasAcceptedTerms(req.user.facebook.email));
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

    /////////////////////////////////////////////
    ///////////////// Analysis //////////////////
    /////////////////////////////////////////////

    /*
     Return users data
     */
    app.get('/userStats', function (req, res) {//TODO PROTEGGERE COME ADMIN
        res.send('{"data":[ [  "Id","Name", "mail","Last analysis", "Analysis count",  "Ban", "elete data"] ]}');
    });

    /*
     Analyze email idenfied user, if necessary (defined by policy)
     */
    app.get('/analyzeUser/:email', isLoggedIn, function (req, res) {
        /*
         * Params mapping on local variables
         */
        var email = req.params.email;
        res.send({email});
        if (Session.lastAnalysis() - new Date() > 10) {
            //TODO Fare analisi
            Session.analysisCompleted(email);
        }
        //TODO CHECK IF THE ANALYSIS HAS TO BE DONE AND THEN REDIRECT TO THE RIGHT PAGE
    });

    /*
     Analyze current user, if necessary (defined by policy)
     */
    app.get('/analyzeUser', isLoggedIn, function (req, res) {
        res.redirect('/analyzeUser/' + req.user.facebook.email);
    });

    /*
     Force an analysis for email idenfied user (only for admins)
     */
    app.get('/analyzeUser/:email', isLoggedIn, function (req, res) {
        var email = req.params.email;
        if (Session.lastAnalysis() - new Date() > 10) {
            //TODO Fare analisi
            Session.analysisCompleted(email);
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
        if (typeof req.user === 'undefined' || typeof req.user.local === 'undefined')
            res.redirect('/');
        else
            return next();
    }

};