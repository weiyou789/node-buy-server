const mongoose = require('../database/mongo');

const Schema = mongoose.Schema;

const testSchema = new Schema({
    userId:String
});


const Test = mongoose.model('test',testSchema);

module.exports = Test;