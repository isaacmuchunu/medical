import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  relationship: String,
  phone: {
    type: String,
    required: true,
  },
  email: String,
  address: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  lastNotified: Date,
}, {
  timestamps: true
}); 