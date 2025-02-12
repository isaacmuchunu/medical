import { getIO } from './realtime';
import { createAuditLog } from './audit';

export async function initiateVideoCall(appointmentId, initiatorId) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('doctorId patientId');

  const room = `consultation-${appointmentId}`;
  const io = getIO();

  // Generate meeting credentials
  const meetingCredentials = await generateMeetingToken(room);

  // Notify participants
  io.to(`user:${appointment.doctorId._id}`).emit('video-call', {
    type: 'incoming',
    appointmentId,
    credentials: meetingCredentials
  });

  io.to(`user:${appointment.patientId._id}`).emit('video-call', {
    type: 'incoming',
    appointmentId,
    credentials: meetingCredentials
  });

  await createAuditLog({
    userId: initiatorId,
    action: 'initiate_video_call',
    entityType: 'appointment',
    entityId: appointmentId
  });

  return meetingCredentials;
} 