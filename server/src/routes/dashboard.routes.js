const express = require('express');
const { getDashboardStats } = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getDashboardStats);

module.exports = router;
