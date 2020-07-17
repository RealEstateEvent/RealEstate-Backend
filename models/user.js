const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/vars');
const _ = require('lodash');

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    userType: {                             //type of user(i.e. attendee, admin, organizer, sponser)
        type: Number,
        required:true
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
    description: {
        type: String
    },
    profilePic: {
        type: String
    },
    profilePicThumb: {
        type: String
    },
    isEmailVerified: {                       //flag denotes if email is confirmed or not
        type: Boolean,
        default: false
    },
    isProfileSetup: {                        //flag denotes if profile has been setup or not
        type: Boolean,
        default: false
    }
});

var default_projection = {
    _id: 0,
    password: 0,
    __v: 0,
    my_events: 0
};

var returnUserModel = {
    _id: null, email:null, userType:null, firstName:null, 
    lastName:null, role:null, description:null, 
    profilePic:null, isEmailVerified:null, isProfileSetup:null,
    profilePicThumb:null
};

userSchema.pre('save', async function (next) {
    try {
        console.log('Executing model/user/userSchema.pre');
        var user = this;
        if (user.isModified('password')) {
            //12rounds of hashing will happen
            var salt = await bcrypt.genSalt(config.HASH_ROUNDS);
            var hash = await bcrypt.hash(user['password'], salt);
            user.password = hash;
            next();
        }
        else {
            next();
        }
    } catch (err) {
        console.log(`Error while executing userSchema.pre!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
});

userSchema.statics.getProfile = async function (condition, project) {
    try {
        console.log('Executing model/user/getProfile');
        
        var projection = project || default_projection;
        var user = await userModel.findOne(condition, projection);
        if(!user)
            throw {error:'No such user present', code:404}
            // throw new Error('No such user present');
        // user = await userMapper(user);
        return user;
    } catch (err) {
        console.log(`Error while executing model/getProfile!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
};

userSchema.statics.updateProfile = async function (condition, obj, project) {
    try {
        console.log('Executing model/user/updateProfile');

        var projection = project || default_projection;
        var user = await userModel.findOneAndUpdate(condition,
            {
                $set: obj
            },
            {
                projection,
                new: true
            });
        if (!user)
        throw {error:'Error updating user profile', code:400}
        // throw new Error('Error updating user profile');
        // user = await userMapper(user);
        return user;
    } catch (err) {
        console.log(`Error while updating user profile!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
};

userSchema.statics.setUser = async function (user) {
    try {
        console.log('Executing model/user/setUser');
        var user = await userModel.create(user);
        // user = await userMapper(user);
        return user;
    } catch (err) {
        console.log(`Error while executing setUser!`);
        console.log(err)
        if(err['code'] == 11000)
            return {error:{message:'This email is already registered', code:409}};
        return {error: {message:err['message'], code:400}};
    }
}

userSchema.statics.findByCredentials = async function (email, password) {
    try {
        console.log('Executing model/user/findByCredentials');
        var userModel = this;
        var user = await userModel.findOne({ email: email });
        if (!user)
            throw {error: 'Email not found', code: 401}
        console.log(user);
        var plain = password;
        var hashed = user['password'];
        var result = await bcrypt.compare(plain, hashed);
        if (!result) 
            throw {error: 'Password not matched', code: 401}

        // user = await userMapper(user);
        user = await _.pick(user, _.keys(returnUserModel));
        return user;
    } catch (err) {
        console.log(`Error while executing findByCredentials!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

userSchema.statics.confirmMailAndgenerateToken = async function (email) {
    try {
        console.log('Executing model/user/confirmMailAndgenerateToken');
        var user = await userModel.findOne({ email: email });
        if (!user)
            throw {error: 'Email not found!', code:400};
        var token = await jwt.sign({ email: email }, config.REC['PWD_SECRET'], { expiresIn: config.REC['PWD_EXPIRE_TIME'] }).toString(); //token will expire in 3 hours
        return token;
    } catch (err) {
        console.log(`Error while executing confirmMailAndgenerateToken!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

userSchema.statics.verifyTokenAndResetPassword = async function (token, password) {
    try {
        console.log('Executing model/user/verifyTokenAndResetPassword');
        var decoded = await jwt.verify(token.toString(), config.REC['PWD_SECRET']);
        var email = decoded['email'];
        var salt = await bcrypt.genSalt(config.HASH_ROUNDS);
        var hash = await bcrypt.hash(password, salt);
        pass = hash;
        var user = await userModel.findOneAndUpdate({ email: email },
            {
                $set: {
                    "password": hash
                }
            });
        if (!user)
            throw {error: 'Token is invalid or expired', code: 400};
        return user;
    } catch (err) {
        console.log('Error while executing verifyTokenAndResetPassword!');
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        // if(!err['error'])
        //     return {error: {message:err['message'], code:400}};
        return {error: {message:'Token is invalid or expired!', code:401}};
    }
};

userSchema.statics.changeEmlVerifiedStatus = async function (email) {
    try {
        console.log('Executing model/user/changeEmlVerifiedStatus');
        var user = await userModel.findOneAndUpdate({ email: email },
            {
                $set: {
                    isEmailVerified: true
                }
            });
        if (!user)
            throw {error: 'Error updating status!', code:400};
        return user;
    } catch (err) {
        console.log('Error while executing verifyEmailAndChangeStatus!');
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
};

userSchema.statics.bookEvent = async function(email, event_id, project) {
    try {
        console.log('Executing model/user/bookEvent');
        console.log(email);
        console.log(event_id);
        var check = await userModel.exists({my_events:event_id});
        if(check)
            throw {error: 'Event already booked!', code: 400};
        
        var projection = project || default_projection;
        var user = await userModel.findOneAndUpdate({email: email}, {
            // $push: {
            $addToSet: {
                my_events:event_id
            }
        },{
            projection,
            new: true
        });
        if (!user)
            throw {error: 'Error booking event', code:400};
        return user;
    } catch (err) {
        console.log('Error while executing bookEvent!');
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

var userModel = mongoose.model('user', userSchema);

module.exports = { userModel };