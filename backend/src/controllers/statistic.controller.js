// Thống kê
const mongoose = require('mongoose');
const Activity = require('../models/activity.model');
const Evidence = require('../models/evidence.model');
const PvcdRecord = require('../models/pvcd_record.model');
const StudentProfile = require('../models/student_profile.model');
const Class = require('../models/class.model');
const Faculty = require('../models/falcuty.model');
const User = require('../models/user.model');

module.exports = {
  async getCommunityPoints(req, res) {
    try {
      // Thống kê tổng điểm PVCD theo user, năm
      const stats = await Point.aggregate([
        { $match: { type: 'pvcd' } },
        { $group: { _id: { user: '$user', year: '$year' }, total: { $sum: '$points' } } },
        { $sort: { '_id.year': 1 } }
      ]);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async getActivitiesStatistic(req, res) {
    try {
      // Thống kê số lượng hoạt động theo loại, trạng thái
      const stats = await Activity.aggregate([
        { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } }
      ]);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async getCertificatesStatistic(req, res) {
    try {
      // Thống kê số lượng minh chứng đã duyệt
      const stats = await Evidence.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$user', count: { $sum: 1 } } }
      ]);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async getActivityDashboard(req, res) {
    try {
      // Get filter parameters from query
      const { year, field_id, org_unit_id, status } = req.query;
      
      // Build base filter
      const baseFilter = {};
      
      // Filter by field_id
      if (field_id) {
        baseFilter.field_id = field_id;
      }
      
      // Filter by org_unit_id
      if (org_unit_id) {
        baseFilter.org_unit_id = org_unit_id;
      }
      
      // Filter by status (convert Vietnamese to English if needed)
      if (status) {
        const statusMapping = {
          'chờ duyệt': 'pending',
          'chưa tổ chức': 'approved',
          'đang tổ chức': 'in_progress',
          'đã tổ chức': 'completed',
          'từ chối': 'rejected',
          'hủy hoạt động': 'cancelled'
        };
        baseFilter.status = statusMapping[status] || status;
      }
      
      // Determine year range - if no year selected, get all activities
      let selectedYear = year ? parseInt(year) : new Date().getFullYear();
      const previousYear = selectedYear - 1;
      let activityFilter = baseFilter;
      let compareFilter = baseFilter;
      
      // If year is explicitly selected, apply year filter
      if (year) {
        const startOfYear = new Date(selectedYear, 0, 1);
        const endOfYear = new Date(selectedYear + 1, 0, 1);
        
        activityFilter = {
          ...baseFilter,
          start_time: { $gte: startOfYear, $lt: endOfYear }
        };
        
        // Hoạt động năm trước
        const startOfPreviousYear = new Date(previousYear, 0, 1);
        const endOfPreviousYear = new Date(selectedYear, 0, 1);
        
        compareFilter = {
          ...baseFilter,
          start_time: { $gte: startOfPreviousYear, $lt: endOfPreviousYear }
        };
      }
      
      // Tổng hoạt động (với filter nếu có)
      const totalActivities = await Activity.countDocuments(baseFilter);
      
      // Hoạt động năm được chọn hoặc tất cả
      const activitiesThisYear = await Activity.countDocuments(activityFilter);
      
      // Hoạt động năm trước
      const activitiesPreviousYear = await Activity.countDocuments(compareFilter);
      
      // Tính phần trăm tăng/giảm
      let growth = 0;
      if (year && activitiesPreviousYear > 0) {
        growth = Math.round(((activitiesThisYear - activitiesPreviousYear) / activitiesPreviousYear) * 100);
      } else if (year && activitiesThisYear > 0) {
        growth = 100;
      }
      
      // Get all activities without pagination
      const activities = await Activity.find(activityFilter)
        .populate('field_id', 'name')
        .populate('org_unit_id', 'name')
        .sort({ start_time: -1 })
        .lean();
      
      res.json({
        data: {
          statistics: {
            totalActivities: totalActivities,
            activitiesThisYear: activitiesThisYear,
            activitiesPreviousYear: activitiesPreviousYear,
            growthPercentage: growth,
            selectedYear: selectedYear
          },
          activities: activities
        },
        message: 'Dashboard statistics and activities retrieved successfully'
      });
    } catch (err) {
      console.error('Error in getActivityDashboard:', err);
      res.status(500).json({ message: err.message });
    }
  },

  async getDashboardStatisticByYear(req, res) {
    try {
      const { year } = req.query;
      
      // Validate year parameter
      if (!year) {
        return res.status(400).json({
          success: false,
          message: 'Year parameter is required'
        });
      }

      const selectedYear = parseInt(year);
      if (isNaN(selectedYear) || selectedYear < 1900 || selectedYear > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year format'
        });
      }

      const startOfYear = new Date(selectedYear, 0, 1);
      const endOfYear = new Date(selectedYear + 1, 0, 1);

      // Get all activities for the year
      const activities = await Activity.find({
        start_time: { $gte: startOfYear, $lt: endOfYear }
      }).populate('org_unit_id', '_id name').lean();

      // Calculate monthly activities
      const monthlyMap = new Map();
      const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
      
      // Initialize all months with 0
      monthNames.forEach((month, index) => {
        monthlyMap.set(index, { month, totalActivities: 0 });
      });

      // Count activities by month
      activities.forEach(act => {
        const actDate = new Date(act.start_time);
        const monthIndex = actDate.getMonth();
        const existing = monthlyMap.get(monthIndex);
        if (existing) {
          existing.totalActivities++;
        }
      });

      const monthly = Array.from(monthlyMap.values());

      // Calculate activities by organization
      const orgMap = new Map();
      activities.forEach(act => {
        if (act.org_unit_id) {
          const orgName = act.org_unit_id.name;
          const existing = orgMap.get(orgName) || { organization: orgName, totalActivities: 0 };
          existing.totalActivities++;
          orgMap.set(orgName, existing);
        }
      });

      const byOrganization = Array.from(orgMap.values()).sort((a, b) => b.totalActivities - a.totalActivities);

      // Get community points by faculty
      const records = await PvcdRecord.find({
        year: selectedYear
      }).populate({
        path: 'student_id',
        populate: {
          path: 'class_id',
          populate: {
            path: 'falcuty_id',
            select: '_id name'
          }
        }
      }).lean();

      const facultyMap = new Map();
      let totalFacultyPoints = 0;
      let facultyCount = 0;

      records.forEach(record => {
        if (record.student_id && record.student_id.class_id && record.student_id.class_id.falcuty_id) {
          const faculty = record.student_id.class_id.falcuty_id;
          const facultyName = faculty.name;
          
          if (!facultyMap.has(facultyName)) {
            facultyMap.set(facultyName, { 
              faculty: facultyName,
              totalPoints: 0,
              studentCount: 0,
              students: new Set()
            });
          }
          
          const data = facultyMap.get(facultyName);
          data.totalPoints += record.total_point;
          data.students.add(record.student_id._id.toString());
          data.studentCount = data.students.size;
        }
      });

      // Calculate average points per student
      const communityPoint = Array.from(facultyMap.values()).map(item => ({
        faculty: item.faculty,
        avgCPoint: item.studentCount > 0 ? Math.round(item.totalPoints / item.studentCount) : 0
      })).sort((a, b) => b.avgCPoint - a.avgCPoint);

      // Build response
      const response = [{
        year: selectedYear,
        activity: {
          monthly,
          byOrganization
        },
        communityPoint
      }];

      res.json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: response
      });
    } catch (err) {
      console.error('Error in getDashboardStatisticByYear:', err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  },

  async getGradesStatistic(req, res) {
    try {
      const pageNum = parseInt(req.query.page) || 1;
      const limitNum = parseInt(req.query.limit) || 10;
      let { student_number, faculty_id, class_id, year } = req.query;

      // Validate and sanitize inputs
      if (pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: 'Page number must be >= 1'
        });
      }

      if (limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100'
        });
      }

      // Validate ObjectIds
      if (faculty_id && !mongoose.Types.ObjectId.isValid(faculty_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid faculty_id format'
        });
      }

      if (class_id && !mongoose.Types.ObjectId.isValid(class_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid class_id format'
        });
      }

      // Validate year
      if (year) {
        const yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
          return res.status(400).json({
            success: false,
            message: 'Invalid year format (must be between 1900 and 2100)'
          });
        }
        year = yearNum;
      }

      // Build filter for PVCD records
      const filter = {};

      if (year) {
        filter.year = year;
      }

      // If searching by student_number, class_id, or faculty_id, we need to first find the student
      let studentIds = [];

      if (student_number || class_id || faculty_id) {
        const studentFilter = {};

        // Search by student number (partial match)
        if (student_number) {
          studentFilter.student_number = { $regex: student_number, $options: 'i' };
        }

        // Determine which classes to filter by
        let classesToUse = [];

        // If class_id is provided, use it directly
        if (class_id) {
          classesToUse = [class_id];
        } else if (faculty_id) {
          // If only faculty_id is provided (no class_id), get all classes from that faculty
          try {
            const classesInFaculty = await Class.find({ falcuty_id: faculty_id }).select('_id');
            classesToUse = classesInFaculty.map(c => c._id);
            
            if (classesToUse.length === 0) {
              // No classes in this faculty
              return res.json({
                success: true,
                message: 'Lấy thống kê điểm thành công',
                data: {
                   records: [],
                   statistics: {
                     total_students: 0,
                     total_points: 0,
                     average_points: '0.00',
                     max_points: 0,
                     min_points: 0
                   },
                   pagination: {
                     page: pageNum,
                     limit: limitNum,
                     total: 0,
                     totalPages: 0
                   }
                 }
              });
            }
          } catch (err) {
            console.error('Error getting classes by faculty:', err);
            throw err;
          }
        }

        // Apply class filter if we have classes to filter by
        if (classesToUse.length > 0) {
          studentFilter.class_id = classesToUse.length === 1 ? classesToUse[0] : { $in: classesToUse };
        }

        // Find students matching the filters
        try {
          const students = await StudentProfile.find(studentFilter).select('_id');
          studentIds = students.map(s => s._id);

          if (studentIds.length === 0) {
            return res.json({
              success: true,
              message: 'Lấy thống kê điểm thành công',
              data: {
                 records: [],
                 statistics: {
                   total_students: 0,
                   total_points: 0,
                   average_points: '0.00',
                   max_points: 0,
                   min_points: 0
                 },
                 pagination: {
                   page: pageNum,
                   limit: limitNum,
                   total: 0,
                   totalPages: 0
                 }
               }
            });
          }

          filter.student_id = { $in: studentIds };
        } catch (err) {
          console.error('Error getting students:', err);
          throw err;
        }
      }

      // Get total count for pagination
      const total = await PvcdRecord.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNum);
      const skip = (pageNum - 1) * limitNum;

      // Get PVCD records with population
      const records = await PvcdRecord.find(filter)
        .sort({ year: -1 }) // Sort BEFORE populate
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'student_id',
          select: 'student_number full_name email phone enrollment_year isClassMonitor class_id user_id',
          populate: [
            {
              path: 'class_id',
              select: '_id name falcuty_id',
              populate: {
                path: 'falcuty_id',
                select: '_id name',
                model: 'Falcuty'
              }
            },
            {
              path: 'user_id',
              select: '_id username',
              model: 'User'
            }
          ]
        })
        .lean();

      // Transform records to include nested faculty info
      const transformedRecords = records.map(record => {
        const student = record.student_id || {};
        const classInfo = student.class_id || {};
        const faculty = classInfo.falcuty_id || {};
        const user = student.user_id || {};

        return {
          _id: record._id,
          year: record.year,
          total_point: record.total_point,
          start_year: record.start_year,
          end_year: record.end_year,
          student: {
            _id: student._id,
            student_number: student.student_number,
            full_name: student.full_name,
            email: student.email,
            phone: student.phone,
            enrollment_year: student.enrollment_year,
            isClassMonitor: student.isClassMonitor
          },
          class: {
            _id: classInfo._id,
            name: classInfo.name
          },
          faculty: {
            _id: faculty._id,
            name: faculty.name
          },
          user: {
            _id: user._id,
            username: user.username
          }
        };
      });

      // Calculate statistics from ALL matching records (not just current page)
      let statistics = {
        total_students: 0,
        total_points: 0,
        average_points: '0.00',
        max_points: 0,
        min_points: 0
      };

      if (total > 0) {
        // Get ALL matching records for statistics (no pagination)
        const allRecords = await PvcdRecord.find(filter)
          .populate({
            path: 'student_id',
            select: '_id student_number full_name email phone enrollment_year isClassMonitor class_id user_id'
          })
          .lean();

        if (allRecords.length > 0) {
          const validRecords = allRecords.filter(r => r.student_id && r.total_point !== undefined && r.total_point !== null);
          
          if (validRecords.length > 0) {
            const points = validRecords.map(r => r.total_point).filter(p => p !== null && p !== undefined);
            const uniqueStudents = new Set(validRecords.map(r => r.student_id._id.toString()));
            
            statistics.total_students = uniqueStudents.size;
            statistics.total_points = points.reduce((sum, p) => sum + (parseFloat(p) || 0), 0);
            statistics.average_points = points.length > 0 ? (statistics.total_points / points.length).toFixed(2) : '0.00';
            statistics.max_points = points.length > 0 ? Math.max(...points) : 0;
            statistics.min_points = points.length > 0 ? Math.min(...points) : 0;
          }
        }
      }

      res.json({
        success: true,
        message: 'Lấy thống kê điểm thành công',
        data: {
          records: transformedRecords,
          statistics,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages
          }
        }
      });
    } catch (err) {
      console.error('Error in getGradesStatistic:', err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  },

  // 🆕 Get PVCD breakdown: attendance points + evidence points + list of both
  async getPvcdBreakdown(req, res) {
    try {
      const { student_id, year } = req.query;

      // Validate input
      if (!student_id || !mongoose.Types.ObjectId.isValid(student_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student_id'
        });
      }

      const yearNum = parseInt(year) || new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year format'
        });
      }

      // Import Attendance model
      const Attendance = require('../models/attendance.model');

      // 1️⃣ Get all attendances for this student in this year
      const attendances = await Attendance.find({
        student_id: student_id,
        scanned_at: {
          $gte: new Date(`${yearNum}-01-01`),
          $lt: new Date(`${yearNum + 1}-01-01`)
        }
      })
        .populate({
          path: 'activity_id',
          select: 'name start_time type'
        })
        .lean();

      // ✅ GROUP by activity_id and take MAX points per activity
      // Reason: Multiple QR scans for same activity = multiple attendance records
      // But we only count the HIGHEST score from all scans of that activity
      const activityMap = {};
      attendances.forEach(att => {
        const actId = att.activity_id?._id?.toString();
        const points = parseFloat(att.points) || 0;
        
        // Create or update activity entry with MAX points
        if (!activityMap[actId]) {
          activityMap[actId] = {
            _id: att._id,
            type: 'attendance',
            title: att.activity_id?.name || 'Unknown Activity',
            points: points,
            date: att.scanned_at,
            activity_id: att.activity_id?._id,
            scan_count: 1
          };
        } else if (points > activityMap[actId].points) {
          // Update if this scan has higher points
          activityMap[actId].points = points;
          activityMap[actId]._id = att._id;
          activityMap[actId].date = att.scanned_at;
          activityMap[actId].scan_count += 1;
        } else {
          // Just increment scan count if not highest
          activityMap[actId].scan_count += 1;
        }
      });

      // Convert to array and sum points
      let attendancePoints = 0;
      const attendanceList = Object.values(activityMap).map(act => {
        attendancePoints += act.points;
        return act;
      });

      // 2️⃣ Get all approved evidences for this student in this year
      const evidences = await Evidence.find({
        student_id: student_id,
        status: 'approved',
        submitted_at: {
          $gte: new Date(`${yearNum}-01-01`),
          $lt: new Date(`${yearNum + 1}-01-01`)
        }
      })
        .select('title faculty_point submitted_at _id')
        .lean();

      // Sum evidence points
      let evidencePoints = 0;
      const evidenceList = evidences.map(ev => {
        evidencePoints += parseFloat(ev.faculty_point) || 0;
        return {
          _id: ev._id,
          type: 'evidence',
          title: ev.title || 'Untitled Evidence',
          points: parseFloat(ev.faculty_point) || 0,
          date: ev.submitted_at
        };
      });

      // 3️⃣ Get PVCD record for verification
      const pvcdRecord = await PvcdRecord.findOne({
        student_id: student_id,
        year: yearNum
      }).lean();

      // 4️⃣ Combine and sort by date
      const combined = [...attendanceList, ...evidenceList].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      // Calculate totals
      const totalPoints = attendancePoints + evidencePoints;

      // Return response
      res.json({
        success: true,
        data: {
          student_id,
          year: yearNum,
          summary: {
            total_point: totalPoints,
            attendance_points: attendancePoints,
            evidence_points: evidencePoints,
            attendance_count: attendances.length,
            evidence_count: evidences.length,
            pvcd_record_total: pvcdRecord?.total_point || 0
          },
          breakdown: {
            attendance_points: attendancePoints,
            evidence_points: evidencePoints,
            total: totalPoints
          },
          sources: {
            attendance: {
              count: attendances.length,
              total_points: attendancePoints,
              items: attendanceList
            },
            evidence: {
              count: evidences.length,
              total_points: evidencePoints,
              items: evidenceList
            }
          },
          combined_list: combined  // ✅ Combined list sorted by date for frontend
        }
      });
    } catch (err) {
      console.error('Error in getPvcdBreakdown:', err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
};