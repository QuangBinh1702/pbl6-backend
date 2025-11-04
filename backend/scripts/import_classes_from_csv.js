/*
  Import classes from CSV and fix Class documents to match schema:
  - name: String (existing)
  - falcuty_id: ObjectId -> points to collection 'falcuty'
  - cohort_id: ObjectId -> points to collection 'cohort' (derived from class name prefix, e.g. 20THXD1 -> 2020)

  CSV assumptions (from provided file head):
  Header: TT,Số thẻ,Họ tên,Lớp,Khoa,Điểm TBHT 22-23,Điểm TBRL 22-23,Khoa,,
  Example row: 1,103190008,Đỗ Trọng Duy,19C4CLC1,CKGT,8.84,83.00,CKGT,Cơ khí giao thông,Lớp
  We will use:
    - className = column[3]
    - facultyName = column[8] if present and non-empty, else column[4] or column[7]
*/

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = 'Community_Activity_Management';
  await mongoose.connect(mongoUri, { dbName });
  return mongoose.connection.db;
}

function deriveCohortYearFromClassName(className) {
  if (!className || className.length < 2) return null;
  const prefix = className.slice(0, 2);
  const twoDigits = parseInt(prefix, 10);
  if (Number.isNaN(twoDigits)) return null;
  // Assume 20xx intake
  return 2000 + twoDigits;
}

function parseCsvToRows(csvContent) {
  // Normalize line endings and split
  return csvContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);
}

async function ensureFaculty(db, facultyNameOrCode) {
  if (!facultyNameOrCode || !facultyNameOrCode.trim()) return null;
  const name = facultyNameOrCode.trim();
  const col = db.collection('falcuty');
  const existing = await col.findOne({ name });
  if (existing) return existing._id;
  const inserted = await col.insertOne({ name });
  return inserted.insertedId;
}

async function ensureCohort(db, year) {
  if (!year) return null;
  const col = db.collection('cohort');
  const existing = await col.findOne({ year });
  if (existing) return existing._id;
  const inserted = await col.insertOne({ year });
  return inserted.insertedId;
}

async function upsertClass(db, name, falcutyId, cohortId) {
  const col = db.collection('class');
  await col.updateOne(
    { name },
    { $set: { name, falcuty_id: falcutyId || null, cohort_id: cohortId || null } },
    { upsert: true }
  );
}

async function main() {
  const db = await connectDB();
  const csvPath = path.resolve(__dirname, '..', 'public', 'Danh sach sinh vien Gioi nam hoc 22-23 29-9-2023.csv');
  const csv = fs.readFileSync(csvPath, 'utf8');

  const lines = parseCsvToRows(csv);
  if (lines.length === 0) {
    console.log('No CSV content.');
    return;
  }

  // Skip header
  const dataLines = lines.slice(1);

  const uniqueClasses = new Map(); // name -> { facultyName, cohortYear }

  for (const line of dataLines) {
    const cells = line.split(',');
    if (cells.length < 4) continue;
    const className = (cells[3] || '').trim();
    if (!className) continue;

    // Prefer long faculty name at index 8; fallbacks to index 7 then 4
    const facultyLong = (cells[8] || '').trim();
    const facultyCode2 = (cells[7] || '').trim();
    const facultyCode1 = (cells[4] || '').trim();
    const facultyName = facultyLong || facultyCode2 || facultyCode1 || '';

    const cohortYear = deriveCohortYearFromClassName(className);

    if (!uniqueClasses.has(className)) {
      uniqueClasses.set(className, { facultyName, cohortYear });
    }
  }

  console.log(`Found ${uniqueClasses.size} unique classes in CSV.`);

  let processed = 0;
  for (const [className, info] of uniqueClasses.entries()) {
    const falcutyId = await ensureFaculty(db, info.facultyName);
    const cohortId = await ensureCohort(db, info.cohortYear);
    await upsertClass(db, className, falcutyId, cohortId);
    processed += 1;
  }

  console.log(`Updated/Inserted ${processed} classes.`);
}

main()
  .then(() => mongoose.connection.close())
  .catch((err) => {
    console.error(err);
    mongoose.connection.close();
    process.exit(1);
  });


