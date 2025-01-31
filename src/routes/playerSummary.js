const express = require('express');

let playerSummary = express.Router();

playerSummary.use(function (req, res, next) {
    res._json = res.json;
    res.json = function json(obj) {
        obj.apiVersion = 1;
        res._json(obj);
    };
    next();
});

playerSummary.get("/info", (req, res) => {
    const status = {
        "Status": "Running"
    };
    res.send(status);
});

module.exports = playerSummary;