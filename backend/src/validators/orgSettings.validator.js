const { z } = require('zod');

const updateOrgSettingsSchema = z.object({
  orgName: z.string().trim().min(1).optional(),
  timezone: z.string().trim().optional(),
  contactEmail: z.string().trim().email('Invalid contact email').optional().or(z.literal('')),
  sessionTimeoutMinutes: z.coerce.number().min(5).max(480).optional(),
  notifyOnOverdueFollowUps: z.boolean().optional(),
});

module.exports = { updateOrgSettingsSchema };
