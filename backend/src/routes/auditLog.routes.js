const express = require('express');
const auditLogController = require('../controllers/auditLog.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', auditLogController.listLogs);

module.exports = router;