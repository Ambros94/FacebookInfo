// load the things we need
var mongoose = require('mongoose');
console.log(mongoose);
// define the schema for our user model
var stateSchema = mongoose.Schema({

    email: String,
    state: String,
    last_update: Date

});

// create the model for users and expose it to our app
var Session = mongoose.model('Sessions', stateSchema);
module.exports = Session;
