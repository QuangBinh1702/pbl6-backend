import React, { useState, useEffect } from 'react';
import {
  getUserPermissions,
  grantPermission,
  revokePermission,
  deleteOverride,
  applyPermissionChanges
} from '../services/permissionAdminService';
import './PermissionAdminPanel.css';

/**
 * Admin Permission Management Panel
 * Allows admins to grant/revoke permissions to users
 */
const PermissionAdminPanel = ({ userId = null, onClose = null }) => {
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [matrix, setMatrix] = useState(null);
  const [expandedResources, setExpandedResources] = useState({});
  const [changes, setChanges] = useState(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, granted, denied, modified

  useEffect(() => {
    if (selectedUserId) {
      loadPermissions();
    }
  }, [selectedUserId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      setChanges(new Map());
      
      const response = await getUserPermissions(selectedUserId);
      
      if (response.success) {
        setMatrix(response.data);
        const resources = new Set(response.data.permissions.map(p => p.resource));
        const initialExpanded = {};
        resources.forEach(r => {
          initialExpanded[r] = true;
        });
        setExpandedResources(initialExpanded);
      } else {
        setError(response.message || 'Failed to load permissions');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading permissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleResourceExpand = (resource) => {
    setExpandedResources(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };

  const handlePermissionToggle = (actionId, currentEffective) => {
    const newState = new Map(changes);
    
    if (newState.has(actionId)) {
      newState.delete(actionId);
    } else {
      newState.set(actionId, !currentEffective);
    }
    
    setChanges(newState);
  };

  const handleSaveChanges = async () => {
    if (changes.size === 0) {
      setError('No changes to save');
      return;
    }

    // Confirmation dialog
    const grantCount = Array.from(changes.entries()).filter(([_, value]) => value === true).length;
    const revokeCount = Array.from(changes.entries()).filter(([_, value]) => value === false).length;
    
    const confirmMessage = `Bạn có chắc chắn muốn áp dụng ${changes.size} thay đổi?\n\n` +
      `✓ Cấp quyền: ${grantCount}\n` +
      `✕ Thu hồi: ${revokeCount}\n\n` +
      `Hành động này sẽ cập nhật quyền của người dùng ngay lập tức.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');

      const changesArray = Array.from(changes.entries()).map(([actionId, desiredEffective]) => ({
        actionId,
        desiredEffective
      }));

      const response = await applyPermissionChanges(selectedUserId, changesArray);

      if (response.success) {
        setMatrix(response.data.updatedMatrix);
        setChanges(new Map());
        setSuccessMessage(
          `✓ Đã cập nhật thành công ${response.data.changes.length} quyền!`
        );
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(response.message || 'Failed to save changes');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    if (changes.size > 0) {
      const confirmCancel = window.confirm(
        `Bạn có ${changes.size} thay đổi chưa lưu.\n\nBạn có chắc chắn muốn hủy bỏ tất cả?`
      );
      if (!confirmCancel) {
        return;
      }
    }
    setChanges(new Map());
  };

  const getPermissionsByResource = () => {
    if (!matrix) return {};
    
    const grouped = {};
    matrix.permissions.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    
    return grouped;
  };

  const filterPermissions = (permissions) => {
    return permissions.filter(p => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          p.action_name.toLowerCase().includes(query) ||
          p.action_code.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Type filter
      const hasChange = changes.has(p.action_id);
      const currentEffective = hasChange ? changes.get(p.action_id) : p.effective;
      const isModified = changes.has(p.action_id);

      switch (filterType) {
        case 'granted':
          return currentEffective === true;
        case 'denied':
          return currentEffective === false;
        case 'modified':
          return isModified;
        default:
          return true;
      }
    });
  };

  const renderOverrideBadge = (permission) => {
    if (!permission.overrideType) return null;

    const badgeClass = permission.overrideType === 'grant'
      ? 'badge-grant'
      : 'badge-revoke';

    return (
      <span className={`override-badge ${badgeClass}`}>
        {permission.overrideType === 'grant' ? '✚ Added' : '✕ Removed'}
      </span>
    );
  };

  const renderPermissionRow = (permission) => {
    const hasUnsavedChange = changes.has(permission.action_id);
    const desiredEffective = hasUnsavedChange
      ? changes.get(permission.action_id)
      : permission.effective;

    const rowClass = `permission-row ${
      hasUnsavedChange ? 'unsaved-change' : ''
    } ${desiredEffective ? 'granted' : 'revoked'}`;

    // Determine if this is a grant or revoke change
    const isGrantChange = hasUnsavedChange && desiredEffective && !permission.effective;
    const isRevokeChange = hasUnsavedChange && !desiredEffective && permission.effective;

    return (
      <div key={permission.action_id} className={rowClass}>
        <div className="permission-info">
          <div className="action-header">
            <strong className="action-name">{permission.action_name}</strong>
            <span className="action-code">{permission.action_code}</span>
          </div>
          
          {permission.description && (
            <p className="description">{permission.description}</p>
          )}
          
          <div className="permission-badges">
            {permission.viaRoles && (
              <span className="badge-via-role">Via Role</span>
            )}
            {renderOverrideBadge(permission)}
            {hasUnsavedChange && (
              <span className={`badge-pending ${isGrantChange ? 'badge-pending-grant' : ''} ${isRevokeChange ? 'badge-pending-revoke' : ''}`}>
                {isGrantChange && '✓ Sẽ cấp quyền'}
                {isRevokeChange && '✕ Sẽ thu hồi'}
                {!isGrantChange && !isRevokeChange && '● Chờ xác nhận'}
              </span>
            )}
          </div>
        </div>

        <div className="permission-controls">
          <div className="toggle-wrapper">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={desiredEffective}
                onChange={() => handlePermissionToggle(permission.action_id, permission.effective)}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className={`toggle-label ${desiredEffective ? 'granted' : 'denied'}`}>
              {desiredEffective ? 'Granted' : 'Denied'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const permissionsByResource = getPermissionsByResource();
  const hasChanges = changes.size > 0;
  
  // Calculate stats
  let totalPermissions = 0;
  let grantedCount = 0;
  let modifiedCount = 0;
  
  Object.values(permissionsByResource).forEach(perms => {
    perms.forEach(p => {
      totalPermissions++;
      const hasChange = changes.has(p.action_id);
      const currentEffective = hasChange ? changes.get(p.action_id) : p.effective;
      if (currentEffective) grantedCount++;
      if (hasChange) modifiedCount++;
    });
  });

  return (
    <div className="permission-admin-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-content">
          <h1>Permission Management</h1>
          <p className="header-subtitle">Manage user permissions and roles</p>
        </div>
        {onClose && (
          <button className="btn-close" onClick={onClose} title="Close">✕</button>
        )}
      </div>

      {/* User Selection */}
      <div className="user-selection-card">
        <div className="search-section">
          <label htmlFor="userId" className="search-label">
            <span className="label-icon">👤</span>
            Select User
          </label>
          <div className="search-input-group">
            <input
              id="userId"
              type="text"
              placeholder="Enter user ID..."
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadPermissions()}
              className="search-input"
            />
            <button 
              className="btn-primary" 
              onClick={loadPermissions} 
              disabled={loading}
              title="Load permissions for this user"
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Loading...
                </>
              ) : (
                <>
                  <span>↻</span>
                  Load Permissions
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span className="alert-message">{error}</span>
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span className="alert-message">{successMessage}</span>
          <button className="alert-close" onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading permissions...</p>
        </div>
      )}

      {/* User Info & Permissions */}
      {matrix && !loading && (
        <div className={`permissions-container ${hasChanges ? 'has-changes' : ''}`}>
          {/* User Info Card */}
          <div className="user-info-card">
            <div className="user-basic-info">
              <div className="user-avatar">
                {matrix.user?.name ? matrix.user.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="user-details">
                <h2 className="user-name">{matrix.user?.name || 'Unknown User'}</h2>
                <p className="user-id">ID: <code>{matrix.user?.id || 'N/A'}</code></p>
              </div>
            </div>

            {matrix.roles && matrix.roles.length > 0 && (
              <div className="user-roles-section">
                <h4 className="roles-title">Roles</h4>
                <div className="roles-list">
                  {matrix.roles.map((role) => (
                    <span key={role.user_role_id} className="role-badge">
                      {role.role_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Permissions</div>
                <div className="stat-value">{totalPermissions}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Granted</div>
                <div className="stat-value granted">{grantedCount}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Pending Changes</div>
                <div className="stat-value pending">{modifiedCount}</div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          {totalPermissions > 0 && (
            <div className="search-filter-card">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search permissions by name, code, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-field"
                />
                {searchQuery && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterType === 'granted' ? 'active' : ''}`}
                  onClick={() => setFilterType('granted')}
                >
                  ✓ Granted
                </button>
                <button
                  className={`filter-btn ${filterType === 'denied' ? 'active' : ''}`}
                  onClick={() => setFilterType('denied')}
                >
                  ✕ Denied
                </button>
                <button
                  className={`filter-btn ${filterType === 'modified' ? 'active' : ''}`}
                  onClick={() => setFilterType('modified')}
                >
                  ● Modified {modifiedCount > 0 && `(${modifiedCount})`}
                </button>
              </div>
            </div>
          )}

          {/* Permissions by Resource */}
          <div className="permissions-list">
            {Object.entries(permissionsByResource)
              .sort(([resourceA], [resourceB]) => resourceA.localeCompare(resourceB))
              .map(([resource, allPermissions]) => {
                const filtered = filterPermissions(allPermissions);
                const grantedInGroup = filtered.filter(p => {
                  const hasChange = changes.has(p.action_id);
                  return hasChange ? changes.get(p.action_id) : p.effective;
                }).length;

                if (filtered.length === 0) return null;

                return (
                  <div key={resource} className="resource-group">
                    <button
                      className="resource-header"
                      onClick={() => toggleResourceExpand(resource)}
                    >
                      <span className="toggle-icon">
                        {expandedResources[resource] ? '▼' : '▶'}
                      </span>
                      <span className="resource-title">{resource}</span>
                      <span className="resource-stats">
                        {grantedInGroup}/{filtered.length} granted
                      </span>
                    </button>

                    {expandedResources[resource] && (
                      <div className="resource-permissions">
                        {filtered.map(renderPermissionRow)}
                      </div>
                    )}
                  </div>
                );
              })}

            {totalPermissions > 0 && filterPermissions(Object.values(permissionsByResource).flat()).length === 0 && (
              <div className="empty-filter-state">
                <p>No permissions match your search and filters</p>
              </div>
            )}
          </div>

          {/* Action Buttons - Fixed Bottom */}
          {hasChanges && (
            <div className="action-bar">
              <div className="changes-actions">
                <div className="changes-indicator">
                  <span className="changes-count">
                    {changes.size} thay đổi chưa lưu
                  </span>
                  <span className="changes-hint">
                    ⓘ Nhấn "Xác nhận lưu" để áp dụng các thay đổi này vào hệ thống
                  </span>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn-success"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    title="Xác nhận và áp dụng tất cả thay đổi"
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-small"></span>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        Xác nhận lưu ({changes.size})
                      </>
                    )}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={handleCancelChanges}
                    disabled={isSaving}
                    title="Hủy bỏ tất cả thay đổi"
                  >
                    ✕ Hủy bỏ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !matrix && selectedUserId && (
        <div className="empty-state">
          <p>👤 Select a user to view and manage permissions</p>
        </div>
      )}

      {!loading && !matrix && !selectedUserId && (
        <div className="empty-state">
          <p>🔐 Enter a user ID above to get started</p>
        </div>
      )}
    </div>
  );
};

export default PermissionAdminPanel;
