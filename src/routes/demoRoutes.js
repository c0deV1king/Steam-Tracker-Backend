const express = require('express');
const demoController = require('../controllers/getPlayerDemo');

let router = express.Router();

router.get('/', demoController.getTestMessage);