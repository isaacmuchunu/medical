import Doctor from '../models/Doctor';
import Department from '../models/Department';
import { sanitizeInput } from '../utils/validation';
import { rateLimit } from '../utils/rateLimit';

const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 // limit each IP to 30 searches per minute
});

export async function searchDoctors(query, filters = {}, req) {
  await searchRateLimit(req);

  const sanitizedQuery = sanitizeInput(query);
  let searchQuery = {};

  if (sanitizedQuery) {
    searchQuery['$or'] = [
      { 'profile.name': { $regex: sanitizedQuery, $options: 'i' } },
      { specialization: { $regex: sanitizedQuery, $options: 'i' } },
      { 'profile.qualifications': { $regex: sanitizedQuery, $options: 'i' } }
    ];
  }

  // Apply filters
  if (filters.specialization) {
    searchQuery.specialization = filters.specialization;
  }
  if (filters.department) {
    searchQuery.departmentId = filters.department;
  }
  if (filters.availability) {
    searchQuery['availability.day'] = filters.availability;
  }
  if (filters.minRating) {
    searchQuery['ratings.average'] = { $gte: parseFloat(filters.minRating) };
  }

  return Doctor.find(searchQuery)
    .select('-availability.slots.isBooked') // Security: Don't expose booking details
    .populate('departmentId', 'name')
    .sort({ 'ratings.average': -1 });
} 