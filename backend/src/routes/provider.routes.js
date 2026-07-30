const express = require('express');
const providerController = require('../controllers/provider.controller');
const validate = require('../middleware/validate.middleware');
const { createProviderSchema, updateProviderSchema } = require('../validators/provider.validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', providerController.listProviders);
router.get('/:id', providerController.getProvider);
router.get('/:id/sensitive', authorize('admin'), providerController.getSensitiveFields);
router.post('/', validate(createProviderSchema), providerController.createProvider);
router.patch('/:id', validate(updateProviderSchema), providerController.updateProvider);
router.delete('/:id', authorize('admin'), providerController.deleteProvider);

module.exports = router;
