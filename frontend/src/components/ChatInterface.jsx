import React, { useState, useEffect, useRef } from 'react';
import useChat from '../hooks/useChat';
import FeedbackWidget from './FeedbackWidget';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  const {
    messages,
    loading,
    error,
    askQuestion,
    addUserMessage,
    clearMessages,
    setError
  } = useChat();

  const [input, setInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('Vui lòng nhập câu hỏi');
      return;
    }

    // Add user message
    addUserMessage(input);

    // Ask question
    const result = await askQuestion(input);

    // Clear input
    setInput('');

    // Show feedback widget if got answer
    if (result && result.messageId) {
      setShowFeedback(result.messageId);
    }
  };

  const handleClear = () => {
    clearMessages();
    setShowFeedback(null);
  };



  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h1>🤖 Chatbot Hỏi Đáp</h1>
        <button onClick={handleClear} className="btn-clear">
          🗑️ Xóa
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !error && (
          <div className="empty-state">
            <p>👋 Xin chào! Hãy hỏi tôi bất cứ điều gì.</p>
            <p>Ví dụ: "Hoạt động sắp tới là gì?"</p>
          </div>
        )}

        {error && (
          <div className="message message-error">
            <div className="error-content">
              <span className="error-icon">❌</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.type}`}>
            {msg.type === 'user' && (
              <div className="user-message">
                <p>{msg.content}</p>
              </div>
            )}

            {msg.type === 'bot' && (
              <div className="bot-message">
                <p>{msg.content}</p>
                <div className="message-meta">
                  <span className="source">📚 {msg.source || 'unknown'}</span>
                  <span className="confidence">
                    {msg.confidence
                      ? `${(msg.confidence * 100).toFixed(0)}%`
                      : 'N/A'}
                  </span>
                </div>

                {msg.messageId === showFeedback && (
                  <FeedbackWidget
                    messageId={msg.messageId}
                    onClose={() => setShowFeedback(null)}
                  />
                )}

                {msg.messageId !== showFeedback && (
                  <button
                    className="btn-feedback"
                    onClick={() => setShowFeedback(msg.messageId)}
                  >
                    👍 Phản hồi
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="message message-loading">
            <div className="spinner">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Đang xử lý...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi..."
            disabled={loading}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-send"
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
