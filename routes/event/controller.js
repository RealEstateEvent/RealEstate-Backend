const { eventModel } = require('./../../models/event');
const { userModel } = require('./../../models/user');
const { agendaModel } = require('./../../models/agenda');
const { eventBookedModel } = require('./../../models/event_booked');
const { eventChatModel } = require('./../../models/event_chat');
const { findAllAndPaginate } = require('../../models/pagination/paginate.js');
const { sendResponse, generateThumbPromise } = require('./../../util/util')
const async = require("async");
const util = require('../../util/util');
const config = require('../../config/vars.js');
const _ = require('lodash');
const moment = require('moment');

var createEvent = (req, res) => {
    try {
        let obj = req.body;
        // let image  = (req.file['buffer']).toString('base64');
        // console.log("image",image);
        // console.log("obj",obj);
        let event = new eventModel();
        async.waterfall([
            (cb) => {
                event.title = obj.title;
                event.description = obj.description;
                event.startTime = obj.startTime;
                event.endTime = obj.endTime;
                event.timezone = obj.timezone;
                // event.coverPhoto = image;
                event.organizer = obj.organizer;

                //first if block for postman form data i.e. to add cover photo using form data
                if(obj.speakerList && typeof(obj.speakerList) == 'string')
                obj.speakerList = JSON.parse(obj.speakerList);
                if(obj.agendaList && typeof(obj.agendaList) == 'string')
                obj.agendaList = JSON.parse(obj.agendaList);

                if (obj.ticketList && obj.ticketList.length > 0) {
                    event.ticketList = obj.ticketList;
                }
                if(req['file']) {
                    // var file = (req.file['buffer']).toString('base64');
                    var file = req['file'];
                    console.log('Cover photo is :-\n', file);
                    file['path'] = file['path'].replace('\\', '/');
                    const appURL = `${req['protocol']}://${req.headers['host']}/`;
                    console.log(`appurl is ${appURL}`);
                    var filePath = `${appURL}${file['path']}`;
                    event['coverPhoto'] = filePath;
                    var thumb;
                    generateThumbPromise(req['file']).then((res) => {
                        thumb = res;
                        thumb['path'] = `${appURL}${thumb['location']}`;
                        event['coverPhotoThumb'] = thumb['path'];
                        console.log('Saved Thumbnail is ', thumb);

                        cb();
                    }).catch((err) => {
                        console.log(err);
                        return sendResponse({}, res, 400, 'Error generating thumbnail for cover photo!');
                    });
                } else {
                    event.coverPhoto = obj.coverPhoto;
                    event.coverPhotoThumb = obj.coverPhotoThumb;    

                    cb();
                }

            },
            (cb) => {
                if (obj.speakerCount > 0) {
                    let speakerList = []
                    async.forEach(obj.speakerList, (speaker, callback) => {
                        userModel.findOne({ email: speaker.email }, (err, user) => {
                            if (err) {
                                // callback(err);
                                console.log(err);
                                return sendResponse({}, res, 400, 'Error generating thumbnail for cover photo!');
                            } else if (user) {
                                console.log("----------speaker available in user list-------------\n", user);
                                speakerList.push(user._id);
                                let mailData = {
                                    to: user.email,
                                    subject: "Invitation from Organiser " + "Organiser's Name",
                                    text: "Hi " + user.firstName + user.lastName + ", \n" +
                                        "Welcome to \"" + event.title + "\" as Speaker." + ".\n" +
                                        "You are invited by organiser \"" + "Organiser's Name" + "\" to speak on " + event.title + ". \n" +
                                        "You can login with these credential : \n" +
                                        "Email : " + user.email + "\n" +
                                        "Your contribution & knowledge will make this event a success. " + " \n" +
                                        "Thanks",
                                    html: "Hi " + user.firstName + user.lastName + ", <br>" +
                                        "Welcome to " + event.title + " as Speaker.<br>" +
                                        "You are invited by organiser " + "Organiser's Name" + " to speak on " + event.title + ".<br>" +
                                        "You can login with these credential : <br>" +
                                        "Email : " + user.email + "<br>" +
                                        "Your contribution & knowledge will make this event a success. <br>" +
                                        "Thanks"
                                };
                                util.sendMail(mailData);
                                callback();
                            } else {
                                let user = new userModel();
                                user.firstName = speaker.firstName;
                                user.lastName = speaker.lastName;
                                user.email = speaker.email;
                                user.role = speaker.headline;
                                user.description = speaker.description;
                                // user.password = '12345';
                                var password = `${user['firstName'].toLowerCase()}${Math.floor(Math.random() * 9000) + 1000}`;
                                user.password = password;
                                user.userType = config.userType.speaker
                                user.save((err, user) => {
                                    if (err) {
                                        // return console.error(err);
                                        console.log(err);
                                        return sendResponse({}, res, 400, 'Error generating speaker!');
                                    }
                                    speakerList.push(user._id);
                                    let mailData = {
                                        to: user.email,
                                        subject: "Invitation from Organiser " + "Organiser's Name",
                                        text: "Hi " + user.firstName + " " + user.lastName + ", \n" +
                                            "Welcome to \"" + event.title + "\" as Speaker." + ".\n" +
                                            "You are invited by organiser \"" + "Organiser's Name" + "\" to speak on " + event.title + ". \n" +
                                            "Email : " + user.email + "\n" +
                                            "Password : " + password + "\n" +
                                            "Your contribution & knowledge will make this event a success. " + " \n" +
                                            "Thanks",
                                        html: "Hi " + user.firstName + " " + user.lastName + ", <br>" +
                                            "Welcome to " + event.title + " as Speaker.<br>" +
                                            "You are invited by organiser " + "Organiser's Name" + " to speak on " + event.title + ".<br>" +
                                            "You can login with these credential : <br>" +
                                            "Email : " + user.email + "<br>" +
                                            "Password : " + password + "<br>" +
                                            "Your contribution & knowledge will make this event a success. <br>" +
                                            "Thanks"
                                    };
                                    util.sendMail(mailData);
                                    callback();
                                });
                            }
                        });
                    }, (err) => {
                        if (err) {
                            console.log("---------------Speaker forEach err------------\n", err);
                            // cb(err);
                            console.log(err);
                            return sendResponse({}, res, 400, 'Request cannot be completed!');
                        } else {
                            console.log("************* SpeakerList ************ \n", speakerList);
                            console.log("************* Event ************* \n", event);
                            event.speakerList = speakerList;
                            cb();
                        }
                    });
                } else {
                    cb();
                }
            },
        ], (err) => {
            if (err) {
                console.log("err", err);
                return sendResponse({}, res, 400, 'Request cannot be completed!');
            } else {
                if (obj.agendaCount > 0) {
                    let agendaList = [];
                    async.forEach(obj.agendaList, (agendaObj, callback) => {
                        let agenda = new agendaModel();
                        agenda.format = agendaObj.format;
                        agenda.title = agendaObj.title;
                        agenda.description = agendaObj.description;
                        agenda.startTime = agendaObj.startTime;
                        agenda.endTime = agendaObj.endTime;
                        if (agendaObj.speakers.length > 0) {
                            let agendaSpeakerList = [];
                            async.forEach(agendaObj.speakers, (speaker, callback) => {
                                userModel.findOne({ email: speaker.speakerEmail }, (err, user) => {
                                    if (err) {
                                        // callback(err);
                                        console.log(err);
                                        return sendResponse({}, res, 400, 'Error while finding agenda spekaer!');
                                    } else if (user) {
                                        console.log("---------------Agenda Speaker found------------------\n", user);
                                        let obj = {
                                            _speaker: user._id,
                                            speakerType: speaker.speakerType
                                        }
                                        agendaSpeakerList.push(obj);
                                        callback();
                                    } else {
                                        console.log("~~~~~~~~~~~~~~~Agenda Speaker not found~~~~~~~~~~~~~~\n");
                                        callback();
                                    }
                                });
                            }, (err) => {
                                if (err) {
                                    console.log("agenda ForEach err", err);
                                    // callback(err);
                                    return sendResponse({}, res, 400, 'Request cannot be completed!');
                                } else {
                                    agenda.speakers = agendaSpeakerList;
                                    agenda.save((err, agenda) => {
                                        if (err) {
                                            // return console.error(err);
                                            console.error(err);
                                            return sendResponse({}, res, 400, 'Error saving agenda!');
                                        }
                                        agendaList.push(agenda);
                                        callback();
                                    });
                                }
                            });
                        } else {
                            agenda.save((err, agenda) => {
                                if (err) {
                                    // return console.error(err);
                                    console.log(err);
                                    return sendResponse({}, res, 400, 'Error saving agenda!');
                                }
                                agendaList.push(agenda);
                                callback();
                            });
                        }
                    }, (err) => {
                        if (err) {
                            console.log("---------------Agenda forEach err------------\n", err);
                            return sendResponse({}, res, 400, 'Request cannot be completed!');
                        } else {
                            console.log("************* agendaList ************ \n", agendaList);
                            console.log("************* event ************* \n", event);
                            event.agendaList = agendaList;
                        }

                        event.save((err, event) => {
                            if (err) {
                                // return console.error(err);
                                console.error(err);
                                return sendResponse({}, res, 400, 'Error saving event!');
                            }
                            if(event){
                                var event_chat = {
                                    event_id: event['_id'],
                                    lastUpdated: Date.now()
                                };
                                event_chat['members'] = [{}];
                                event['speakerList'].forEach((speaker_id, i) => {
                                    event_chat['members'][i] = { member_id: speaker_id, unread_count: 0}
                                });
                                console.log(1);
                                console.log('Event Chat Object ', event_chat);
                                eventChatModel.create(event_chat).then((result) => {
                                    console.log("\n Event is created : \n", event);
    
                                    if(result){
                                        console.log('Created events_chat object ', result);
                                        // res.status(200).send({ status: 200, message: "Event is created successfully.", data: event });
                                        return sendResponse({}, res, 200, 'Event is created successfully!', event);
                                    }
    
                                    if(!result){
                                        console.log('No events_chat object created');
                                        return sendResponse({}, res, 400, 'Event is not created!');
                                    }
                                    
                                }, (err) => {
                                    console.log('Error occured while creating events chat object!');
                                });
                                // eventChatModel.create()
                            }
                            
                            // console.log("\n Event is created : \n", event);
                            // // res.status(200).send({ status: 200, message: "Event is created successfully.", data: event });
                            // return sendResponse({}, res, 200, 'Event is created successfully!', event);
                        });
                    });
                } else {
                    event.save((err, event) => {
                        if (err) {
                            // return console.error(err);
                            console.error(err);
                            return sendResponse({}, res, 400, 'Error saving event!');
                        }
                        if(event){
                            var event_chat = {
                                event_id: event['_id'],
                                lastUpdated: Date.now()
                            };
                            // event_chat['members'] = [{}];
                            event['speakerList'].forEach((speaker_id, i) => {
                                event_chat['members'][i] = { member_id: speaker_id, count: 0}
                            });
                            console.log(2);
                            console.log('Event Chat Object ', event_chat);
                            eventChatModel.create(event_chat).then((result) => {
                                console.log("\n Event is created : \n", event);

                                if(result){
                                    console.log('Created events_chat object ', result);
                                    // res.status(200).send({ status: 200, message: "Event is created successfully.", data: event });
                                    return sendResponse({}, res, 200, 'Event is created successfully!', event);
                                }

                                if(!result){
                                    console.log('No events_chat object created');
                                    return sendResponse({}, res, 400, 'Event is not created!');
                                }
                                
                            }, (err) => {
                                console.log('Error occured while creating events chat object!');
                            });
                        }
                    });
                }
            }
        });
    } 
    catch (err) {
        // console.log('Error occured!', err);
        // res.status(400).send({ status: 400, error: err.toString() });
        console.log(`Error while creating event!`);
        console.log(err);
        // return sendResponse({}, res, 400, err.toString());
        return sendResponse({}, res, 400, 'Request cannot be completed');
    }
};

