/*
  Remove extra fields from student_profile:
  - falcuty_id
  - cohort_id
  Profiles will derive these via class_id (virtuals + populate)
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
  const col = db.collection('student_profile');
  const result = await col.updateMany(
    { $or: [ { falcuty_id: { $exists: true } }, { cohort_id: { $exists: true } } ] },
    { $unset: { falcuty_id: '', cohort_id: '' } }
  );
  console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
}

main()
  .then(() => mongoose.connection.close())
  .catch((err) => {
    console.error(err);
    mongoose.connection.close();
    process.exit(1);
  });


