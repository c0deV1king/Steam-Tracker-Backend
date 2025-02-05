const express = require('express');
const playerProfile = require('../src/getPlayerSummary')

let playerSummary = express.Router();

playerSummary.get('/', playerProfile.getPlayerSummary)

module.exports = playerSummary;