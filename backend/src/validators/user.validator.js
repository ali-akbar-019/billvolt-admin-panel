const { z } = require('zod');

const updateUserSchema = z.object({
  role: z.enum(['admin', 'staff']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

module.exports = { updateUserSchema };
