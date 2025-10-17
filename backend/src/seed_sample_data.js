require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const User = require('./models/user.model');
const Role = require('./models/role.model');
const Permission = require('./models/permission.model');
const OrgUnit = require('./models/org_unit.model');
const StudentProfile = require('./models/student_profile.model');
const StaffProfile = require('./models/staff_profile.model');
const Class = require('./models/class.model');
const Falcuty = require('./models/falcuty.model');
const Cohort = require('./models/cohort.model');
const Field = require('./models/field.model');
const Activity = require('./models/activity.model');
const Evidence = require('./models/evidence.model');
const Registration = require('./models/registration.model');
const Attendance = require('./models/attendance.model');
const PvcdRecord = require('./models/pvcd_record.model');
const StudentCohort = require('./models/student_cohort.model');
const Post = require('./models/post.model');
const ActivityEligibility = require('./models/activity_eligibility.model');

async function seed() {
  await connectDB();

  // Tạo dữ liệu mẫu cho từng collection
  const role = await Role.create({ name: 'admin', description: 'Quản trị viên' });
  const permission = await Permission.create({ resource: 'user', action: 'create', name: 'Tạo user', description: 'Quyền tạo user' });
  const orgUnit = await OrgUnit.create({ name: 'Phòng CTSV', type: 'phong', leader: null });
  
  // Hash password trước khi tạo user
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await User.create({ 
    username: 'admin', 
    password: hashedPassword, 
    email: 'admin@example.com',
    name: 'Administrator',
    role: 'admin',
    active: true 
  });
  const studentProfile = await StudentProfile.create({ user: user._id, student_number: 'SV001', full_name: 'Nguyễn Văn A', email: 'sinhvien@example.com' });
  const staffProfile = await StaffProfile.create({ user: user._id, staff_number: 'CB001', full_name: 'Nguyễn Văn B', email: 'canbo@example.com', org_unit: orgUnit._id });
  const falcuty = await Falcuty.create({ name: 'CNTT' });
  const cohort = await Cohort.create({ year: 2022 });
  const classObj = await Class.create({ name: 'D20CQCN01', falcuty: falcuty._id, cohort: cohort._id });
  const field = await Field.create({ name: 'Công nghệ thông tin' });
  const activity = await Activity.create({ org_unit: orgUnit._id, field: field._id, title: 'Hoạt động A', description: 'Mô tả hoạt động' });
  const evidence = await Evidence.create({ student: studentProfile._id, title: 'Minh chứng A', file_url: 'http://example.com/file.pdf' });
  const registration = await Registration.create({ activity: activity._id, student: user._id });
  const attendance = await Attendance.create({ student: studentProfile._id, activity: activity._id });
  const pvcdRecord = await PvcdRecord.create({ student: studentProfile._id, year: new Date(), total_point: 10 });
  const studentCohort = await StudentCohort.create({ student: studentProfile._id, cohort: cohort._id, type: 'official' });
  const post = await Post.create({ activity: activity._id, description: 'Bài viết hoạt động' });
  const activityEligibility = await ActivityEligibility.create({ activity: activity._id, type: 'falcuty', reference: falcuty._id });

  console.log('Đã thêm dữ liệu mẫu cho tất cả collection!');
  mongoose.disconnect();
}

seed();
