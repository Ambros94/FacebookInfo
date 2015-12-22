"use strict";
var fb = require('../facebook/crawler');
var db = require('./QueryManager');
var analyzer = require('../facebook/analyzer');

module.exports = function (app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function (req, res) {

            /*
             On login it stores user info
             */
            var token = req.user.facebook.token;
            var email = req.user.facebook.email;
            if (token) {
                fb.init(token);
                var state = "";//TODO SALVARE NELLA SESSIONE
                state = "Post downloading";
                fb.getPosts().then(function (result) {
                    /*
                     Store the feed
                     */
                    return db.storeUserFeed(email, result);
                }).then(function () {

                    state = "Uploaded photos downloading";
                    /*
                     Get uploaded photos
                     */
                    return fb.getPhotos('uploaded');
                }).then(function (result) {
                    /*
                     Store uploaded photos
                     */
                    return db.storeUserUploadedPhotos(email, result);
                }).then(function () {
                    state = "Tagged photos downloading";
                    /*
                     Get tagged photos
                     */
                    return fb.getPhotos('tagged');
                }).then(function (result) {
                    /*
                     Store tagged photos
                     */
                    return db.storeUserTaggedPhotos(email, result)
                }).then(function () {
                    state = "Looking at your posts!";
                    /*
                     Feed analysis
                     */
                    return analyzer.analyzePosts(email);
                }).then(function () {
                    state = "Looking at photos where u are tagged!";
                    /*
                     Tagged photos analysis
                     */
                    return analyzer.analyzeTaggedPhotos(email);
                }).then(function () {
                    state = "Looking at your photos!";
                    /*
                     Uploaded photo analysis
                     */
                    return analyzer.analyzeUploadedPhotos(email);
                }).then(function () {
                    state = "Analysis completed!";
                }).catch(function (err) {
                    console.log("Error during downloading or analiyis", err);
                });


                res.render('profile.ejs', {
                    user: req.user
                });

            }
        }
    );

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
    app.get('/login', function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
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