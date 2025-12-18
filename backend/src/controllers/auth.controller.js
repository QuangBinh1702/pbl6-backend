// Xử lý đăng nhập, đăng ký, quên mật khẩu
const User = require('../models/user.model');
const UserRole = require('../models/user_role.model');
const Role = require('../models/role.model');
const StudentProfile = require('../models/student_profile.model');
const StaffProfile = require('../models/staff_profile.model');
const Class = require('../models/class.model');
const Falcuty = require('../models/falcuty.model');
const OrgUnit = require('../models/org_unit.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { jwtSecret } = require('../config/app.config');
const { sendEmail } = require('../utils/email.util');

// Generate common date-of-birth password variants to block
function generateDobPasswordVariants(date) {
  if (!date) return [];
  const dob = new Date(date);
  if (Number.isNaN(dob.getTime())) return [];

  const day = dob.getDate();
  const month = dob.getMonth() + 1;
  const year = dob.getFullYear();

  const d = String(day);
  const m = String(month);
  const y = String(year);
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');

  // Without separators
  const noSep = [
    // DDMMYYYY family
    `${dd}${mm}${y}`,
    `${dd}${m}${y}`,
    `${d}${mm}${y}`,
    `${d}${m}${y}`,
    // MMDDYYYY family
    `${mm}${dd}${y}`,
    `${mm}${d}${y}`,
    `${m}${dd}${y}`,
    `${m}${d}${y}`,
    // YYYYMMDD family
    `${y}${mm}${dd}`,
    `${y}${mm}${d}`,
    `${y}${m}${dd}`,
    `${y}${m}${d}`
  ];

  // With separators '/', '-'
  const withSep = [];
  ['/', '-'].forEach((sep) => {
    // DD/MM/YYYY and variants
    withSep.push(
      `${dd}${sep}${mm}${sep}${y}`,
      `${d}${sep}${m}${sep}${y}`,
      `${dd}${sep}${m}${sep}${y}`,
      `${d}${sep}${mm}${sep}${y}`
    );
    // MM/DD/YYYY and variants
    withSep.push(
      `${mm}${sep}${dd}${sep}${y}`,
      `${m}${sep}${d}${sep}${y}`,
      `${mm}${sep}${d}${sep}${y}`,
      `${m}${sep}${dd}${sep}${y}`
    );
    // YYYY/MM/DD and variants
    withSep.push(
      `${y}${sep}${mm}${sep}${dd}`,
      `${y}${sep}${m}${sep}${d}`,
      `${y}${sep}${mm}${sep}${d}`,
      `${y}${sep}${m}${sep}${dd}`
    );
  });

  return Array.from(new Set([...noSep, ...withSep]));
}

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
        return res.status(404).json({ 
          success: false, 
          // message: 'Tên đăng nhập không tồn tại' 
          message: 'User not found'
        });
      }
      
      // Check password with password_hash field
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          // message: 'Mật khẩu không đúng' 
          message: 'Invalid credentials'
        });
      }
      
      // Check if account is active
      if (!user.active) {
        return res.status(403).json({ 
          success: false, 
          // message: 'Account is inactive' 
          message: 'User is inactive' 
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
      let { 
        username, 
        password, 
        roleName,
        // Staff profile fields - các trường từ form UI
        staff_number,
        full_name,
        org_unit_id,
        position,
        // Student profile fields - các trường từ form UI
        student_number,
        class_id,
        enrollment_year,
        date_of_birth,
        gender,
        email,
        phone,
        contact_address
      } = req.body;
      
      // Validate required fields
      if (!username || !password || !roleName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, password and role are required' 
        });
      }
      
      // Nếu role là staff và không có staff_number, tự động dùng username làm staff_number
      // Vì theo form UI, username chính là mã cán bộ
      if (roleName === 'staff' && !staff_number) {
        staff_number = username;
      }
      
      // Nếu role là student và không có student_number, tự động dùng username làm student_number
      // Vì theo form UI, username chính là mã sinh viên
      if (roleName === 'student' && !student_number) {
        student_number = username;
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
      
      // Check if staff_number already exists (if creating staff)
      if (roleName === 'staff') {
        const existingStaff = await StaffProfile.findOne({ staff_number });
        if (existingStaff) {
          return res.status(400).json({ 
            success: false, 
            message: 'Staff number already exists' 
          });
        }
      }
      
      // Check if student_number already exists (if creating student)
      if (roleName === 'student') {
        const existingStudent = await StudentProfile.findOne({ student_number });
        if (existingStudent) {
          return res.status(400).json({ 
            success: false, 
            message: 'Student number already exists' 
          });
        }
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
      
      // If role is staff, create staff profile với các trường từ form
      // Tự động dùng username làm staff_number nếu không có
      let staffProfile = null;
      if (roleName === 'staff') {
        try {
          staffProfile = await StaffProfile.create({
            user_id: user._id,
            staff_number: staff_number || username,
            full_name: full_name || null,
            org_unit_id: org_unit_id || null,
            position: position || null
          });
          await staffProfile.populate('org_unit_id');
        } catch (staffError) {
          console.error('Error creating staff profile:', staffError);
          // Optionally delete the user if staff profile creation fails
          // await User.findByIdAndDelete(user._id);
          // return res.status(400).json({ success: false, message: 'Failed to create staff profile: ' + staffError.message });
        }
      }
      
      // If role is student, create student profile với các trường từ form
      // Tự động dùng username làm student_number nếu không có
      let studentProfile = null;
      if (roleName === 'student') {
        try {
          studentProfile = await StudentProfile.create({
            user_id: user._id,
            student_number: student_number || username,
            full_name: full_name || null,
            class_id: class_id || null,
            enrollment_year: enrollment_year || null,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            gender: gender || null,
            email: email || null,
            phone: phone || null,
            contact_address: contact_address || null,
            isClassMonitor: false
          });
          await studentProfile.populate({ 
            path: 'class_id', 
            populate: [
              { path: 'falcuty_id' }, 
              { path: 'cohort_id' } 
            ] 
          });
        } catch (studentError) {
          console.error('Error creating student profile:', studentError);
          // Optionally delete the user if student profile creation fails
          // await User.findByIdAndDelete(user._id);
          // return res.status(400).json({ success: false, message: 'Failed to create student profile: ' + studentError.message });
        }
      }
      
      const responseData = {
        success: true,
        message: `User '${username}' created successfully`,
        user: {
          id: user._id,
          username: user.username,
          active: user.active,
          role: roleName,
          createdBy: req.user.username
        }
      };
      
      // Include staff profile info if created
      if (staffProfile) {
        responseData.staffProfile = {
          id: staffProfile._id,
          staff_number: staffProfile.staff_number,
          full_name: staffProfile.full_name,
          org_unit_id: staffProfile.org_unit_id,
          position: staffProfile.position
        };
      }
      
      // Include student profile info if created
      if (studentProfile) {
        const spLean = studentProfile.toObject();
        responseData.studentProfile = {
          id: studentProfile._id,
          student_number: studentProfile.student_number,
          full_name: studentProfile.full_name,
          class_id: studentProfile.class_id,
          enrollment_year: studentProfile.enrollment_year
        };
      }
      
      res.status(201).json(responseData);
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createBulkUsers(req, res) {
    try {
      let users = [];
      let roleName = req.body.roleName; // Lấy roleName từ body hoặc form data
      
      // Nếu có file Excel upload
      if (req.file) {
        try {
          // Parse Excel file
          const workbook = XLSX.readFile(req.file.path);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const excelData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          
          // Xóa file sau khi đọc
          fs.unlinkSync(req.file.path);
          
          if (excelData.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'File Excel không có dữ liệu'
            });
          }
          
          // Validate roleName
          if (!roleName || (roleName !== 'student' && roleName !== 'staff')) {
            return res.status(400).json({
              success: false,
              message: 'roleName phải là "student" hoặc "staff"'
            });
          }
          
          // Convert Excel data to users array
          if (roleName === 'student') {
            // Format cho sinh viên: Mã số sinh viên, Tên sinh viên, Lớp, Khoa
            users = await this.parseExcelToStudents(excelData);
          } else if (roleName === 'staff') {
            // Format cho staff: Mã cán bộ, Tên cán bộ, Đơn vị, Chức vụ
            users = await this.parseExcelToStaff(excelData);
          }
          
          if (users.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'Không thể parse dữ liệu từ file Excel. Vui lòng kiểm tra format file.'
            });
          }
        } catch (excelError) {
          // Xóa file nếu có lỗi
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          return res.status(400).json({
            success: false,
            message: `Lỗi đọc file Excel: ${excelError.message}`
          });
        }
      } else {
        // Cách cũ: nhận JSON array từ body
        users = req.body.users;
        if (!users || !Array.isArray(users) || users.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Users array is required and must not be empty, or upload Excel file' 
          });
        }
      }
      
      // Validate input
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
        let { 
          username, 
          password, 
          roleName: userRoleName,
          // Staff profile fields - các trường từ form UI
          staff_number,
          full_name,
          org_unit_id,
          position,
          // Student profile fields - các trường từ form UI
          student_number,
          class_id,
          enrollment_year,
          date_of_birth,
          gender,
          email,
          phone,
          contact_address
        } = users[i];
        
        try {
          // Sử dụng roleName từ Excel (nếu có) hoặc từ user object
          // Nếu upload Excel, roleName đã được set trong users array
          // Nếu dùng JSON, mỗi user có thể có roleName riêng
          const finalRoleName = userRoleName || roleName;
          
          // Validate required fields
          if (!username || !password || !finalRoleName) {
            errors.push({
              index: i + 1, // Excel row number (1-based)
              username: username || 'N/A',
              error: 'Username, password and role are required'
            });
            continue;
          }
          
          // Nếu role là staff và không có staff_number, tự động dùng username làm staff_number
          // Vì theo form UI, username chính là mã cán bộ
          if (finalRoleName === 'staff' && !staff_number) {
            staff_number = username;
          }
          
          // Nếu role là student và không có student_number, tự động dùng username làm student_number
          // Vì theo form UI, username chính là mã sinh viên
          if (finalRoleName === 'student' && !student_number) {
            student_number = username;
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
          const role = await Role.findOne({ name: finalRoleName });
          if (!role) {
            errors.push({
              index: i + 1,
              username,
              error: `Invalid role: ${finalRoleName}. Available roles: admin, teacher, student, staff`
            });
            continue;
          }
          
          // Check if staff_number already exists (if creating staff)
          if (finalRoleName === 'staff') {
            const finalStaffNumber = staff_number || username;
            const existingStaff = await StaffProfile.findOne({ staff_number: finalStaffNumber });
            if (existingStaff) {
              errors.push({
                index: i,
                username: username || 'N/A',
                error: 'Staff number already exists'
              });
              continue;
            }
          }
          
          // Check if student_number already exists (if creating student)
          if (finalRoleName === 'student') {
            const finalStudentNumber = student_number || username;
            const existingStudent = await StudentProfile.findOne({ student_number: finalStudentNumber });
            if (existingStudent) {
              errors.push({
                index: i,
                username: username || 'N/A',
                error: 'Student number already exists'
              });
              continue;
            }
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
          
          // If role is staff, create staff profile với các trường từ form
          // Tự động dùng username làm staff_number nếu không có
          let staffProfile = null;
          if (finalRoleName === 'staff') {
            try {
              staffProfile = await StaffProfile.create({
                user_id: user._id,
                staff_number: staff_number || username,
                full_name: full_name || null,
                org_unit_id: org_unit_id || null,
                position: position || null
              });
              await staffProfile.populate('org_unit_id');
            } catch (staffError) {
              console.error(`Error creating staff profile for ${username}:`, staffError);
              // Note: User is already created, but staff profile creation failed
              // You might want to handle this differently (e.g., delete user or mark as error)
            }
          }
          
          // If role is student, create student profile với các trường từ form
          // Tự động dùng username làm student_number nếu không có
          let studentProfile = null;
          if (finalRoleName === 'student') {
            try {
              studentProfile = await StudentProfile.create({
                user_id: user._id,
                student_number: student_number || username,
                full_name: full_name || null,
                class_id: class_id || null,
                enrollment_year: enrollment_year || null,
                date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
                gender: gender || null,
                email: email || null,
                phone: phone || null,
                contact_address: contact_address || null,
                isClassMonitor: false
              });
              await studentProfile.populate({ 
                path: 'class_id', 
                populate: [
                  { path: 'falcuty_id' }, 
                  { path: 'cohort_id' } 
                ] 
              });
            } catch (studentError) {
              console.error(`Error creating student profile for ${username}:`, studentError);
              // Note: User is already created, but student profile creation failed
              // You might want to handle this differently (e.g., delete user or mark as error)
            }
          }
          
          const resultItem = {
            username: user.username,
            role: finalRoleName,
            id: user._id
          };
          
          // Include staff profile info if created
          if (staffProfile) {
            resultItem.staffProfile = {
              id: staffProfile._id,
              staff_number: staffProfile.staff_number,
              full_name: staffProfile.full_name,
              org_unit_id: staffProfile.org_unit_id,
              position: staffProfile.position
            };
          }
          
          // Include student profile info if created
          if (studentProfile) {
            resultItem.studentProfile = {
              id: studentProfile._id,
              student_number: studentProfile.student_number,
              full_name: studentProfile.full_name,
              class_id: studentProfile.class_id,
              enrollment_year: studentProfile.enrollment_year
            };
          }
          
          results.push(resultItem);
        } catch (err) {
          console.error(`Error creating user ${username}:`, err);
          errors.push({
            index: i + 1,
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

  // Helper function: Parse Excel data to students array
  async parseExcelToStudents(excelData) {
    const users = [];
    
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      
      // Map các tên cột có thể khác nhau
      const studentNumber = row['Mã số sinh viên'] || row['MSSV'] || row['Mã sinh viên'] || row['Student ID'] || '';
      const fullName = row['Tên sinh viên'] || row['Họ tên'] || row['Tên'] || row['Full Name'] || row['Name'] || '';
      const className = row['Lớp'] || row['Class'] || row['Tên lớp'] || '';
      const facultyName = row['Khoa'] || row['Faculty'] || row['Tên khoa'] || '';
      
      if (!studentNumber || !fullName) {
        continue; // Skip row nếu thiếu thông tin bắt buộc
      }
      
      // Tìm class_id từ tên lớp và tên khoa
      let class_id = null;
      if (className && facultyName) {
        try {
          // Tìm khoa trước
          const faculty = await Falcuty.findOne({ 
            name: { $regex: new RegExp(facultyName.trim(), 'i') } 
          });
          
          if (faculty) {
            // Tìm lớp trong khoa đó
            const classObj = await Class.findOne({ 
              name: className.trim(),
              falcuty_id: faculty._id
            });
            
            if (classObj) {
              class_id = classObj._id;
            }
          }
        } catch (err) {
          console.error(`Error finding class for ${className} in ${facultyName}:`, err);
        }
      }
      
      // Password mặc định = username (mã số sinh viên)
      users.push({
        username: studentNumber.toString().trim(),
        password: studentNumber.toString().trim(),
        roleName: 'student',
        student_number: studentNumber.toString().trim(),
        full_name: fullName.trim(),
        class_id: class_id
      });
    }
    
    return users;
  },

  // Helper function: Parse Excel data to staff array
  async parseExcelToStaff(excelData) {
    const users = [];
    
    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      
      // Map các tên cột có thể khác nhau
      const staffNumber = row['Mã cán bộ'] || row['Mã giảng viên'] || row['Mã nhân viên'] || row['Staff ID'] || row['Mã CB'] || '';
      const fullName = row['Tên cán bộ'] || row['Tên giảng viên'] || row['Tên nhân viên'] || row['Họ tên'] || row['Tên'] || row['Full Name'] || row['Name'] || '';
      const orgUnitName = row['Đơn vị'] || row['Đơn vị công tác'] || row['Org Unit'] || row['Department'] || '';
      const position = row['Chức vụ'] || row['Position'] || '';
      
      if (!staffNumber || !fullName) {
        continue; // Skip row nếu thiếu thông tin bắt buộc
      }
      
      // Tìm org_unit_id từ tên đơn vị
      let org_unit_id = null;
      if (orgUnitName) {
        try {
          const orgUnit = await OrgUnit.findOne({ 
            name: { $regex: new RegExp(orgUnitName.trim(), 'i') } 
          });
          
          if (orgUnit) {
            org_unit_id = orgUnit._id;
          }
        } catch (err) {
          console.error(`Error finding org unit for ${orgUnitName}:`, err);
        }
      }
      
      // Password mặc định = username (mã cán bộ)
      users.push({
        username: staffNumber.toString().trim(),
        password: staffNumber.toString().trim(),
        roleName: 'staff',
        staff_number: staffNumber.toString().trim(),
        full_name: fullName.trim(),
        org_unit_id: org_unit_id,
        position: position ? position.trim() : null
      });
    }
    
    return users;
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
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id; // From auth middleware
      
      // Validate input (basic checks only - FE should do most validation)
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Mật khẩu cũ và mật khẩu mới là bắt buộc' 
        });
      }

      // Validate password strength
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password too short'
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
          // message: 'Mật khẩu mới phải khác mật khẩu cũ' 
          message: 'New password must be different from old password' 
        });
      }
      
      // Validate against date of birth (important security check - must be on backend)
      const studentProfile = await StudentProfile.findOne({ user_id: userId });
      if (studentProfile && studentProfile.date_of_birth) {
        const possiblePasswords = generateDobPasswordVariants(studentProfile.date_of_birth);
        if (possiblePasswords.includes(newPassword)) {
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
      const { username, newPassword } = req.body;
      
      // Validate input (basic checks only - FE should do most validation)
      if (!username || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username và mật khẩu mới là bắt buộc' 
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
      
      // Validate against date of birth (important security check - must be on backend)
      const studentProfile = await StudentProfile.findOne({ user_id: user._id });
      if (studentProfile && studentProfile.date_of_birth) {
        const possiblePasswords = generateDobPasswordVariants(studentProfile.date_of_birth);
        if (possiblePasswords.includes(newPassword)) {
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
