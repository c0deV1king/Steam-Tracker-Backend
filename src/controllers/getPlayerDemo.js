const getTestMessage = (req, res) => {
    res.send("Yo, this is the controller speaking from ./src/controllers/getPlayerDemo.js !")
};

module.exports = {
    getTestMessage
};