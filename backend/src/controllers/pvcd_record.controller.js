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
      if (payload.points != null && payload.total_point == null) payload.total_point = payload.points;
      // Normalize year to number if sent as string
      if (payload.year != null) payload.year = parseInt(payload.year, 10);

      // Validate total_point: cannot exceed 100
      if (payload.total_point != null) {
        const totalPoint = typeof payload.total_point === 'number' 
          ? payload.total_point 
          : parseFloat(payload.total_point);
        if (isNaN(totalPoint)) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid total_point format' 
          });
        }
        if (totalPoint > 100) {
          return res.status(400).json({ 
            success: false,
            message: 'Total point cannot exceed 100' 
          });
        }
        if (totalPoint < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Total point cannot be negative' 
          });
        }
        payload.total_point = totalPoint;
      }

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
      res.status(400).json({ message: err.message });
    }
  },

  async updatePvcdRecord(req, res) {
    try {
      const payload = { ...req.body };
      if (payload.studentId && !payload.student_id) payload.student_id = payload.studentId;
      if (payload.points != null && payload.total_point == null) payload.total_point = payload.points;
      if (payload.year != null) payload.year = parseInt(payload.year, 10);

      // Validate total_point: cannot exceed 100
      if (payload.total_point != null) {
        const totalPoint = typeof payload.total_point === 'number' 
          ? payload.total_point 
          : parseFloat(payload.total_point);
        if (isNaN(totalPoint)) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid total_point format' 
          });
        }
        if (totalPoint > 100) {
          return res.status(400).json({ 
            success: false,
            message: 'Total point cannot exceed 100' 
          });
        }
        if (totalPoint < 0) {
          return res.status(400).json({ 
            success: false,
            message: 'Total point cannot be negative' 
          });
        }
        payload.total_point = totalPoint;
      }

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

  async updatePoints(req, res) {
    try {
      const pointsFromBody = req.body.points != null ? req.body.points : req.body.total_point;
      
      if (pointsFromBody == null) {
        return res.status(400).json({ 
          success: false,
          message: 'Points or total_point is required' 
        });
      }
      
      // Validate total_point: cannot exceed 100
      const totalPoint = typeof pointsFromBody === 'number' 
        ? pointsFromBody 
        : parseFloat(pointsFromBody);
      
      if (isNaN(totalPoint)) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid points format' 
        });
      }
      if (totalPoint > 100) {
        return res.status(400).json({ 
          success: false,
          message: 'Total point cannot exceed 100' 
        });
      }
      if (totalPoint < 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Total point cannot be negative' 
        });
      }
      
      const record = await PvcdRecord.findByIdAndUpdate(
        req.params.id,
        { total_point: totalPoint },
        { new: true }
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
      res.status(400).json({ message: err.message });
    }
  },
};


