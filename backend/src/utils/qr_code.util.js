// Utility functions for QR code generation and handling
const QRCode = require('qrcode');

/**
 * Generate QR code for activity attendance
 * @param {string} activityId - MongoDB ObjectId of activity
 * @param {string} activityTitle - Title of the activity
 * @returns {Promise<string>} - Base64 data URL of QR code
 */
async function generateActivityQRCode(activityId, activityTitle) {
  try {
    const qrData = JSON.stringify({
      activityId: activityId.toString(),
      activityTitle: activityTitle,
      timestamp: new Date().toISOString()
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H', // High error correction (30% recovery)
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Parse QR code data from scanned content
 * @param {string} qrData - Raw QR code data (JSON string)
 * @returns {object} - Parsed QR code data
 */
function parseQRCodeData(qrData) {
  try {
    const data = JSON.parse(qrData);
    return {
      activityId: data.activityId,
      activityTitle: data.activityTitle,
      timestamp: data.timestamp,
      isValid: !!data.activityId
    };
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return {
      isValid: false,
      error: 'Invalid QR code format'
    };
  }
}

/**
 * Validate QR code timing (check if within scanning window)
 * @param {Date} activityStartTime - Activity start time
 * @param {Date} activityEndTime - Activity end time
 * @param {number} minutesBeforeStart - Allow scanning N minutes before start
 * @returns {object} - Validation result
 */
function validateQRCodeTiming(activityStartTime, activityEndTime, minutesBeforeStart = 30) {
  const now = new Date();
  const startTime = new Date(activityStartTime);
  const endTime = new Date(activityEndTime);
  const scanStartWindow = new Date(startTime.getTime() - minutesBeforeStart * 60000);

  return {
    isValid: now >= scanStartWindow && now <= endTime,
    currentTime: now,
    scanWindowStart: scanStartWindow,
    activityStart: startTime,
    activityEnd: endTime,
    message: 
      now < scanStartWindow ? `Hoạt động chưa bắt đầu. Vui lòng quay lại vào ${startTime.toLocaleString('vi-VN')}` :
      now > endTime ? 'Hoạt động đã kết thúc. Không thể điểm danh' :
      'Có thể điểm danh'
  };
}

module.exports = {
  generateActivityQRCode,
  parseQRCodeData,
  validateQRCodeTiming
};
