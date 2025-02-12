import Audit from '../models/Audit';

export async function createAuditLog(data) {
  try {
    await Audit.create(data);
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
}

export async function getAuditLogs(filters, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const query = {};
  if (filters.userId) query.userId = filters.userId;
  if (filters.entityType) query.entityType = filters.entityType;
  if (filters.entityId) query.entityId = filters.entityId;
  if (filters.action) query.action = filters.action;
  
  const [logs, total] = await Promise.all([
    Audit.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'profile role'),
    Audit.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit
    }
  };
} 