const config = require('./../config/vars');
const nodemailer = require('nodemailer');
const { otpModel } = require('./../models/otp');
const sharp = require('sharp');
const fs = require('fs');
const { reject } = require('lodash');

var sendMail = async(mailData) => {
    try {
        console.log('Executing util/util/sendMail');

        var transporter = await nodemailer.createTransport({
            secure: true,
            service: config.email['service'],
            auth: config.email['auth']
        });
        if (!transporter)
            throw { error: 'Error creating transporter', code: 400 }
            //    throw new Error('Error creating transporter');

        var mailOptions = {
            // from: '"Real Estate Conference 👻" <no-reply@realestateconf.com>',
            from: config.email['from'], // sender's email
            to: mailData['to'], // list of receivers emails
            subject: mailData['subject'], // Subject line
            text: mailData['text'], // plain text body
            html: mailData['html'] // html body
        };
        console.log('Sending this mail :-\n', mailOptions);

        var result = await transporter.sendMail(mailOptions);
        if (!result)
            throw { error: 'Error sending mail', code: 400 };
        // throw new Error('Error sending mail');
        console.log(`Mail sent to ${mailData['to']}`)
        return { result };
    } catch (err) {
        console.log(`Error while executing sendMail!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if (!err['error'])
            return { error: { message: err['message'], code: 400 } };
        return { error: { message: err['error'], code: err['code'] } };
    }
}

var generateOTP = async(email, mode) => {
    try {
        console.log('Executing util/util/generateOTP');
        var newOtp = await otpModel.setOTP(email, mode);
        if (newOtp['error'])
            throw { error: newOtp.error['message'], code: newOtp.error['code'] };
        // throw new Error(newOtp['error']);
        if (mode == 'email')
            return newOtp['email'];
        return newOtp['password'];
    } catch (err) {
        console.log(`Error while executing generateOTP!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if (!err['error'])
            return { error: { message: err['message'], code: 400 } };
        return { error: { message: err['error'], code: err['code'] } };
        // return {error:err['message']};
    }
}

var generateThumb = async (file, destination, options) => {
    try {
        console.log('Executing util/util/generateThumbnail');

        if(!options)
        var options = {
            width: 300,
            height: 300
        };
        var destination = destination || 'uploads';
        
        const name = 'thumb-' + `${new Date().toISOString().replace(/:/g, '-')}${file.originalname.replace(/\s/g, '')}`;
        const thumb = await sharp(file['path']).resize(options['width'], options['height'])
        .toFile(destination+ '/'+ name);
        if(!thumb)
            throw {error: 'Error saving thumbnail', code: 400};
        thumb['location'] = `${destination}/${name}`;
        return thumb;
    } catch (err) {
        console.log(`Error while executing sendMail!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if (!err['error'])
            return { error: { message: err['message'], code: 400 } };
        return { error: { message: err['error'], code: err['code'] } };
    }
}

var generateThumbPromise = async (file, destination, options) => {
        console.log('Executing util/util/generateThumbnail');

        if(!options)
        var options = {
            width: 300,
            height: 300
        };
        var destination = destination || 'uploads';
        
        const name = 'thumb-' + `${new Date().toISOString().replace(/:/g, '-')}${file.originalname.replace(/\s/g, '')}`;
        var thumb = {};

        return new Promise((resolve, reject) => {
            sharp(file['path']).resize(options['width'], options['width'], options['height'])
            .toFile(destination+ '/'+ name).then((res) => {
                thumb = res;
                thumb['location'] = `${destination}/${name}`;
                resolve(thumb); 
            }, (err) => {
                reject('Error generating thumbnail');
            })    
        })
}

var deleteImage = async (filePath) => {
    try {
        console.log('Executing util/util/deleteImage');

        var img = filePath;
        console.log('Image to be deleted -', img);
        fs.unlinkSync(img);
        console.log(`Image ${filePath} is deleted!`);
        return true;
    } catch (err) {
        console.log(`Error while executing deleteImage!`);
        console.log(err);
        if(err['code'] == 'ENOENT')
            return { error: { message: 'No such image found!', code: 400 }};
        return { error: { message: 'Cannot delete this image!', code: 400 } };
    }
};

var sendResponse = async (req, res, statusCode, message, data, header) => {
    if(header){
        var head = Object.keys(header)[0];
        return res.header(head, header[head]).send({ status: statusCode, message: message, data: data || {} });
    }
    return res.status(statusCode).send({ status: statusCode, message: message, data: data || {} });
}

module.exports = { sendMail, generateOTP, sendResponse, generateThumb, generateThumbPromise, deleteImage };