import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

if (process.env.NODE_ENV !== 'production') {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (_e) {}
}

async function clearTestCountsAndDemoData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is missing in backend/.env');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log('🧹 Clearing demo test counts, submissions, and demo student roster from MongoDB Atlas...');

    // 1. Delete all test submissions (resets test attempt counts & accuracy stats)
    const subRes = await db.collection('submissions').deleteMany({});
    console.log(`   - Deleted ${subRes.deletedCount} submissions (resets student test counts)`);

    // 2. Delete all tests (both system demo tests and user-generated tests)
    const testRes = await db.collection('tests').deleteMany({});
    console.log(`   - Deleted ${testRes.deletedCount} tests`);

    // 3. Delete demo roster students with hardcoded test counts
    const studRes = await db.collection('students').deleteMany({});
    console.log(`   - Deleted ${studRes.deletedCount} demo student roster entries`);

    // 4. Clear demo documents & schedules
    const docRes = await db.collection('documents').deleteMany({});
    console.log(`   - Deleted ${docRes.deletedCount} demo documents`);

    const schedRes = await db.collection('schedules').deleteMany({});
    console.log(`   - Deleted ${schedRes.deletedCount} demo schedules`);

    console.log('\n✅ ALL DEMO TEST COUNTS & DEMO PANELS CLEARED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Error clearing test counts:', error.message);
  } finally {
    await client.close();
  }
}

clearTestCountsAndDemoData();
