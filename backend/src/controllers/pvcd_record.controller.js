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
      const record = await PvcdRecord.findByIdAndUpdate(
        req.params.id,
        { total_point: pointsFromBody },
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


