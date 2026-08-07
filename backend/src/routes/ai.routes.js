const express = require('express');
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.post('/query', aiController.askQuestion);

module.exports = router;
