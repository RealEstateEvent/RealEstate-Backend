const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate.js');
const { signup, 
    login, 
    logout, 
    getProfile,
    updateProfile, 
    forgetPassword, 
    resetPassword, 
    completeEmailConfirmation,
    resendEmailConfirmation } = require('./controller.js');
    
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, `${new Date().toISOString().replace(/:/g, '-')}${file.originalname.replace(/\s/g, '')}`)
    }
});
const upload = multer({ storage: storage});

router.post('/signup', signup);                                                         //signup user
router.post('/login', login);                                                           //login user
router.delete('/logout', authenticate, logout);                                         //logout user
router.get('/profile', authenticate, getProfile);                                       //fetch profile of user
router.patch('/profile', authenticate, upload.single('profilepic'), updateProfile);     //add or update fields in profile (updateprofile)
router.post('/forgetpass', forgetPassword);                                             //initiate forgetpassword process
router.patch('/forgetpass/:token', resetPassword);                                      //resets the password
router.get('/email_confirmation', authenticate, resendEmailConfirmation);               //resends otp for email confirmation
router.patch('/email_confirmation', authenticate, completeEmailConfirmation);           //complete email confirmation process

module.exports = router;