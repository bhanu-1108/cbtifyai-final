import 'dotenv/config';
import dns from 'node:dns';
import { MongoClient } from 'mongodb';

if (process.env.NODE_ENV !== 'production') {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (_e) {}
}

let clientInstance = null;
let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is not set. Please add it to your .env file.'
    );
  }

  clientInstance = new MongoClient(uri, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
    tls: true,
  });

  await clientInstance.connect();
  console.log('✅ Connected to MongoDB Atlas');

  dbInstance = clientInstance.db();
  await initializeDatabase(dbInstance);
  return dbInstance;
}

async function initializeDatabase(db) {
  // Create indexes for high scalability and zero-collscan performance
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('students').createIndex({ email: 1 }, { unique: true });
  await db.collection('tests').createIndex({ createdAt: -1 });
  await db.collection('tests').createIndex({ createdBy: 1, createdAt: -1 });
  await db.collection('submissions').createIndex({ createdAt: -1 });
  await db.collection('submissions').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('submissions').createIndex({ testId: 1, createdAt: -1 });
  await db.collection('documents').createIndex({ createdAt: -1 });

  // Seed default demo users if users collection is empty
  const userCount = await db.collection('users').countDocuments();
  if (userCount === 0) {
    const now = new Date();
    await db.collection('users').insertMany([
      {
        _id: 'student-1',
        username: 'Student Demo',
        email: 'student@cbtify.ai',
        password: 'password',
        role: 'student',
        organizationName: '',
        createdAt: now,
      },
      {
        _id: 'org-1',
        username: 'Institute Demo',
        email: 'school@cbtify.ai',
        password: 'password',
        role: 'organization',
        organizationName: 'CBTify Institute',
        createdAt: now,
      }
    ]);
    console.log('✅ Initialized demo credentials for student and institute');
  }
}
