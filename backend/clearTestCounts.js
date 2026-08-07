import 'dotenv/config';
import dns from 'node:dns';
import { MongoClient } from 'mongodb';

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

    // 2. Delete demo tests created by system
    const testRes = await db.collection('tests').deleteMany({ createdBy: 'system' });
    console.log(`   - Deleted ${testRes.deletedCount} demo tests`);

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
