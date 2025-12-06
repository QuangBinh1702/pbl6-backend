// Thống kê
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

  async getGradesStatistic(req, res) {
    try {
      const pageNum = parseInt(req.query.page) || 1;
      const limitNum = parseInt(req.query.limit) || 10;
      const { student_number, faculty_id, class_id, year } = req.query;

      // Build filter for PVCD records
      const filter = {};

      if (year) {
        filter.year = parseInt(year);
      }

      // If searching by student_number, class_id, or faculty_id, we need to first find the student
      let studentIds = [];

      if (student_number || class_id || faculty_id) {
        const studentFilter = {};

        // Search by student number (partial match)
        if (student_number) {
          studentFilter.student_number = { $regex: student_number, $options: 'i' };
        }

        // Search by class
        if (class_id) {
          studentFilter.class_id = class_id;
        }

        // Search by faculty (need to get students from that faculty's classes)
        if (faculty_id) {
          try {
            // First get all classes from this faculty
            const classesInFaculty = await Class.find({ falcuty_id: faculty_id }).select('_id');
            const classIds = classesInFaculty.map(c => c._id);
            
            if (classIds.length > 0) {
              studentFilter.class_id = { $in: classIds };
            } else {
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
        .sort({ year: -1, 'student_id.student_number': 1 })
        .skip(skip)
        .limit(limitNum)
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

      // Calculate statistics (from all matching records, not just current page)
      let statistics = {
        total_students: 0,
        total_points: 0,
        average_points: '0.00',
        max_points: 0,
        min_points: 0
      };

      if (transformedRecords.length > 0) {
        const points = transformedRecords.map(r => r.total_point);
        const uniqueStudents = new Set(transformedRecords.map(r => r.student._id.toString()));
        
        statistics.total_students = uniqueStudents.size;
        statistics.total_points = points.reduce((sum, p) => sum + p, 0);
        statistics.average_points = (statistics.total_points / transformedRecords.length).toFixed(2);
        statistics.max_points = Math.max(...points);
        statistics.min_points = Math.min(...points);
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
  }
};