const { z } = require('zod');

const updateUserSchema = z.object({
  role: z.enum(['admin', 'staff']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  assignedPracticeIds: z.array(z.string()).optional(),
});

module.exports = { updateUserSchema };
