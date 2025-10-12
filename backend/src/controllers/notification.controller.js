// Quản lý thông báo
const Notification = require('../models/notification.model');

module.exports = {
  async createNotification(req, res) {
    try {
      const notification = new Notification(req.body);
      await notification.save();
      res.status(201).json(notification);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async getUserNotifications(req, res) {
    try {
      const notifications = await Notification.find({ user: req.params.userId });
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};
