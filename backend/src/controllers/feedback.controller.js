// Quản lý phản hồi
const Feedback = require('../models/feedback.model');

module.exports = {
  async createFeedback(req, res) {
    try {
      const feedback = new Feedback({ ...req.body, user: req.user._id });
      await feedback.save();
      res.status(201).json(feedback);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async getAllFeedbacks(req, res) {
    try {
      const feedbacks = await Feedback.find();
      res.json(feedbacks);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async resolveFeedback(req, res) {
    try {
      const feedback = await Feedback.findByIdAndUpdate(
        req.params.id,
        { resolved: true, resolvedBy: req.user._id, resolvedAt: new Date() },
        { new: true }
      );
      if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
      res.json(feedback);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};
