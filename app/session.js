/**
 * Created by lambrosini on 23/12/15.
 */
var moment = require('moment');

var sessions = {};


var Sessions = {

    'betweenAnalysisTime': 5,
    StatesEnum: {
        STARTED: 0,
        FEEDDOWNLOAD: 1,
        UPLOADEDDOWNLOAD: 2,
        TAGGEDDOWNLOAD: 3,
        FEEDANALYSIS: 4,
        UPLOADEDANALYSIS: 5,
        TAGGEDANALYSIS: 6,
        TOTALANALYSIS: 7,
        COMPLETED: 8,
        NOTHING: 9,
        ERROR: -1
    },
    getState: function (email) {
        if (typeof sessions[email] === 'undefined' || typeof sessions[email].state === 'undefined') {
            return Sessions.StatesEnum.NOTHING;
        }
        else
            return sessions[email].state;
    },
    updateState: function (email, state) {
        if (typeof sessions[email] === 'undefined')
            sessions[email] = {};
        return sessions[email].state = state;
    },
    analysisCompleted: function (email) {
        if (typeof sessions[email] === 'undefined')
            sessions[email] = {};
        if (typeof sessions[email].count === 'undefined')
            sessions[email].count = 1;
        sessions[email].count++;
        return sessions[email].lastUpdate = moment();
    },
    analysisCount: function (email) {
        if (typeof sessions[email] === 'undefined')
            sessions[email] = {};
        if (typeof sessions[email].count === 'undefined')
            return 1;
        return sessions[email].count;
    },
    lastAnalysis: function (email) {
        if (typeof sessions[email] === 'undefined')
            return moment();
        if (typeof sessions[email].lastUpdate === 'undefined')
            return moment();
        return sessions[email].lastUpdate;
    },
    acceptTerms: function (email) {
        if (typeof sessions[email] === 'undefined')
            sessions[email] = {};
        sessions[email].terms = true;
    },
    hasAcceptedTerms: function (email) {
        if (typeof sessions[email] === 'undefined')
            return false;
        if (typeof sessions[email].terms === 'undefined')
            return false;
        return sessions[email].terms;
    }

};

module.exports = Sessions;
