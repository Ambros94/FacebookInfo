/**
 * Created by lambrosini on 23/12/15.
 */
var sessions = {};

var Sessions = {
    getState: function (email) {
        if (typeof sessions[email] === 'undefined') {
            return "No analysis";
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
        return sessions[email].lastUpdate = new Date();
    },
    lastAnalysis: function (email) {
        if (typeof sessions[email] === 'undefined')
            return new Date('2011-12-12');
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
