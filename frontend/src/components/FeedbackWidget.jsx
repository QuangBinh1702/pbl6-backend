import React, { useState } from 'react';
import useFeedback from '../hooks/useFeedback';
import '../styles/FeedbackWidget.css';

const FeedbackWidget = ({ messageId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [issue, setIssue] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const { loading, error, success, submitFeedback, resetFeedback } = useFeedback();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Vui lòng chọn rating');
      return;
    }

    const result = await submitFeedback({
      messageId,
      rating,
      issue: issue || null,
      suggestion: suggestion || null,
      isHelpful: rating >= 4
    });

    if (result) {
      alert('Cảm ơn phản hồi của bạn!');
      resetFeedback();
      onClose?.();
    }
  };

  if (success) {
    return (
      <div className="feedback-success">
        <p>✅ Cảm ơn phản hồi của bạn!</p>
      </div>
    );
  }

  return (
    <div className="feedback-widget">
      <h4>Bạn cảm thấy câu trả lời này thế nào?</h4>

      {error && (
        <div className="feedback-error">
          <p>❌ {error}</p>
        </div>
      )}

      {/* Rating Stars */}
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${rating >= star ? 'active' : ''}`}
            onClick={() => setRating(star)}
            disabled={loading}
            title={`${star} sao`}
          >
            ⭐
          </button>
        ))}
      </div>

      {/* Issue Selection (if rating < 4) */}
      {rating > 0 && rating < 4 && (
        <div className="issue-selection">
          <label htmlFor="issue">Vấn đề gặp phải:</label>
          <select
            id="issue"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            disabled={loading}
            className="issue-select"
          >
            <option value="">-- Chọn vấn đề --</option>
            <option value="incomplete">Câu trả lời không đầy đủ</option>
            <option value="unclear">Câu trả lời không rõ ràng</option>
            <option value="inaccurate">Câu trả lời không chính xác</option>
            <option value="irrelevant">Câu trả lời không liên quan</option>
            <option value="other">Vấn đề khác</option>
          </select>
        </div>
      )}

      {/* Suggestion Textarea */}
      <textarea
        placeholder="Gợi ý cải thiện (tùy chọn)..."
        value={suggestion}
        onChange={(e) => setSuggestion(e.target.value)}
        disabled={loading}
        rows="3"
        className="suggestion-textarea"
      />

      {/* Action Buttons */}
      <div className="feedback-actions">
        <button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="btn-submit-feedback"
        >
          {loading ? '⏳ Đang gửi...' : '✓ Gửi phản hồi'}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="btn-skip-feedback"
        >
          ✕ Bỏ qua
        </button>
      </div>
    </div>
  );
};

export default FeedbackWidget;
