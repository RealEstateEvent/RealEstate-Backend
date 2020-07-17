//Authenticate Middelware will be used to verify the user is valid and authentic.
const { authModel, verifyAuthToken } = require('./../models/auth');
const { sendResponse } = require('./../util/util');

var authenticate = async (req, res, next) => {
    try {
        console.log('\n---------------middleware/authenticate---------------\n');
        console.log('User is getting authenticated/validated');
        
        var token = req.header('x-auth');
        console.log('Token for validation is', token);
        if (!token)
            throw {error: new Error('Token is invalid or expired!'), code: 401};
            // throw new Error('Access denied! No token provided!');

        var decoded = await verifyAuthToken(token);
        if(decoded['error'])
            throw {error: new Error('Token is invalid or expired!'), code: 401};
            // throw new Error(decoded['error']);
        console.log('Token decoded is :-\n', decoded);
        
        var authEntry = await authModel.getAuthEntry(decoded);
        console.log(authEntry);
        if(authEntry['error'])
            throw {error: new Error(authEntry.error['message']), code:authEntry.error['code']};
            // throw new Error(authEntry['error']);

        console.log('User is valid :-\n', authEntry);
        req.user = authEntry;
        next();
    } catch (err) {
        console.log(`Error while authenticating user!`);
        console.log(err);
        if(!err['error'])
            return sendResponse({}, res, 400, 'Request cannot be completed!');
        return sendResponse({}, res, err['code'], err.error['message']);
    }
};

module.exports = { authenticate };
