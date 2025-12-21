import React, { useState, useEffect, useRef } from 'react';
import useChat from '../hooks/useChat';
import FeedbackWidget from './FeedbackWidget';
import '../styles/ChatInterface.css';

// Format answer text to improve readability
const formatAnswer = (text) => {
  if (!text) return '';
  
  // Check if text already contains HTML tags (from backend)
  const hasHTML = /<[a-z][\s\S]*>/i.test(text);
  
  if (hasHTML) {
    // If already HTML, just return as is (but sanitize dangerous content)
    return text;
  }
  
  // Escape HTML first to prevent XSS
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Format bold text (**text**)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Format headers (lines starting with #)
  formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Format numbered lists (1. 2. 3.)
  formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="list-item"><span class="list-number">$1.</span> $2</div>');
  
  // Format bullet points (- or •)
  formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<div class="list-item">• $1</div>');
  
  // Split into paragraphs (double line breaks)
  const paragraphs = formatted.split(/\n\n+/);
  formatted = paragraphs
    .map(p => {
      p = p.trim();
      if (!p) return '';
      // If paragraph doesn't start with HTML tag, wrap in <p>
      if (!p.match(/^<[a-z]/i)) {
        return '<p>' + p + '</p>';
      }
      return p;
    })
    .filter(p => p)
    .join('');
  
  // Format single line breaks as <br>
  formatted = formatted.replace(/\n/g, '<br>');
  
  // If no paragraphs were created, wrap entire content
  if (!formatted.includes('<p>') && !formatted.includes('<h')) {
    formatted = '<p>' + formatted + '</p>';
  }
  
  return formatted;
};

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

        {messages.map((msg, i) => {
          // Find the corresponding user question for this bot response
          // Look backwards from current message to find the most recent user message
          let userQuestion = null;
          if (msg.type === 'bot') {
            for (let j = i - 1; j >= 0; j--) {
              if (messages[j].type === 'user') {
                userQuestion = messages[j].content;
                break;
              }
            }
          }

          return (
            <div key={i} className={`message message-${msg.type}`}>
              {msg.type === 'user' && (
                <div className="user-message">
                  <p><strong>❓ Câu hỏi:</strong> {msg.content}</p>
                </div>
              )}

              {msg.type === 'bot' && (
                <div className="bot-message">
                  {userQuestion && (
                    <div className="question-context">
                      <p className="question-label">❓ Câu hỏi của bạn:</p>
                      <p className="question-text">{userQuestion}</p>
                    </div>
                  )}
                  <div className="answer-content">
                    <p className="answer-label">💬 Câu trả lời:</p>
                    <div className="answer-text" dangerouslySetInnerHTML={{ 
                      __html: formatAnswer(msg.content) 
                    }} />
                  </div>
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
          );
        })}

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
