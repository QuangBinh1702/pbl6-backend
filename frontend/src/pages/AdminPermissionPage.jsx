import React from 'react';
import PermissionAdminPanel from '../components/PermissionAdminPanel';
import './AdminPermissionPage.css';

/**
 * Admin Permission Management Page
 * Page wrapper for the permission admin panel
 */
const AdminPermissionPage = () => {
  return (
    <div className="admin-permission-page">
      <div className="page-container">
        <PermissionAdminPanel />
      </div>
    </div>
  );
};

export default AdminPermissionPage;
