"use strict";
var fb = require('../facebook/crawler');
var db = require('./QueryManager');
var analyzer = require('../facebook/analyzer');
var Session = require('./session');

module.exports = function (app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function (req, res) {
        res.render('index.ejs');
    });
    ///////////////////////////
    // Terms and conditions //
    ///////////////////////////
    app.get('/login/terms', function (req, res) {
        res.render('terms_conditions.ejs', {});
    });
    app.get('/terms_accepted', function (req, res) {
        Session.acceptTerms(req.user.facebook.email);
        console.log(Session.hasAcceptedTerms(req.user.facebook.email));
        res.redirect('/profile');
    });

    // ADMIN PAGE =========================
    app.get('/admin', function (req, res) {
        res.render('admin.ejs', {});
    });

    /*
     Interations with state
     */
    app.get('/getState', isLoggedIn, function (req, res) {
        var email = req.user.facebook.email;
        var state = Session.getState(email);
        res.send({state});
    });
    app.get('/getState/:email', isLoggedIn, function (req, res) {
        /*
         * Params mapping on local variables
         */
        var email = req.params.email;
        var state = Session.getState(email);
        res.send({state});
    });
    /*
     Analyze user
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

    app.get('/analyzeUser', isLoggedIn, function (req, res) {
        res.redirect('/analyzeUser/' + req.user.facebook.email);
    });

    // PROFILE SECTION =========================
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

    // LOGOUT ==============================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/admin/login', function (req, res) {
        res.render('admin_login.ejs', {message: req.flash('loginMessage')});
    });
    // Locally autenticate the admin
    app.post('/admin/login', passport.authenticate('local-login', {
        successRedirect: '/admin', // redirect to the secure profile section
        failureRedirect: '/admin/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));


// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

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


// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function (req, res) {
        var user = req.user;
        user.facebook.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });


// route middleware to ensure user is logged in
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        // If the User is not logged in i redirect him on the homepage
        res.redirect('/');
    }
}