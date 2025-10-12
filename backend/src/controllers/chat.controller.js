// Quản lý chat nhóm
const Chat = require('../models/chat.model');

module.exports = {
  async getActivityChats(req, res) {
    try {
      const chats = await Chat.find({ activity: req.params.activityId }).sort({ createdAt: 1 });
      res.json(chats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async sendActivityChat(req, res) {
    try {
      const chat = new Chat({ ...req.body, activity: req.params.activityId, user: req.user._id });
      await chat.save();
      res.status(201).json(chat);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};