var updateEvent = (req, res) => {
    try {
        let obj = req.body;
        eventModel.findOne({ _id: obj._id }).
            exec((err, event) => {
                if (err){
                    console.log(err);
                    return sendResponse({}, res, 400, 'Error saving event!');
                }
                if(!event){
                    console.log(err);
                    return sendResponse({}, res, 404, 'No such event present!');
                }    
                console.log('Event found is : ', event);
                async.waterfall([
                    (cb) => {
                        event.title = obj.title;
                        event.description = obj.description;
                        event.startTime = obj.startTime;
                        event.endTime = obj.endTime;
                        event.timezone = obj.timezone;
                        //organizer cannot be changed for now

                        //first if block for postman form data i.e. to add cover photo using form data
                        if(obj.speakerList && typeof obj.speakerList === 'string')
                        obj.speakerList = JSON.parse(obj.speakerList);
                        if(obj.agendaList && typeof obj.agendaList === 'string')
                        obj.agendaList = JSON.parse(obj.agendaList);

                        if (obj.ticketList && obj.ticketList.length > 0) {
                            event.ticketList = obj.ticketList;
                        }
                        if(req['file']) {
                            // var file = (req.file['buffer']).toString('base64');
                            var file = req['file'];
                            console.log('Cover photo is :-\n', file);
                            file['path'] = file['path'].replace('\\', '/');
                            const appURL = `${req['protocol']}://${req.headers['host']}/`;
                            console.log(`appurl is ${appURL}`);
                            var filePath = `${appURL}${file['path']}`;
                            event['coverPhoto'] = filePath;
                            var thumb;
                            generateThumbPromise(req['file']).then((res) => {
                                thumb = res;
                                thumb['path'] = `${appURL}${thumb['location']}`;
                                event['coverPhotoThumb'] = thumb['path'];
                                console.log('Saved Thumbnail is ', thumb);

                                cb();
                            }).catch((err) => {
                                console.log(err);
                                return sendResponse({}, res, 400, 'Error generating thumbnail for cover photo!');
                            });
                        } else {
                            event.coverPhoto = obj.coverPhoto;
                            event.coverPhotoThumb = obj.coverPhotoThumb;    

                            cb();
                        }
                    },
                    (cb) => {
                        if (obj.speakerCount > 0) {
                            var speakerList = []
                            event.speakerCount = obj.speakerCount;

                            async.forEach(obj.speakerList, (speaker, callback) => {
                                userModel.findOne({ email: speaker.email }, (err, user) => {
                                    if (err) {
                                        // callback(err);
                                        console.log(err);
                                        return sendResponse({}, res, 400, 'Error generating thumbnail for cover photo!');
                                    } else if (user) {
                                        console.log("----------speaker available in user list-------------\n", user);
                                        speakerList.push(user._id);
                                        let mailData = {
                                            to: user.email,
                                            subject: "Invitation from Organiser " + "Organiser's Name",
                                            text: "Hi " + user.firstName + user.lastName + ", \n" +
                                                "Welcome to \"" + event.title + "\" as Speaker." + ".\n" +
                                                "You are invited by organiser \"" + "Organiser's Name" + "\" to speak on " + event.title + ". \n" +
                                                "Your contribution & knowledge will make this event a success. " + " \n" +
                                                "Thanks.",
                                            html: "Hi " + user.firstName + user.lastName + ", <br>" +
                                                "Welcome to " + event.title + " as Speaker.<br>" +
                                                "You are invited by organiser " + "Organiser's Name" + " to speak on " + event.title + ".<br>" +
                                                "Your contribution & knowledge will make this event a success. <br>" +
                                                "Thanks"
                                        };
                                        util.sendMail(mailData);
                                        callback();
                                    } else {
                                        let user = new userModel();
                                        user.firstName = speaker.firstName;
                                        user.lastName = speaker.lastName;
                                        user.email = speaker.email;
                                        user.role = speaker.headline;
                                        user.description = speaker.description;
                                        // user.password = '12345';
                                        var password = `${user['firstName'].toLowerCase()}${Math.floor(Math.random() * 9000) + 1000}`;
                                        user.password = password;
                                        user.userType = config.userType.speaker;
                                        user.save((err, user) => {
                                            if (err) {
                                                // return console.error(err);
                                                console.log(err);
                                                return sendResponse({}, res, 400, 'Error generating speaker!');
                                            }
                                            speakerList.push(user._id);
                                            let mailData = {
                                                to: user.email,
                                                subject: "Invitation from Organiser " + "Organiser's Name",
                                                text: "Hi " + user.firstName + " " + user.lastName + ", \n" +
                                                    "Welcome to \"" + event.title + "\" as Speaker." + ".\n" +
                                                    "You are invited by organiser \"" + "Organiser's Name" + "\" to speak on " + event.title + ". \n" +
                                                    "Email : " + user.email + "\n" +
                                                    "Password : " + password + "\n" +
                                                    "Your contribution & knowledge will make this event a success. " + " \n" +
                                                    "Thanks",
                                                html: "Hi " + user.firstName + " " + user.lastName + ", <br>" +
                                                    "Welcome to " + event.title + " as Speaker.<br>" +
                                                    "You are invited by organiser " + "Organiser's Name" + " to speak on " + event.title + ".<br>" +
                                                    "You can login with these credential : <br>" +
                                                    "Email : " + user.email + "<br>" +
                                                    "Password : " + password + "<br>" +
                                                    "Your contribution & knowledge will make this event a success. <br>" +
                                                    "Thanks"
                                            };
                                            util.sendMail(mailData);
                                            callback();
                                        });
                                    }
                                });
                            }, (err) => {
                                if (err) {
                                    console.log("---------------Speaker forEach err------------\n", err);
                                    // cb(err);
                                    console.log(err);
                                    return sendResponse({}, res, 400, 'Request cannot be completed!');
                                } else {
                                    console.log("************* SpeakerList ************ \n", speakerList);
                                    console.log("************* Event ************* \n", event);
                                    event.speakerList = speakerList;
                                    cb();
                                }
                            });
                        } else {
                            cb();
                        }
                    }
                ], (err) => {
                    if (err) {
                        console.log("err", err);
                        return sendResponse({}, res, 400, 'Request cannot be completed!');
                    } else {
                        if (obj.agendaCount > 0) {
                            var agendaList = [];
                            event.agendaCount = obj.agendaCount;

                            async.forEach(obj.agendaList, (agendaObj, callback) => {
                                var agendaSpeakerList = [];
                                if (agendaObj._id) {
                                    agendaModel.findOne({ _id: agendaObj._id }, (err, agenda) => {
                                        if(err){
                                            console.log(err);
                                            return sendResponse({}, res, 400, 'Error finding agenda!');
                                        }
                                        if(!agenda){
                                            console.log(err);
                                            return sendResponse({}, res, 400, 'No such agenda present!');
                                        }
                                        agenda.format = agendaObj.format;
                                        agenda.title = agendaObj.title;
                                        agenda.description = agendaObj.description;
                                        agenda.startTime = agendaObj.startTime;
                                        agenda.endTime = agendaObj.endTime;
                                        if (agendaObj.speakers.length > 0) {
                                            async.forEach(agendaObj.speakers, (speaker, callback) => {
                                                userModel.findOne({ email: speaker.speakerEmail }, (err, user) => {
                                                    if (err) {
                                                        // callback(err);
                                                        console.log(err);
                                                        return sendResponse({}, res, 400, 'Error while finding agenda spekaer!');
                                                    } else if (user) {
                                                        console.log("---------------Agenda Speaker found------------------\n", user);
                                                        let obj = {
                                                            _speaker: user._id,
                                                            speakerType: speaker.speakerType
                                                        }
                                                        agendaSpeakerList.push(obj);
                                                        callback();
                                                    } else {
                                                        console.log("~~~~~~~~~~~~~~~Agenda Speaker not found~~~~~~~~~~~~~~\n");
                                                        callback();
                                                    }
                                                });
                                            }, (err) => {
                                                if (err) {
                                                    console.log("agenda ForEach err", err);
                                                    // callback(err);
                                                    return sendResponse({}, res, 400, 'Request cannot be completed!');
                                                } else {
                                                    agenda.speakers = agendaSpeakerList;
                                                    agenda.save((err, agenda) => {
                                                        if (err) {
                                                            // return console.error(err);
                                                            console.error(err);
                                                            return sendResponse({}, res, 400, 'Error saving agenda!');
                                                        }
                                                        agendaList.push(agenda);
                                                        callback();
                                                    });
                                                }
                                            });
                                        } else {
                                            agenda.save((err, agenda) => {
                                                if (err) {
                                                    // return console.error(err);
                                                    console.log(err);
                                                    return sendResponse({}, res, 400, 'Error saving agenda!');
                                                }
                                                agendaList.push(agenda);
                                                callback();
                                            });
                                        }
                                    })
                                } else {
                                    let agenda = new agendaModel();
                                    agenda.format = agendaObj.format;
                                    agenda.title = agendaObj.title;
                                    agenda.description = agendaObj.description;
                                    agenda.startTime = agendaObj.startTime;
                                    agenda.endTime = agendaObj.endTime;
                                    if (agendaObj.speakers.length > 0) {
                                        async.forEach(agendaObj.speakers, (speaker, callback) => {
                                            userModel.findOne({ email: speaker.speakerEmail }, (err, user) => {
                                                if (err) {
                                                    // callback(err);
                                                    console.log(err);
                                                    return sendResponse({}, res, 400, 'Error while finding agenda spekaer!');
                                                } else if (user) {
                                                    console.log("---------------Agenda Speaker found------------------\n", user);
                                                    let obj = {
                                                        _speaker: user._id,
                                                        speakerType: speaker.speakerType
                                                    }
                                                    agendaSpeakerList.push(obj);
                                                    callback();
                                                } else {
                                                    console.log("~~~~~~~~~~~~~~~Agenda Speaker not found~~~~~~~~~~~~~~\n");
                                                    callback();
                                                }
                                            });
                                        }, (err) => {
                                            if (err) {
                                                console.log("agenda ForEach err", err);
                                                // callback(err);
                                                return sendResponse({}, res, 400, 'Request cannot be completed!');
                                            } else {
                                                agenda.speakers = agendaSpeakerList;
                                                agenda.save((err, agenda) => {
                                                    if (err) {
                                                        return console.error(err);
                                                    }
                                                    agendaList.push(agenda);
                                                    callback();
                                                });
                                            }
                                        });
                                    } else {
                                        agenda.save((err, agenda) => {
                                            if (err) {
                                                // return console.error(err);
                                                console.log(err);
                                                return sendResponse({}, res, 400, 'Error saving agenda!');
                                            }
                                            agendaList.push(agenda);
                                            callback();
                                        });
                                    }
                                }
                            }, (err) => {
                                if (err) {
                                    console.log("---------------Agenda forEach err------------\n", err);
                                    return sendResponse({}, res, 400, 'Request cannot be completed!');
                                } else {
                                    console.log("************* agendaList ************ \n", agendaList);
                                    console.log("************* event ************* \n", event);
                                    event.agendaList = agendaList;
                                }

                                event.save((err, event) => {
                                    if (err) {
                                        // return console.error(err);
                                        console.error(err);
                                        return sendResponse({}, res, 400, 'Error saving event!');
                                    }
                                    console.log("\n Event is updated : \n", event['_doc']);
                                    var bookedEventUpdateObj = {};
                                    bookedEventUpdateObj['title'] = event['title'];
                                    bookedEventUpdateObj['description'] = event['description'];
                                    bookedEventUpdateObj['coverPhoto'] = event['coverPhoto'];
                                    bookedEventUpdateObj['coverPhotoThumb'] = event['coverPhotoThumb'];
                                    bookedEventUpdateObj['startTime'] = event['startTime'];
                                    bookedEventUpdateObj['endTime'] = event['endTime'];
                                    bookedEventUpdateObj['speakerList'] = event['speakerList'];
                                    console.log(bookedEventUpdateObj);
                                    eventBookedModel.updateMany({event_id:event['_id']}, bookedEventUpdateObj).then((status) => {
                                        console.log(`Updated ${status['n']} booked events`);
                                        if(!status)
                                        console.log(`No event booked with id ${event['_id']}`)
                                        return sendResponse({}, res, 200, 'Event is updated successfully!', event);
                                    }, (err) => {
                                        console.log('Error updating booked events');
                                        return sendResponse({}, res, 400, 'Error updating booked events!', event);
                                    });
                                    // res.status(200).send({ status: 200, message: "Event is updated successfully!", data: event });
                                    // return sendResponse({}, res, 200, 'Event is updated successfully!', event);
                                });
                            });
                        } else {
                            console.log("^^^^^^^^^^^^^^^^agenda count 0^^^^^^^^^^^^^^^^^^");
                            event.save((err, event) => {
                                if (err) {
                                     // return console.error(err);
                                    console.error(err);
                                    return sendResponse({}, res, 400, 'Error saving event!');
                                }
                                console.log("\n Event is updated : \n", event);
                                var bookedEventUpdateObj = {};
                                    bookedEventUpdateObj['title'] = event['title'];
                                    bookedEventUpdateObj['description'] = event['description'];
                                    bookedEventUpdateObj['coverPhoto'] = event['coverPhoto'];
                                    bookedEventUpdateObj['coverPhotoThumb'] = event['coverPhotoThumb'];
                                    bookedEventUpdateObj['startTime'] = event['startTime'];
                                    bookedEventUpdateObj['endTime'] = event['endTime'];
                                    bookedEventUpdateObj['speakerList'] = event['speakerList'];
                                    console.log(bookedEventUpdateObj);
                                    eventBookedModel.updateMany({event_id:event['_id']}, bookedEventUpdateObj).then((status) => {
                                        console.log(`Updated ${status['n']} booked events`);
                                        if(!status)
                                        console.log(`No event booked with id ${event['_id']}`)
                                        return sendResponse({}, res, 200, 'Event is updated successfully!', event);
                                    }, (err) => {
                                        console.log('Error updating booked events');
                                        return sendResponse({}, res, 400, 'Error updating booked events!', event);
                                    });
                                // res.status(200).send({ status: 200, message: "Event is updated successfully!", data: event });
                                // return sendResponse({}, res, 200, 'Event is updated successfully!', event);
                            });
                        }
                    }
                });
            });
    } catch (err) {
        // console.log('Error occured!', err);
        // res.status(400).send({ status: 400, error: err.toString() });
        console.log(`Error while updating event!`);
        console.log(err);
        // return sendResponse({}, res, 400, err.toString());
        return sendResponse({}, res, 400, 'Request cannot be completed');
    }
};

