const DB = require('./testDB.json');

const getTestProfiles = () => {
    return DB.profiles;
};

module.exports = { getTestProfiles };