/**
 * Seed script - Tạo Activity với 2 sessions điểm danh
 * Usage: node scripts/seed-attendance-sessions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');

const Activity = require('../src/models/activity.model');
const AttendanceSession = require('../src/models/attendance_session.model');
const OrgUnit = require('../src/models/org_unit.model');

async function seedAttendanceSessions() {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_NAME || 'pbl6'
    });
    console.log('✅ Connected!');

    // Get or create an org_unit for testing
    let orgUnit = await OrgUnit.findOne();
    if (!orgUnit) {
      console.log('⚠️ No org_unit found. Creating test org_unit...');
      orgUnit = await OrgUnit.create({
        name: 'Test Department'
      });
      console.log('✅ Created test org_unit:', orgUnit._id);
    }

    // Create Activity
    const now = new Date();
    const activityStart = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const activityEnd = new Date(activityStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    const activity = new Activity({
      org_unit_id: orgUnit._id,
      title: 'Demo Event - Multi-Session Attendance',
      description: 'Test event với 2 lần điểm danh (giữa giờ và cuối giờ)',
      location: 'Room 101',
      start_time: activityStart,
      end_time: activityEnd,
      capacity: 100,
      status: 'approved',
      attendance_config: {
        enabled: true,
        total_sessions_required: 2,
        calculation_method: 'partial', // 'all' | 'partial' | 'first_match'
        attendance_threshold: 0.5,      // >= 50% sessions
        points_config: {
          points_per_session: 5,
          partial_points: true,
          max_points: 10  // 2 sessions * 5 points
        }
      }
    });

    await activity.save();
    console.log('✅ Created Activity:', activity._id);
    console.log('   Title:', activity.title);
    console.log('   Time:', activity.start_time.toLocaleString('vi-VN'), 'to', activity.end_time.toLocaleString('vi-VN'));

    // Create 2 Attendance Sessions
    const sessions = [];
    
    // Session 1: Giữa giờ (30 phút sau bắt đầu)
    const session1Start = new Date(activityStart.getTime() + 30 * 60 * 1000);
    const session1End = new Date(session1Start.getTime() + 15 * 60 * 1000);
    
    // Session 2: Cuối giờ (90 phút sau bắt đầu)
    const session2Start = new Date(activityStart.getTime() + 90 * 60 * 1000);
    const session2End = new Date(session2Start.getTime() + 15 * 60 * 1000);

    for (let i = 1; i <= 2; i++) {
      const sessionStart = i === 1 ? session1Start : session2Start;
      const sessionEnd = i === 1 ? session1End : session2End;
      const sessionName = i === 1 ? 'Mid-Session Attendance' : 'End-Session Attendance';

      // Generate QR Code
      const qrData = JSON.stringify({
        activityId: activity._id.toString(),
        sessionId: `session_${i}`,
        sessionNumber: i,
        sessionName: sessionName,
        timestamp: new Date().toISOString()
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const session = new AttendanceSession({
        activity_id: activity._id,
        session_number: i,
        name: sessionName,
        description: i === 1 
          ? 'Attendance check in the middle of the event'
          : 'Attendance check at the end of the event',
        start_time: sessionStart,
        end_time: sessionEnd,
        qr_code: qrCodeDataUrl,
        required: true,
        status: 'active'
      });

      await session.save();
      sessions.push(session);
      console.log(`✅ Created Session ${i}:`, session.name);
      console.log(`   Time: ${sessionStart.toLocaleString('vi-VN')} to ${sessionEnd.toLocaleString('vi-VN')}`);
    }

    // Update Activity với sessions
    activity.attendance_sessions = sessions.map(s => ({
      _id: s._id,
      session_number: s.session_number,
      name: s.name,
      description: s.description,
      start_time: s.start_time,
      end_time: s.end_time,
      qr_code: s.qr_code,
      required: s.required
    }));

    await activity.save();
    console.log('\n✅ Activity updated with sessions!');

    // Print test info
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST INFORMATION');
    console.log('='.repeat(60));
    console.log('\nActivity ID:', activity._id);
    console.log('Activity Name:', activity.title);
    console.log('Required Sessions:', 2);
    console.log('Calculation Method:', activity.attendance_config.calculation_method);
    console.log('Max Points:', activity.attendance_config.points_config.max_points);
    console.log('\nSession 1:', sessions[0].name);
    console.log('  - QR Code ID: session_1');
    console.log('  - Time Window:', sessions[0].start_time.toLocaleString('vi-VN'));
    console.log('\nSession 2:', sessions[1].name);
    console.log('  - QR Code ID: session_2');
    console.log('  - Time Window:', sessions[1].start_time.toLocaleString('vi-VN'));
    console.log('\nTest scenarios:');
    console.log('1. Scan Session 1 QR → status: partial, points: 5/10');
    console.log('2. Scan Session 2 QR → status: present, points: 10/10');
    console.log('3. Scan both → status: present, points: 10/10');
    console.log('4. Scan neither → status: absent, points: 0');
    console.log('='.repeat(60) + '\n');

    await mongoose.connection.close();
    console.log('✅ Seed completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedAttendanceSessions();
