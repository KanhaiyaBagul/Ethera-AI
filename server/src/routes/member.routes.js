const express = require('express');
const { getMembers, addMember, updateMemberRole, removeMember } = require('../controllers/member.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { addMemberSchema, updateMemberRoleSchema } = require('../schemas/project.schema');

const router = express.Router();

router.use(authMiddleware);

// These routes are mounted under /api/projects
router.get('/:id/members', roleMiddleware('ADMIN', 'MEMBER'), getMembers);
router.post('/:id/members', validate(addMemberSchema), roleMiddleware('ADMIN'), addMember);
router.patch('/:id/members/:userId', validate(updateMemberRoleSchema), roleMiddleware('ADMIN'), updateMemberRole);
router.delete('/:id/members/:userId', roleMiddleware('ADMIN'), removeMember);

module.exports = router;
