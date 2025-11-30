import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatBot from './components/ChatBot';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Optionally fetch user info
      fetchUserInfo(token);
    }
    setLoading(false);
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chatbot/my-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    fetchUserInfo(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserInfo(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {isLoggedIn ? (
        <>
          <Dashboard userInfo={userInfo} onLogout={handleLogout} />
          <ChatBot />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
