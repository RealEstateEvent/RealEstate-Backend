const socketIO = require('socket.io');
const {eventChatModel} = require('../models/event_chat');

exports.socketInit = (server) => {

    console.log("socket init")
    var io = socketIO(server, { origins: '*:*'});

    io.on('connection', (socket) => {
        console.log('connected');
        socket.on('new-message', async (msgObj) => {
            console.log("incoming message", msgObj)
            msgObj = JSON.parse(msgObj)
            let chatRep = await eventChatModel.addChat(msgObj.event_id, {
                user_id: msgObj.user_id,
                username: msgObj.username,
                msg: msgObj.msg
            });
            console.log("###", chatRep);
        });
    });

};