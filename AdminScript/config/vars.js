var env = process.env.NODE_ENV;
if(!env){
    env = 'development';
}
console.log(`Env is`, env);
var config;
switch(env){
    case 'development':
        config = {
            mongoDB:'mongodb://localhost:27017/Real_Estate_Conference',
            HASH_ROUNDS:12
        }
    break;
    case 'production':
        config = {
            mongoDB:"mongodb+srv://ongraph:ongraph@cluster0.xtbfc.mongodb.net/Real_Estate_Conference?retryWrites=true&w=majority",
            HASH_ROUNDS:12
        }
    break;
}

module.exports = config;