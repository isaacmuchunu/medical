import Rating from '../models/Rating';
import Doctor from '../models/Doctor';
import { rateLimit } from '../utils/rateLimit';
import { createAuditLog } from './audit';
import { analyzeSentiment } from '../utils/ai';

const ratingRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5 // limit each IP to 5 ratings per day
});

export async function submitRating(data, user, req) {
  await ratingRateLimit(req);

  const { appointmentId, doctorId, rating, review } = data;

  // Check for existing rating
  const existingRating = await Rating.findOne({ appointmentId });
  if (existingRating) {
    throw new Error('Rating already exists for this appointment');
  }

  // Analyze sentiment if review is provided
  let sentiment;
  if (review) {
    sentiment = await analyzeSentiment(review);
  }

  // Create rating
  const newRating = await Rating.create({
    doctorId,
    patientId: user.id,
    appointmentId,
    rating,
    review,
    sentiment,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  // Update doctor's average rating
  await updateDoctorRating(doctorId);

  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: 'submit_rating',
    entityType: 'rating',
    entityId: newRating._id,
    details: { doctorId, rating }
  });

  return newRating;
}

async function updateDoctorRating(doctorId) {
  const ratings = await Rating.find({
    doctorId,
    status: 'approved'
  });

  const averageRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;

  await Doctor.findByIdAndUpdate(doctorId, {
    $set: {
      'ratings.average': averageRating,
      'ratings.count': ratings.length
    }
  });
} 