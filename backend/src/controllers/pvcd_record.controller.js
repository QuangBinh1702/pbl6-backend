// Quản lý bản ghi PVCD (Phiếu đánh giá kết quả rèn luyện)
const PvcdRecord = require('../models/pvcd_record.model');

module.exports = {
  async getAllPvcdRecords(req, res) {
    try {
      const records = await PvcdRecord.find()
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password'
          }
        })
        .sort({ year: -1 });
      res.json(records);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPvcdRecordById(req, res) {
    try {
      const record = await PvcdRecord.findById(req.params.id)
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password'
          }
        });
      if (!record) {
        return res.status(404).json({ message: 'PVCD record not found' });
      }
      res.json(record);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPvcdRecordsByStudent(req, res) {
    try {
      const records = await PvcdRecord.find({ student_id: req.params.studentId })
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password'
          }
        })
        .sort({ year: -1 });
      res.json(records);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getPvcdRecordsByYear(req, res) {
    try {
      const year = parseInt(req.params.year, 10);
      const records = await PvcdRecord.find({ year })
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password'
          }
        })
        .sort({ total_point: -1 });
      res.json(records);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createPvcdRecord(req, res) {
    try {
      const payload = { ...req.body };
      if (payload.studentId && !payload.student_id) payload.student_id = payload.studentId;
      
      // ✅ Validate and normalize year to number
      if (payload.year != null) {
        const yearValue = parseInt(payload.year, 10);
        if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
          return res.status(400).json({ 
            success: false,
            message: 'Year must be a 4-digit number between 1900 and 2100' 
          });
        }
        payload.year = yearValue;
      } else {
        return res.status(400).json({ 
          success: false,
          message: 'Year is required' 
        });
      }

      // Remove total_point from payload - it will be calculated automatically
      delete payload.total_point;

      // Validate start_year and end_year
      if (payload.start_year || payload.end_year) {
        const startYearDate = payload.start_year ? new Date(payload.start_year) : null;
        const endYearDate = payload.end_year ? new Date(payload.end_year) : null;

        // Check if dates are valid
        if (startYearDate && isNaN(startYearDate.getTime())) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid start_year format' 
          });
        }
        if (endYearDate && isNaN(endYearDate.getTime())) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid end_year format' 
          });
        }

        // Validate: end_year must be after start_year
        if (startYearDate && endYearDate) {
          if (endYearDate <= startYearDate) {
            return res.status(400).json({ 
              success: false,
              message: 'End year must be after start year' 
            });
          }
        }

        if (startYearDate) payload.start_year = startYearDate;
        if (endYearDate) payload.end_year = endYearDate;
      }

      const record = new PvcdRecord(payload);
      await record.save();
      await record.populate({
        path: 'student_id',
        populate: {
          path: 'user_id',
          select: '-password'
        }
      });
      res.status(201).json(record);
    } catch (err) {
      // Handle unique constraint violation
      if (err.code === 11000) {
        return res.status(409).json({ 
          success: false,
          message: `A PVCD record already exists for this student in year ${req.body.year}` 
        });
      }
      res.status(400).json({ message: err.message });
    }
  },

  async updatePvcdRecord(req, res) {
    try {
      const payload = { ...req.body };
      if (payload.studentId && !payload.student_id) payload.student_id = payload.studentId;
      
      // ✅ Validate and normalize year to number
      if (payload.year != null) {
        const yearValue = parseInt(payload.year, 10);
        if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
          return res.status(400).json({ 
            success: false,
            message: 'Year must be a 4-digit number between 1900 and 2100' 
          });
        }
        payload.year = yearValue;
      }

      // Remove total_point from payload - it will be calculated automatically
      delete payload.total_point;

      // Validate start_year and end_year
      // Get existing record to compare with new values
      const existingRecord = await PvcdRecord.findById(req.params.id);
      
      if (payload.start_year || payload.end_year || existingRecord) {
        const startYearDate = payload.start_year 
          ? new Date(payload.start_year) 
          : (existingRecord?.start_year || null);
        const endYearDate = payload.end_year 
          ? new Date(payload.end_year) 
          : (existingRecord?.end_year || null);

        // Check if dates are valid
        if (payload.start_year && isNaN(startYearDate.getTime())) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid start_year format' 
          });
        }
        if (payload.end_year && isNaN(endYearDate.getTime())) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid end_year format' 
          });
        }

        // Validate: end_year must be after start_year (if both exist)
        if (startYearDate && endYearDate) {
          if (endYearDate <= startYearDate) {
            return res.status(400).json({ 
              success: false,
              message: 'End year must be after start year' 
            });
          }
        }

        if (payload.start_year) payload.start_year = new Date(payload.start_year);
        if (payload.end_year) payload.end_year = new Date(payload.end_year);
      }

      const record = await PvcdRecord.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true, runValidators: true }
      )
        .populate({
          path: 'student_id',
          populate: {
            path: 'user_id',
            select: '-password'
          }
        });
      if (!record) {
        return res.status(404).json({ message: 'PVCD record not found' });
      }
      res.json(record);
    } catch (err) {
      // Handle unique constraint violation
      if (err.code === 11000) {
        return res.status(409).json({ 
          success: false,
          message: `A PVCD record already exists for this student in year ${req.body.year}` 
        });
      }
      res.status(400).json({ message: err.message });
    }
  },

  async deletePvcdRecord(req, res) {
    try {
      const record = await PvcdRecord.findByIdAndDelete(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'PVCD record not found' });
      }
      res.json({ message: 'PVCD record deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // 🆕 Recalculate total_point for all approved evidences
  async recalculateAllPvcdPoints(req, res) {
    try {
      const Evidence = require('../models/evidence.model');
      const Attendance = require('../models/attendance.model');
      
      // Get all approved evidences
      const approvedEvidences = await Evidence.find({ status: 'approved' }).lean();
      
      if (approvedEvidences.length === 0) {
        return res.json({ 
          success: true, 
          message: 'No approved evidences found',
          processed: 0
        });
      }

      // Group evidences by student_id and year
      const groupedByStudent = {};
      approvedEvidences.forEach(ev => {
        const studentId = ev.student_id.toString();
        const year = new Date(ev.submitted_at).getFullYear();
        const key = `${studentId}-${year}`;
        
        if (!groupedByStudent[key]) {
          groupedByStudent[key] = { studentId, year, evidences: [] };
        }
        groupedByStudent[key].evidences.push(ev);
      });

      // Recalculate and update each student-year combination
      let processed = 0;
      const results = [];

      for (const [key, data] of Object.entries(groupedByStudent)) {
        try {
          const { studentId, year, evidences } = data;

          // Get all attendances for this student in this year
          const attendances = await Attendance.find({
            student_id: studentId,
            scanned_at: {
              $gte: new Date(`${year}-01-01`),
              $lt: new Date(`${year + 1}-01-01`)
            }
          }).lean();

          // ✅ GROUP by activity_id and take MAX points per activity
          const activityPointsMap = {};
          attendances.forEach(att => {
            const actId = att.activity_id.toString();
            const points = parseFloat(att.points) || 0;
            
            if (!activityPointsMap[actId] || points > activityPointsMap[actId]) {
              activityPointsMap[actId] = points;
            }
          });

          // Sum the MAX points from each activity
          let attendancePoints = 0;
          Object.values(activityPointsMap).forEach(maxPoints => {
            attendancePoints += maxPoints;
          });

          // Sum faculty_point from approved evidences
          let evidencePoints = 0;
          evidences.forEach(ev => {
            evidencePoints += parseFloat(ev.faculty_point) || 0;
          });

          // Total = Attendance + Approved Evidence
          const totalPoints = attendancePoints + evidencePoints;

          // Update or create pvcd_record
          const updatedRecord = await PvcdRecord.findOneAndUpdate(
            { student_id: studentId, year: year },
            {
              student_id: studentId,
              year: year,
              total_point: totalPoints
            },
            { upsert: true, new: true, runValidators: true }
          );

          processed++;
          results.push({
            studentId,
            year,
            attendancePoints,
            evidencePoints,
            totalPoints,
            status: 'success'
          });

          console.log(`[PVCD Recalculate] Student ${studentId} Year ${year}: ${totalPoints} points (Attendance: ${attendancePoints}, Evidence: ${evidencePoints})`);
        } catch (err) {
          results.push({
            studentId: data.studentId,
            year: data.year,
            status: 'error',
            error: err.message
          });
          console.error(`[PVCD Recalculate Error] Student ${data.studentId} Year ${data.year}:`, err.message);
        }
      }

      res.json({
        success: true,
        message: `Recalculated total_point for ${processed} student-year combinations`,
        processed,
        total: results.length,
        details: results
      });

    } catch (err) {
      console.error('Error in recalculateAllPvcdPoints:', err);
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  }

};


