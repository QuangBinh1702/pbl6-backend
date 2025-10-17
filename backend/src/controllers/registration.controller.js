
// Quản lý đăng ký hoạt động
const Registration = require('../models/registration.model');
const Activity = require('../models/activity.model');
const User = require('../models/user.model');
const QRCode = require('qrcode');

module.exports = {
  async getAllRegistrations(req, res) {
    try {
      const registrations = await Registration.find()
        .populate('user', '-password')
        .populate('activity')
        .populate('evidence')
        .populate('confirmedBy', '-password')
        .populate('feedback')
        .sort({ createdAt: -1 });
      res.json(registrations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getRegistrationById(req, res) {
    try {
      const registration = await Registration.findById(req.params.id)
        .populate('user', '-password')
        .populate('activity')
        .populate('evidence')
        .populate('confirmedBy', '-password')
        .populate('feedback');
      if (!registration) {
        return res.status(404).json({ message: 'Registration not found' });
      }
      res.json(registration);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getRegistrationsByActivity(req, res) {
    try {
      const registrations = await Registration.find({ activity: req.params.activityId })
        .populate('user', '-password')
        .populate('activity')
        .populate('evidence')
        .populate('confirmedBy', '-password')
        .populate('feedback')
        .sort({ createdAt: -1 });
      res.json(registrations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getRegistrationsByUser(req, res) {
    try {
      const registrations = await Registration.find({ user: req.params.userId })
        .populate('user', '-password')
        .populate('activity')
        .populate('evidence')
        .populate('confirmedBy', '-password')
        .populate('feedback')
        .sort({ createdAt: -1 });
      res.json(registrations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createRegistration(req, res) {
    try {
      // Check if already registered
      const existingReg = await Registration.findOne({
        user: req.body.user || req.user._id,
        activity: req.body.activity
      });
      
      if (existingReg) {
        return res.status(400).json({ message: 'Already registered for this activity' });
      }

      const registration = new Registration({
        ...req.body,
        user: req.body.user || req.user._id
      });

      // Generate QR code for attendance
      const qrData = JSON.stringify({
        registrationId: registration._id,
        userId: registration.user,
        activityId: registration.activity,
        timestamp: Date.now()
      });
      
      const qrCode = await QRCode.toDataURL(qrData);
      registration.qrCode = qrCode;

      await registration.save();
      await registration.populate('user', '-password');
      await registration.populate('activity');
      
      res.status(201).json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateRegistration(req, res) {
    try {
      const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('user', '-password')
        .populate('activity')
        .populate('evidence')
        .populate('confirmedBy', '-password')
        .populate('feedback');
      
      if (!registration) {
        return res.status(404).json({ message: 'Registration not found' });
      }
      res.json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteRegistration(req, res) {
    try {
      const registration = await Registration.findByIdAndDelete(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: 'Registration not found' });
      }
      res.json({ message: 'Registration deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async approveRegistration(req, res) {
    try {
      const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        { status: 'approved' },
        { new: true }
      )
        .populate('user', '-password')
        .populate('activity');
      
      if (!registration) {
        return res.status(404).json({ message: 'Registration not found' });
      }
      res.json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async rejectRegistration(req, res) {
    try {
      const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        { status: 'rejected' },
        { new: true }
      )
        .populate('user', '-password')
        .populate('activity');
      
      if (!registration) {
        return res.status(404).json({ message: 'Registration not found' });
      }
      res.json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async markAttended(req, res) {
    try {
      const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        { 
          attended: true, 
          attendanceTime: new Date(),
          status: 'attended'
        },
        { new: true }
      )
        .populate('user', '-password')
        .populate('activity');
      
      if (!registration) {
        return res.status(404).json({ message: 'Registration not found' });
      }
      res.json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async confirmRegistration(req, res) {
    try {
      const registration = await Registration.findByIdAndUpdate(
        req.params.id,
        { 
          status: 'confirmed',
          confirmedBy: req.user._id,
          confirmedAt: new Date()
        },
        { new: true }
      )
        .populate('user', '-password')
        .populate('activity')
        .populate('confirmedBy', '-password');
      
      if (!registration) {
        return res.status(404).json({ message: 'Registration not found' });
      }
      res.json(registration);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async getMyRegistrations(req, res) {
    try {
      const registrations = await Registration.find({ user: req.user._id })
        .populate('activity')
        .populate('evidence')
        .populate('feedback')
        .sort({ createdAt: -1 });
      res.json(registrations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


