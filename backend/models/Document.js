import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['lab_report', 'prescription', 'medical_certificate', 'imaging', 'other'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: String,
  fileSize: Number,
  isConfidential: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  metadata: {
    originalName: String,
    contentType: String,
    lastModified: Date,
  }
}, {
  timestamps: true
});

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);

export default Document; 