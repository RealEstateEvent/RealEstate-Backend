const { userModel } = require('../../models/user');
const { authModel } = require('../../models/auth');
const { otpModel } = require('../../models/otp');
const _ = require('lodash');
const config = require('../../config/vars.js');
const fs = require('fs');
const { sendMail, generateOTP, sendResponse, generateThumb, deleteImage } = require('./../../util/util');
const jwt = require('jsonwebtoken');

var signup = async (req, res) => {
    try {
        console.log('\n---------------user/controller/signup---------------\n');
        console.log('User is signing up');
        console.log('User details entered :-\n', req['body']);
        if (_.isEmpty(req['body']))
            throw {error: new Error('Request body cannot be empty'), code:400};

        if(!req.body['email'] || !req.body['password'] || !req.body['userType'])
            throw {error: new Error('Incomplete data, check Email, Password and UserType!'), code:400};

        var user = { email: req.body['email'], password: req.body['password'], userType: config.userType[req.body['userType']] };
        var newUser = await userModel.setUser(user);
        if(newUser['error'])
            throw {error: new Error(newUser.error['message']), code:newUser.error['code']};
        console.log('New User added is :-\n', newUser);

        var authEntry = { user_id: newUser['_id'], email: user['email'], time: new Date(), userType: user['userType'] };
        var newAuth = await authModel.setAuthEntry(authEntry);
        if(newAuth['error'])
            throw {error: new Error(newAuth.error['message']), code:newAuth.error['code']};
            // throw new Error(newAuth['error']);
        console.log('New Auth Entry added is :-\n', newAuth);

        var token = await newAuth.generateAuthToken();
        if(token['error'])
            throw {error: new Error(token.error['message']), code:token.error['code']};
            // throw new Error(token['error']);
        console.log(`Token generated is ${token}`);

        console.log(`User ${newUser['email']} has been registered successfully!`);
        const response = { _id: newUser['_id'], email: newUser['email'], userType: newUser['userType']};
        sendResponse({}, res, 200, 'You are registered successfully!', response, {"x-auth": token}); 
        // res.header('x-auth', token).send({status:200, message:'You are registered successfully!', data:{}});
        const otp = await generateOTP(newUser['email'], 'email');
        return sendConfirmationEmail(user['email'], otp);
    } catch (err) {
        console.log(`Error while signing up user!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!');
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

var login = async (req, res) => {
    try {
        console.log('\n---------------user/controller/login---------------\n');
        console.log('User is logging in');
        console.log('User details entered', req['body']);
        if (_.isEmpty(req['body']))
            throw {error: new Error('Request body cannot be empty'), code:400};

        if(!req.body['email'] || !req.body['password'])
            throw {error: new Error('Incomplete data, check Email or Password!'), code:400};

        var user = await userModel.findByCredentials(req.body['email'], req.body['password']);
        if (user['error'])
            throw {error: new Error(user.error['message']), code:user.error['code']};
            // throw new Error(user['error']);
        console.log('User found is \n', user);

        var authEntry = { user_id: user['_id'], email: user['email'], time: new Date(), userType: user.userType };
        var newAuth = await authModel.setAuthEntry(authEntry);
        if(newAuth['error'])
            throw {error: new Error(newAuth.error['message']), code:newAuth.error['code']};
            // throw new Error(newAuth['error']);
        console.log('New Auth Entry added is :-\n', newAuth);

        var token = await newAuth.generateAuthToken();
        if(token['error'])
            throw {error: new Error(token.error['message']), code:token.error['code']};
            // throw new Error(token['error']);
        console.log(`Token generated is ${token}`);

        // var result = user;
        console.log(`User ${newAuth['email']} has been logged in successfully!`);
        return sendResponse({}, res, 200, 'You are logged in successfully!', user, {"x-auth": token}); 
    } catch (err) {
        console.log(`Error while logging in user!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!');
        return sendResponse({}, res, err['code'], err.error['message']);   
    }
};

var logout = async (req, res) => {
    try {
        console.log('\n---------------user/controller/logout---------------\n');
        console.log('User is Logging out');
        console.log('User in request is (req.user) :-\n', req['user']);
        if (!req['user'])
            throw {error: new Error('Request.user is not present'), code:400};
            // throw new Error('Request.user is not present');

        var removedEntry = await authModel.removeAuthEntry(req['user']);
        if (removedEntry['error'])
            throw {error: new Error(removedEntry.error['message']), code:removedEntry.error['code']};
            // throw new Error(removedEntry['error']);
        console.log('Removed auth entry is :-\n', removedEntry);

        console.log(`User ${removedEntry['email']} has been logged out successfully!`);
        return sendResponse({}, res, 200, 'You have been logged out succesfully!');
    } catch (err) {
        console.log(`Error while logging out user!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!'); 
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

var getProfile = async (req, res) => {
    try{
        console.log('\n---------------user/controller/getProfile---------------\n');
        console.log('User is fetching its details');
        console.log('User in request is (req.user) :-\n', req['user']);
        
        var email = req.user['email'];
        const projection = { password: 0, __v: 0, my_events: 0 };
        var profile = await userModel.getProfile({email: email}, projection);
        if(profile['error'])
            throw {error: new Error(profile.error['message']), code:profile.error['code']};
        console.log('Profile has been fetched :-\n', profile);

        console.log('Profile has been sent!');
        return sendResponse({}, res, 200, 'Profile has been fetched successfully!', profile);
    }catch(err){
        console.log(`Error while logging out user!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!'); 
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

var updateProfile = async (req, res) => {
    try {
        console.log('\n---------------user/controller/updateProfile---------------\n');
        console.log('Updating user profile');
        console.log('User in request is (req.user) :-\n', req['user']);
        if(req.user['userType'] !== 2)
            throw {error: new Error('Only attendee profile can be updated!'), code:403};
            // throw new Error('Only attendee profile can be updated!');
        if (_.isEmpty(req['body']))
            throw {error: new Error('Request body cannot be empty'), code:400};
        var user = req['user'];
        console.log(req.body);

        var profileObj = req['body'];
        profileObj['isProfileSetup'] = true;
        if(req['file']) {
            // var file = (req.file['buffer']).toString('base64');
            var file = req['file'];
            console.log('Profile image is :-\n', file);
            file['path'] = file['path'].replace('\\', '/');
            const appURL = `${req['protocol']}://${req.headers['host']}/`;
            var filePath = `${appURL}${file['path']}`;
            console.log(`appurl is ${appURL}`);
            profileObj['profilePic'] = filePath;
            // var profileObj = { firstName: req.body['firstName'], lastName: req.body['lastName'], profilePic: filePath, role: req.body['role'], description: req.body['description'], isProfileSetup:true};    
            var thumb = await generateThumb(req['file']);
            if(thumb['error'])
                throw {error: new Error(thumb.error['message']), code: thumb.error['code']};
            console.log('Thumbnail saved ', thumb);
            thumb['path'] = `${appURL}${thumb['location']}`;
            profileObj['profilePicThumb'] = thumb['path'];

            //overwritting existing or deleting old images from server
            var profile_imgs = await userModel.getProfile({email: user['email']}, {profilePic: 1, profilePicThumb: 1});
            console.log(profile_imgs);
            if(profile_imgs['profilePic']){
                var profileImg = profile_imgs['profilePic'];
                profileImg = await profileImg.split(appURL)[1];
                var status = await deleteImage(profileImg);
                if(status['error'])
                    console.log(status['error']);
                console.log('Previous profile pic overwritten!')
            }
            if(profile_imgs['profilePicThumb']){
                var profileThumb = profile_imgs['profilePicThumb'];
                profileThumb = await profileThumb.split(appURL)[1];
                var status = await deleteImage(profileThumb);
                if(status['error'])
                    console.log(status['error']['message']);
                console.log('Previous profile pic thumbnail overwritten!')
            }
        }
        
        const projection = { password: 0, __v: 0, my_events: 0 };
        var updatedUser = await userModel.updateProfile({email: user['email']}, profileObj, projection);
        if(updatedUser['error'])
            throw {error: new Error(updatedUser.error['message']), code:updatedUser.error['code']};
            // throw new Error(updatedUser['error']);
            
        console.log('Profile has been updated');
        return sendResponse({}, res, 200, 'Profile has been updated successfully!', updatedUser);
    } catch (err) {
        console.log(`Error while updating user profile!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!'); 
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

var forgetPassword = async (req, res) => {
    try{
        console.log('\n---------------user/controller/forgetPassword---------------\n');
        console.log('User requesting new password');
        var email = req.body['email'];
        var token = await userModel.confirmMailAndgenerateToken(email);
        console.log('Token is ',token);
        if(token['error'])
            throw {error: new Error(token.error['message']), code:token.error['code']};
            // throw new Error(token['error'].toString());

        var mailData = {
            to: email,
            subject: `Change Password`,
            text: `Please click on the link to change password`,
            html: `
            Hello ${email}!,<br>Please Click on the link to change your password.<br>
            <a href="${config.frontendURL}/reset_password/${token}">Click Here</a>`
        }
        var sendStatus = await sendMail(mailData);//change error handeling of this
        if(sendStatus['error'])
            throw {error: new Error('Cannot send mail!'), code:sendStatus.error['code']};
            // throw new Error(sendStatus['error']);
        
        console.log(`Password Reset link has been sent to ${email}`);
        return sendResponse({}, res, 200, 'Password reset link has been sent to your email!');
    }catch(err){
        console.log('Error while implementing forgetPassword!');
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!'); 
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

var resetPassword = async (req, res) => {
    try{
        console.log('\n---------------user/controller/resetPassword---------------\n');
        console.log('User is resetting their password');
        var token = req.params['token'];
        var password = req.body['password']
        var updatedUser = await userModel.verifyTokenAndResetPassword(token,password);
        if(updatedUser['error'])
            throw {error: new Error(updatedUser.error['message']), code:updatedUser.error['code']};
            // throw new Error(updatedUser['error']);
        console.log('Updated user is :-\n', updatedUser);
        
        console.log(`${updatedUser['email']}'s Password has been changed successfully!`)
        return sendResponse({}, res, 200, 'Your Password has been changed successfully!');
    }catch(err){
        console.log(`Error while resetting password!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!'); 
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

var sendConfirmationEmail = async(email, otp) => {
    try{
        console.log('\n---------------user/controller/sendConfirmationEmail---------------\n');
        console.log('Performing user email confirmation');

        var mailData = {
            to: email,
            subject: `Confirm Your Email`,
            text: `Please click on the link to confirm your email`,
            html: `
            Hello ${email},<br>Use this OTP to confirm your email.<br>
            ${otp}`
        }
        var sendStatus = await sendMail(mailData);
        if(sendStatus['error'])
            throw {error: sendStatus.error['message'], code:sendStatus.error['code']};
            // throw new Error(sendStatus['error']);
        
        console.log(`Email confirmation link has been sent to ${email}`);
        return true;
        // res.status(200).send(`Email confirmation link has been sent to your email`);
    }catch(err){
        console.log(`Error while executing initiate emailconfirm!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
};

var completeEmailConfirmation = async(req, res) => {
    try{
        console.log('\n---------------user/controller/confirmEmail---------------\n');
        console.log('Confirming email');
        console.log('User in request is (req.user) :-\n', req['user']);
        if(req.user['userType'] !== 2)
            throw {error: new Error('Only attendee profile can be updated!'), code:403};
            // throw new Error('Only attendee email can be confirmed!');
        if (_.isEmpty(req['body']))
            throw {error: new Error('Request body cannot be empty'), code:400};
            // throw new Error('No otp in request');
        
        var email = req.user['email'];
        var otp = req.body['otp'];
            
        if(!req.body['otp'])
            throw {error: new Error('Incomplete data, check OTP!'), code:400};
        
        var profile = await userModel.getProfile({email: email});
        if(profile['error'])
            throw {error: new Error(profile.error['message']), code:profile.error['code']};
            // throw new Error(profile['error']);
        console.log('Profile has been fetched :-\n', profile);
        if(profile['isEmailVerified']){
            console.log(`${email} has already been confirmed!`);
            return sendResponse({}, res, 200, 'Your email has already been confirmed!');
        }

        var otpDoc = await otpModel.verifyOTP(email, 'email', otp);
        if(otpDoc['error'])
            throw {error: new Error(otpDoc.error['message']), code:otpDoc.error['code']};
            // throw new Error(otpDoc['error']);
        console.log('otp doc is ',otpDoc);
        
        var updatedUser = await userModel.changeEmlVerifiedStatus(email);
        if(updatedUser['error'])
            throw {error: new Error(updatedUser.error['message']), code:updatedUser.error['code']};
        console.log('Updated user is :-\n', updatedUser);

        console.log(`User's email ${updatedUser['email']} has been confirmed!`)
        return sendResponse({}, res, 200, 'Your email has been confirmed!');
    }catch(err){
        console.log(`Error while completing email confirmation!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!'); 
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

var resendEmailConfirmation = async(req, res) => {
    try {
        console.log('\n---------------user/controller/resendEmailConfirmation---------------\n');
        console.log('Resend email confirmation mail');
        console.log('User in request is (req.user) :-\n', req['user']);
        if(req.user['userType'] !== 2)
            throw {error: new Error('Only attendee profile can be updated!'), code:403};
        var email = req.user['email'];

        var profile = await userModel.getProfile({email: email});
        if(profile['error'])
            throw {error: new Error(profile.error['message']), code:profile.error['code']};
            // throw new Error(profile['error']);
        console.log('Profile has been fetched :-\n', profile);
        if(profile['isEmailVerified']){
            console.log(`${email} has already been confirmed!`);
            return sendResponse({}, res, 200, 'Your email has already been confirmed!');
        }
            
        var otp = await generateOTP(email, 'email');
        if(otp['error'])
            throw {error: new Error(otp.error['message']), code:otp.error['code']};
            // throw new Error(otp['error']);
        console.log(`New otp for verification is ${otp}`);

        var isEmailSent = await sendConfirmationEmail(email, otp);
        if(isEmailSent == true)
            return sendResponse({}, res, 200, 'Email confirmation link has been sent to your email!');

        if(isEmailSent['error'])
            throw {error: new Error(isEmailSent.error['message']), code:isEmailSent.error['code']};
            // throw new Error(isEmailSent['error']);
            
    } catch (error) {
        console.log(`Error while completing email confirmation!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!'); 
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

module.exports = { signup, login, logout, getProfile, updateProfile, forgetPassword, resetPassword, completeEmailConfirmation, resendEmailConfirmation };
