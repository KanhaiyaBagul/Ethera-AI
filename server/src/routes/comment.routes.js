const express = require('express');
const { getComments, createComment, deleteComment } = require('../controllers/comment.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/task/:taskId', getComments);
router.post('/task/:taskId', createComment);
router.delete('/:id', deleteComment);

module.exports = router;
