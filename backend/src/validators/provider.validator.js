const { z } = require('zod');

const licenseShape = z.object({
  type: z.string().trim().optional(),
  number: z.string().trim().optional(),
  state: z.string().trim().optional(),
  issueDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  status: z.enum(['active', 'expired', 'pending']).optional(),
});

const deaShape = z.object({
  number: z.string().trim().optional(),
  state: z.string().trim().optional(),
  issueDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  status: z.enum(['active', 'expired', 'pending']).optional(),
});

const contactShape = z
  .object({
    phone: z.string().trim().optional(),
    email: z.string().trim().email('Invalid contact email').optional().or(z.literal('')),
  })
  .partial()
  .optional();

const homeAddressShape = z
  .object({
    street: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zip: z.string().trim().optional(),
  })
  .partial()
  .optional();

const caqhShape = z
  .object({
    caqhId: z.string().trim().optional(),
    username: z.string().trim().optional(),
    password: z.string().trim().optional(),
    lastAttestedDate: z.coerce.date().optional(),
    nextAttestationDue: z.coerce.date().optional(),
    status: z.enum(['current', 'due_soon', 'overdue', 'not_linked']).optional(),
  })
  .partial()
  .optional();

const baseProviderShape = {
  name: z.string().trim().min(1, 'Name is required'),
  providerType: z.string().trim().optional(),
  npi: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  secondarySpecialty: z.string().trim().optional(),
  taxonomy: z.string().trim().optional(),
  dob: z.coerce.date().optional(),
  gender: z.string().trim().optional(),
  ssn: z.string().trim().optional(),
  practiceId: z.string().trim().min(1, 'A practice must be selected'),
  contact: contactShape,
  homeAddress: homeAddressShape,
  licenses: z.array(licenseShape).optional(),
  deaRegistrations: z.array(deaShape).optional(),
  caqh: caqhShape,
  assignedSpecialist: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
};

const createProviderSchema = z.object(baseProviderShape);

const updateProviderSchema = z.object({
  ...baseProviderShape,
  name: baseProviderShape.name.optional(),
  practiceId: baseProviderShape.practiceId.optional(),
});

module.exports = { createProviderSchema, updateProviderSchema };
