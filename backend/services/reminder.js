import { scheduleJob } from 'node-schedule';
import Appointment from '../models/Appointment';
import { getIO } from './websocket';
import { createNotification } from './notification';

export async function scheduleAppointmentReminders() {
  // Schedule daily job to check and send reminders
  scheduleJob('0 0 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get appointments for tomorrow
      const appointments = await Appointment.find({
        dateTime: {
          $gte: new Date(tomorrow.setHours(0, 0, 0)),
          $lt: new Date(tomorrow.setHours(23, 59, 59))
        },
        status: 'confirmed'
      }).populate('patientId').populate('doctorId');

      // Send reminders for each appointment
      for (const appointment of appointments) {
        await sendAppointmentReminder(appointment);
      }
    } catch (error) {
      console.error('Appointment Reminder Error:', error);
    }
  });
}

export async function sendAppointmentReminder(appointment) {
  try {
    // Create notification for patient
    await createNotification({
      userId: appointment.patientId._id,
      title: 'Appointment Reminder',
      message: `You have an appointment with Dr. ${appointment.doctorId.profile.name} tomorrow at ${new Date(appointment.dateTime).toLocaleTimeString()}`,
      type: 'appointment',
      relatedId: appointment._id,
      relatedModel: 'Appointment',
      priority: 'high'
    });

    // Create notification for doctor
    await createNotification({
      userId: appointment.doctorId._id,
      title: 'Appointment Reminder',
      message: `You have an appointment with ${appointment.patientId.profile.name} tomorrow at ${new Date(appointment.dateTime).toLocaleTimeString()}`,
      type: 'appointment',
      relatedId: appointment._id,
      relatedModel: 'Appointment',
      priority: 'high'
    });

    // Send real-time notifications
    const io = getIO();
    io.to(`user:${appointment.patientId._id}`).emit('notification', {
      type: 'appointment_reminder',
      appointment
    });
    io.to(`user:${appointment.doctorId._id}`).emit('notification', {
      type: 'appointment_reminder',
      appointment
    });
  } catch (error) {
    console.error('Send Reminder Error:', error);
  }
} 