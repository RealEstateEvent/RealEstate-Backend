const express = require('express');
const router = express.Router();
const userRouter = require('./../../routes/user/index');
const eventRouter = require('./../../routes/event/index');

//all routes here
router.use('/user', userRouter);                 //user Routes
router.use('/event', eventRouter);                //event Routes

module.exports = router;