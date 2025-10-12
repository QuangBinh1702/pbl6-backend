// Thống kê
const Point = require('../models/point.model');
const Activity = require('../models/activity.model');
const Evidence = require('../models/evidence.model');

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
};
