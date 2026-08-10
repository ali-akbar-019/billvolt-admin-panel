const express = require('express');
const orgSettingsController = require('../controllers/orgSettings.controller');
const validate = require('../middleware/validate.middleware');
const { updateOrgSettingsSchema } = require('../validators/orgSettings.validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.get('/', orgSettingsController.getSettings);
router.patch('/', authorize('admin'), validate(updateOrgSettingsSchema), orgSettingsController.updateSettings);

module.exports = router;
