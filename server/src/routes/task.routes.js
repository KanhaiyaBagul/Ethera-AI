const express = require('express');
const { 
  getTasks, createTask, getTaskById, updateTask, updateTaskStatus, deleteTask, exportTasksCSV,
  addChecklistItem, updateChecklistItem, deleteChecklistItem
} = require('../controllers/task.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } = require('../schemas/task.schema');

const router = express.Router();

router.use(authMiddleware);

// Project task routes
router.get('/projects/:id/tasks', roleMiddleware('ADMIN', 'MEMBER'), getTasks);
router.post('/projects/:id/tasks', validate(createTaskSchema), roleMiddleware('ADMIN'), createTask);
router.get('/projects/:id/tasks/export', roleMiddleware('ADMIN', 'MEMBER'), exportTasksCSV); // CSV export

// Individual task routes
router.get('/tasks/:id', getTaskById);
router.put('/tasks/:id', validate(updateTaskSchema), updateTask);
router.patch('/tasks/:id/status', validate(updateTaskStatusSchema), updateTaskStatus);
router.delete('/tasks/:id', deleteTask);

// Checklist routes
router.post('/tasks/:taskId/checklist', addChecklistItem);
router.patch('/checklist/:itemId', updateChecklistItem);
router.delete('/checklist/:itemId', deleteChecklistItem);

module.exports = router;
