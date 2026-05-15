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
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  ownerEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  subscription: {
    plan: {
      type: String,
      enum: ['FREE', 'PRO', 'ENTERPRISE'],
      default: 'FREE'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING'],
      default: 'ACTIVE'
    },
    currentPeriodEnd: Date,
    customerId: String
  },
  usage: {
    totalProjects: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 } // in bytes
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  settings: {
    timezone: { type: String, default: 'UTC' },
    dailyLogReminderTime: { type: String, default: '18:00' },
    allowedDomains: [String]
  }
}, {
  timestamps: true
});

organizationSchema.index({ 'subscription.plan': 1 });


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