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

    console.log("*******Enter Data to update Admin********\n\n")

    let email = prompt('Please enter your email : ');



    userModel.findOne({ email: email }, (err, user) => {
        if (err) {
            console.log("error: ", err);
        } else if (user) {
            let firstName = prompt('To update the First Name enter value or press enter to skip : ');
            let lastName = prompt('To update the Last Name enter value or press enter to skip : ');
            let password = prompt('To update the Password enter value or press enter skip : ');

            if(firstName) {
                user.firstName = firstName;
            }

            if(lastName) {
                user.lastName = lastName;
            }

            if(password) {
                user.password = password;
            }

            user.save(function (err, user) {
                if (err) return console.error(err);
                console.log("\n**************************************************************************\n");
                console.log("Your data is updated successfully. \n", user);
                console.log("\n**************************************************************************\n");

                process.exit();
            });
        } else {
            console.log("\n**************************************************************************\n");
            console.log("You are not registered yet.");
            console.log("\n**************************************************************************\n");

            process.exit();
        }
    });
});