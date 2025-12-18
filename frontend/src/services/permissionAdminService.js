import apiClient from './api';

/**
 * Get permission matrix for a user
 * Shows all permissions with their states (via roles, overrides, effective)
 */
export const getUserPermissions = async (userId, orgUnitId = null) => {
  const params = orgUnitId ? { orgUnitId } : {};
  const response = await apiClient.get(`/admin/permissions/users/${userId}`, { params });
  return response.data;
};

/**
 * Get available permissions for a user (based on their roles)
 */
export const getAvailablePermissions = async (userId, orgUnitId = null) => {
  const params = orgUnitId ? { orgUnitId } : {};
  const response = await apiClient.get(`/admin/permissions/users/${userId}/available`, { params });
  return response.data;
};

/**
 * Grant a permission to a user
 */
export const grantPermission = async (userId, actionId, note = null) => {
  const response = await apiClient.post(
    `/admin/permissions/users/${userId}/grant/${actionId}`,
    { note }
  );
  return response.data;
};

/**
 * Revoke a permission from a user
 */
export const revokePermission = async (userId, actionId, note = null) => {
  const response = await apiClient.post(
    `/admin/permissions/users/${userId}/revoke/${actionId}`,
    { note }
  );
  return response.data;
};

/**
 * Delete an override (revert to role-based permissions)
 */
export const deleteOverride = async (userId, actionId) => {
  const response = await apiClient.delete(
    `/admin/permissions/users/${userId}/override/${actionId}`
  );
  return response.data;
};

/**
 * Apply multiple permission changes at once
 */
export const applyPermissionChanges = async (userId, changes) => {
  const response = await apiClient.patch(
    `/admin/permissions/users/${userId}/apply-changes`,
    { changes }
  );
  return response.data;
};

export default {
  getUserPermissions,
  getAvailablePermissions,
  grantPermission,
  revokePermission,
  deleteOverride,
  applyPermissionChanges
};
