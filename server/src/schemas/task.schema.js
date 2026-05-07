const { z } = require('zod');

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    dueDate: z.string().datetime().optional(), // ISO string
    assignedToId: z.string().uuid().optional(),
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate: z.string().datetime().optional(),
    assignedToId: z.string().uuid().optional().nullable(),
  }),
});

const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  }),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
};
