const express = require('express');
const router = express.Router();
const { createEvent, updateEvent, deleteEvent, getAllEvents, bookEvent, getMyEvents, getEvent, getAttendees } = require('./controller');
const multer = require('multer');
const { authenticate } = require('../../middleware/authenticate');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, `${new Date().toISOString().replace(/:/g, '-')}${file.originalname.replace(/\s/g, '')}`)
    }
});
const upload = multer({ storage: storage});

router.post('/create', upload.single('coverphoto'), createEvent);
router.patch('/update', upload.single('coverphoto'), updateEvent);
router.delete('/delete', deleteEvent);

router.get('/all', authenticate, getAllEvents);                     //route to get all events available
router.get('/my', authenticate, getMyEvents);                       //route to get my events available
router.get('', authenticate, getEvent);                             //route to get complete details of an event
router.get('/attendees', authenticate, getAttendees);               //route to get attendees of an event
router.post('/book', authenticate, bookEvent);                      //route to book an event
module.exports = router;