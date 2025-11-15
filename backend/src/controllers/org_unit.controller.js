// Quản lý đơn vị tổ chức
const OrgUnit = require('../models/org_unit.model');
const StaffProfile = require('../models/staff_profile.model');

module.exports = {
  async getAllOrgUnits(req, res) {
    try {
      const orgUnits = await OrgUnit.find()
        .populate('leader_id')
        .sort({ name: 1 });
      res.json(orgUnits);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getOrgUnitById(req, res) {
    try {
      const orgUnit = await OrgUnit.findById(req.params.id)
        .populate('leader_id');
      if (!orgUnit) {
        return res.status(404).json({ message: 'Organization unit not found' });
      }
      res.json(orgUnit);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getOrgUnitsByType(req, res) {
    try {
      const orgUnits = await OrgUnit.find({ type: req.params.type })
        .populate('leader_id')
        .sort({ name: 1 });
      res.json(orgUnits);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async createOrgUnit(req, res) {
    try {
      const orgUnit = new OrgUnit(req.body);
      await orgUnit.save();
      await orgUnit.populate('leader_id');
      res.status(201).json(orgUnit);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async updateOrgUnit(req, res) {
    try {
      const orgUnit = await OrgUnit.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('leader_id');
      if (!orgUnit) {
        return res.status(404).json({ message: 'Organization unit not found' });
      }
      res.json(orgUnit);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  async deleteOrgUnit(req, res) {
    try {
      const orgUnit = await OrgUnit.findByIdAndDelete(req.params.id);
      if (!orgUnit) {
        return res.status(404).json({ message: 'Organization unit not found' });
      }
      res.json({ message: 'Organization unit deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async getOrgUnitStaff(req, res) {
    try {
      const staff = await StaffProfile.find({ org_unit_id: req.params.id })
        .populate('user_id')
        .populate('org_unit_id');
      res.json(staff);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  async setLeader(req, res) {
    try {
      const { leaderId } = req.body;
      const orgUnit = await OrgUnit.findByIdAndUpdate(
        req.params.id,
        { leader_id: leaderId },
        { new: true }
      ).populate('leader_id');
      if (!orgUnit) {
        return res.status(404).json({ message: 'Organization unit not found' });
      }
      res.json(orgUnit);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

