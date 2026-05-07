const express = require('express');
const { getProjects, createProject, getProjectById, updateProject, deleteProject } = require('../controllers/project.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createProjectSchema, updateProjectSchema } = require('../schemas/project.schema');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProjects);
router.post('/', validate(createProjectSchema), createProject);
router.get('/:id', roleMiddleware('ADMIN', 'MEMBER'), getProjectById);
router.put('/:id', validate(updateProjectSchema), roleMiddleware('ADMIN'), updateProject);
router.delete('/:id', roleMiddleware('ADMIN'), deleteProject);

module.exports = router;
