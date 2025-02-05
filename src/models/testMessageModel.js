const Profile = require('../db/testMessage')

const getTestMessage = () => {
    const testProfiles = Profile.getTestProfiles();
    return testProfiles;
};

module.exports = {
    getTestMessage
};