// Quản lý người dùng
const User = require('../models/user.model');
const UserRole = require('../models/user_role.model');
const Role = require('../models/role.model');
const Action = require('../models/action.model');
const UserActionOverride = require('../models/user_action_override.model');
const Evidence = require('../models/evidence.model');

module.exports = {
  async getAllUsers(req, res) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async createUser(req, res) {
    try {
      const user = new User(req.body);
      await user.save();
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async updateUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      
      // Kiểm tra user có tồn tại không
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Xóa cascade: Xóa tất cả dữ liệu liên quan đến user
      const StaffProfile = require('../models/staff_profile.model');
      const StudentProfile = require('../models/student_profile.model');
      
      // Xóa staff profile nếu có
      await StaffProfile.deleteMany({ user_id: userId });
      
      // Xóa student profile nếu có
      await StudentProfile.deleteMany({ user_id: userId });
      
      // Xóa user roles
      await UserRole.deleteMany({ user_id: userId });
      
      // Xóa action overrides
      await UserActionOverride.deleteMany({ user_id: userId });
      
      // Xóa evidences
      await Evidence.deleteMany({ user: userId });
      
      // Cuối cùng xóa user
      await User.findByIdAndDelete(userId);
      
      res.json({ 
        success: true, 
        message: 'User and all related data deleted successfully' 
      });
    } catch (err) {
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  },
  async lockUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { isLocked: true }, { new: true });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async unlockUser(req, res) {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, { isLocked: false }, { new: true });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
  async updateRole(req, res) {
    try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async getUserEvidences(req, res) {
    try {
      const evidences = await Evidence.find({ user: req.params.id });
      res.json(evidences);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // Role management methods
  async getUserRoles(req, res) {
    try {
      const userRoles = await UserRole.find({ user_id: req.params.id })
        .populate('role_id')
        .populate('org_unit_id');
      
      res.json({ success: true, data: userRoles });
    } catch (err) {
      console.error('Get user roles error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async assignRole(req, res) {
    try {
      const { role_id, org_unit_id } = req.body;
      
      if (!role_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'role_id is required' 
        });
      }
      
      // Check if role exists
      const role = await Role.findById(role_id);
      if (!role) {
        return res.status(404).json({ 
          success: false, 
          message: 'Role not found' 
        });
      }
      
      // Check if user-role assignment already exists
      const existing = await UserRole.findOne({
        user_id: req.params.id,
        role_id,
        org_unit_id: org_unit_id || null
      });
      
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'User already has this role' 
        });
      }
      
      const userRole = await UserRole.create({
        user_id: req.params.id,
        role_id,
        org_unit_id
      });
      
      await userRole.populate('role_id');
      await userRole.populate('org_unit_id');
      
      res.status(201).json({ success: true, data: userRole });
    } catch (err) {
      console.error('Assign role error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeRole(req, res) {
    try {
      const userRole = await UserRole.findOneAndDelete({
        user_id: req.params.id,
        role_id: req.params.roleId
      });
      
      if (!userRole) {
        return res.status(404).json({ 
          success: false, 
          message: 'User role assignment not found' 
        });
      }
      
      res.json({ success: true, message: 'Role removed successfully' });
    } catch (err) {
      console.error('Remove role error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Action override management methods
  async addActionOverride(req, res) {
    try {
      const { action_id, is_granted } = req.body;
      
      if (!action_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'action_id is required' 
        });
      }
      
      // Check if action exists
      const action = await Action.findById(action_id);
      if (!action) {
        return res.status(404).json({ 
          success: false, 
          message: 'Action not found' 
        });
      }
      
      // Create or update override
      const override = await UserActionOverride.findOneAndUpdate(
        { user_id: req.params.id, action_id },
        { is_granted: is_granted !== false }, // Default to true if not specified
        { upsert: true, new: true }
      ).populate('action_id');
      
      res.status(201).json({ success: true, data: override });
    } catch (err) {
      console.error('Add action override error:', err);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  async removeActionOverride(req, res) {
    try {
      const override = await UserActionOverride.findOneAndDelete({
        user_id: req.params.id,
        action_id: req.params.actionId
      });
      
      if (!override) {
        return res.status(404).json({ 
          success: false, 
          message: 'Action override not found' 
        });
      }
      
      res.json({ success: true, message: 'Action override removed successfully' });
    } catch (err) {
      console.error('Remove action override error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
