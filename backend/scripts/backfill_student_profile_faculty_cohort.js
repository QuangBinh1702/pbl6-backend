/*
  Backfill student_profile.falcuty_id and cohort_id from class_id.
  For each student_profile:
    - Find its class document by class_id
    - Copy class.falcuty_id -> student_profile.falcuty_id
    - Copy class.cohort_id -> student_profile.cohort_id
  Only updates when values are missing or different.
*/

require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = 'Community_Activity_Management';
  await mongoose.connect(mongoUri, { dbName });
  return mongoose.connection.db;
}

async function main() {
  const db = await connectDB();
  const studentCol = db.collection('student_profile');
  const classCol = db.collection('class');

  const cursor = studentCol.find({}, { projection: { _id: 1, class_id: 1, falcuty_id: 1, cohort_id: 1 } });

  let total = 0;
  let updated = 0;
  let skippedNoClass = 0;

  while (await cursor.hasNext()) {
    const sp = await cursor.next();
    total += 1;
    if (!sp.class_id) {
      skippedNoClass += 1;
      continue;
    }

    const cls = await classCol.findOne({ _id: sp.class_id }, { projection: { falcuty_id: 1, cohort_id: 1 } });
    if (!cls) {
      skippedNoClass += 1;
      continue;
    }

    const nextFal = cls.falcuty_id || null;
    const nextCoh = cls.cohort_id || null;

    const needUpdate = String(sp.falcuty_id || '') !== String(nextFal || '') || String(sp.cohort_id || '') !== String(nextCoh || '');
    if (!needUpdate) continue;

    await studentCol.updateOne(
      { _id: sp._id },
      { $set: { falcuty_id: nextFal, cohort_id: nextCoh } }
    );
    updated += 1;
  }

  console.log(`Processed: ${total}, Updated: ${updated}, Skipped(no class): ${skippedNoClass}`);
}

main()
  .then(() => mongoose.connection.close())
  .catch((err) => {
    console.error(err);
    mongoose.connection.close();
    process.exit(1);
  });


