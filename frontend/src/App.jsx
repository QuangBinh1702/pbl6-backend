import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ChatPage from './pages/ChatPage';
import AdminPermissionPage from './pages/AdminPermissionPage';
import BulkImportStudents from './pages/BulkImportStudents';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if token exists in localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
    } else {
      // For testing, we can set a mock token
      // In production, this would come from a login page
      setIsLoggedIn(false);
    }
    setLoading(false);
  }, []);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>⏳ Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>🤖 Chatbot Hỏi Đáp</h1>
          <p>Hệ thống Q&A thông minh</p>
          
          <div className="login-info">
            <p>Để testing, vui lòng nhập token JWT:</p>
            <input
              type="password"
              id="token-input"
              placeholder="Dán JWT token tại đây..."
              style={{
                width: '100%',
                padding: '0.8rem',
                marginBottom: '1rem',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
                fontSize: '0.9rem'
              }}
            />
            <button
              onClick={() => {
                const tokenInput = document.getElementById('token-input');
                if (tokenInput.value.trim()) {
                  handleLogin(tokenInput.value);
                } else {
                  alert('Vui lòng nhập token');
                }
              }}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}
            >
              ➤ Đăng nhập
            </button>
          </div>

          <div className="demo-section">
            <p style={{ fontSize: '0.9rem', color: '#999' }}>
              💡 Hoặc bạn có thể test API trực tiếp thông qua Postman hoặc curl
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/admin/permissions" element={<AdminPermissionPage />} />
          <Route path="/bulk-import-students" element={<BulkImportStudents />} />
          <Route path="/" element={<ChatPage />} />
        </Routes>
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            zIndex: 50
          }}
        >
          🚪 Đăng xuất
        </button>
        {/* Navigation links for testing */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 50
        }}>
          <Link to="/" style={{
            color: 'white',
            textDecoration: 'none',
            marginRight: '1rem',
            fontSize: '0.9rem'
          }}>
            💬 Chatbot
          </Link>
          <Link to="/admin/permissions" style={{
            color: 'white',
            textDecoration: 'none',
            marginRight: '1rem',
            fontSize: '0.9rem'
          }}>
            🔐 Quản lý Quyền
          </Link>
          <Link to="/bulk-import-students" style={{
            color: 'white',
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}>
            📤 Import Sinh Viên
          </Link>
        </div>
      </div>
    </Router>
  );
}

export default App;
