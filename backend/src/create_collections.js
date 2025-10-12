require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Import all models
const User = require('./models/user.model');
const StudentProfile = require('./models/student_profile.model');
const StaffProfile = require('./models/staff_profile.model');
const Role = require('./models/role.model');
const Permission = require('./models/permission.model');
const OrgUnit = require('./models/org_unit.model');
const Activity = require('./models/activity.model');
const Class = require('./models/class.model');
const Falcuty = require('./models/falcuty.model');
const Cohort = require('./models/cohort.model');
const Field = require('./models/field.model');
const Evidence = require('./models/evidence.model');
const Registration = require('./models/registration.model');
const Attendance = require('./models/attendance.model');
const PvcdRecord = require('./models/pvcd_record.model');
const StudentCohort = require('./models/student_cohort.model');
const Post = require('./models/post.model');
const ActivityEligibility = require('./models/activity_eligibility.model');

async function createCollections() {
  await connectDB();
  // Tạo collection bằng cách insert tạm 1 document rồi xóa đi
  const models = [User, StudentProfile, StaffProfile, Role, Permission, OrgUnit, Activity, Class, Falcuty, Cohort, Field, Evidence, Registration, Attendance, PvcdRecord, StudentCohort, Post, ActivityEligibility];
  for (const Model of models) {
    await Model.create({ _temp: true });
    await Model.deleteMany({ _temp: true });
  }
  console.log('Đã tạo tất cả collection!');
  mongoose.disconnect();
}

createCollections();
