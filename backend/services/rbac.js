import Role from '../models/Role';
import Permission from '../models/Permission';
import { createAuditLog } from './audit';

const permissionCache = new Map();
const roleCache = new Map();

export async function checkPermission(user, resource, action) {
  const cacheKey = `${user.id}:${resource}:${action}`;
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey);
  }

  const role = await Role.findById(user.roleId)
    .populate('permissions')
    .cache(60); // Cache for 1 minute

  if (!role) {
    permissionCache.set(cacheKey, false);
    return false;
  }

  const hasPermission = role.permissions.some(permission => 
    permission.resource === resource &&
    permission.actions.includes(action)
  );

  permissionCache.set(cacheKey, hasPermission);
  return hasPermission;
}

export async function assignRole(userId, roleId, assignedBy) {
  await User.findByIdAndUpdate(userId, { roleId });
  
  await createAuditLog({
    userId: assignedBy,
    action: 'assign_role',
    entityType: 'user',
    entityId: userId,
    details: { roleId }
  });

  // Clear cache
  permissionCache.clear();
}

export async function createCustomRole(data, createdBy) {
  const role = await Role.create({
    ...data,
    isSystem: false
  });

  await createAuditLog({
    userId: createdBy,
    action: 'create_role',
    entityType: 'role',
    entityId: role._id,
    details: data
  });

  return role;
} 