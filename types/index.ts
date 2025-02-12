export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'staff';
  profile: {
    name: string;
    phone?: string;
    address?: string;
    photo?: string;
  };
  isActive: boolean;
  lastLogin?: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: 'regular' | 'followup' | 'emergency';
  notes?: string;
  patient?: {
    name: string;
    email: string;
    photo?: string;
  };
  doctor?: {
    name: string;
    specialization: string;
  };
}

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  monthlyStats: {
    name: string;
    appointments: number;
  }[];
}

export interface Patient {
  id: string;
  medicalId: string;
  userId: string;
  email: string;
  profile: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    photo?: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    bloodType?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  status: 'active' | 'inactive';
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
} 