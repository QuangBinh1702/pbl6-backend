// Fallback Service - Default responses when no match found
class FallbackService {
  /**
   * Get fallback response based on reason
   */
  getFallbackResponse(reason = 'no_match') {
    const responses = {
      no_match: 'Xin lỗi, tôi không tìm thấy câu trả lời cho câu hỏi của bạn. Vui lòng liên hệ với bộ phận hỗ trợ để được giúp đỡ.',
      empty_query: 'Vui lòng nhập một câu hỏi để tôi có thể giúp bạn.',
      error: 'Có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
      timeout: 'Yêu cầu của bạn đã hết thời gian. Vui lòng thử lại.',
      maintenance: 'Hệ thống hiện đang bảo trì. Vui lòng thử lại sau.',
      insufficient_context: 'Câu hỏi của bạn quá mơ hồ. Vui lòng cung cấp thêm chi tiết.'
    };

    return responses[reason] || responses.no_match;
  }

  /**
   * Create fallback response object
   */
  answer(userQuestion, reason = 'no_match') {
    return {
      answer: this.getFallbackResponse(reason),
      source: 'fallback',
      confidence: 0,
      reason
    };
  }

  /**
   * Suggest to escalate to human
   */
  suggestEscalation(userQuestion) {
    return {
      answer: 'Câu hỏi của bạn cần được xử lý bởi nhân viên hỗ trợ. Vui lòng liên hệ trực tiếp hoặc gửi email đến bộ phận tương ứng.',
      source: 'fallback',
      confidence: 0,
      reason: 'escalation_needed',
      contact: {
        email: 'support@organization.com',
        phone: 'N/A',
        department: 'Support Team'
      }
    };
  }

  /**
   * Get help message
   */
  getHelpMessage() {
    return {
      answer: `Tôi có thể giúp bạn với các câu hỏi về:
- Quy định hoạt động
- Yêu cầu tham gia hoạt động
- Quy trình nộp bằng cấp
- Các quy định khác của tổ chức

Hãy đặt câu hỏi cụ thể để tôi có thể giúp tốt hơn.`,
      source: 'fallback',
      confidence: 0,
      reason: 'help_request'
    };
  }
}

module.exports = new FallbackService();
