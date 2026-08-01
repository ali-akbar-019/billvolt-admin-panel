const express = require('express');
const credentialingController = require('../controllers/credentialing.controller');
const validate = require('../middleware/validate.middleware');
const { createCredentialingSchema, updateCredentialingSchema } = require('../validators/credentialing.validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', credentialingController.listRecords);
router.get('/:id', credentialingController.getRecord);
router.post('/', validate(createCredentialingSchema), credentialingController.createRecord);
router.patch('/:id', validate(updateCredentialingSchema), credentialingController.updateRecord);
router.delete('/:id', authorize('admin'), credentialingController.deleteRecord);

module.exports = router;
