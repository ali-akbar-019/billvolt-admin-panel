const { z } = require('zod');
const { ACTIVITY_TYPES } = require('../models/TimelineEntry.model');

const createTimelineEntrySchema = z.object({
  credentialingRecordId: z.string().trim().min(1, 'credentialingRecordId is required'),
  activityType: z.enum(ACTIVITY_TYPES).optional(),
  notes: z.string().trim().min(1, 'Notes are required'),
  referenceNumber: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
});

module.exports = { createTimelineEntrySchema };
