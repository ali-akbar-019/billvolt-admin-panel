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

module.exports = mongoose.model('FollowUp', followUpSchema);
