// Xử lý đăng nhập, đăng ký, quên mật khẩu
const User = require('../models/user.model');
const UserRole = require('../models/user_role.model');
const Role = require('../models/role.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret } = require('../config/app.config');

module.exports = {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }
      
      // Find user by username only (new schema)
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Check password with password_hash field
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Check if account is active
      if (!user.active) {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is inactive' 
        });
      }
      
      // Check if account is locked
      if (user.isLocked) {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is locked' 
        });
      }
      
      // Get user roles from UserRole table
      const userRoles = await UserRole.find({ user_id: user._id })
        .populate('role_id')
        .populate('org_unit_id');
      
      const roles = userRoles.map(ur => ({
        role: ur.role_id ? ur.role_id.name : null,
        roleId: ur.role_id ? ur.role_id._id : null,
        orgUnit: ur.org_unit_id ? {
          id: ur.org_unit_id._id,
          name: ur.org_unit_id.name,
          type: ur.org_unit_id.type
        } : null
      })).filter(r => r.role);
      
      // Generate token (no role in payload, just id and username)
      const token = jwt.sign(
        { 
          id: user._id, 
          username: user.username
        }, 
        jwtSecret, 
        { expiresIn: '7d' }
      );
      
      res.json({ 
        success: true,
        token, 
        user: {
          id: user._id,
          username: user.username,
          active: user.active,
          isLocked: user.isLocked,
          roles: roles
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async register(req, res) {
    try {
      const { username, password, roleName } = req.body;
      
      // Validate
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }
      
      // Check if username exists
      const exists = await User.findOne({ username });
      if (exists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already exists' 
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user with new schema
      const user = await User.create({
        username,
        password_hash: hashedPassword,
        active: true,
        isLocked: false
      });
      
      // Assign default role (student) if not specified
      const roleToAssign = roleName || 'student';
      const role = await Role.findOne({ name: roleToAssign });
      
      if (role) {
        await UserRole.create({
          user_id: user._id,
          role_id: role._id
        });
      }
      
      res.status(201).json({ 
        success: true,
        message: 'User created successfully',
        user: {
          id: user._id,
          username: user.username,
          active: user.active,
          role: roleToAssign
        }
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getProfile(req, res) {
    try {
      const userId = req.user.id; // From auth middleware
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Get user roles
      const userRoles = await UserRole.find({ user_id: userId })
        .populate('role_id')
        .populate('org_unit_id');
      
      const roles = userRoles.map(ur => ({
        role: ur.role_id ? ur.role_id.name : null,
        roleId: ur.role_id ? ur.role_id._id : null,
        orgUnit: ur.org_unit_id ? {
          id: ur.org_unit_id._id,
          name: ur.org_unit_id.name,
          type: ur.org_unit_id.type
        } : null
      })).filter(r => r.role);
      
      res.json({
        success: true,
        user: {
          id: user._id,
          username: user.username,
          active: user.active,
          isLocked: user.isLocked,
          roles: roles
        }
      });
    } catch (err) {
      console.error('Get profile error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
