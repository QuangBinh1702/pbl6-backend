// Quản lý bản ghi PVCD (Phiếu đánh giá kết quả rèn luyện)
const PvcdRecord = require('../models/pvcd_record.model');

module.exports = {
  async getAllPvcdRecords(req, res) {
    try {
      const records = await PvcdRecord.find()
        .populate({
          path: 'student',
          populate: {
            path: 'user',
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
          path: 'student',
          populate: {
            path: 'user',
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
      const records = await PvcdRecord.find({ student: req.params.studentId })
        .populate({
          path: 'student',
          populate: {
            path: 'user',
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
      const year = new Date(req.params.year);
      const records = await PvcdRecord.find({ year })
        .populate({
          path: 'student',
          populate: {
            path: 'user',
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
      const record = new PvcdRecord(req.body);
      await record.save();
      await record.populate({
        path: 'student',
        populate: {
          path: 'user',
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
      const record = await PvcdRecord.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate({
          path: 'student',
          populate: {
            path: 'user',
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
      const { total_point } = req.body;
      const record = await PvcdRecord.findByIdAndUpdate(
        req.params.id,
        { total_point },
        { new: true }
      )
        .populate({
          path: 'student',
          populate: {
            path: 'user',
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


