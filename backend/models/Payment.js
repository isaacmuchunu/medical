import mongoose from 'mongoose';
import { encrypt } from '../utils/encryption';

const paymentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'cash'],
    required: true,
  },
  // Encrypted payment details
  paymentDetails: {
    type: String, // Encrypted string
    select: false, // Not included in queries by default
  },
  stripePaymentId: {
    type: String,
    sparse: true, // Allows null values but ensures uniqueness when present
    select: false,
  },
  refundReason: String,
  metadata: {
    type: Map,
    of: String,
  },
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true
});

// Indexes for security and performance
paymentSchema.index({ appointmentId: 1 }, { unique: true });
paymentSchema.index({ patientId: 1, createdAt: -1 });
paymentSchema.index({ doctorId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Middleware to encrypt sensitive payment details
paymentSchema.pre('save', async function(next) {
  if (this.isModified('paymentDetails')) {
    this.paymentDetails = await encrypt(this.paymentDetails);
  }
  next();
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment; 