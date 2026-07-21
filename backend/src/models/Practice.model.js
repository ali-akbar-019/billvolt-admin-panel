const mongoose = require('mongoose');

const practiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    taxId: { type: String, trim: true },
    npi: { type: String, trim: true }, // organization-level NPI
    specialtyFocus: { type: String, trim: true },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    primaryContact: {
      name: String,
      phone: String,
      email: String,
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Virtual: providers linked to this practice (populate on demand)
practiceSchema.virtual('providers', {
  ref: 'Provider',
  localField: '_id',
  foreignField: 'practiceId',
});

practiceSchema.set('toJSON', { virtuals: true });
practiceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Practice', practiceSchema);
