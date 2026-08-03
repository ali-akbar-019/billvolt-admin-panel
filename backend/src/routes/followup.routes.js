const express = require('express');
const followUpController = require('../controllers/followup.controller');
const validate = require('../middleware/validate.middleware');
const { createFollowUpSchema, updateFollowUpSchema } = require('../validators/followup.validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', followUpController.listFollowUps);
router.get('/counts', followUpController.getCounts);
router.get('/:id', followUpController.getFollowUp);
router.post('/', validate(createFollowUpSchema), followUpController.createFollowUp);
router.patch('/:id', validate(updateFollowUpSchema), followUpController.updateFollowUp);
router.delete('/:id', authorize('admin'), followUpController.deleteFollowUp);

module.exports = router;
