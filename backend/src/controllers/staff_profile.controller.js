// Quản lý hồ sơ cán bộ/giảng viên
const StaffProfile = require('../models/staff_profile.model');
const User = require('../models/user.model');

module.exports = {
  async getAllStaffProfiles(req, res) {
    try {
      const staffProfiles = await StaffProfile.find()
        .populate('user_id')
        .populate('org_unit_id');
      res.json(staffProfiles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStaffProfileById(req, res) {
    try {
      const staffProfile = await StaffProfile.findById(req.params.id)
        .populate('user_id')
        .populate('org_unit_id');
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
      const staffProfile = await StaffProfile.findOne({ user_id: req.params.userId })
        .populate('user_id')
        .populate('org_unit_id');
      if (!staffProfile) {
        return res.status(404).json({ message: 'Staff profile not found' });
      }
      res.json(staffProfile);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getStaffProfileByUsername(req, res) {
    try {
      // First, find the user by username
      const user = await User.findOne({ username: req.params.username });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Then find the staff profile by user_id
      const staffProfile = await StaffProfile.findOne({ 
        user_id: user._id 
      })
        .populate('user_id')
        .populate('org_unit_id');
      
      if (!staffProfile) {
        return res.status(404).json({ 
          success: false, 
          message: 'Staff profile not found for this user' 
        });
      }
      
      res.json({ success: true, data: staffProfile });
    } catch (err) {
      console.error('Get staff profile by username error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStaffProfileByStaffNumber(req, res) {
    try {
      const staffProfile = await StaffProfile.findOne({ staff_number: req.params.staffNumber })
        .populate('user_id')
        .populate('org_unit_id');
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
      await staffProfile.populate('user_id');
      await staffProfile.populate('org_unit_id');
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
        .populate('user_id')
        .populate('org_unit_id');
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
      const staffProfiles = await StaffProfile.find({ org_unit_id: req.params.orgUnitId })
        .populate('user_id')
        .populate('org_unit_id');
      res.json(staffProfiles);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
};


