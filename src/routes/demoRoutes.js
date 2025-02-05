const express = require('express');
const demoController = require('../controllers/getPlayerDemo');

const router = express.Router();

router.get('/', demoController.getTestMessage);

module.exports = router;