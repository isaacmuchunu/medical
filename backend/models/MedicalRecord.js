import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['diagnosis', 'prescription', 'procedure', 'note'],
    required: true,
  },
  diagnosis: {
    condition: String,
    icdCode: String,
    severity: String,
    notes: String,
  },
  prescription: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      startDate: Date,
      endDate: Date,
      instructions: String,
    }],
  },
  attachments: [{
    type: String,
    url: String,
    name: String,
  }],
  version: {
    type: Number,
    default: 1,
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord',
  },
}, {
  timestamps: true
});

// Indexes for efficient querying
medicalRecordSchema.index({ patientId: 1, createdAt: -1 });
medicalRecordSchema.index({ doctorId: 1, createdAt: -1 });
medicalRecordSchema.index({ type: 1, createdAt: -1 });

const MedicalRecord = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord; 