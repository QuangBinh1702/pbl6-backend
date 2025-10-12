// Xử lý đăng nhập, đăng ký, quên mật khẩu
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret } = require('../config/app.config');

module.exports = {
  async login(req, res) {
    try {
      const { username, password, email } = req.body;
      
      // Tìm user bằng username hoặc email
      const user = await User.findOne({
        $or: [{ username }, { email: email || username }]
      });
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Check locked
      if (user.isLocked) {
        return res.status(403).json({ success: false, message: 'Account is locked' });
      }
      
      // Generate token
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role }, 
        jwtSecret, 
        { expiresIn: '7d' }
      );
      
      res.json({ 
        success: true,
        token, 
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async register(req, res) {
    try {
      const { username, password, email, name, role } = req.body;
      
      // Validate
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
      }
      
      // Check exists
      const exists = await User.findOne({ $or: [{ username }, { email }] });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Username or email already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await User.create({
        username,
        password: hashedPassword,
        email,
        name: name || username,
        role: role || 'student',
        active: true
      });
      
      res.status(201).json({ 
        success: true,
        message: 'User created successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};
