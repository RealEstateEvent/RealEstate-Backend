const mongoose = require('mongoose');

var otpSchema = new mongoose.Schema({
    user_email: {
        type: String
    },
    email: {                        //otp for email confirmation
        type: Number
    },
    password: {                     //otp for password confirmation
        type: Number
    },
    createdAt: { type: Date, expires: '5m', default: Date.now },
});

otpSchema.statics.setOTP = async function (email, mode) {
    try {
        console.log('Executing model/otp/setOTP');
        var otp = await Math.floor(Math.random() * 90000) + 10000;        //5 digit random number
        var otpDoc = await otpModel.findOne({user_email:email});
        if (otpDoc) {
            if (mode == 'email')
                otpDoc['email'] = otp;
            else
                otpDoc['password'] = otp;

            await otpDoc.save();
            return otpDoc;
        } else {
            if(mode == 'email')
                var doc = { user_email: email, email: otp };
            else
                var doc = { user_email: email, password: otp };
            var newOtp = await otpModel.create(doc);
            if (!newOtp)
                throw {error:'Error creating otp', code:400}
                // throw new Error('Error creating otp');
            return newOtp;
        }
    } catch (err) {
        console.log(`Error while executing setOTP!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
};

otpSchema.statics.verifyOTP = async function (email, mode, otp) {
    try {
        console.log('Executing model/otp/verifyOTP');
        if (mode == 'email')
            var cond = { user_email: email, email: otp };
        else
            var cond = { user_email: email, password: otp };

        var otpDoc = await otpModel.findOne(cond);
        if (!otpDoc)
            throw {error:'OTP is invalid or expired', code:400}
            // throw new Error('OTP is invalid or expired')

        return otpDoc;
    } catch (err) {
        console.log(`Error while verifying OTP!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

var otpModel = mongoose.model('otp', otpSchema);

module.exports = { otpModel };