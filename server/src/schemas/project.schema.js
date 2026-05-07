const { z } = require('zod');

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters').max(50),
    description: z.string().max(200).optional(),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50).optional(),
    description: z.string().max(200).optional(),
  }),
});

const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'MEMBER']),
  }),
});

const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MEMBER']),
  }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
};
