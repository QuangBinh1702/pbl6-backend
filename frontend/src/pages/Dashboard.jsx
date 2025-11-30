import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard({ userInfo, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [activitiesRes, attendanceRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/chatbot/my-activities?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.REACT_APP_API_URL}/chatbot/my-attendance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const activitiesData = await activitiesRes.json();
      const attendanceData = await attendanceRes.json();

      setStats({
        activities: activitiesData.data || [],
        attendance: attendanceData.data || {}
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🎓 Dashboard</h1>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* User Info Card */}
        {userInfo && (
          <div className="card user-card">
            <h2>👤 Thông tin cá nhân</h2>
            <div className="user-info-grid">
              <div className="info-item">
                <span className="label">Tên:</span>
                <span className="value">{userInfo.full_name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">MSSV:</span>
                <span className="value">{userInfo.student_number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Email:</span>
                <span className="value">{userInfo.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="label">Lớp:</span>
                <span className="value">{userInfo.class || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {!loading && stats && (
          <>
            {/* Attendance Card */}
            <div className="card stats-card">
              <h2>📊 Điểm danh & PVCD</h2>
              <div className="stats-grid">
                <div className="stat-item">
                   <span className="stat-label">Hoạt động đã tham gia</span>
                   <span className="stat-value">{stats.attendance.total_attended || 0}</span>
                 </div>
                <div className="stat-item">
                  <span className="stat-label">Điểm PVCD</span>
                  <span className="stat-value">{stats.attendance.pvcd_points || 0}/100</span>
                </div>
              </div>
            </div>

            {/* Activities Card */}
            <div className="card activities-card">
              <h2>🎯 Hoạt động gần đây</h2>
              {stats.activities && stats.activities.length > 0 ? (
                <div className="activities-list">
                  {stats.activities.map((activity, idx) => (
                    <div key={idx} className="activity-item">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-details">
                        <span>📍 {activity.location || 'Chưa có địa điểm'}</span>
                        <span>🕐 {new Date(activity.start_time).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className={`activity-status ${activity.status}`}>
                        {activity.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">Chưa có hoạt động nào</p>
              )}
            </div>
          </>
        )}

        {/* Helper Text */}
        <div className="card helper-card">
          <h3>💡 Gợi ý</h3>
          <p>Bạn có thể hỏi chatbot (💬 button góc phải) về:</p>
          <ul>
            <li>Hoạt động sắp tới là gì?</li>
            <li>Điểm PVCD của em bao nhiêu?</li>
            <li>Quy định điểm danh như thế nào?</li>
            <li>Hoặc upload ảnh để phân tích</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
