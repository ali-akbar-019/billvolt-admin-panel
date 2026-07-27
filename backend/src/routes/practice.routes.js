const express = require('express');
const practiceController = require('../controllers/practice.controller');
const validate = require('../middleware/validate.middleware');
const { createPracticeSchema, updatePracticeSchema } = require('../validators/practice.validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', practiceController.listPractices);
router.get('/:id', practiceController.getPractice);
router.post('/', validate(createPracticeSchema), practiceController.createPractice);
router.patch('/:id', validate(updatePracticeSchema), practiceController.updatePractice);
router.delete('/:id', authorize('admin'), practiceController.deletePractice);

module.exports = router;
