// Xử lý đăng nhập, đăng ký, quên mật khẩu
const User = require('../models/user.model');
const UserRole = require('../models/user_role.model');
const Role = require('../models/role.model');
const StudentProfile = require('../models/student_profile.model');
const StaffProfile = require('../models/staff_profile.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { jwtSecret } = require('../config/app.config');
const { sendEmail } = require('../utils/email.util');

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
      
      // Validate required fields
      if (!username || !password || !roleName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, password and role are required' 
        });
      }
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' 
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
      
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        });
      }
      
      // Check if role exists
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role. Available roles: admin, teacher, student, staff' 
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
      
      // Assign the specified role
      await UserRole.create({
        user_id: user._id,
        role_id: role._id
      });
      
      res.status(201).json({ 
        success: true,
        message: 'User created successfully',
        user: {
          id: user._id,
          username: user.username,
          active: user.active,
          role: roleName
        }
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createUser(req, res) {
    try {
      const { username, password, roleName } = req.body;
      
      // Validate required fields
      if (!username || !password || !roleName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, password and role are required' 
        });
      }
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores' 
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
      
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        });
      }
      
      // Check if role exists
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role. Available roles: admin, teacher, student, staff' 
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
      
      // Assign the specified role
      await UserRole.create({
        user_id: user._id,
        role_id: role._id
      });
      
      res.status(201).json({ 
        success: true,
        message: 'User created successfully by admin',
        user: {
          id: user._id,
          username: user.username,
          active: user.active,
          role: roleName,
          createdBy: req.user.username
        }
      });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createBulkUsers(req, res) {
    try {
      const { users } = req.body;
      
      // Validate input
      if (!users || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Users array is required and must not be empty' 
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
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      
      for (let i = 0; i < users.length; i++) {
        const { username, password, roleName } = users[i];
        
        try {
          // Validate required fields
          if (!username || !password || !roleName) {
            errors.push({
              index: i,
              username: username || 'N/A',
              error: 'Username, password and role are required'
            });
            continue;
          }
          
          // Validate username format
          if (!usernameRegex.test(username)) {
            errors.push({
              index: i,
              username,
              error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
            });
            continue;
          }
          
          // Check if username exists
          const exists = await User.findOne({ username });
          if (exists) {
            errors.push({
              index: i,
              username,
              error: 'Username already exists'
            });
            continue;
          }
          
          // Validate password strength
          if (password.length < 6) {
            errors.push({
              index: i,
              username,
              error: 'Password must be at least 6 characters long'
            });
            continue;
          }
          
          // Check if role exists
          const role = await Role.findOne({ name: roleName });
          if (!role) {
            errors.push({
              index: i,
              username,
              error: `Invalid role: ${roleName}. Available roles: admin, teacher, student, staff`
            });
            continue;
          }
          
          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);
          
          // Create user
          const user = await User.create({
            username,
            password_hash: hashedPassword,
            active: true,
            isLocked: false
          });
          
          // Assign role
          await UserRole.create({
            user_id: user._id,
            role_id: role._id
          });
          
          results.push({
            username: user.username,
            role: roleName,
            id: user._id
          });
        } catch (err) {
          console.error(`Error creating user ${username}:`, err);
          errors.push({
            index: i,
            username: username || 'N/A',
            error: err.message
          });
        }
      }
      
      res.status(201).json({ 
        success: true,
        message: `${results.length} users created successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
        created: results,
        failed: errors.length > 0 ? errors : undefined,
        summary: {
          total: users.length,
          created: results.length,
          failed: errors.length
        }
      });
    } catch (err) {
      console.error('Create bulk users error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getAvailableRoles(req, res) {
    try {
      const roles = await Role.find({}, 'name description').sort({ name: 1 });
      
      res.json({ 
        success: true, 
        data: roles,
        message: 'Available roles retrieved successfully'
      });
    } catch (err) {
      console.error('Get available roles error:', err);
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
  },

  async forgotPassword(req, res) {
    try {
      const { username } = req.body;
      
      // Validate input
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username is required' 
        });
      }
      
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ 
          success: true,
          message: 'If an account with that username exists, a password reset link has been sent.' 
        });
      }
      
      // Check if account is active
      if (!user.active) {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is inactive' 
        });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
      
      // Save token to user
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();
      
      // Get user email from profile
      let email = null;
      const studentProfile = await StudentProfile.findOne({ user_id: user._id });
      if (studentProfile && studentProfile.email) {
        email = studentProfile.email;
      } else {
        const staffProfile = await StaffProfile.findOne({ user_id: user._id });
        if (staffProfile && staffProfile.email) {
          email = staffProfile.email;
        }
      }
      
      // If no email found, return error
      if (!email) {
        // Clear the token since we can't send email
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        return res.status(400).json({ 
          success: false, 
          message: 'No email found for this account. Please contact administrator.' 
        });
      }
      
      // Send email with reset link
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      const emailSubject = 'Password Reset Request';
      const emailText = `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your account (${username}).</p>
          <p>Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 30 minutes.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,<br>Community Activity Management System</p>
        </div>
      `;
      
      try {
        await sendEmail(email, emailSubject, emailText, emailHtml);
        
        res.json({ 
          success: true,
          message: 'Password reset link has been sent to your email.' 
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Clear the token since email failed
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send email. Please contact administrator.' 
        });
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      // Validate input
      if (!token || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Token and new password are required' 
        });
      }
      
      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        });
      }
      
      // Hash the token to compare with stored hash
      const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find user with valid token and not expired
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired reset token' 
        });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear reset token fields
      user.password_hash = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      res.json({ 
        success: true,
        message: 'Password has been reset successfully' 
      });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user.id; // From auth middleware
      
      // Validate input
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vui lòng nhập đầy đủ thông tin' 
        });
      }
      
      // Check new password matches confirmation
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mật khẩu mới và xác nhận mật khẩu không khớp' 
        });
      }
      
      // Validate password strength (6-12 characters)
      if (newPassword.length < 6 || newPassword.length > 12) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mật khẩu phải có độ dài từ 6 đến 12 ký tự' 
        });
      }
      
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Mật khẩu cũ không đúng' 
        });
      }
      
      // Check if new password is same as old password
      const isSame = await bcrypt.compare(newPassword, user.password_hash);
      if (isSame) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mật khẩu mới phải khác mật khẩu cũ' 
        });
      }
      
      // Validate against date of birth (for students)
      const studentProfile = await StudentProfile.findOne({ user_id: userId });
      if (studentProfile && studentProfile.date_of_birth) {
        // Format date of birth to check if password matches (DDMMYYYY or YYYYMMDD)
        const dob = new Date(studentProfile.date_of_birth);
        const dobDDMMYYYY = `${String(dob.getDate()).padStart(2, '0')}${String(dob.getMonth() + 1).padStart(2, '0')}${dob.getFullYear()}`;
        const dobYYYYMMDD = `${dob.getFullYear()}${String(dob.getMonth() + 1).padStart(2, '0')}${String(dob.getDate()).padStart(2, '0')}`;
        
        if (newPassword === dobDDMMYYYY || newPassword === dobYYYYMMDD) {
          return res.status(400).json({ 
            success: false, 
            message: 'Không được đặt mật khẩu trùng ngày sinh' 
          });
        }
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      user.password_hash = hashedPassword;
      await user.save();
      
      res.json({ 
        success: true,
        message: 'Đổi mật khẩu thành công' 
      });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async adminUpdatePassword(req, res) {
    try {
      const { username, newPassword, confirmPassword } = req.body;
      
      // Validate input
      if (!username || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vui lòng nhập đầy đủ thông tin' 
        });
      }
      
      // Check new password matches confirmation
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mật khẩu mới và xác nhận mật khẩu không khớp' 
        });
      }
      
      // Validate password strength (6-12 characters)
      if (newPassword.length < 6 || newPassword.length > 12) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mật khẩu phải có độ dài từ 6 đến 12 ký tự' 
        });
      }
      
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy người dùng với username này' 
        });
      }
      
      // Validate against date of birth (for students)
      const studentProfile = await StudentProfile.findOne({ user_id: user._id });
      if (studentProfile && studentProfile.date_of_birth) {
        // Format date of birth to check if password matches (DDMMYYYY or YYYYMMDD)
        const dob = new Date(studentProfile.date_of_birth);
        const dobDDMMYYYY = `${String(dob.getDate()).padStart(2, '0')}${String(dob.getMonth() + 1).padStart(2, '0')}${dob.getFullYear()}`;
        const dobYYYYMMDD = `${dob.getFullYear()}${String(dob.getMonth() + 1).padStart(2, '0')}${String(dob.getDate()).padStart(2, '0')}`;
        
        if (newPassword === dobDDMMYYYY || newPassword === dobYYYYMMDD) {
          return res.status(400).json({ 
            success: false, 
            message: 'Không được đặt mật khẩu trùng ngày sinh' 
          });
        }
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      user.password_hash = hashedPassword;
      await user.save();
      
      res.json({ 
        success: true,
        message: 'Cập nhật mật khẩu thành công' 
      });
    } catch (err) {
      console.error('Admin update password error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
