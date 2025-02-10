const express = require('express');
const playerProfile = require('../controllers/getPlayerSummary')

const router = express.Router();

router.get('/', playerProfile.getPlayerSummary)

module.exports = router;