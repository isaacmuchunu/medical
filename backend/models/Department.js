import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  headDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  }],
  specializations: [String],
  contactInfo: {
    email: String,
    phone: String,
    location: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);

export default Department; 