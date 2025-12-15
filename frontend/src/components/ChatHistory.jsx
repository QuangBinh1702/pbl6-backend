import React, { useState, useEffect } from 'react';
import useChat from '../hooks/useChat';
import '../styles/ChatHistory.css';

const ChatHistory = ({ isOpen, onClose }) => {
  const { getChatHistory, history, historyLoading, error } = useChat();
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory(page);
    }
  }, [page, isOpen]);

  const loadHistory = async (pageNum) => {
    const result = await getChatHistory(pageNum, 20);
    if (result) {
      setPagination(result.pagination);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-history-modal">
      <div className="chat-history-content">
        <div className="history-header">
          <h2>📜 Lịch sử chat</h2>
          <button onClick={onClose} className="btn-close">
            ✕
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {historyLoading && (
          <div className="loading">
            <p>⏳ Đang tải...</p>
          </div>
        )}

        {!historyLoading && history.length === 0 && (
          <div className="empty-state">
            <p>Chưa có lịch sử chat nào</p>
          </div>
        )}

        {!historyLoading && history.length > 0 && (
          <>
            <div className="history-list">
              {history.map((item, index) => (
                <div key={item._id || index} className="history-item">
                  <div className="history-question">
                    <strong>❓ Câu hỏi:</strong>
                    <p>{item.question}</p>
                  </div>
                  <div className="history-answer">
                    <strong>✓ Câu trả lời:</strong>
                    <p>{item.answer}</p>
                  </div>
                  <div className="history-meta">
                    <span className="source">📚 {item.source}</span>
                    <span className="time">
                      🕐 {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-prev"
                >
                  ← Trước
                </button>

                <span className="page-info">
                  Trang {page} / {pagination.pages}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="btn-next"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
