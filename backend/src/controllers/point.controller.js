// Quản lý điểm cộng đồng
const Point = require('../models/point.model');

module.exports = {
  async getUserPoints(req, res) {
    try {
      const points = await Point.find({ user: req.params.userId });
      res.json(points);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async updateUserPoints(req, res) {
    try {
      const { semester, year, points, type } = req.body;
      let point = await Point.findOne({ user: req.params.userId, semester, year, type });
      if (point) {
        point.points = points;
        await point.save();
      } else {
        point = new Point({ user: req.params.userId, semester, year, points, type });
        await point.save();
      }
      res.json(point);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async getUserPointHistory(req, res) {
    try {
      const points = await Point.find({ user: req.params.userId }).sort({ year: 1, semester: 1 });
      res.json(points);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