var deleteEvent = async (req, res) => {
    try {
        let obj = req.body;
        eventBookedModel.findOne({event_id: obj._id}, (err, data) => {
          if(err){
            console.log("error: ", error);
            return sendResponse({}, res, 400, 'Error finding booked event!');
          }
          if(data){
              console.log("This event is booked :-\n", data);
              console.log("You cannot delete this event!");
              return sendResponse({}, res, 400, 'Event is booked, You cannot delete this event!', {});
          }else{
            eventModel.findOne({ _id: obj._id }, (err, event) => {
                if (err) {
                    console.log("error: ", error);
                    return sendResponse({}, res, 400, 'Error finding event!');
                }
                if(!event){
                    console.log('No such event found to delete!');
                    return sendResponse({}, res, 404, 'No such event found!');
                }
                else {
                    async.parallel([
                        (cb) => {
                            if (event.agendaList.length > 0) {
                                async.forEach(event.agendaList, (agenda, callback) => {
                                    agendaModel.findOneAndDelete({ _id: agenda._id }, (err, agenda) => {
                                        if (err) {
                                            // callback(err);
                                            console.log(err);
                                            return sendResponse({}, res, 400, 'Error finding and deleting agenda!');
                                        } 
                                        if(!agenda) {
                                            console.log('Agenda present in event is missing!');
                                            return sendResponse({}, res, 404, 'Agenda present in event is missing!');
                                        }
                                        else {
                                            console.log("----------deleted agenda-------------\n", agenda);
                                            callback();
                                        }
                                    });
                                }, (err) => {
                                    if (err) {
                                        console.log("---------------Agenda delete forEach err------------\n", err);
                                        // cb(err);
                                        console.log(err);
                                        return sendResponse({}, res, 400, 'Error removing agenda!');
                                    } else {
                                        console.log("************* AgendaList deleted successfully ************ \n");
                                        cb();
                                    }
                                });
                            } else {
                                cb();
                            }
                        }
                    ], (err) => {
                        if (err) {
                            console.log("err", err);
                            return sendResponse({}, res, 400, 'Request cannot be completed!');
                        } else {
                            eventModel.findOneAndDelete({ _id: event._id }, (err, event) => {
                                if (err) {
                                    console.log("error: ", error);
                                    console.log(err);
                                    return sendResponse({}, res, 400, 'Error finding and deleting event!');
                                }
                                if(!event){
                                    console.log("No such event is present");
                                    return sendResponse({}, res, 404, 'No such event is present!', {});
                                }
                                else {
                                    console.log("--------Event is deleted successfully-----------\n", event);
                                    // res.status(200).send({ status: 200, message: "Event is deleted successfully", data: {} });
                                    return sendResponse({}, res, 200, 'Event is deleted successfully!', {});
                                }
                            })
                        }
                    });
                }
            })
          }
        })
    } catch (err) {
        // console.log('Error occured!', err);
        // res.status(400).send({ status: 400, error: err.toString() });
        console.log(`Error while deleting event!`);
        console.log(err);
        // return sendResponse({}, res, 400, err.toString());
        return sendResponse({}, res, 400, 'Request cannot be completed');
    }
};

