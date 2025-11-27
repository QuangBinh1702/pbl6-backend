// Utility functions for calculating attendance status and points

/**
 * Calculate attendance status and points based on activity configuration
 * @param {Object} activity - Activity document with attendance_config
 * @param {Number} sessionsAttended - Number of sessions attended
 * @returns {Object} - { status, attendanceRate, earnedPoints, message }
 */
function calculateAttendanceStatus(activity, sessionsAttended) {
  const config = activity.attendance_config || getDefaultConfig();
  const totalRequired = activity.attendance_sessions?.length || 1;
  
  // Tính tỷ lệ
  const attendanceRate = totalRequired > 0 ? sessionsAttended / totalRequired : 0;
  
  let status = 'absent';
  let earnedPoints = 0;
  let message = '';
  
  // ===== CÁCH 1: ALL - Phải quét tất cả =====
  if (config.calculation_method === 'all') {
    if (attendanceRate === 1.0) {
      status = 'present';
      earnedPoints = config.points_config.max_points || 0;
      message = `✅ Đủ điều kiện (${(attendanceRate * 100).toFixed(0)}%)`;
    } else if (sessionsAttended > 0) {
      status = 'partial';
      earnedPoints = 0;
      message = `⚠️ Chưa đủ (${sessionsAttended}/${totalRequired})`;
    } else {
      status = 'absent';
      earnedPoints = 0;
      message = `❌ Vắng mặt`;
    }
  }
  // ===== CÁCH 2: PARTIAL - Quét bất kỳ theo threshold =====
  else if (config.calculation_method === 'partial') {
    if (sessionsAttended === 0) {
      status = 'absent';
      earnedPoints = 0;
      message = `❌ Vắng mặt`;
    } else if (attendanceRate >= config.attendance_threshold) {
      status = 'present';
      
      // Tính điểm
      if (config.points_config.partial_points) {
        // Quét bao nhiêu được % đó
        earnedPoints = Math.round(
          config.points_config.max_points * attendanceRate
        );
      } else {
        // Quét >= ngưỡng được full điểm
        earnedPoints = config.points_config.max_points || 0;
      }
      
      message = `✅ Đủ điều kiện (${(attendanceRate * 100).toFixed(0)}%)`;
    } else {
      // Dưới ngưỡng
      status = 'absent';
      
      // Tuỳ config có tính điểm hay không
      if (config.points_config.partial_points) {
        earnedPoints = Math.round(
          config.points_config.max_points * attendanceRate
        );
      } else {
        earnedPoints = 0;
      }
      
      const threshold = (config.attendance_threshold * 100).toFixed(0);
      message = `❌ Vắng mặt (${(attendanceRate * 100).toFixed(0)}% < ${threshold}%)`;
    }
  }
  // ===== CÁCH 3: FIRST_MATCH - Chỉ cần lần đầu =====
  else if (config.calculation_method === 'first_match') {
    if (sessionsAttended > 0) {
      status = 'present';
      earnedPoints = config.points_config.max_points || 0;
      message = `✅ Có mặt (chỉ cần 1 lần)`;
    } else {
      status = 'absent';
      earnedPoints = 0;
      message = `❌ Vắng mặt`;
    }
  }
  
  return {
    status,
    attendanceRate,
    sessionsAttended,
    totalRequired,
    earnedPoints,
    message
  };
}

/**
 * Get default attendance configuration
 * @returns {Object} - Default configuration
 */
function getDefaultConfig() {
  return {
    enabled: true,
    total_sessions_required: 1,
    calculation_method: 'partial',  // all | partial | first_match
    attendance_threshold: 0.5,      // >= 50%
    points_config: {
      points_per_session: 5,
      partial_points: true,
      max_points: 5
    }
  };
}

/**
 * Validate attendance session timing
 * @param {Date} sessionStart - Session start time
 * @param {Date} sessionEnd - Session end time
 * @param {Number} minutesBeforeStart - Allow scanning N minutes before
 * @returns {Object} - { isValid, message }
 */
function validateSessionTiming(sessionStart, sessionEnd, minutesBeforeStart = 30) {
  const now = new Date();
  const start = new Date(sessionStart);
  const end = new Date(sessionEnd);
  const scanStartWindow = new Date(start.getTime() - minutesBeforeStart * 60000);
  
  if (now < scanStartWindow) {
    return {
      isValid: false,
      message: `Session chưa bắt đầu. Vui lòng quay lại vào ${start.toLocaleString('vi-VN')}`
    };
  }
  
  if (now > end) {
    return {
      isValid: false,
      message: `Session đã kết thúc. Không thể điểm danh`
    };
  }
  
  return {
    isValid: true,
    message: 'Có thể điểm danh'
  };
}

/**
 * Format attendance summary for response
 * @param {Object} attendanceData - Attendance document
 * @param {Object} calculation - Result from calculateAttendanceStatus
 * @returns {Object} - Formatted summary
 */
function formatAttendanceSummary(attendanceData, calculation) {
  return {
    session: `${attendanceData.total_sessions_attended}/${attendanceData.total_sessions_required}`,
    status: calculation.status,
    attendanceRate: `${(calculation.attendanceRate * 100).toFixed(0)}%`,
    points: calculation.earnedPoints,
    message: calculation.message
  };
}

module.exports = {
  calculateAttendanceStatus,
  getDefaultConfig,
  validateSessionTiming,
  formatAttendanceSummary
};
