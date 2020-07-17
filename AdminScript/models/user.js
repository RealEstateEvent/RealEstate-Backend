const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/vars');

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    userType: {
        type: Number
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    role: {
        type: String
    },
    profilePic: {
        type: String
    },
    profilePicThumb: {
        type: String
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    }
});

userSchema.pre('save', async function (next) {
    try {
        console.log('Executing model/user/userSchema.pre');
        var user = this;
        if (user.isModified('password')) {
            //12rounds of hashing will happen
            var salt = await bcrypt.genSalt(config.HASH_ROUNDS);
            var hash = await bcrypt.hash(user.password, salt);
            user.password = hash;
            next();
        }
        else {
            next();
        }
    } catch (err) {
        console.log(`Error while executing userSchema.pre!`);
        console.log(err);
        return { error: err };
    }
});

userSchema.statics.setUser = async function (user) {
    try {
        console.log('Executing model/user/setUser');
        return await userModel.create(user);
    } catch (err) {
        console.log(`Error while executing setUser!`);
        console.log(err);
        return { error: err };
    }
}

var userModel = mongoose.model('user', userSchema);

module.exports = { userModel };