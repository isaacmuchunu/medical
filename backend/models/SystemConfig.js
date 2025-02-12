import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  category: {
    type: String,
    enum: ['general', 'appointment', 'payment', 'notification', 'security'],
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true
});

const SystemConfig = mongoose.models.SystemConfig || mongoose.model('SystemConfig', systemConfigSchema);

export default SystemConfig; 