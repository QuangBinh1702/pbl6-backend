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

};


