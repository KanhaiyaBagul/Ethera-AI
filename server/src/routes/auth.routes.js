const express = require('express');
const { signup, login, getMe } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../schemas/auth.schema');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', authMiddleware, getMe);

module.exports = router;
