require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_NAME || 'Community_Activity_Management';

const Activity = require('../src/models/activity.model');
const ActivityEligibility = require('../src/models/activity_eligibility.model');
const Falcuty = require('../src/models/falcuty.model');
const Cohort = require('../src/models/cohort.model');
const Field = require('../src/models/field.model');
const OrgUnit = require('../src/models/org_unit.model');

const createActivityWithRequirements = async () => {
  try {
    await mongoose.connect(mongoUri, { dbName });
    console.log(`✅ Kết nối database: ${dbName}\n`);

    // Debug: In ra tất cả các khoa
    const allFaculties = await Falcuty.find({});
    console.log('All faculties in DB:', allFaculties);

    // --- Step 1: Find required documents ---
    const faculty = await Falcuty.findOne({ name: 'Công nghệ thông tin' });
    const cohort = await Cohort.findOne({ year: 2022 });
    const field = await Field.findOne({ name: 'Y tế' });
    const orgUnit = await OrgUnit.findOne({ name: 'Đoàn trường' });

    if (!faculty) {
      throw new Error('Faculty "Công nghệ thông tin" not found. Please seed faculties first.');
    }
    if (!cohort) {
      throw new Error('Cohort "2022" not found. Please seed cohorts first.');
    }
    if (!field) {
      throw new Error('Field "Y tế" not found. Please seed fields first.');
    }
    if (!orgUnit) {
      throw new Error('OrgUnit "Đoàn trường" not found. Please seed org units first.');
    }

    console.log('Found required data:');
    console.log(`- Faculty ID: ${faculty._id}`);
    console.log(`- Cohort ID: ${cohort._id}`);
    console.log(`- Field ID: ${field._id}`);
    console.log(`- OrgUnit ID: ${orgUnit._id}`);

    // --- Step 2: Create the new Activity ---
    const newActivity = new Activity({
      title: 'Chuyến xe về quê',
      description: 'Hỗ trợ sinh viên về quê trong dịp lễ.',
      location: 'f101',
      start_time: new Date('2025-11-20T15:00:00'),
      end_time: new Date('2025-11-21T19:00:00'),
      capacity: 50,
      registration_open: new Date('2025-11-16T00:00:00'),
      registration_close: new Date('2025-11-20T00:00:00'),
      status: 'approved',
      org_unit_id: orgUnit._id,
      field_id: field._id,
    });

    await newActivity.save();
    console.log('Activity "Chuyến xe về quê" created successfully with ID:', newActivity._id);

    // --- Step 3: Create ActivityEligibility records ---
    const eligibilityData = [
      {
        activity_id: newActivity._id,
        type: 'falcuty',
        reference_id: faculty._id,
      },
      {
        activity_id: newActivity._id,
        type: 'cohort',
        reference_id: cohort._id,
      },
    ];

    await ActivityEligibility.insertMany(eligibilityData);
    console.log('Successfully added requirements to the activity.');

    console.log('\n--- Script finished successfully! ---');

  } catch (error) {
    console.error('Error running script:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

createActivityWithRequirements();