var getAllEvents = async (req, res) => {
    try {
        console.log('\n---------------event/controller/getEvents---------------\n');
        console.log('User is fetching events');
        console.log('User in request is (req.user) :-\n', req['user']);

        if(req.user['userType'] !== 2 || req.user['userType'] == 4)
            throw {error: new Error('Only attendee & organizer are allowed to perform this operation!'), code:403};

        if(!req.query || !req.query['isPast'] || !req.query['page'] || !req.query['limit'])
            throw {error: new Error('Invalid query object!'), code:400};

        if(isNaN(req.query['page']) || isNaN(req.query['limit']))
            throw {error: new Error('Invalid query object!'), code:400};
        
        const todayDate = await moment().startOf('day').toDate();

        var page = parseInt(req.query['page']);
        var limit = parseInt(req.query['limit']);
        if( page <=0 || limit <=0 )
            throw {error: new Error('Invalid query object'), code: 400};

        var projection = {
            _id: 1, title: 1, startTime: 1, endTime: 1, speakerCount: 1, speakerList: 1, coverPhoto: 1, coverPhotoThumb: 1, description: 1
        };

        var events, sort;
        if(req.query['isPast'] == 'true'){
            sort = {endTime: 'desc'};
            events = await findAllAndPaginate(eventModel, {startTime: {$lt:todayDate}, endTime: {$lt: todayDate}}, page, limit, sort, projection)
        }
        else if(req.query['isPast'] == 'false'){
            sort = {startTime: 'asc'};
            events = await findAllAndPaginate(eventModel, {endTime: {$gte:todayDate}}, page, limit, sort, projection)
        }else{
            throw {error: new Error('Invalid query object!'), code:400};
        }

        if(events['error'])
            throw {error: new Error(events.error['message']), code:events.error['code']};
        console.log('Events has been fetched :-\n', events);
        
        //outer loop for changing date time to epoch and inner loop to append profile picture of given id speaker
        var temp = {docs:[], total:0};
        temp['total'] = events['total']; 
        if(events['docs'].length > 0){
            for(var i = 0; i <events['docs'].length; i++){
                temp['docs'][i] = {};
                temp['docs'][i]['event_id'] = events['docs'][i]['_id'] || "";
                temp['docs'][i]['title'] = events['docs'][i]['title'] || "";
                temp['docs'][i]['description'] = events['docs'][i]['description'] || "";
                temp['docs'][i]['coverPhoto'] = events['docs'][i]['coverPhoto'] || "";
                temp['docs'][i]['coverPhotoThumb'] = events['docs'][i]['coverPhotoThumb'] || "";
                temp['docs'][i]['startTime'] = await moment(events['docs'][i]['startTime']).unix() || 0;
                temp['docs'][i]['endTime'] = await moment(events['docs'][i]['endTime']).unix() || 0;
                temp['docs'][i]['speakerList'] = [];
                if(events['docs'][i]['speakerList'].length > 0){
                    for(var j = 0; j < events['docs'][i]['speakerList'].length; j++){
                        var id = events['docs'][i]['speakerList'][j];
                        var profile = await userModel.getProfile({_id: id});
                        if(profile['error'])
                            throw {error: new Error(profile.error['message']), code:profile.error['code']};
                        temp['docs'][i]['speakerList'][j] = {};
                        temp['docs'][i]['speakerList'][j]['profilePic'] = profile['profilePic'] || "";
                        temp['docs'][i]['speakerList'][j]['profilePicThumb'] = profile['profilePicThumb'] || "";
                        temp['docs'][i]['speakerList'][j]['id'] = id || "";
                    }
                }
            }
        }

        console.log('Updated events :-\n', temp);
        
        console.log('All Events has been fetched successfully!');
        return sendResponse({}, res, 200, 'Events has been fetched successfully!', temp);
    } catch (err) {
        console.log(`Error while logging out user!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!');
        return sendResponse({}, res, err['code'], err.error['message']);
    }
}

var bookEvent = async (req, res) => {
    try{
        console.log('\n---------------event/controller/bookEvent---------------\n');
        console.log('User is booking event');
        console.log('User in request is (req.user) :-\n', req['user']);

        if(req.user['userType'] !== 2)
            throw {error: new Error('Only attendee is allowed to perform this operation!'), code:403};
        
        if(!req.query || !req.query['id'])
            throw {error: new Error('Invalid query object!'), code:400};
        
        if (!req.query['id'].match(/^[0-9a-fA-F]{24}$/))                    //checks for a valid object id
            throw {error: new Error('Invalid query object!'), code:400};

        var event_id = req.query['id'];
        var projection = {
            _id:0, title: 1, startTime: 1, endTime: 1, speakerList: 1, coverPhoto: 1, coverPhotoThumb: 1, description: 1
        };
        var temp = {};
        var event = await eventModel.getEvent({_id: event_id}, projection);
        if(event['error'])
            throw {error: new Error(event.error['message']), code:event.error['code']};
        console.log('Event has been fetched for id '+event_id+' :-\n', event);
            
        temp = event['_doc'];
        temp['event_id'] = event_id;
        temp['email'] = req.user['email'];
        console.log('Event going to be booked :-\n', temp);


        // var email = req.user['email'];
        // var projection = {my_events:1}
        // var userEvents = await userModel.bookEvent(email, event_id, projection);
        // if(userEvents['error'])
        //     throw {error: new Error(userEvents.error['message']), code:userEvents.error['code']};

        var bookedEvent = await eventBookedModel.setEvent(temp);
        if(bookedEvent['error'])
            throw {error: new Error(bookedEvent.error['message']), code:bookedEvent.error['code']};
        console.log('Events has been booked :-\n', bookedEvent);
        
        console.log(`Event ${event_id} has been booked for user ${req.user['email']} successfully!`);
        return sendResponse({}, res, 200, 'Event has been booked successfully!');
    } catch(err) {
        console.log(`Error while booking event!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!');
        return sendResponse({}, res, err['code'], err.error['message']);
    }
}

var getMyEvents = async (req, res) => {
    try {
        console.log('\n---------------event/controller/getMyEvents---------------\n');
        console.log('User is fetching their events');
        console.log('User in request is (req.user) :-\n', req['user']);

        // if(req.user['userType'] !== 2)
        //     throw {error: new Error('Only attendee is allowed to perform this operation!'), code:403};

        if(!req.query || !req.query['isPast'] || !req.query['page'] || !req.query['limit'])
            throw {error: new Error('Invalid query object!'), code:400};

        if(isNaN(req.query['page']) || isNaN(req.query['limit']))
            throw {error: new Error('Invalid query object!'), code:400};

        // var projection = {my_events:1}
        // var userEvents = userModel.getProfile({email: req.user['email'], projection});
        // if(userEvents['error'])
        //     throw {error: new Error(userEvents.error['message']), code:userEvents.error['code']};
        
        const todayDate = await moment().startOf('day').toDate();
        
        var page = parseInt(req.query['page']);
        var limit = parseInt(req.query['limit']);
        if( page <=0 || limit <=0 )
            throw {error: new Error('Invalid query object'), code: 400};
            
        var projection = {
            _id: 1, title: 1, startTime: 1, endTime: 1, speakerList: 1, event_id: 1, coverPhoto: 1, coverPhotoThumb: 1, description: 1
        };

        var events, sort;
        if(req.user['userType'] == 2){ //2 -> Attendee
            console.log('User Type is Attendee!');
            if(req.query['isPast'] == 'true'){
                sort = { endTime: 'desc'};
                events = await findAllAndPaginate(eventBookedModel, {email: req.user['email'], startTime: {$lt:todayDate}, endTime: {$lt: todayDate}}, page, limit, sort, projection)
            }
            else if(req.query['isPast'] == 'false'){
                sort = { startTime: 'asc'};
                events = await findAllAndPaginate(eventBookedModel, {email: req.user['email'], endTime: {$gte:todayDate}}, page, limit, sort, projection)
            }else{
                throw {error: new Error('Invalid query object!'), code:400};
            }
        }
        if(req.user['userType'] == 3){ // 3 -> Speaker
            console.log('User Type is Speaker!');
            var profile = await userModel.getProfile({email: req.user['email']}, {_id: 1});
            if(profile['error'])
                throw {error: new Error(profile.error['message']), code:profile.error['code']};
            console.log('Speaker id is', profile['_id']);
            console.log(typeof(profile['_id']));
            if(req.query['isPast'] == 'true'){
                sort = { endTime: 'desc'};
                events = await findAllAndPaginate(eventModel, {"speakerList": profile['_id'], startTime: {$lt:todayDate}, endTime: {$lt: todayDate}}, page, limit, sort, projection)
            }
            else if(req.query['isPast'] == 'false'){
                sort = { startTime: 'asc'};
                events = await findAllAndPaginate(eventModel, {"speakerList": profile['_id'], endTime: {$gte:todayDate}}, page, limit, sort, projection)
                console.log('Events are', events);
            }else{
                throw {error: new Error('Invalid query object!'), code:400};
            }
        }
        if(req.user['userType'] == 4){ // 4 -> Organizer
            console.log('User Type is Organizer!');
            var id = await userModel.getProfile({email: req.user['email']}, {_id: 1});
            console.log('Organizer Id', id);
            if(id['error'])
                throw {error: new Error(id.error['message']), code:id.error['code']};
            if(req.query['isPast'] == 'true'){
                sort = { endTime: 'desc'};
                events = await findAllAndPaginate(eventModel, {organizer: id['_id'], startTime: {$lt:todayDate}, endTime: {$lt: todayDate}}, page, limit, sort, projection)
            }
            else if(req.query['isPast'] == 'false'){
                sort = { startTime: 'asc'};
                events = await findAllAndPaginate(eventModel, {organizer: id['_id'], endTime: {$gte:todayDate}}, page, limit, sort, projection)
            }else{
                throw {error: new Error('Invalid query object!'), code:400};
            }
        }
        console.log('My events fetched are :-\n', events);
        
        var temp = {docs:[], total:0};
        temp['total'] = events['total']; 
        if(events['docs'].length > 0){
            for(var i = 0; i <events['docs'].length; i++){
                temp['docs'][i] = {};
                if(req.user['userType'] == 2)
                temp['docs'][i]['event_id'] = events['docs'][i]['event_id'] || "";
                if(req.user['userType'] == 3 || req.user['userType'] == 4 )
                temp['docs'][i]['event_id'] = events['docs'][i]['_id'] || "";
                
                temp['docs'][i]['title'] = events['docs'][i]['title'] || "";
                temp['docs'][i]['description'] = events['docs'][i]['description'] || "";
                temp['docs'][i]['coverPhoto'] = events['docs'][i]['coverPhoto'] || "";
                temp['docs'][i]['coverPhotoThumb'] = events['docs'][i]['coverPhotoThumb'] || "";
                temp['docs'][i]['startTime'] = await moment(events['docs'][i]['startTime']).unix() || 0;
                temp['docs'][i]['endTime'] = await moment(events['docs'][i]['endTime']).unix() || 0;
                temp['docs'][i]['speakerList'] = [];
                if(events['docs'][i]['speakerList'].length > 0){
                    for(var j = 0; j < events['docs'][i]['speakerList'].length; j++){
                        var id = events['docs'][i]['speakerList'][j];
                        var profile = await userModel.getProfile({_id: id});
                        if(profile['error'])
                            throw {error: new Error(profile.error['message']), code:profile.error['code']};
                        temp['docs'][i]['speakerList'][j] = {};
                        temp['docs'][i]['speakerList'][j]['profilePic'] = profile['profilePic'] || "";
                        temp['docs'][i]['speakerList'][j]['profilePicThumb'] = profile['profilePicThumb'] || "";
                        temp['docs'][i]['speakerList'][j]['id'] = id || "";
                    }
                }
            }
        }
        console.log('Updated my events :-\n', temp);
        
        console.log('My Events has been fetched successfully!');
        return sendResponse({}, res, 200, 'Events has been fetched successfully!', temp);
    } catch (err) {
        console.log(`Error while booking event!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!');
        return sendResponse({}, res, err['code'], err.error['message']);
    }
}

var getEvent = async (req, res) => {
    try {
        console.log('\n---------------event/controller/getEvent---------------\n');
        console.log('User is fetching single event');
        console.log('User in request is (req.user) :-\n', req['user']);
        
        // if(req.user['userType'] !== 2)
        //     throw {error: new Error('Only attendee is allowed to perform this operation!'), code:403};

        if(!req.query || !req.query['id'])
            throw {error: new Error('Invalid query object!'), code:400};
        
        if (!req.query['id'].match(/^[0-9a-fA-F]{24}$/))                    //checks for a valid object id
            throw {error: new Error('Invalid query object!'), code:400};

        var event_id = req.query['id'];
        var event_projection = {ticketList:0, createdAt:0, __v:0}
        var event = await eventModel.getEvent({_id: event_id}, event_projection);
        if(event['error'])
            throw {error: new Error(event.error['message']), code:event.error['code']};
        console.log('Event '+event_id+' has been fetched :-\n', event);
                    
        var temp = {};
        temp['speakerList'] = [];
        var user_projection = { password: 0, __v: 0, my_events: 0, isEmailVerified: 0, isProfileSetup: 0}
        
        //fetching speakers
        for(var i = 0; i < event['speakerList'].length; i++ ) {
            const id = event['speakerList'][i];
            const profile = await userModel.getProfile({_id: id}, user_projection);
            if(profile['error'])
                throw {error: new Error(profile.error['message']), code:profile.error['code']};
            temp['speakerList'][i] = {};
            for( var k in profile['_doc'])
                temp['speakerList'][i][k] = profile['_doc'][k];
            const currentSpeaker = temp['speakerList'][i]; 
            currentSpeaker['id'] = id || currentSpeaker['_id'] || "";
            currentSpeaker['firstName'] = currentSpeaker['firstName'] || "";
            currentSpeaker['lastName'] = currentSpeaker['lastName'] || "";
            currentSpeaker['email'] = currentSpeaker['email'] || "";
            currentSpeaker['profilePic'] = currentSpeaker['profilePic'] || "";
            currentSpeaker['profilePicThumb'] = currentSpeaker['profilePicThumb'] || "";
            currentSpeaker['role'] = currentSpeaker['role'] || "";
            currentSpeaker['description'] = currentSpeaker['description'] || "";
            delete currentSpeaker['_id']; 
        }
        temp['agendaList'] = [];
        var agenda_projection = { _id: 0, createdAt: 0, __v: 0};
        
        //fetching agendas
        for(var i = 0; i < event['agendaList'].length; i++ ) {
            const id = event['agendaList'][i];
            const agenda = await agendaModel.getAgenda({_id: id}, agenda_projection);
            if(agenda['error'])
                throw {error: new Error(agenda.error['message']), code:agenda.error['code']};
            temp['agendaList'][i] = {};
            for( var k in agenda['_doc'])
                temp['agendaList'][i][k] = agenda['_doc'][k];

            var currentAgenda = temp['agendaList'][i];
            currentAgenda['id'] = id || "";
            currentAgenda['startTime'] = currentAgenda['startTime'] ? await moment(currentAgenda['startTime']).unix() : 0;
            currentAgenda['endTime'] = currentAgenda['endTime'] ? await moment(currentAgenda['endTime']).unix() : 0;
            currentAgenda['format'] = currentAgenda['format'] ? currentAgenda['format'] : "";
            currentAgenda['title'] = currentAgenda['title'] ? currentAgenda['title'] : "";
            currentAgenda['description'] = currentAgenda['description'] ? currentAgenda['description'] : "";

            if(currentAgenda['speakers'])
            for(var j = 0; j < currentAgenda['speakers'].length; j++ ){
                const currentSpeaker = currentAgenda['speakers'][j];
                console.log('current speaker is ', currentSpeaker); 
                const profile = await userModel.getProfile({_id: currentSpeaker['_speaker']}, user_projection);
                if(profile['error'])
                    throw {error: new Error(profile.error['message']), code:profile.error['code']};
                currentAgenda['speakers'][j] = profile['_doc'];
                delete currentAgenda['speakers'][j]['_id'];
                currentAgenda['speakers'][j]['id'] = currentSpeaker['_speaker'] || "";
                currentAgenda['speakers'][j]['speakerType'] = currentSpeaker['speakerType'] || "";
                currentAgenda['speakers'][j]['firstName'] = profile['firstName'] || "";
                currentAgenda['speakers'][j]['lastName'] = profile['lastName'] || "";
                currentAgenda['speakers'][j]['email'] = profile['email'] || "";
                currentAgenda['speakers'][j]['profilePic'] = profile['profilePic'] || "";
                currentAgenda['speakers'][j]['profilePicThumb'] = profile['profilePicThumb'] || "";
                currentAgenda['speakers'][j]['role'] = profile['role'] || "";
                currentAgenda['speakers'][j]['description'] = profile['description'] || "";
            }
        }

        //fetching attendees
        temp['attendeeList'] = {docs: [], total: 0};
        sort = {createdAt: 'asc'};
        var projection = {email: 1, _id: 0};
        var attendees = await findAllAndPaginate(eventBookedModel, {event_id: event_id}, 1, 20, sort, projection)
        if(attendees['error'])
            throw {error: new Error(attendees.error['message']), code:attendees.error['code']};
        console.log('Attendees has been fetched :-\n', attendees);
        const attendee_projection = {id: 1, firstName: 1, lastName: 1, profilePic: 1, profilePicThumb: 1, role: 1, description: 1};
        for(var i = 0; i < attendees['docs'].length; i++) {
            const profile = await userModel.getProfile({email: attendees.docs[i]['email']}, attendee_projection);
            if(profile['error'])
                throw {error: new Error(profile.error['message']), code:profile.error['code']};
            temp['attendeeList']['docs'][i] = {};
            temp['attendeeList']['docs'][i]['id'] = profile['_id'] || ""; 
            temp['attendeeList']['docs'][i]['firstName'] = profile['firstName'] || ""; 
            temp['attendeeList']['docs'][i]['lastName'] = profile['lastName'] || ""; 
            temp['attendeeList']['docs'][i]['email'] = attendees['docs'][i]['email'] || ""; 
            temp['attendeeList']['docs'][i]['profilePic'] = profile['profilePic'] || ""; 
            temp['attendeeList']['docs'][i]['profilePicThumb'] = profile['profilePicThumb'] || ""; 
            temp['attendeeList']['docs'][i]['role'] = profile['role'] || ""; 
            temp['attendeeList']['docs'][i]['description'] = profile['description'] || ""; 
        }
        temp['attendeeList']['total'] = attendees['total'];

        //check if attendee has booked the event or not
        if(req.user['userType'] == 2){
            var isBooked = await eventBookedModel.isEventBooked({event_id: event_id, email: req.user['email']});
            if(isBooked['error'])
                throw {error: new Error(isBooked.error['message']), code:isBooked.error['code']};
            temp['isBooked'] = isBooked;
            if(isBooked)
                console.log('This event is already booked by current attendee!');
            console.log('This event is not booked by current attendee!');
        }
        
        temp['event_id'] = event['_id'] || "";
        temp['title'] = event['title'] || "";
        temp['coverPhoto'] = event['coverPhoto'] || "";
        temp['coverPhotoThumb'] = event['coverPhotoThumb'] || "";
        temp['description'] = event['description'] || "";
        temp['organizer'] = event['organizer'] || "";
        temp['startTime'] = event['startTime'] ? await moment(event['startTime']).unix() : 0;
        temp['endTime'] = event['endTime'] ? await moment(event['endTime']).unix() : 0;
        console.log(`Updated Event :-\n`, temp);
        
        console.log('Event has been fetched successfully!');
        return sendResponse({}, res, 200, 'Event has been fetched successfully!', temp);
    } catch (err) {
        console.log(`Error while getting one event!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!');
        return sendResponse({}, res, err['code'], err.error['message']);
    }
}

var getAttendees = async (req, res) => {
    try {
        console.log('\n---------------event/controller/getAttendees---------------\n');
        console.log('User is fetching attendees of event');
        console.log('User in request is (req.user) :-\n', req['user']);

        // if(req.user['userType'] !== 2)
        //     throw {error: new Error('Only attendee is allowed to perform this operation!'), code:403};

        if(!req.query || !req.query['id'] || !req.query['page'] || !req.query['limit'])
            throw {error: new Error('Invalid query object!'), code:400};

        if(isNaN(req.query['page']) || isNaN(req.query['limit']))
            throw {error: new Error('Invalid query object!'), code:400};

        if(!req.query['id'].match(/^[0-9a-fA-F]{24}$/))                    //checks for a valid object id
            throw {error: new Error('Invalid query object!'), code:400};
        
        var event_id = req.query['id'];
        var page = req.query['page'];
        var limit = req.query['limit'];
            
        //fetching attendees
        var temp = {docs: [], total: 0};
        // temp['attendeeList'] = {docs: [], total: 0};
        sort = {createdAt: 'asc'};
        var projection = {email: 1, _id: 0};
        attendees = await findAllAndPaginate(eventBookedModel, {event_id: event_id}, page, limit, sort, projection)
        if(attendees['error'])
            throw {error: new Error(attendees.error['message']), code:attendees.error['code']};
        console.log('Attendees has been fetched :-\n', attendees);
        const attendee_projection = {firstName: 1, lastName: 1, profilePic: 1, profilePicThumb: 1, role: 1};
        for(var i = 0; i < attendees['docs'].length; i++) {
            const profile = await userModel.getProfile({email: attendees.docs[i]['email']}, attendee_projection);
            if(profile['error'])
                throw {error: new Error(profile.error['message']), code:profile.error['code']};
            temp['docs'][i] = {};
            temp['docs'][i]['firstName'] = profile['firstName'] || ""; 
            temp['docs'][i]['lastName'] = profile['lastName'] || ""; 
            temp['docs'][i]['email'] = attendees['docs'][i]['email'] || ""; 
            temp['docs'][i]['profilePic'] = profile['profilePic'] || ""; 
            temp['docs'][i]['profilePicThumb'] = profile['profilePicThumb'] || ""; 
            temp['docs'][i]['role'] = profile['role'] || ""; 
        }
        temp['total'] = attendees['total'];

        console.log('Attendees has been fetched successfully!');
        return sendResponse({}, res, 200, 'Attendees has been fetched successfully!', temp);
    } catch (err) {
        console.log(`Error while getting one event!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!');
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};


module.exports = { createEvent, updateEvent, deleteEvent, getAllEvents, bookEvent, getMyEvents, getEvent, getAttendees }; 