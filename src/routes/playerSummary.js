const express = require('express');
const playerProfile = require('../controllers/getPlayerSummary')

let router = express.Router();

router.get('/', playerProfile.getPlayerSummary)

module.exports = router;