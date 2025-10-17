// Quản lý hồ sơ cán bộ/giảng viên
const StaffProfile = require('../models/staff_profile.model');
const User = require('../models/user.model');

module.exports = {
  async getAllStaffProfiles(req, res) {
    try {
      const staffProfiles = await StaffProfile.find()
        .populate('user', '-password')
        .populate('org_unit');
      res.json(staffProfiles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStaffProfileById(req, res) {
    try {
      const staffProfile = await StaffProfile.findById(req.params.id)
        .populate('user', '-password')
        .populate('org_unit');
      if (!staffProfile) {
        return res.status(404).json({ message: 'Staff profile not found' });
      }
      res.json(staffProfile);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStaffProfileByUserId(req, res) {
    try {
      const staffProfile = await StaffProfile.findOne({ user: req.params.userId })
        .populate('user', '-password')
        .populate('org_unit');
      if (!staffProfile) {
        return res.status(404).json({ message: 'Staff profile not found' });
      }
      res.json(staffProfile);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStaffProfileByStaffNumber(req, res) {
    try {
      const staffProfile = await StaffProfile.findOne({ staff_number: req.params.staffNumber })
        .populate('user', '-password')
        .populate('org_unit');
      if (!staffProfile) {
        return res.status(404).json({ message: 'Staff profile not found' });
      }
      res.json(staffProfile);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createStaffProfile(req, res) {
    try {
      const staffProfile = new StaffProfile(req.body);
      await staffProfile.save();
      await staffProfile.populate('user', '-password');
      await staffProfile.populate('org_unit');
      res.status(201).json(staffProfile);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateStaffProfile(req, res) {
    try {
      const staffProfile = await StaffProfile.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate('user', '-password')
        .populate('org_unit');
      if (!staffProfile) {
        return res.status(404).json({ message: 'Staff profile not found' });
      }
      res.json(staffProfile);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteStaffProfile(req, res) {
    try {
      const staffProfile = await StaffProfile.findByIdAndDelete(req.params.id);
      if (!staffProfile) {
        return res.status(404).json({ message: 'Staff profile not found' });
      }
      res.json({ message: 'Staff profile deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStaffByOrgUnit(req, res) {
    try {
      const staffProfiles = await StaffProfile.find({ org_unit: req.params.orgUnitId })
        .populate('user', '-password')
        .populate('org_unit');
      res.json(staffProfiles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


