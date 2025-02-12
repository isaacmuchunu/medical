import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';

export async function findOptimalSlots(doctorId, date, duration = 30) {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const dayOfWeek = new Date(date).toLocaleString('en-us', { weekday: 'long' });
    const dayAvailability = doctor.availability.find(a => a.day === dayOfWeek);
    
    if (!dayAvailability) {
      return [];
    }

    // Get existing appointments for the day
    const existingAppointments = await Appointment.find({
      doctorId,
      dateTime: {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59))
      },
      status: { $nin: ['cancelled', 'rejected'] }
    });

    // Convert availability slots to minutes for easier calculation
    const availableSlots = dayAvailability.slots.map(slot => {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      return {
        start: startHour * 60 + startMinute,
        end: endHour * 60 + endMinute,
        isBooked: slot.isBooked
      };
    });

    // Convert existing appointments to blocked time ranges
    const blockedSlots = existingAppointments.map(apt => {
      const startTime = new Date(apt.dateTime);
      const start = startTime.getHours() * 60 + startTime.getMinutes();
      return {
        start,
        end: start + duration
      };
    });

    // Find all possible slots
    const possibleSlots = [];
    for (const slot of availableSlots) {
      if (slot.isBooked) continue;

      for (let time = slot.start; time <= slot.end - duration; time += duration) {
        // Check if this time slot overlaps with any blocked slots
        const isBlocked = blockedSlots.some(
          blocked => time < blocked.end && (time + duration) > blocked.start
        );

        if (!isBlocked) {
          const slotDate = new Date(date);
          slotDate.setHours(Math.floor(time / 60), time % 60);
          possibleSlots.push(slotDate);
        }
      }
    }

    return possibleSlots;
  } catch (error) {
    console.error('Find Optimal Slots Error:', error);
    throw error;
  }
}

export async function suggestAlternativeSlots(doctorId, preferredDate, duration = 30) {
  const alternatives = [];
  const daysToCheck = 7;

  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date(preferredDate);
    date.setDate(date.getDate() + i);
    
    const slots = await findOptimalSlots(doctorId, date, duration);
    if (slots.length > 0) {
      alternatives.push({
        date,
        slots
      });
    }
  }

  return alternatives;
} 