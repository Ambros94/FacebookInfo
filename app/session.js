/**
 * Created by lambrosini on 23/12/15.
 */
var sessions= {};

var Sessions = {
    getState: function (email) {
        if (typeof sessions[email]==='undefined'){
            return "No analysis";
        }
        else
            return sessions[email].state;
    },
    updateState: function(email,state){
        if (typeof sessions[email]==='undefined')
            sessions[email]={};
        return sessions[email].state=state;
    }

};

module.exports = Sessions;
