const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const {
  inviteByEmail,
  inviteByCSV,
  validateInviteToken,
  acceptInviteToken,
  getPendingInvitations,
  revokeInvitation,
  generateInviteLink,
} = require('../controllers/invite.controller');


const router = express.Router();

// CSV file upload (memory storage, 1MB limit for CSVs)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// ── Public routes (no auth needed — for checking invite links) ────────────────
router.get('/token/:token', validateInviteToken);

// ── Authenticated routes ──────────────────────────────────────────────────────
router.post('/token/:token/accept', authMiddleware, acceptInviteToken);

// ── Project-scoped invite routes (admin only) ─────────────────────────────────
router.post(
  '/projects/:id/invite',
  authMiddleware,
  roleMiddleware('ADMIN'),
  inviteByEmail
);

// Generate invite link only (no email sent) — for sharing via WhatsApp/Slack/etc.
router.post(
  '/projects/:id/invite/link',
  authMiddleware,
  roleMiddleware('ADMIN'),
  generateInviteLink
);

router.post(
  '/projects/:id/invite/csv',
  authMiddleware,
  roleMiddleware('ADMIN'),
  csvUpload.single('file'),
  inviteByCSV
);

router.get(
  '/projects/:id/invitations',
  authMiddleware,
  roleMiddleware('ADMIN'),
  getPendingInvitations
);

router.delete(
  '/projects/:id/invitations/:inviteId',
  authMiddleware,
  roleMiddleware('ADMIN'),
  revokeInvitation
);

module.exports = router;
