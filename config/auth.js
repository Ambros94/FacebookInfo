// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '446288818863633', // your App ID
        'clientSecret'    : '9adf8faef8ff9927d0e2d47e6ca3e775', // your App Secret
        'callbackURL'     : 'http://localhost:8080/auth/facebook/callback'
    }

};
