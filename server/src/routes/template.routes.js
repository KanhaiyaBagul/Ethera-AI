const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { createTemplate, listTemplates, deleteTemplate, createProjectFromTemplate } = require('../controllers/template.controller');

const router = express.Router();

router.get('/', authMiddleware, listTemplates);
router.post('/', authMiddleware, createTemplate);
router.delete('/:id', authMiddleware, deleteTemplate);
router.post('/apply/:templateId', authMiddleware, createProjectFromTemplate);

module.exports = router;
