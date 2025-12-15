import { useState, useCallback } from 'react';
import apiClient from '../services/api';

const useFeedback = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submitFeedback = useCallback(async (feedbackData) => {
    const { messageId, rating, issue, suggestion, isHelpful } = feedbackData;

    if (!messageId) {
      setError('Message ID is required');
      return false;
    }

    if (!rating || rating < 1 || rating > 5) {
      setError('Rating must be between 1-5');
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.post('/chatbot/feedback', {
        messageId,
        rating,
        issue: issue || null,
        suggestion: suggestion || null,
        isHelpful
      });

      if (response.data.success) {
        setSuccess(true);
        return true;
      } else {
        setError(response.data.error || 'Lỗi gửi phản hồi');
        return false;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Lỗi kết nối';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetFeedback = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    success,
    submitFeedback,
    resetFeedback
  };
};

export default useFeedback;
