const mongoose = require('mongoose');
const { encryptField, decryptField } = require('../utils/crypto.util');

const encryptedString = {
  type: String,
  select: false,
  set: (value) => (value ? encryptField(value) : value),
  get: (value) => (value ? decryptField(value) : value),
};

const licenseSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true }, // e.g. "Medical License"
    number: { type: String, trim: true },
    state: { type: String, trim: true },
    issueDate: { type: Date },
    expirationDate: { type: Date },
    status: { type: String, enum: ['active', 'expired', 'pending'], default: 'active' },
  },
  { timestamps: true }
);

const deaRegistrationSchema = new mongoose.Schema(
  {
    number: { type: String, trim: true },
    state: { type: String, trim: true },
    issueDate: { type: Date },
    expirationDate: { type: Date },
    status: { type: String, enum: ['active', 'expired', 'pending'], default: 'active' },
  },
  { timestamps: true }
);

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    providerType: { type: String, trim: true }, // MD / DO / NP / PA / etc.
    npi: { type: String, trim: true, index: true }, // individual NPI
    specialty: { type: String, trim: true, index: true },
    secondarySpecialty: { type: String, trim: true },
    taxonomy: { type: String, trim: true },
    dob: { type: Date },
    gender: { type: String, trim: true },

    // Encrypted at rest — never queryable, never logged in plaintext, hidden by default.
    ssn: encryptedString,

    practiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practice', required: true, index: true },

    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },

    homeAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },

    licenses: [licenseSchema],
    deaRegistrations: [deaRegistrationSchema],

    // CAQH — stored as a secure linked account, never plain text.
    caqh: {
      caqhId: { type: String, trim: true },
      username: encryptedString,
      password: encryptedString,
      lastAttestedDate: { type: Date },
      nextAttestationDue: { type: Date },
      status: { type: String, enum: ['current', 'due_soon', 'overdue', 'not_linked'], default: 'not_linked' },
    },

    assignedSpecialist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

providerSchema.index({ name: 'text', npi: 'text', specialty: 'text' });

providerSchema.virtual('credentialingRecords', {
  ref: 'CredentialingRecord',
  localField: '_id',
  foreignField: 'providerId',
});

providerSchema.set('toJSON', { virtuals: true, getters: true });
providerSchema.set('toObject', { virtuals: true, getters: true });

module.exports = mongoose.model('Provider', providerSchema);
