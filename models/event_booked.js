const mongoose = require('mongoose');

var eventBookedSchema = new mongoose.Schema({
    email: {
        type: String,
        ref:"user"
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"event"
    },
    title:{
        type: String
    },
    startTime:{
        type: Date
    },
    endTime: {
        type: Date
    },
    coverPhoto: {
        type: String
    },
    coverPhotoThumb: {
        type: String
    },
    description: {
        type: String
    },
    speakerList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    createdAt: { 
        type: Date,
        default: Date.now
    }
});

eventBookedSchema.statics.setEvent = async function(event, project) {
    try {
        console.log('Executing model/event_booked/setEvent');
        
        var isEventAlreadyPresent = await eventBookedModel.exists({email: event['email'], event_id: event['event_id']});
        if(isEventAlreadyPresent)
            throw {error: 'Event already booked!', code: 400};
        
        var projection = project || {};
        var bookedEvent = await eventBookedModel.create(event);
        console.log('booked booked booked', bookedEvent);
        if(!bookedEvent)
            throw {error: 'Error booking event', code: 400};
        return bookedEvent;
    } catch (err) {
        console.log(`Error while executing setEvent!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

eventBookedSchema.statics.updateEvent = async function (event, project) {
    try {
        console.log('Executing model/event_booked/updateEvent');
        var projection = project || {};
        var updatedEvents = await eventBookedModel.update({event_id:event['_id']}, event, {multi: true})
        if(!updatedEvents)
            throw {error: 'Error updating booked events', code: 400}
        return updatedEvents;
    } catch (err) {
        console.log(`Error while executing updateEvent!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

eventBookedSchema.statics.isEventBooked = async function (condition){
    try {
        console.log('Executing model/event_booked/isEventBooked');
        if(!condition)
            throw {error: 'Please specify condition to check the booked event!', code: 400}
        var status = await eventBookedModel.exists(condition);
        if(!status)
            return false;
        return true;
    } catch (err) {
        console.log(`Error while executing isEventBooked!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message: 'Error checking whether current booked by user or not!', code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

var eventBookedModel = mongoose.model('booked_event', eventBookedSchema);

module.exports = { eventBookedModel };