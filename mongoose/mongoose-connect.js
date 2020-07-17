const config = require('./../config/vars.js');
var mongoose = require('mongoose');
var mongoDB = config.mongoDB;

mongoose.connect(mongoDB, {
    useNewUrlParser:true, 
    useUnifiedTopology: true, 
    useFindAndModify: false , 
    useCreateIndex: true})
    .then(()=>{
    console.log('Connected to database!');
},(err)=>{
    console.log('Error connecting to database \n');
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = {mongoose};