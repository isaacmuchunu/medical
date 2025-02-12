import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['appointment', 'revenue', 'patient', 'doctor', 'department'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  metrics: {
    // Appointments
    totalAppointments: Number,
    completedAppointments: Number,
    cancelledAppointments: Number,
    noShowAppointments: Number,
    
    // Revenue
    totalRevenue: Number,
    pendingPayments: Number,
    refundedAmount: Number,
    
    // Patients
    newPatients: Number,
    activePatients: Number,
    totalPatients: Number,
    
    // Doctors
    activeDoctor: Number,
    averageRating: Number,
    consultationHours: Number,
    
    // Departments
    departmentMetrics: [{
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
      },
      appointmentCount: Number,
      revenue: Number,
      patientCount: Number
    }]
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
analyticsSchema.index({ type: 1, date: 1 });

const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

export default Analytics; 