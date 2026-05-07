const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { getAttachments, uploadAttachment, deleteAttachment, upload } = require('../controllers/attachment.controller');

const router = express.Router();

// All attachment routes require auth + project membership
router.get(
  '/projects/:id/tasks/:taskId/attachments',
  authMiddleware,
  roleMiddleware(),
  getAttachments
);

router.post(
  '/projects/:id/tasks/:taskId/attachments',
  authMiddleware,
  roleMiddleware(),
  upload.single('file'),
  uploadAttachment
);

router.delete(
  '/projects/:id/tasks/:taskId/attachments/:attachmentId',
  authMiddleware,
  roleMiddleware(),
  deleteAttachment
);

module.exports = router;
