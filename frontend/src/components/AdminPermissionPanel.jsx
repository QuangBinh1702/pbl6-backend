import React, { useState, useEffect } from 'react';
import {
  lookupUserByUsername,
  addRoleToUser,
  applyPermissionChanges,
  getOrgUnits,
  getPositions
} from '../services/permissionAdminService';
import './AdminPermissionPanel.css';

const AdminPermissionPanel = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [matrix, setMatrix] = useState(null);
  const [orgUnits, setOrgUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [changes, setChanges] = useState(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [addingRole, setAddingRole] = useState(false);
  const [expandedResources, setExpandedResources] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrgUnits();
    loadPositions();
  }, []);

  const loadOrgUnits = async () => {
    try {
      const response = await getOrgUnits();
      if (response.success) {
        setOrgUnits(response.data);
      }
    } catch (err) {
      console.error('Error loading org units:', err);
    }
  };

  const loadPositions = async () => {
    try {
      const response = await getPositions();
      if (response.success) {
        setPositions(response.data);
      }
    } catch (err) {
      console.error('Error loading positions:', err);
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập username');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      setChanges(new Map());

      const response = await lookupUserByUsername(username);
      if (response.success) {
        setMatrix(response.data);
      } else {
        setError(response.message || 'Không tìm thấy người dùng');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tìm kiếm người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedOrgUnit) {
      setError('Vui lòng chọn đơn vị tổ chức');
      return;
    }
    if (!selectedPosition) {
      setError('Vui lòng chọn chức vụ');
      return;
    }

    try {
      setAddingRole(true);
      setError('');

      const response = await addRoleToUser(matrix.userId, 'staff', selectedOrgUnit, selectedPosition);
      if (response.success) {
        setMatrix(response.data.updatedMatrix);
        setShowAddRoleModal(false);
        setSelectedOrgUnit('');
        setSelectedPosition('');
        setSuccessMessage('✓ Thêm role staff thành công');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi thêm role');
    } finally {
      setAddingRole(false);
    }
  };

  const handlePermissionToggle = (actionId, currentEffective, originalEffective) => {
    const newChanges = new Map(changes);
    
    // Calculate current desired state (with pending changes)
    const hasPendingChange = newChanges.has(actionId);
    const currentDesiredState = hasPendingChange 
      ? newChanges.get(actionId) 
      : currentEffective;
    
    // Toggle to opposite state
    const newDesiredState = !currentDesiredState;
    
    // Check if new state matches original (no change needed)
    if (newDesiredState === originalEffective) {
      // Revert to original → Remove from changes
      newChanges.delete(actionId);
      console.log(`📝 Permission toggle: ${actionId} → Revert to original (${originalEffective})`);
    } else {
      // Add or update change
      newChanges.set(actionId, newDesiredState);
      console.log(`📝 Permission toggle: ${actionId} → ${newDesiredState} (pending, chưa lưu DB)`);
    }
    
    setChanges(newChanges);
  };

  const handleSaveChanges = async () => {
    if (changes.size === 0) {
      setError('Không có thay đổi để lưu');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn lưu ${changes.size} thay đổi?`)) {
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const changesArray = Array.from(changes.entries()).map(([actionId, desiredEffective]) => ({
        actionId,
        desiredEffective
      }));

      const response = await applyPermissionChanges(matrix.userId, changesArray);
      
      // Response structure: { success: true, data: { success: true, changes: [...], updatedMatrix: {...} } }
      // Hoặc: { success: true, changes: [...], updatedMatrix: {...} }
      const responseData = response.data || response;
      const updatedMatrix = responseData.updatedMatrix;
      const changesResults = responseData.changes || responseData.data?.changes || [];
      const summary = responseData.summary;
      
      if (response.success && updatedMatrix) {
        // Check if any changes failed
        const failedChanges = changesResults.filter(r => !r.success);
        const successCount = changesResults.filter(r => r.success).length;
        
        if (failedChanges.length > 0) {
          console.error(`❌ ${failedChanges.length} changes failed:`, failedChanges);
          setError(`Lưu không thành công: ${failedChanges.length}/${changes.size} thay đổi thất bại. Chi tiết: ${failedChanges.map(f => f.message).join(', ')}`);
        } else {
          console.log(`✅ Đã lưu ${successCount} thay đổi vào database`);
          console.log(`🔄 Reloading permissions từ server...`);
          
          // Update matrix với data mới từ server (đã lưu vào DB)
          setMatrix(updatedMatrix);
          setChanges(new Map()); // Clear pending changes
          
          // Verify: Checkbox sẽ hiển thị đúng từ updatedMatrix
          console.log(`✅ Permissions đã được reload từ database`);
          console.log(`📊 Summary:`, summary);
          
          setSuccessMessage(`✓ Lưu thành công ${successCount} thay đổi`);
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        setError(response.message || responseData.message || 'Lỗi khi lưu thay đổi');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lưu thay đổi');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (roleName) => {
    const colors = {
      student: '#3498db',
      staff: '#2ecc71',
      admin: '#e74c3c'
    };
    return colors[roleName] || '#95a5a6';
  };

  const toggleResource = (resource) => {
    setExpandedResources(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };

  const toggleAllResources = (expand) => {
    const allResources = {};
    if (matrix?.permissionsByRole) {
      Object.values(matrix.permissionsByRole).forEach(roleData => {
        roleData.permissions.forEach(p => {
          allResources[p.resource] = expand;
        });
      });
    }
    setExpandedResources(allResources);
  };

  const groupPermissionsByResource = (permissions) => {
    const grouped = {};
    permissions.forEach(permission => {
      const resource = permission.resource || 'other';
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(permission);
    });
    return grouped;
  };

  const filterPermissions = (permissions) => {
    if (!searchQuery.trim()) return permissions;
    
    const query = searchQuery.toLowerCase();
    return permissions.filter(p => 
      p.action_name?.toLowerCase().includes(query) ||
      p.action_code?.toLowerCase().includes(query) ||
      p.resource?.toLowerCase().includes(query)
    );
  };

  const canTogglePermission = (permission) => {
    if (!matrix || !matrix.roles) return false;

    const userRoleNames = matrix.roles.map(r => r.role_name);
    const hasAdminRole = userRoleNames.includes('admin');
    const hasStaffRole = userRoleNames.includes('staff');

    // SAFETY: If permission_level is missing, assume it needs staff role (conservative approach)
    const permLevel = permission.permission_level || 'staff';

    // Admin can toggle everything
    if (hasAdminRole) return true;

    // Admin-only permissions cannot be toggled by non-admin
    if (permLevel === 'admin-only') return false;

    // Staff permissions require staff role
    if (permLevel === 'staff' && !hasStaffRole) return false;

    // Student permissions can always be toggled
    return true;
  };

  const getDisabledReason = (permission) => {
    if (!matrix || !matrix.roles) return null;

    const userRoleNames = matrix.roles.map(r => r.role_name);
    const hasAdminRole = userRoleNames.includes('admin');
    const hasStaffRole = userRoleNames.includes('staff');

    if (hasAdminRole) return null;

    const permLevel = permission.permission_level || 'staff';

    if (permLevel === 'admin-only') {
      return 'Chỉ Admin mới có quyền này';
    }

    if (permLevel === 'staff' && !hasStaffRole) {
      return 'Cần có role Tổ chức để được cấp quyền này';
    }

    return null;
  };

  const renderPermissionRow = (permission) => {
    const hasUnsavedChange = changes.has(permission.action_id);
    const desiredEffective = hasUnsavedChange
      ? changes.get(permission.action_id)
      : permission.effective;
    
    // Original effective state (from DB, before any pending changes)
    const originalEffective = permission.effective;

    const canToggle = canTogglePermission(permission);
    const disabledReason = getDisabledReason(permission);

    const getBadges = () => {
      const badges = [];
      
      // Badge for disabled state
      if (!canToggle && disabledReason) {
        badges.push(
          <span key="disabled" className="badge badge-disabled" title={disabledReason}>
            🔒 {permission.permission_level === 'admin-only' ? 'Chỉ Admin' : 'Cần Role Tổ chức'}
          </span>
        );
      }

      // Badge for role-based permission
      if (permission.viaRoles && canToggle) {
        badges.push(
          <span key="role" className="badge badge-role">Via Role</span>
        );
      }

      // Badge for override
      if (permission.overrideType === 'grant') {
        badges.push(
          <span key="override" className="badge badge-grant">✚ Added</span>
        );
      } else if (permission.overrideType === 'revoke') {
        badges.push(
          <span key="override" className="badge badge-revoke">✕ Removed</span>
        );
      }

      // Badge for unsaved changes
      if (hasUnsavedChange) {
        badges.push(
          <span key="unsaved" className="badge badge-unsaved">● Unsaved</span>
        );
      }

      return badges;
    };

    return (
      <div 
        key={permission.action_id} 
        className={`permission-item ${desiredEffective ? 'granted' : 'denied'} ${!canToggle ? 'disabled' : ''}`}
      >
        <label className={`permission-checkbox ${!canToggle ? 'tooltip-container' : ''}`}>
          <input
            type="checkbox"
            checked={desiredEffective}
            onChange={() => canToggle && handlePermissionToggle(permission.action_id, desiredEffective, originalEffective)}
            disabled={!canToggle}
          />
          <div className="permission-info">
            <span className="permission-name">{permission.action_name}</span>
            <span className="permission-code">{permission.action_code}</span>
          </div>
          {!canToggle && disabledReason && (
            <span className="tooltip-text">{disabledReason}</span>
          )}
        </label>
        <div className="permission-badges">
          {getBadges()}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-permission-panel">
      {/* Header */}
      <div className="panel-header">
        <h1>Quản lý Quyền Người dùng</h1>
      </div>

      {/* Search User */}
      <div className="search-section">
        <form onSubmit={handleSearchUser}>
          <input
            type="text"
            placeholder="Nhập username, MSSV, hoặc mã cán bộ..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="search-input"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </form>
      </div>

      {/* Search & Filter Permissions */}
      {matrix && !loading && (
        <div className="filter-section">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm quyền theo tên hoặc resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-input"
          />
          <div className="filter-actions">
            <button onClick={() => toggleAllResources(true)} className="btn-expand">
              ⬇ Mở tất cả
            </button>
            <button onClick={() => toggleAllResources(false)} className="btn-collapse">
              ⬆ Thu gọn
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      {/* User Info & Permissions */}
      {matrix && !loading && (
        <div className="permission-container">
          {/* User Info */}
          <div className="user-header">
            <div>
              <h2>User: <strong>{matrix.user.username}</strong></h2>
              <div className="roles-display">
                {matrix.roles && matrix.roles.map((role) => (
                  <label key={role.user_role_id} className="role-radio">
                    <input type="radio" name="role" defaultChecked readOnly />
                    <span style={{ color: getRoleColor(role.role_name) }}>
                      {role.role_name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Add Role Button - if only student */}
            {matrix.roles.length === 1 && matrix.roles[0].role_name === 'student' && (
              <button
                className="btn-add-role"
                onClick={() => setShowAddRoleModal(true)}
              >
                + Thêm role tổ chức
              </button>
            )}
          </div>

          {/* Add Role Modal */}
          {showAddRoleModal && (
            <div className="modal-overlay" onClick={() => setShowAddRoleModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Thêm Role Tổ chức</h3>
                
                <div className="form-group">
                  <label>Đơn vị tổ chức: <span className="required">*</span></label>
                  <select
                    value={selectedOrgUnit}
                    onChange={(e) => setSelectedOrgUnit(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Chọn đơn vị --</option>
                    {orgUnits.map((ou) => (
                      <option key={ou._id} value={ou._id}>
                        {ou.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Chức vụ: <span className="required">*</span></label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {positions.map((pos, idx) => (
                      <option key={idx} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-success"
                    onClick={handleAddRole}
                    disabled={addingRole || !selectedOrgUnit || !selectedPosition}
                  >
                    {addingRole ? 'Đang thêm...' : 'Xác nhận thêm'}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowAddRoleModal(false);
                      setSelectedOrgUnit('');
                      setSelectedPosition('');
                    }}
                    disabled={addingRole}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Permissions by Role */}
          <div className="permissions-by-role">
            {matrix.permissionsByRole &&
              Object.entries(matrix.permissionsByRole).map(([roleName, roleData]) => {
                const filteredPermissions = filterPermissions(roleData.permissions);
                const groupedByResource = groupPermissionsByResource(filteredPermissions);
                const resourceNames = Object.keys(groupedByResource).sort();

                return (
                  <div key={roleName} className="role-section">
                    <div className="role-header" style={{ borderColor: getRoleColor(roleName) }}>
                      <h3>Quyền của role <strong>{roleName}</strong></h3>
                      <span className="permission-count">
                        {roleData.summary.effectiveCount}/{roleData.summary.totalActions}
                      </span>
                    </div>

                    <div className="permissions-by-resource">
                      {resourceNames.map((resourceName) => {
                        const resourcePermissions = groupedByResource[resourceName];
                        const isExpanded = expandedResources[resourceName];
                        const grantedCount = resourcePermissions.filter(p => {
                          const hasChange = changes.has(p.action_id);
                          return hasChange ? changes.get(p.action_id) : p.effective;
                        }).length;

                        return (
                          <div key={resourceName} className="resource-group">
                            <div 
                              className={`resource-header ${isExpanded ? 'expanded' : 'collapsed'}`}
                              onClick={() => toggleResource(resourceName)}
                            >
                              <div className="resource-title">
                                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                                <strong>{resourceName}</strong>
                                <span className="resource-count">
                                  ({grantedCount}/{resourcePermissions.length})
                                </span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="resource-permissions">
                                {resourcePermissions.map((permission) =>
                                  renderPermissionRow(permission)
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Save Changes */}
          {changes.size > 0 && (
            <div className="save-section">
              <div className="changes-info">
                {changes.size} thay đổi chưa lưu
              </div>
              <div className="save-buttons">
                <button
                  className="btn-success"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang lưu...' : `Xác nhận lưu (${changes.size})`}
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => setChanges(new Map())}
                  disabled={isSaving}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !matrix && !username && (
        <div className="empty-state">
          <p>🔐 Nhập username để bắt đầu</p>
        </div>
      )}
    </div>
  );
};

export default AdminPermissionPanel;
