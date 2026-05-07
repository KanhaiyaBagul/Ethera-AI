const express = require('express');
const { globalSearch } = require('../controllers/search.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', globalSearch);

module.exports = router;
