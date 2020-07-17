const mongoose = require('mongoose');

var eventChatSchema = new mongoose.Schema({
    event_id: {
        type: String,
        required: true
    },
    messages: [{
        user_id: {
            type: String,
            required: true
        },
        msg: {
            type: String,
            required: true
        },
        username:{
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    members: [{
        member_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"user"
        },
        unread_count:{
            type: Number
        }
    }],
    lastUpdated: {
        type: Date
    },
    messageType: {
        type: Number    
    }
});

eventChatSchema.statics.addChat = async function (event_id, data) {
    try {
        let rep = await eventChatModel.findOneAndUpdate({event_id: event_id}, {  $push: { messages: data } }, { new: true, upsert: true});
        
        return { msg: rep };
    } catch (e) {
        console.log("socket error event chat update", e);
        return { msg: 'fail' };
    }
}

var eventChatModel = mongoose.model('event_chats', eventChatSchema);

module.exports = { eventChatModel };