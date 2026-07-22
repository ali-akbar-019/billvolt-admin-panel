const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.me);

// Admin-only: create new staff/admin accounts (no public self-signup)
router.post('/register', protect, authorize('admin'), validate(registerSchema), authController.register);

module.exports = router;
