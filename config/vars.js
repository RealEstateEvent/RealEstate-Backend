var env = process.env.NODE_ENV;
if(!env){
    env = 'development';
}
console.log(`Env is`, env);
var config;
switch(env){
    case 'development':
        config = {
            mongoDB:'mongodb://Your_DB_URL_Here/Real_Estate_Conference',
            userType:{
                admin: 1,
                attendee: 2,
                speaker: 3,
                organiser: 4,
                organizer: 4,
            },
            REC:{
                AUTH_SECRET: 'Your_auth_secret_here',
                AUTH_EXPIRE_TIME: '200 days',
                PWD_SECRET: 'Your_pass_secret_here',
                PWD_EXPIRE_TIME: '100h'
            },
            email:{
                service:'gmail',
                from:'"Real Estate Conference" <youremail@abc123.com>',
                auth: {
                    user: 'youremail@abc1235.com',
                    pass: 'yourpassword'
                }
            },
            frontendURL: 'http://localhost:4200',
            HASH_ROUNDS:20
        }
    break;
    case 'production':
        config = {
            mongoDB:"mongodb://Your_DB_URL_HERE/Real_Estate_Conference",
            userType:{
                admin: 1,
                attendee: 2,
                speaker: 3,
                organiser: 4,
                organizer: 4
            },
            REC:{
                AUTH_SECRET: 'Your_auth_secret_here',
                AUTH_EXPIRE_TIME: '200 days',
                PWD_SECRET: 'Your_pass_secret_here',
                PWD_EXPIRE_TIME: '100h'
            },
            email:{
                service:'gmail',
                from:'"Real Estate Conference" <youremail@abc123.com>',
                auth: {
                    user: 'youremail@abc1235.com',
                    pass: 'yourpassword'
                }
            },
            frontendURL: 'https://realestatewebangular.herokuapp.com',
            HASH_ROUNDS:20
        }
    break;
}

module.exports = config;