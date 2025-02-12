import { createAuditLog } from './audit';
import { sendNotification } from './notification';

const ALERT_THRESHOLDS = {
  failedLogins: 5,
  apiErrors: 10,
  suspiciousActivities: 3
};

export async function monitorSecurityEvents(event) {
  const { type, userId, details } = event;

  // Log security event
  await createAuditLog({
    userId,
    action: 'security_event',
    entityType: 'security',
    details: {
      type,
      ...details
    }
  });

  // Check thresholds
  const recentEvents = await getRecentSecurityEvents(type, userId);
  
  if (recentEvents.length >= ALERT_THRESHOLDS[type]) {
    await handleSecurityAlert({
      type,
      userId,
      events: recentEvents,
      details
    });
  }
}

async function handleSecurityAlert(alert) {
  // Notify administrators
  await sendNotification({
    role: 'admin',
    title: 'Security Alert',
    message: `Security threshold exceeded: ${alert.type}`,
    type: 'security',
    priority: 'high',
    data: alert
  });

  // Take automated actions based on type
  switch (alert.type) {
    case 'failedLogins':
      await temporarilyLockAccount(alert.userId);
      break;
    case 'apiErrors':
      await disableApiKey(alert.details.apiKeyId);
      break;
    case 'suspiciousActivities':
      await flagAccountForReview(alert.userId);
      break;
  }
} 