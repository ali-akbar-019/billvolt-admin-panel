const { z } = require('zod');
const { CREDENTIALING_STATUSES } = require('../models/CredentialingRecord.model');

const baseShape = {
  providerId: z.string().trim().min(1, 'A provider must be selected'),
  payerName: z.string().trim().min(1, 'Payer name is required'),
  status: z.enum(CREDENTIALING_STATUSES).optional(),
  submittedDate: z.coerce.date().optional(),
  approvedDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  nextFollowUpDate: z.coerce.date().nullable().optional(),
  assignedTo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
};

const createCredentialingSchema = z.object(baseShape);

const updateCredentialingSchema = z.object({
  ...baseShape,
  providerId: baseShape.providerId.optional(),
  payerName: baseShape.payerName.optional(),
});

module.exports = { createCredentialingSchema, updateCredentialingSchema };
