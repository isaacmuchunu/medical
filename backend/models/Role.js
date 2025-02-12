import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isSystem: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

export default Role; 