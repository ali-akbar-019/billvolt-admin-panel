const mongoose = require('mongoose');

const CREDENTIALING_STATUSES = [
  'not_started',
  'in_progress',
  'submitted',
  'approved',
  'denied',
  'expired',
];

const credentialingRecordSchema = new mongoose.Schema(
  {
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
    payerName: { type: String, required: true, trim: true, index: true }, // e.g. Aetna, BCBS, Medicare
    status: { type: String, enum: CREDENTIALING_STATUSES, default: 'not_started', index: true },
    submittedDate: { type: Date },
    approvedDate: { type: Date },
    expirationDate: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// A provider should only have one active record per payer
credentialingRecordSchema.index({ providerId: 1, payerName: 1 }, { unique: true });

module.exports = mongoose.model('CredentialingRecord', credentialingRecordSchema);
module.exports.CREDENTIALING_STATUSES = CREDENTIALING_STATUSES;
