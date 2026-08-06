const express = require('express');
const reportsController = require('../controllers/reports.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/summary', reportsController.getSummary);

module.exports = router;
