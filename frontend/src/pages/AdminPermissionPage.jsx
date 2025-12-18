import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPermissionPanel from '../components/AdminPermissionPanel';
import './AdminPermissionPage.css';

/**
 * Admin Permission Management Page
 * PROTECTED: Only admin with permission:update can access
 */
const AdminPermissionPage = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Try to access protected endpoint
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/permissions/positions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403 || response.status === 401) {
        // No permission
        setHasAccess(false);
        setLoading(false);
        setTimeout(() => navigate('/'), 2000);
      } else if (response.ok) {
        // Has permission
        setHasAccess(true);
        setLoading(false);
      } else {
        // Other error
        setHasAccess(false);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      setLoading(false);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  if (loading) {
    return (
      <div className="admin-permission-page">
        <div className="page-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="admin-permission-page">
        <div className="page-container">
          <div className="access-denied-container">
            <div className="access-denied-icon">🔒</div>
            <h2>Truy cập bị từ chối</h2>
            <p>Bạn không có quyền truy cập trang quản lý phân quyền.</p>
            <p>Chỉ <strong>Admin</strong> mới có thể truy cập trang này.</p>
            <p className="redirect-text">Đang chuyển hướng về trang chủ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-permission-page">
      <div className="page-container">
        <AdminPermissionPanel />
      </div>
    </div>
  );
};

export default AdminPermissionPage;
