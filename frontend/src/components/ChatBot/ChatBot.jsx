import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Xin chào! 👋 Tôi là trợ lý ảo của bạn. Bạn có thể hỏi tôi về quy định, hoạt động, điểm danh, thông tin lớp hoặc tải lên ảnh để phân tích.',
      timestamp: new Date(),
      suggested_questions: [
        'Hoạt động sắp tới là gì?',
        'Điểm PVCD của em bao nhiêu?',
        'Làm sao để đăng ký hoạt động?',
        'Lớp của em là gì?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to backend
  const sendMessage = async (text = null) => {
    const messageText = text || input.trim();
    if (!messageText && !selectedFile) return;

    try {
      setLoading(true);

      // Add user message to chat
      const userMessage = {
        id: messages.length + 1,
        type: 'user',
        content: messageText || `📸 Uploaded image`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      let response;

      // Handle image upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);

        response = await fetch(`${API_BASE_URL}/chatbot/analyze-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        // Handle text question
        response = await fetch(`${API_BASE_URL}/chatbot/ask-anything`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ question: messageText })
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gửi tin nhắn');
      }

      // Add bot response
      const botResponse = {
        id: messages.length + 2,
        type: 'bot',
        content: data.data?.response || data.data?.extracted_text || 'Không thể xử lý yêu cầu',
        timestamp: new Date(),
        suggested_questions: data.data?.suggested_questions || [],
        regulations: data.data?.regulations || [],
        activities: data.data?.activities || []
      };

      setMessages(prev => [...prev, botResponse]);
      setSuggestedQuestions(data.data?.suggested_questions || []);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: messages.length + 1,
        type: 'bot',
        content: `❌ Lỗi: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSuggestedQuestion = (question) => {
    sendMessage(question);
  };

  return (
    <div className="chatbot-container">
      {/* Floating Button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Đóng' : 'Mở trợ lý ảo'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <h3>Trợ Lý Ảo</h3>
            <button
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-content">
                  <p>{msg.content}</p>

                  {/* Display regulations if any */}
                  {msg.regulations && msg.regulations.length > 0 && (
                    <div className="regulations-list">
                      {msg.regulations.map((reg, idx) => (
                        <div key={idx} className="regulation-item">
                          <strong>{reg.title}</strong>
                          <p>{reg.description.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Display activities if any */}
                  {msg.activities && msg.activities.length > 0 && (
                    <div className="activities-list">
                      {msg.activities.map((act, idx) => (
                        <div key={idx} className="activity-item">
                          <strong>{act.title}</strong>
                          <p>📍 {act.location}</p>
                          <p>🕐 {new Date(act.start_time).toLocaleString('vi-VN')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Display suggested questions */}
                  {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                    <div className="suggested-questions">
                      <p className="suggestion-label">💡 Câu hỏi gợi ý:</p>
                      {msg.suggested_questions.map((q, idx) => (
                        <button
                          key={idx}
                          className="suggestion-btn"
                          onClick={() => handleSuggestedQuestion(q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
            {loading && (
              <div className="message bot">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-input-area">
            {selectedFile && (
              <div className="file-preview">
                📎 {selectedFile.name}
                <button onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}>
                  ✕
                </button>
              </div>
            )}

            <div className="input-controls">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                className="file-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Tải ảnh lên"
              >
                📸
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Hỏi gì đó..."
                disabled={loading}
              />

              <button
                className="send-btn"
                onClick={() => sendMessage()}
                disabled={loading || (!input.trim() && !selectedFile)}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
