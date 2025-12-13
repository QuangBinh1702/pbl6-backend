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
      const { username, password, email, role, isLocked } = req.body;

      // Validate required fields
      if (!username || username.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Username is required'
        });
      }

      if (!password || password.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        });
      }

      if (!email || email.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check if username already exists
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      const user = new User({
        username: username.trim(),
        password: password.trim(),
        email: email.trim().toLowerCase(),
        role: role || 'student',
        isLocked: isLocked === true
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isLocked: user.isLocked
        }
      });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  async createMultipleUsers(req, res) {
    try {
      const { users } = req.body;

      // Validate request
      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'users array is required and must not be empty'
        });
      }

      if (users.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 100 users can be created at once'
        });
      }

      const results = [];
      const errors = [];

      // Collect all usernames and emails to check for duplicates
      const usernames = new Set();
      const emails = new Set();
      const existingUsernames = new Set();
      const existingEmails = new Set();

      // Get all existing usernames and emails in database
      const existingUsers = await User.find({
        $or: [
          { username: { $in: users.map(u => u.username) } },
          { email: { $in: users.map(u => u.email) } }
        ]
      }).select('username email');

      existingUsers.forEach(user => {
        existingUsernames.add(user.username);
        existingEmails.add(user.email);
      });

      // Validate each user object
      for (let i = 0; i < users.length; i++) {
        const { username, password, email, role, isLocked } = users[i];

        // Validate required fields
        if (!username || username.trim() === '') {
          errors.push({
            index: i,
            error: 'Username is required'
          });
          continue;
        }

        if (!password || password.trim() === '') {
          errors.push({
            index: i,
            error: 'Password is required'
          });
          continue;
        }

        if (!email || email.trim() === '') {
          errors.push({
            index: i,
            error: 'Email is required'
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push({
            index: i,
            error: 'Invalid email format'
          });
          continue;
        }

        const usernameNormalized = username.trim();
        const emailNormalized = email.trim().toLowerCase();

        // Check for duplicate in current batch
        if (usernames.has(usernameNormalized)) {
          errors.push({
            index: i,
            error: 'Duplicate username in batch'
          });
          continue;
        }

        if (emails.has(emailNormalized)) {
          errors.push({
            index: i,
            error: 'Duplicate email in batch'
          });
          continue;
        }

        // Check if username already exists in database
        if (existingUsernames.has(usernameNormalized)) {
          errors.push({
            index: i,
            error: 'Username already exists'
          });
          continue;
        }

        // Check if email already exists in database
        if (existingEmails.has(emailNormalized)) {
          errors.push({
            index: i,
            error: 'Email already exists'
          });
          continue;
        }

        usernames.add(usernameNormalized);
        emails.add(emailNormalized);

        // Create user object
        try {
          const user = new User({
            username: usernameNormalized,
            password: password.trim(),
            email: emailNormalized,
            role: role || 'student',
            isLocked: isLocked === true
          });

          await user.save();

          results.push({
            index: i,
            success: true,
            user: {
              _id: user._id,
              username: user.username,
              email: user.email,
              role: user.role,
              isLocked: user.isLocked
            }
          });
        } catch (err) {
          errors.push({
            index: i,
            error: err.message
          });
        }
      }

      res.json({
        success: errors.length === 0,
        message: `Created ${results.length} users${errors.length > 0 ? `, with ${errors.length} errors` : ''}`,
        data: {
          created: results.length,
          failed: errors.length,
          results: results,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (err) {
      console.error('Create multiple users error:', err);
      res.status(500).json({
        success: false,
        message: err.message
      });
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
