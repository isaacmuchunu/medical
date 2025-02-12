import mongoose from 'mongoose';
import crypto from 'crypto';

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  hashedKey: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  permissions: [{
    type: String,
  }],
  lastUsed: Date,
  expiresAt: Date,
  ipRestrictions: [String],
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

apiKeySchema.pre('save', function(next) {
  if (this.isModified('key')) {
    this.hashedKey = crypto
      .createHash('sha256')
      .update(this.key)
      .digest('hex');
  }
  next();
});

const ApiKey = mongoose.models.ApiKey || mongoose.model('ApiKey', apiKeySchema);

export default ApiKey; 