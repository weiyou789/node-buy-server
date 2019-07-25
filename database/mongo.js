const mongoose = require('mongoose');
const config = require('../config');
mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUrl,config.opts,(err)=>{
    if(err) console.error('mongoose.connect ',err);
})


module.exports = mongoose;