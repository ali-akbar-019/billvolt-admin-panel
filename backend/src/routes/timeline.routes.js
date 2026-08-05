const express = require('express');
const timelineController = require('../controllers/timeline.controller');
const validate = require('../middleware/validate.middleware');
const { createTimelineEntrySchema } = require('../validators/timeline.validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', timelineController.listEntries);
router.post('/', validate(createTimelineEntrySchema), timelineController.createEntry);
router.delete('/:id', authorize('admin'), timelineController.deleteEntry);

module.exports = router;
