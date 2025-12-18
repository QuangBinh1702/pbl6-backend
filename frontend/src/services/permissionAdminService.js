import api from './api';

const API_BASE = '/admin/permissions';

/**
 * Lookup user by username and get permissions grouped by role
 */
export const lookupUserByUsername = async (username) => {
  try {
    const response = await api.get(`${API_BASE}/lookup-user/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user permissions by ID
 */
export const getUserPermissions = async (userId) => {
  try {
    const response = await api.get(`${API_BASE}/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get available permissions for user
 */
export const getAvailablePermissions = async (userId, orgUnitId = null) => {
  try {
    const params = orgUnitId ? `?orgUnitId=${orgUnitId}` : '';
    const response = await api.get(`${API_BASE}/users/${userId}/available${params}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Grant permission to user
 */
export const grantPermission = async (userId, actionId, note = null) => {
  try {
    const response = await api.post(`${API_BASE}/users/${userId}/grant/${actionId}`, {
      note
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Revoke permission from user
 */
export const revokePermission = async (userId, actionId, note = null) => {
  try {
    const response = await api.post(`${API_BASE}/users/${userId}/revoke/${actionId}`, {
      note
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete override (revert to role-based)
 */
export const deleteOverride = async (userId, actionId) => {
  try {
    const response = await api.delete(`${API_BASE}/users/${userId}/override/${actionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Apply multiple permission changes at once
 */
export const applyPermissionChanges = async (userId, changes) => {
  try {
    const response = await api.patch(`${API_BASE}/users/${userId}/apply-changes`, {
      changes
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all org units
 */
export const getOrgUnits = async () => {
  try {
    const response = await api.get(`${API_BASE}/org-units`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get common positions
 */
export const getPositions = async () => {
  try {
    const response = await api.get(`${API_BASE}/positions`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Add role to user
 */
export const addRoleToUser = async (userId, roleName, orgUnitId = null, position = null) => {
  try {
    const response = await api.post(`${API_BASE}/users/${userId}/add-role`, {
      roleName,
      orgUnitId,
      position
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
