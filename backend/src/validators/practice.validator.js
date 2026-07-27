const { z } = require('zod');

const addressShape = z
  .object({
    street: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zip: z.string().trim().optional(),
  })
  .partial()
  .optional();

const serviceLocationShape = z.object({
  label: z.string().trim().optional(),
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  isPrimary: z.boolean().optional(),
  active: z.boolean().optional(),
});

const contactShape = z
  .object({
    phone: z.string().trim().optional(),
    fax: z.string().trim().optional(),
    email: z.string().trim().email('Invalid contact email').optional().or(z.literal('')),
    website: z.string().trim().optional(),
  })
  .partial()
  .optional();

const ownerShape = z
  .object({
    name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email('Invalid owner email').optional().or(z.literal('')),
  })
  .partial()
  .optional();

const basePracticeShape = {
  groupName: z.string().trim().min(1, 'Group name is required'),
  dbaName: z.string().trim().optional(),
  groupNpi: z.string().trim().optional(),
  taxId: z.string().trim().optional(),
  orgType: z.string().trim().optional(),
  taxonomy: z.string().trim().optional(),
  cliaNumber: z.string().trim().optional(),
  medicarePtan: z.string().trim().optional(),
  medicaidProviderNumber: z.string().trim().optional(),
  contact: contactShape,
  serviceLocations: z.array(serviceLocationShape).optional(),
  mailingAddress: addressShape,
  billingAddress: addressShape,
  owner: ownerShape,
  notes: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
};

const createPracticeSchema = z.object(basePracticeShape);

// All fields optional on update — including groupName, since a PATCH may
// only touch one field.
const updatePracticeSchema = z.object({
  ...basePracticeShape,
  groupName: basePracticeShape.groupName.optional(),
});

module.exports = { createPracticeSchema, updatePracticeSchema };
