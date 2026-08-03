const { z } = require('zod');

const baseShape = {
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional(),
  linkedType: z.enum(['CredentialingRecord', 'Provider']),
  linkedId: z.string().trim().min(1, 'linkedId is required'),
  dueDate: z.coerce.date(),
  assignedTo: z.string().trim().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
};

const createFollowUpSchema = z.object(baseShape);

const updateFollowUpSchema = z.object({
  title: baseShape.title.optional(),
  description: baseShape.description,
  dueDate: baseShape.dueDate.optional(),
  assignedTo: baseShape.assignedTo,
  priority: baseShape.priority,
  status: z.enum(['pending', 'completed']).optional(),
});

module.exports = { createFollowUpSchema, updateFollowUpSchema };
