import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  resource: {
    type: String,
    required: true,
  },
  actions: [{
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'manage'],
  }],
  conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  }
}, {
  timestamps: true
});

const Permission = mongoose.models.Permission || mongoose.model('Permission', permissionSchema);

export default Permission; 