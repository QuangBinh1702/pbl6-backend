/**
 * Normalize và validate date string
 * Hỗ trợ nhiều format date và tự động sửa lỗi format phổ biến
 * 
 * @param {string} dateString - Date string cần normalize
 * @returns {Date|null} - Date object hoặc null nếu không hợp lệ
 */
function normalizeDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  try {
    // Loại bỏ khoảng trắng thừa
    let normalized = dateString.trim();

    // Fix format: "2025-12-05T7:00:00.000+00:00" -> "2025-12-05T07:00:00.000+00:00"
    // Thêm số 0 vào trước giờ/phút/giây nếu thiếu
    const timePattern = /T(\d{1,2}):(\d{1,2}):(\d{1,2})/;
    const timeMatch = normalized.match(timePattern);
    
    if (timeMatch) {
      const hour = timeMatch[1].padStart(2, '0');
      const minute = timeMatch[2].padStart(2, '0');
      const second = timeMatch[3].padStart(2, '0');
      normalized = normalized.replace(timePattern, `T${hour}:${minute}:${second}`);
    }

    // Thử parse date
    const date = new Date(normalized);
    
    // Kiểm tra xem date có hợp lệ không
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (error) {
    return null;
  }
}

/**
 * Validate và parse date với thông báo lỗi rõ ràng
 * 
 * @param {string} dateString - Date string cần validate
 * @param {string} fieldName - Tên field (để hiển thị trong error message)
 * @returns {Object} - { date: Date, error: string|null }
 */
function validateDate(dateString, fieldName = 'date') {
  if (!dateString) {
    return {
      date: null,
      error: `${fieldName} is required`
    };
  }

  const date = normalizeDate(dateString);
  
  if (!date) {
    return {
      date: null,
      error: `Invalid ${fieldName} format. Accepted formats:\n` +
             `- ISO 8601: "2025-12-05T07:00:00.000Z"\n` +
             `- ISO 8601 with timezone: "2025-12-05T07:00:00.000+00:00"\n` +
             `- ISO 8601 without milliseconds: "2025-12-05T07:00:00Z"\n` +
             `- Simple format: "2025-12-05 07:00:00"\n` +
             `Note: Hours, minutes, and seconds should be 2 digits (e.g., 07:00:00, not 7:00:00)`
    };
  }

  return {
    date: date,
    error: null
  };
}

module.exports = {
  normalizeDate,
  validateDate
};


