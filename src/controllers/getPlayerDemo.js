const testModel = require('../models/testMessageModel');

const getTestMessage = (req, res) => {
    const testMessage = testModel.getTestMessage();
    res.send({ status: "OK", data: testMessage });
};

module.exports = {
    getTestMessage
};