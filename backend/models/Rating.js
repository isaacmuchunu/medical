import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: String,
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reportCount: {
    type: Number,
    default: 0,
  },
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true
});

// Ensure one rating per appointment
ratingSchema.index({ appointmentId: 1 }, { unique: true });
ratingSchema.index({ doctorId: 1, createdAt: -1 });
ratingSchema.index({ patientId: 1, createdAt: -1 });

const Rating = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);

export default Rating; 