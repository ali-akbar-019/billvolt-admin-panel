const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    linkedType: { type: String, enum: ['CredentialingRecord', 'Provider'], required: true },
    linkedId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'linkedType' },
    dueDate: { type: Date, required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending', index: true },
  },
  { timestamps: true }
);

// Matches the exact filter shape used by every follow-ups list/count query
followUpSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
