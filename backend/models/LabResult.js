import mongoose from 'mongoose';

const labResultSchema = new mongoose.Schema({
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
  testType: {
    type: String,
    required: true,
  },
  results: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
  },
  normalRanges: {
    type: Map,
    of: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
  },
  reportUrl: String,
  issuedDate: Date,
  collectedDate: Date,
  comments: String,
  criticalValues: [{
    parameter: String,
    value: String,
    alertSent: Boolean,
  }],
}, {
  timestamps: true
});

labResultSchema.index({ patientId: 1, createdAt: -1 });
labResultSchema.index({ doctorId: 1, createdAt: -1 });

const LabResult = mongoose.models.LabResult || mongoose.model('LabResult', labResultSchema);

export default LabResult; 