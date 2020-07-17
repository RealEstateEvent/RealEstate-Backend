var mongoose = require('mongoose');
const config = require('./config/vars');
const prompt = require('prompt-sync')({ sigint: true });
const { userModel } = require('./models/user');
var mongoDB = config.mongoDB;


if (!process.env.NODE_ENV) {
    console.log("development");
    mongoose.connect(mongoDB, { useUnifiedTopology: true, useNewUrlParser: true });
} else {
    console.log("production");
    mongoose.connect(mongoDB, { useUnifiedTopology: true, useNewUrlParser: true });
}

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', () => {

    console.log("connection successful! \n\n");

    console.log("*******Enter Data to create Admin********\n\n")

    let firstName = prompt('Please enter your first name : ');
    let lastName = prompt('Please enter your last name : ');
    let email = prompt('Please enter your email : ');
    let password = prompt('Please enter your password : ');
    let usertype = 1;

    userModel.findOne({ email: email }, (err, user) => {
        if (err) {
            console.log("error: ", err);
        } else if (user) {
            console.log("\n**************************************************************************\n");
            console.log("Admin is already created with this email id. Try again with different email id.");
            console.log("\n**************************************************************************\n");
            process.exit();
        } else {
            let user = new userModel();
            user.firstName = firstName;
            user.lastName = lastName;
            user.email = email;
            user.userType = usertype;
            user.password = password;
            user.save(function (err, user) {
                if (err) return console.error(err);
                console.log("\n**************************************************************************\n");
                console.log("You are registered successfully.");
                console.log("\n**************************************************************************\n");

                process.exit();
            });
        }
    });
});