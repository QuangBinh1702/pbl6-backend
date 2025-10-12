require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/user.model');
const Role = require('./models/role.model');
const Permission = require('./models/permission.model');
const permConfig = require('./permissions.config');
const StudentProfile = require('./models/student_profile.model');
const Class = require('./models/class.model');
const Falcuty = require('./models/falcuty.model');
const Cohort = require('./models/cohort.model');
const OrgUnit = require('./models/org_unit.model');
const StaffProfile = require('./models/staff_profile.model');
const Activity = require('./models/activity.model');
const Evidence = require('./models/evidence.model');
const Registration = require('./models/registration.model');
const Attendance = require('./models/attendance.model');
const PvcdRecord = require('./models/pvcd_record.model');

async function seed() {
  await connectDB();

  // Thông tin theo yêu cầu người dùng
  const MSSV = '102220095';
  const CLASS_NAME = '22T_DT2';
  const FACULTY_NAME = 'Công nghệ thông tin';
  const JOIN_YEAR = 2022;
  const STUDENT_FULLNAME = 'Nguyễn Quang Bình';
  const STUDENT_PERSONAL_EMAIL = 'ngbinh1702@gmail.com';
  const STUDENT_PHONE = '0787546459';
  const STUDENT_DOB = new Date('2004-02-17');

  try {
    // 0) Role/Permission cơ bản
    const roleNames = Object.keys(permConfig);
    const roleDocs = await Promise.all(
      roleNames.map((r) =>
        Role.findOneAndUpdate(
          { name: r },
          { name: r, permissions: permConfig[r] },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    const basePermissions = Array.from(
      new Set(roleDocs.flatMap((r) => r.permissions))
    ).map((pa) => {
      const [resource, action] = pa.split(':');
      const nameMap = {
        'activity:create': 'Tạo hoạt động',
        'activity:update': 'Sửa hoạt động',
        'activity:delete': 'Xóa hoạt động',
        'activity:approve': 'Duyệt hoạt động',
        'activity:register': 'Đăng ký hoạt động',
        'attendance:scan': 'Điểm danh'
      };
      return { resource, action, name: nameMap[pa] || pa };
    });
    await Promise.all(
      basePermissions.map((p) =>
        Permission.findOneAndUpdate(
          { resource: p.resource, action: p.action },
          p,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    // 1) Tạo/đảm bảo Khoa, Khóa, Lớp
    const falcuty = await Falcuty.findOneAndUpdate(
      { name: FACULTY_NAME },
      { name: FACULTY_NAME },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const cohort = await Cohort.findOneAndUpdate(
      { year: JOIN_YEAR },
      { year: JOIN_YEAR },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const classObj = await Class.findOneAndUpdate(
      { name: CLASS_NAME },
      { name: CLASS_NAME, falcuty: falcuty._id, cohort: cohort._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2) Tạo/đảm bảo User (schema yêu cầu name, email, password)
    const userEmail = `${MSSV}@stu.ptit.edu.vn`;
    const userName = STUDENT_FULLNAME || `Sinh viên ${MSSV}`;

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      {
        name: userName,
        email: userEmail,
        password: '123456', // chỉ dùng cho test API
        role: 'student',
        class: CLASS_NAME,
        studentId: MSSV,
        department: FACULTY_NAME,
        joinedYear: JOIN_YEAR
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 3) Hồ sơ sinh viên
    const studentProfile = await StudentProfile.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        student_number: MSSV,
        full_name: userName,
        email: STUDENT_PERSONAL_EMAIL,
        enrollment_year: JOIN_YEAR,
        class: classObj._id,
        phone: STUDENT_PHONE,
        date_of_birth: STUDENT_DOB
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 3.1) Tạo các Đơn vị (OrgUnit) cơ bản và tài khoản nhân sự tương ứng
    const [ctsvUnit, khoaUnit, doanUnit, clbUnit] = await Promise.all([
      OrgUnit.findOneAndUpdate({ name: 'Phòng CTSV' }, { name: 'Phòng CTSV', type: 'ctsv' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
      OrgUnit.findOneAndUpdate({ name: 'Khoa Công nghệ thông tin' }, { name: 'Khoa Công nghệ thông tin', type: 'khoa' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
      OrgUnit.findOneAndUpdate({ name: 'Đoàn trường' }, { name: 'Đoàn trường', type: 'doan' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
      OrgUnit.findOneAndUpdate({ name: 'CLB IT' }, { name: 'CLB IT', type: 'clb' }, { upsert: true, new: true, setDefaultsOnInsert: true })
    ]);

    // Tài khoản Admin hệ thống
    const admin = await User.findOneAndUpdate(
      { email: 'admin@pbl6.local' },
      { name: 'Quản trị hệ thống', email: 'admin@pbl6.local', password: '123456', role: 'admin' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Tài khoản CTSV
    const ctsvUser = await User.findOneAndUpdate(
      { email: 'ctsv@pbl6.local' },
      { name: 'Cán bộ CTSV', email: 'ctsv@pbl6.local', password: '123456', role: 'ctsv', department: 'Phòng CTSV' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await StaffProfile.findOneAndUpdate(
      { user: ctsvUser._id },
      { user: ctsvUser._id, staff_number: 'CBCTSV001', full_name: 'Cán bộ CTSV', email: 'ctsv@pbl6.local', org_unit: ctsvUnit._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Tài khoản Khoa
    const khoaUser = await User.findOneAndUpdate(
      { email: 'khoa.cntt@pbl6.local' },
      { name: 'Cán bộ Khoa CNTT', email: 'khoa.cntt@pbl6.local', password: '123456', role: 'khoa', department: 'Khoa Công nghệ thông tin' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await StaffProfile.findOneAndUpdate(
      { user: khoaUser._id },
      { user: khoaUser._id, staff_number: 'CBKHOA001', full_name: 'Cán bộ Khoa CNTT', email: 'khoa.cntt@pbl6.local', org_unit: khoaUnit._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Tài khoản Đoàn trường
    const doanUser = await User.findOneAndUpdate(
      { email: 'doan@pbl6.local' },
      { name: 'Cán bộ Đoàn trường', email: 'doan@pbl6.local', password: '123456', role: 'doantruong', department: 'Đoàn trường' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await StaffProfile.findOneAndUpdate(
      { user: doanUser._id },
      { user: doanUser._id, staff_number: 'CBDOAN001', full_name: 'Cán bộ Đoàn trường', email: 'doan@pbl6.local', org_unit: doanUnit._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Tài khoản CLB
    const clbUser = await User.findOneAndUpdate(
      { email: 'clb.it@pbl6.local' },
      { name: 'Chủ nhiệm CLB IT', email: 'clb.it@pbl6.local', password: '123456', role: 'clb', department: 'CLB IT' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await StaffProfile.findOneAndUpdate(
      { user: clbUser._id },
      { user: clbUser._id, staff_number: 'CBCLB001', full_name: 'Chủ nhiệm CLB IT', email: 'clb.it@pbl6.local', org_unit: clbUnit._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 4) Hoạt động mẫu phù hợp schema Activity hiện tại
    const activity = await Activity.findOneAndUpdate(
      { name: 'Chào tân sinh viên 2022 CNTT' },
      {
        name: 'Chào tân sinh viên 2022 CNTT',
        description: 'Sự kiện chào tân sinh viên Khoa CNTT khóa 2022',
        type: 'faculty',
        organizer: 'Khoa Công nghệ thông tin',
        createdBy: user._id,
        time: new Date(),
        location: 'Hội trường A',
        points: 10,
        status: 'approved'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5) Đăng ký + điểm danh mẫu
    const registration = await Registration.findOneAndUpdate(
      { user: user._id, activity: activity._id },
      { user: user._id, activity: activity._id, status: 'approved', attended: true, attendanceTime: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentProfile._id, activity: activity._id },
      { student: studentProfile._id, activity: activity._id, points: 10, verified: true, verified_at: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 6) Minh chứng ngoài trường mẫu
    const evidence = await Evidence.findOneAndUpdate(
      { user: user._id, activityName: 'Mùa hè xanh 2022' },
      {
        user: user._id,
        activityName: 'Mùa hè xanh 2022',
        organization: 'Đoàn trường',
        description: 'Tham gia tình nguyện hè',
        fileUrl: 'https://example.com/evidence.pdf',
        status: 'approved'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 7) Tổng hợp điểm PVCD
    const pvcdRecord = await PvcdRecord.findOneAndUpdate(
      { student: studentProfile._id, year: new Date(`${JOIN_YEAR}-01-01`) },
      { student: studentProfile._id, year: new Date(`${JOIN_YEAR}-01-01`), total_point: 10 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 8) Thêm nhiều hoạt động để test API
    const moreActivities = await Promise.all([
      Activity.findOneAndUpdate(
        { name: 'Seminar AI 2025' },
        {
          name: 'Seminar AI 2025',
          description: 'Chia sẻ xu hướng AI mới',
          type: 'faculty',
          organizer: 'Khoa Công nghệ thông tin',
          createdBy: user._id,
          time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Phòng 101',
          points: 5,
          status: 'approved'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      Activity.findOneAndUpdate(
        { name: 'Giải bóng đá CNTT 2025' },
        {
          name: 'Giải bóng đá CNTT 2025',
          description: 'Giải thể thao của CLB IT',
          type: 'club',
          organizer: 'CLB IT',
          createdBy: user._id,
          time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: 'Sân vận động',
          points: 8,
          status: 'approved'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
      Activity.findOneAndUpdate(
        { name: 'Hiến máu nhân đạo 2025' },
        {
          name: 'Hiến máu nhân đạo 2025',
          description: 'Chiến dịch hiến máu',
          type: 'school',
          organizer: 'Đoàn trường',
          createdBy: user._id,
          time: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          location: 'Hội trường B',
          points: 12,
          status: 'approved'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    ]);

    // 9) Thêm vài sinh viên cùng lớp để test
    const additionalStudents = ['0096', '0097', '0098', '0099'].map((suffix) => `10222${suffix}`);
    const createdAdditional = [];
    for (const sid of additionalStudents) {
      const sEmail = `${sid}@stu.ptit.edu.vn`;
      const sName = `Sinh viên ${sid}`;
      const u = await User.findOneAndUpdate(
        { email: sEmail },
        {
          name: sName,
          email: sEmail,
          password: '123456',
          role: 'student',
          class: CLASS_NAME,
          studentId: sid,
          department: FACULTY_NAME,
          joinedYear: JOIN_YEAR
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const sp = await StudentProfile.findOneAndUpdate(
        { user: u._id },
        { user: u._id, student_number: sid, full_name: sName, email: sEmail, enrollment_year: JOIN_YEAR, class: classObj._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdAdditional.push({ user: u, profile: sp });
    }

    // 10) Đăng ký/điểm danh cho các hoạt động mới
    for (const act of moreActivities) {
      // Người dùng chính
      await Registration.findOneAndUpdate(
        { user: user._id, activity: act._id },
        { user: user._id, activity: act._id, status: 'approved', attended: true, attendanceTime: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await Attendance.findOneAndUpdate(
        { student: studentProfile._id, activity: act._id },
        { student: studentProfile._id, activity: act._id, points: act.points, verified: true, verified_at: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Một vài sinh viên phụ thêm
      for (const { user: u, profile: sp } of createdAdditional) {
        await Registration.findOneAndUpdate(
          { user: u._id, activity: act._id },
          { user: u._id, activity: act._id, status: 'approved', attended: Math.random() > 0.3 },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (Math.random() > 0.3) {
          await Attendance.findOneAndUpdate(
            { student: sp._id, activity: act._id },
            { student: sp._id, activity: act._id, points: act.points, verified: true, verified_at: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }
    }

    console.log('Seeding thành công:', {
      user: user.email,
      student_number: studentProfile.student_number,
      class: classObj.name,
      falcuty: falcuty.name,
      cohort: cohort.year,
      activity: activity.name,
      moreActivities: moreActivities.map((a) => a.name)
    });
  } catch (err) {
    console.error('Seed lỗi:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
