const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    npi: { type: String, trim: true, index: true },
    licenseNumber: { type: String, trim: true },
    specialty: { type: String, trim: true, index: true },
    dob: { type: Date },
    ssn: { type: String, select: false }, // TODO: encrypt at rest before this holds real data
    practiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practice', required: true, index: true },
    contact: {
      phone: String,
      email: String,
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

providerSchema.virtual('credentialingRecords', {
  ref: 'CredentialingRecord',
  localField: '_id',
  foreignField: 'providerId',
});

module.exports = mongoose.model('Provider', providerSchema);
