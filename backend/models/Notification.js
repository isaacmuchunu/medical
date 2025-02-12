import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: String,
  type: {
    type: String,
    enum: ['appointment', 'lab_result', 'prescription', 'message', 'system'],
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
  },
  relatedModel: {
    type: String,
    enum: ['Appointment', 'LabResult', 'Prescription', 'Message'],
  },
  read: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  actionUrl: String,
}, {
  timestamps: true
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification; 