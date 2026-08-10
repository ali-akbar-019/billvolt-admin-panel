const mongoose = require('mongoose');

// Singleton document — one org per deployment of this portal (see README for
// the multi-tenant note: this build is single-tenant; the settings row is
// created lazily on first GET/PATCH if it doesn't exist yet).
const orgSettingsSchema = new mongoose.Schema(
  {
    orgName: { type: String, trim: true, default: 'BillVolt' },
    timezone: { type: String, trim: true, default: 'America/New_York' },
    contactEmail: { type: String, trim: true },
    sessionTimeoutMinutes: { type: Number, default: 30, min: 5, max: 480 },
    notifyOnOverdueFollowUps: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrgSettings', orgSettingsSchema);
