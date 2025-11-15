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
      // Map camelCase to snake_case if needed (support both formats)
      const {
        userId,
        user_id,
        staffNumber,
        staff_number,
        orgUnitId,
        org_unit_id,
        fullName,
        full_name,
        dateOfBirth,
        date_of_birth,
        email,
        phone,
        contactAddress,
        contact_address,
        gender,
        position,
        staffImage,
        staff_image
      } = req.body;

      // Use snake_case (database format)
      const profileData = {
        user_id: user_id || userId,
        staff_number: staff_number || staffNumber,
        org_unit_id: org_unit_id || orgUnitId,
        full_name: full_name || fullName,
        date_of_birth: date_of_birth || dateOfBirth ? new Date(date_of_birth || dateOfBirth) : null,
        gender: gender,
        email: email,
        phone: phone,
        contact_address: contact_address || contactAddress,
        position: position,
        staff_image: staff_image || staffImage
      };

      // Validate required fields
      if (!profileData.user_id || !profileData.staff_number) {
        return res.status(400).json({ 
          success: false,
          message: 'user_id and staff_number are required' 
        });
      }

      // Check if staff profile already exists
      const existingProfile = await StaffProfile.findOne({ 
        $or: [
          { user_id: profileData.user_id }, 
          { staff_number: profileData.staff_number } 
        ] 
      });
      
      if (existingProfile) {
        return res.status(400).json({ 
          success: false,
          message: 'Staff profile already exists for this user or staff number' 
        });
      }

      const staffProfile = new StaffProfile(profileData);
      await staffProfile.save();
      await staffProfile.populate('user_id');
      await staffProfile.populate('org_unit_id');
      res.status(201).json(staffProfile);
    } catch (err) {
      res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
  },

  async updateStaffProfile(req, res) {
    try {
      // Map camelCase to snake_case if needed (support both formats)
      const {
        userId,
        user_id,
        staffNumber,
        staff_number,
        orgUnitId,
        org_unit_id,
        fullName,
        full_name,
        dateOfBirth,
        date_of_birth,
        email,
        phone,
        contactAddress,
        contact_address,
        gender,
        position,
        staffImage,
        staff_image
      } = req.body;

      // Build update object with snake_case (database format)
      const updateData = {};
      if (user_id || userId) updateData.user_id = user_id || userId;
      if (staff_number || staffNumber) updateData.staff_number = staff_number || staffNumber;
      if (org_unit_id !== undefined || orgUnitId !== undefined) updateData.org_unit_id = org_unit_id || orgUnitId;
      if (full_name !== undefined || fullName !== undefined) updateData.full_name = full_name || fullName;
      if (date_of_birth || dateOfBirth) updateData.date_of_birth = new Date(date_of_birth || dateOfBirth);
      if (gender !== undefined) updateData.gender = gender;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (contact_address !== undefined || contactAddress !== undefined) updateData.contact_address = contact_address || contactAddress;
      if (position !== undefined) updateData.position = position;
      if (staff_image !== undefined || staffImage !== undefined) updateData.staff_image = staff_image || staffImage;

      const staffProfile = await StaffProfile.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('user_id')
        .populate('org_unit_id');
      if (!staffProfile) {
        return res.status(404).json({ 
          success: false,
          message: 'Staff profile not found' 
        });
      }
      res.json(staffProfile);
    } catch (err) {
      res.status(400).json({ 
        success: false,
        message: err.message 
      });
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

  async getPositions(req, res) {
    try {
      // Danh sách position mặc định
      const defaultPositions = [
        'Trưởng phòng',
        'Phó phòng',
        'Thư kí',
        'Giảng viên',
        'Nhân viên',
        'Trưởng khoa',
        'Phó trưởng khoa',
        'Trưởng bộ môn',
        'Phó trưởng bộ môn',
        'Chuyên viên',
        'Cán bộ',
        'Trợ lý'
      ];

      // Lấy tất cả các position unique từ database
      const positionsInDB = await StaffProfile.distinct('position', {
        position: { $exists: true, $ne: null, $ne: '' }
      });

      // Kết hợp và loại bỏ trùng lặp
      const allPositions = [...new Set([...defaultPositions, ...positionsInDB])].sort();

      res.json({
        success: true,
        data: allPositions,
        count: allPositions.length
      });
    } catch (err) {
      console.error('Get positions error:', err);
      res.status(500).json({ 
        success: false,
        message: err.message 
      });
    }
  },
};

