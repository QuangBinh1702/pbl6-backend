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

      // Lấy danh sách staff trong tổ chức
      const staff = await StaffProfile.find({ org_unit_id: req.params.id })
        .populate('user_id', 'username email')
        .populate('org_unit_id', '_id name type')
        .populate({
          path: 'faculty_id',
          select: '_id name'
        })
        .lean();

      // Format staff data tương tự như getOrgUnitStaff
      const staffList = staff.map(s => {
        const staffData = {
          ...s,
          org_unit_name: s.org_unit_id?.name || null,
          faculty_name: s.faculty_id?.name || null
        };
        return staffData;
      });

      // Thêm danh sách staff vào response
      const response = {
        ...orgUnit.toObject(),
        staff: staffList,
        staff_count: staffList.length
      };

      res.json(response);
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
      const { name, founded_date, description, achievements, leader_id } = req.body;

      // Validate required fields
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Tên tổ chức là bắt buộc'
        });
      }

      // Validate founded_date format if provided
      if (founded_date) {
        const dateObj = new Date(founded_date);
        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Định dạng ngày thành lập không hợp lệ (YYYY-MM-DD)'
          });
        }
        
        // Check if founded_date is not in the future
        if (dateObj > new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Ngày thành lập không thể trong tương lai'
          });
        }
      }

      // Validate achievements is an array if provided
      if (achievements && !Array.isArray(achievements)) {
        return res.status(400).json({
          success: false,
          message: 'Thành tựu phải là một mảng'
        });
      }

      // Validate achievements items are non-empty strings
      if (achievements && achievements.length > 0) {
        const invalidAchievement = achievements.find(a => typeof a !== 'string' || a.trim() === '');
        if (invalidAchievement !== undefined) {
          return res.status(400).json({
            success: false,
            message: 'Mỗi thành tựu phải là một chuỗi không trống'
          });
        }
      }

      // Validate description
      if (description && typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Giới thiệu phải là chuỗi văn bản'
        });
      }

      // Validate leader_id if provided
      if (leader_id) {
        const StaffProfile = require('../models/staff_profile.model');
        const staffExists = await StaffProfile.findById(leader_id);
        if (!staffExists) {
          return res.status(404).json({
            success: false,
            message: 'Trưởng tổ chức không tồn tại'
          });
        }
      }

      const orgUnitData = {
        name: name.trim(),
        founded_date: founded_date ? new Date(founded_date) : undefined,
        description: description ? description.trim() : undefined,
        achievements: achievements && achievements.length > 0 ? achievements.map(a => a.trim()) : [],
        leader_id: leader_id || undefined
      };

      // Remove undefined values
      Object.keys(orgUnitData).forEach(key => orgUnitData[key] === undefined && delete orgUnitData[key]);

      const orgUnit = new OrgUnit(orgUnitData);
      await orgUnit.save();
      await orgUnit.populate('leader_id');

      res.status(201).json({
        success: true,
        message: 'Tổ chức được tạo thành công',
        data: orgUnit
      });
    } catch (err) {
      console.error('Create org unit error:', err);
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  async updateOrgUnit(req, res) {
    try {
      const { name, founded_date, description, achievements, leader_id } = req.body;

      // Check if organization exists
      const orgUnit = await OrgUnit.findById(req.params.id);
      if (!orgUnit) {
        return res.status(404).json({
          success: false,
          message: 'Tổ chức không tồn tại'
        });
      }

      // Validate name if provided
      if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({
          success: false,
          message: 'Tên tổ chức không hợp lệ'
        });
      }

      // Validate founded_date format if provided
      if (founded_date !== undefined) {
        if (founded_date === null) {
          orgUnit.founded_date = null;
        } else {
          const dateObj = new Date(founded_date);
          if (isNaN(dateObj.getTime())) {
            return res.status(400).json({
              success: false,
              message: 'Định dạng ngày thành lập không hợp lệ (YYYY-MM-DD)'
            });
          }
          
          // Check if founded_date is not in the future
          if (dateObj > new Date()) {
            return res.status(400).json({
              success: false,
              message: 'Ngày thành lập không thể trong tương lai'
            });
          }
          orgUnit.founded_date = dateObj;
        }
      }

      // Validate achievements is an array if provided
      if (achievements !== undefined) {
        if (!Array.isArray(achievements)) {
          return res.status(400).json({
            success: false,
            message: 'Thành tựu phải là một mảng'
          });
        }

        // Validate achievements items are non-empty strings
        if (achievements.length > 0) {
          const invalidAchievement = achievements.find(a => typeof a !== 'string' || a.trim() === '');
          if (invalidAchievement !== undefined) {
            return res.status(400).json({
              success: false,
              message: 'Mỗi thành tựu phải là một chuỗi không trống'
            });
          }
        }
        orgUnit.achievements = achievements.map(a => a.trim());
      }

      // Validate description
      if (description !== undefined) {
        if (description === null) {
          orgUnit.description = null;
        } else if (typeof description === 'string') {
          orgUnit.description = description.trim();
        } else {
          return res.status(400).json({
            success: false,
            message: 'Giới thiệu phải là chuỗi văn bản'
          });
        }
      }

      // Validate leader_id if provided
      if (leader_id !== undefined) {
        if (leader_id === null) {
          orgUnit.leader_id = null;
        } else {
          const StaffProfile = require('../models/staff_profile.model');
          const staffExists = await StaffProfile.findById(leader_id);
          if (!staffExists) {
            return res.status(404).json({
              success: false,
              message: 'Trưởng tổ chức không tồn tại'
            });
          }
          orgUnit.leader_id = leader_id;
        }
      }

      // Update name if provided
      if (name !== undefined) {
        orgUnit.name = name.trim();
      }

      await orgUnit.save();
      await orgUnit.populate('leader_id');

      res.json({
        success: true,
        message: 'Tổ chức được cập nhật thành công',
        data: orgUnit
      });
    } catch (err) {
      console.error('Update org unit error:', err);
      res.status(400).json({
        success: false,
        message: err.message
      });
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

