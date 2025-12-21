const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
    index: true
  },
  
  qr_name: {
    type: String,
    default: ''  // e.g., "Điểm danh Buổi Sáng", "Round 1", etc
  },
  
  qr_data: {
    type: String,  // JSON: {activityId, qrId, createdAt, expiresAt}
    required: true
  },
  
  qr_code: {
    type: String,  // Base64 PNG image
    required: true
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expires_at: {
    type: Date,
    sparse: true,  // Optional
    index: true
  },
  
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  scans_count: {
    type: Number,
    default: 0
  },
  
  notes: String,
  
  // 🆕 GEOFENCE TRACKING: Location where QR was created
  location: {
    latitude: Number,
    longitude: Number,
    checkpoint_name: String,
    accuracy_m: Number,  // GPS accuracy in meters
    created_at: Date
  },
  
  // 🆕 GEOFENCE SETTING: Radius for geofence check (default 80m)
  geofence_radius_m: {
    type: Number,
    default: 80,
    min: 10,
    max: 500
  }
});

// 🆕 Index for geospatial queries (2dsphere for GeoJSON)
qrCodeSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('QRCode', qrCodeSchema, 'qr_codes');
