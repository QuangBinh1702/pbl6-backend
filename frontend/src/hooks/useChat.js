import { useState, useCallback } from 'react';
import apiClient from '../services/api';

const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Ask a question
  const askQuestion = useCallback(async (question) => {
    if (!question.trim()) {
      setError('Vui lòng nhập câu hỏi');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/chatbot/ask-anything', {
        question
      });

      if (response.data.success) {
        const botMessage = {
          type: 'bot',
          content: response.data.data.answer,
          source: response.data.data.source,
          confidence: response.data.data.confidence,
          messageId: response.data.data._id,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMessage]);
        return botMessage;
      } else {
        setError(response.data.error || 'Lỗi xử lý câu hỏi');
        return null;
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        'Lỗi kết nối đến server';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get chat history
  const getChatHistory = useCallback(async (page = 1, limit = 20) => {
    setHistoryLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/chatbot/history', {
        params: { limit, page }
      });

      if (response.data.success) {
        setHistory(response.data.data);
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      } else {
        setError(response.data.error || 'Lỗi lấy lịch chat');
        return null;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Lỗi kết nối';
      setError(errorMsg);
      return null;
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Add user message to local state
  const addUserMessage = useCallback((content) => {
    setMessages(prev => [...prev, {
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    }]);
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    history,
    historyLoading,
    askQuestion,
    getChatHistory,
    addUserMessage,
    clearMessages,
    setMessages,
    setError
  };
};

export default useChat;
