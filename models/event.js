const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var eventSchema = new Schema({
    organizer: {
        type: mongoose.Schema.Types.ObjectId
    },
    title: {
        type: String,
        required: true
    },
    coverPhoto: {
        type: String
    },
    coverPhotoThumb: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    speakerCount: {
        type: Number,
    },
    speakerList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    // sponsorCount: {
    //     type: Number,
    //     required: true
    // },
    // sponsorList: [{
    //     type: mongoose.Schema.ObjectId,
    //     ref: "User"
    // }],
    agendaCount: {
        type: Number,
    },
    agendaList: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "agenda"
    }],
    ticketList: [{
        ticketType: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        soldAmount: {
            type: Number,
            required: true
        },
        description: {
            type: String,
        },
        status: {                                                //Possible Values : "ENABLED" / "DISABLED"
            type: String,
            required: true
        },
        _id: false
    }],
    createdAt: { type: Date, default: Date.now },
});

var projection = {
    _id: 1,
    title: 1,
    startTime: 1,
    endTime: 1,
    speakerCount: 1,
    speakerList: 1
};

eventSchema.statics.getEvent = async function (condition, project) {
    try {
        console.log('Executing model/event/getEvent');
        // var event = await eventModel.exists({_id: id});
        // if(!event)
        //     throw {error: 'No such event present!', code: 404}
        
        var projection = project || {};
        var event = await eventModel.findOne(condition, projection);
        if(!event)
            throw {error: 'No such event present!', code: 404};
        return event;
    } catch (err) {
        console.log(`Error while executing getEvent!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

var eventModel = mongoose.model('event', eventSchema);

module.exports = { eventModel };