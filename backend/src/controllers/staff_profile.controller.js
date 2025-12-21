// Quản lý hồ sơ cán bộ/giảng viên
const StaffProfile = require('../models/staff_profile.model');
const User = require('../models/user.model');

module.exports = {
  async getAllStaffProfiles(req, res) {
    try {
      const { staff_number, org_unit_id, sort } = req.query;
      const filter = {};
      
      // Filter by staff_number (partial match)
      if (staff_number) {
        filter.staff_number = { $regex: staff_number, $options: 'i' };
      }
      
      // Filter by org_unit_id
      if (org_unit_id) {
        filter.org_unit_id = org_unit_id;
      }
      
      // Build sort object
      let sortOption = {};
      if (sort) {
        switch (sort) {
          case 'name_asc':
            sortOption = { full_name: 1 };
            break;
          case 'name_desc':
            sortOption = { full_name: -1 };
            break;
          case 'staff_number_asc':
            sortOption = { staff_number: 1 };
            break;
          case 'staff_number_desc':
            sortOption = { staff_number: -1 };
            break;
          default:
            sortOption = { staff_number: 1 }; // Default sort
        }
      } else {
        sortOption = { staff_number: 1 }; // Default sort
      }
      
      const staffProfiles = await StaffProfile.find(filter)
        .populate('user_id', 'username email')
        .populate('org_unit_id', '_id name')
        .populate({
          path: 'faculty_id',
          select: '_id name'
        })
        .sort(sortOption)
        .lean();

      const data = staffProfiles.map(sp => ({
        ...sp,
        // Nếu org_unit_id null nhưng có faculty_id, hiển thị tên khoa thay cho đơn vị
        org_unit_name: sp.org_unit_id?.name || sp.faculty_id?.name || '-',
        faculty_name: sp.faculty_id?.name || '-',
        position: sp.position || '-'
      }));
      
      res.json({ success: true, data, count: data.length });
    } catch (err) {
      console.error('Get all staff profiles error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getStaffProfileById(req, res) {
    try {
      const staffProfile = await StaffProfile.findById(req.params.id)
        .populate('user_id')
        .populate('org_unit_id')
        .populate({
          path: 'faculty_id',
          select: '_id name'
        });
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
        .populate('org_unit_id')
        .populate({
          path: 'faculty_id',
          select: '_id name'
        });
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
        .populate('org_unit_id')
        .populate({
          path: 'faculty_id',
          select: '_id name'
        });
      
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
        .populate('org_unit_id')
        .populate({
          path: 'faculty_id',
          select: '_id name'
        });
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
        facultyId,
        faculty_id,
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
        faculty_id: faculty_id || facultyId,
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

      // Xử lý file upload (staff_image)
      if (req.file) {
        // Sử dụng Cloudinary URL nếu có, nếu không dùng local URL
        const { getFileUrl } = require('../utils/cloudinary.util');
        profileData.staff_image = getFileUrl(req.file, req);
      }

      const staffProfile = new StaffProfile(profileData);
      await staffProfile.save();
      await staffProfile.populate('user_id');
      await staffProfile.populate('org_unit_id');
      await staffProfile.populate({
        path: 'faculty_id',
        select: '_id name'
      });
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
        facultyId,
        faculty_id,
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
      if (faculty_id !== undefined || facultyId !== undefined) updateData.faculty_id = faculty_id || facultyId;
      if (full_name !== undefined || fullName !== undefined) updateData.full_name = full_name || fullName;
      if (date_of_birth || dateOfBirth) updateData.date_of_birth = new Date(date_of_birth || dateOfBirth);
      if (gender !== undefined) updateData.gender = gender;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (contact_address !== undefined || contactAddress !== undefined) updateData.contact_address = contact_address || contactAddress;
      if (position !== undefined) updateData.position = position;
      
      // Xử lý file upload (staff_image)
      if (req.file) {
        // Sử dụng Cloudinary URL nếu có, nếu không dùng local URL
        const { getFileUrl } = require('../utils/cloudinary.util');
        updateData.staff_image = getFileUrl(req.file, req);
      } else if (staff_image !== undefined || staffImage !== undefined) {
        // Nếu không có file upload mới, giữ nguyên giá trị từ body (nếu có)
        // Ưu tiên staff_image, nếu không có thì dùng staffImage (kể cả null hoặc empty string)
        updateData.staff_image = staff_image !== undefined ? staff_image : staffImage;
      }

      const staffProfile = await StaffProfile.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('user_id')
        .populate('org_unit_id')
        .populate({
          path: 'faculty_id',
          select: '_id name'
        });
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
        .populate('org_unit_id')
        .populate({
          path: 'faculty_id',
          select: '_id name'
        });
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

