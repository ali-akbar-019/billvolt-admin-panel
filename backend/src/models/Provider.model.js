const mongoose = require('mongoose');
const { encryptField, decryptField } = require('../utils/crypto.util');

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    npi: { type: String, trim: true, index: true },
    licenseNumber: { type: String, trim: true },
    specialty: { type: String, trim: true, index: true },
    dob: { type: Date },
    // Encrypted at rest — never queryable, never logged in plaintext.
    ssn: {
      type: String,
      select: false,
      set: (value) => (value ? encryptField(value) : value),
      get: (value) => (value ? decryptField(value) : value),
    },
    practiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practice', required: true, index: true },
    contact: {
      phone: String,
      email: String,
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true, toJSON: { getters: true }, toObject: { getters: true } }
);

providerSchema.virtual('credentialingRecords', {
  ref: 'CredentialingRecord',
  localField: '_id',
  foreignField: 'providerId',
});

module.exports = mongoose.model('Provider', providerSchema);
