const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config/vars');

var authSchema = new mongoose.Schema({
    user_id:{                                       //id of user registered
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        trim:true,
    },
    email:{                                         //email
        type: String,
        required: true,
        trim: true,
    },
    time:{                                           //time
        type: Date,
        expires: '30d',
        required: true
    },
    userType: {                                      //type of user(i.e. attendee, admin, organizer, sponser)
        type: Number
    }
});

authSchema.methods.generateAuthToken = async function() {
    try{
        console.log('Executing model/auth/generateAuthToken');
        var authEntry = {user_id: this['user_id'], email: this['email'], time:this['time'], userType: this['userType']};
        var access = 'auth';
        var token = await jwt.sign({authEntry : authEntry, access}, config.REC['AUTH_SECRET'], { expiresIn : config.REC['AUTH_EXPIRE_TIME']}).toString(); //token will expire in 30 days
        // var token = await jwt.sign({authEntry : authEntry, access}, config.REC['AUTH_SECRET']).toString();
        return token;
    }
    catch(err){
        console.log(`Error while executing generateAuthToken!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

verifyAuthToken = async function(token) {
    try{
        console.log('Executing model/auth/verifyAuthToken');
        return await jwt.verify(token.toString(), config.REC['AUTH_SECRET']);
    }
    catch(err){
        console.log(`Error while executing verifyAuthToken!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        return {error: {message:'Token is invalid or expired', code:401}};
    }
}

authSchema.statics.setAuthEntry = async function(authEntry){
    try{
        console.log('Executing model/auth/createAuthEntry');
        var authEntry = await authModel.create(authEntry);
        if(!authEntry)
            throw {error: 'Error creating authEntry', code:400};
            // throw new Error('Error creating authEntry');
        return authEntry;
    }catch(err){
        console.log(`Error while executing createAuthEntry!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

authSchema.statics.removeAuthEntry = async function(authEntry){
    try{
        console.log('Executing model/auth/removeAuthEntry');
        var condition = {email:authEntry['email'], time:authEntry['time']};
        var removedEntry = await authModel.findOneAndDelete(condition);
        if(!removedEntry)
            throw {error: 'Token is invalid or expired', code:401};
            // throw new Error('Token is invalid or expired!');
        return removedEntry;
    }catch(err){
        console.log(`Error while executing removeAuthEntry!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

authSchema.statics.getAuthEntry = async function(decoded){
    try{
        console.log('Executing model/auth/getAuthEntry');
        var authEntry = await authModel.findOne(decoded['authEntry']);
        if(!authEntry)
            throw {error: 'Token is invalid or expired!', code:401};;
            // throw new Error('Token is invalid or expired! Please login again!');
        return authEntry;
    }catch(err){
        console.log(`Error while executing getAuthEntry!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

var authModel = mongoose.model('auth',authSchema);

module.exports = {authModel, verifyAuthToken};