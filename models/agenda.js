var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var agendaSchema = new Schema({
    createdAt: { type: Date, default: Date.now },
    format: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: Date.now
    },
    speakers: [{
        _speaker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        speakerType: String,
        _id : false
    }]
});

agendaSchema.statics.getAgenda = async function(condition, project){
    try {
        console.log('Executing model/agenda/getAgenda');

        var projection = project || {};
        var agenda = agendaModel.findOne(condition, projection)
        if(!agenda)
            throw {error: 'No such agenda present', code: 404}
        return agenda
    } catch (err) {
        console.log(`Error while executing model/getProfile!`);
        console.log(err);
        //manual error handeling - err['error'] is a manual error
        if(!err['error'])
            return {error: {message:err['message'], code:400}};
        return {error: {message:err['error'], code:err['code']}};
    }
}

var agendaModel = mongoose.model('agenda', agendaSchema);

module.exports = { agendaModel };