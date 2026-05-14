import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  ownerEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  plan: {
    type: String,
    enum: ['FREE', 'PRO', 'ENTERPRISE'],
    default: 'FREE'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    timezone: { type: String, default: 'UTC' },
    dailyLogReminderTime: { type: String, default: '18:00' }
  }
}, {
  timestamps: true,
  indexes: [
    { ownerEmail: 1 }
  ]
});

// Generate slug from name
organizationSchema.statics.generateSlug = async function(name) {
  let baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  let slug = baseSlug;
  let counter = 0;

  while (await this.findOne({ slug })) {
    counter++;
    slug = `${baseSlug}-${Math.random().toString(36).substr(2, 4)}`;
  }

  return slug;
};

export const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;