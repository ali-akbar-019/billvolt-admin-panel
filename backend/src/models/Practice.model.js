const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
  },
  { _id: false }
);

const serviceLocationSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true }, // e.g. "Main office", "Satellite - Downtown"
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const practiceSchema = new mongoose.Schema(
  {
    // Core identity — FR-002 Tab 1
    groupName: { type: String, required: true, trim: true, index: true },
    dbaName: { type: String, trim: true },
    groupNpi: { type: String, trim: true, index: true },
    taxId: { type: String, trim: true },
    orgType: { type: String, trim: true }, // Group Practice / Solo / Hospital / Billing Entity, admin-defined
    taxonomy: { type: String, trim: true },
    cliaNumber: { type: String, trim: true },
    medicarePtan: { type: String, trim: true },
    medicaidProviderNumber: { type: String, trim: true },

    contact: {
      phone: { type: String, trim: true },
      fax: { type: String, trim: true },
      email: { type: String, trim: true },
      website: { type: String, trim: true },
    },

    // Multiple service locations, oldest first — history is kept, not overwritten
    serviceLocations: [serviceLocationSchema],

    mailingAddress: addressSchema,
    billingAddress: addressSchema,

    owner: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },

    notes: { type: String, trim: true },

    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Free-text search across the fields staff actually search by
practiceSchema.index({ groupName: 'text', dbaName: 'text', groupNpi: 'text', taxId: 'text' });

// Virtual: providers linked to this practice (populate on demand)
practiceSchema.virtual('providers', {
  ref: 'Provider',
  localField: '_id',
  foreignField: 'practiceId',
});

practiceSchema.set('toJSON', { virtuals: true });
practiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Practice', practiceSchema);
