const mongoose = require('mongoose');

const ACTIVITY_TYPES = ['call', 'email', 'portal_update', 'fax', 'submission', 'approval', 'note', 'status_change'];

const timelineEntrySchema = new mongoose.Schema(
  {
    credentialingRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'CredentialingRecord', required: true, index: true },
    activityType: { type: String, enum: ACTIVITY_TYPES, default: 'note' },
    notes: { type: String, required: true, trim: true },
    referenceNumber: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

timelineEntrySchema.index({ credentialingRecordId: 1, createdAt: -1 });

module.exports = mongoose.model('TimelineEntry', timelineEntrySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
