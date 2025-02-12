export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  // Ensure dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  // Ensure start is before end
  if (start >= end) return false;

  // Prevent future dates
  if (end > now) return false;

  // Limit range to 1 year
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (end - start > oneYear) return false;

  return true;
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '');
}

export function validatePaymentData(data) {
  const requiredFields = ['amount', 'paymentMethod', 'appointmentId'];
  for (const field of requiredFields) {
    if (!data[field]) return false;
  }

  if (typeof data.amount !== 'number' || data.amount <= 0) return false;
  if (!['card', 'bank_transfer', 'cash'].includes(data.paymentMethod)) return false;

  return true;
} 