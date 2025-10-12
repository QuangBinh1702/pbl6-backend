// Quản lý hoạt động
const Activity = require('../models/activity.model');
const Registration = require('../models/registration.model');
const User = require('../models/user.model');

module.exports = {
  async getAllActivities(req, res) {
    try {
      const activities = [];
      res.json(activities);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async getActivityById(req, res) {
    try {
      const activity = await Activity.findById(req.params.id);
      if (!activity) return res.status(404).json({ message: 'Activity not found' });
      res.json(activity);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async createActivity(req, res) {
    try {
      const activity = new Activity({ ...req.body, createdBy: req.user._id });
      await activity.save();
      res.status(201).json(activity);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async updateActivity(req, res) {
    try {
      const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!activity) return res.status(404).json({ message: 'Activity not found' });
      res.json(activity);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteActivity(req, res) {
    try {
      const activity = await Activity.findByIdAndDelete(req.params.id);
      if (!activity) return res.status(404).json({ message: 'Activity not found' });
      res.json({ message: 'Activity deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async approveActivity(req, res) {
    try {
      const activity = await Activity.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy: req.user._id }, { new: true });
      if (!activity) return res.status(404).json({ message: 'Activity not found' });
      res.json(activity);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async rejectActivity(req, res) {
    try {
      const activity = await Activity.findByIdAndUpdate(req.params.id, { status: 'rejected', approvedBy: req.user._id }, { new: true });
      if (!activity) return res.status(404).json({ message: 'Activity not found' });
      res.json(activity);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async completeActivity(req, res) {
    try {
      const activity = await Activity.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
      if (!activity) return res.status(404).json({ message: 'Activity not found' });
      res.json(activity);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async registerActivity(req, res) {
    try {
      const exist = await Registration.findOne({ user: req.user._id, activity: req.params.id });
      if (exist) return res.status(400).json({ message: 'Already registered' });
      const registration = new Registration({ user: req.user._id, activity: req.params.id });
      await registration.save();
      res.status(201).json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async attendanceActivity(req, res) {
    try {
      const { userId } = req.body;
      const registration = await Registration.findOneAndUpdate(
        { user: userId, activity: req.params.id },
        { attended: true, attendanceTime: new Date() },
        { new: true }
      );
      if (!registration) return res.status(404).json({ message: 'Registration not found' });
      res.json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async confirmActivity(req, res) {
    try {
      const { userId } = req.body;
      const registration = await Registration.findOneAndUpdate(
        { user: userId, activity: req.params.id },
        { status: 'confirmed', confirmedBy: req.user._id, confirmedAt: new Date() },
        { new: true }
      );
      if (!registration) return res.status(404).json({ message: 'Registration not found' });
      res.json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};
