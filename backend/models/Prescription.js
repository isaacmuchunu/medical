import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  medications: [{
    name: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
    },
    duration: String,
    instructions: String,
    quantity: Number,
  }],
  diagnosis: String,
  notes: String,
  issuedDate: {
    type: Date,
    default: Date.now,
  },
  validUntil: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  refills: {
    allowed: {
      type: Number,
      default: 0,
    },
    used: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true
});

const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

export default Prescription; 