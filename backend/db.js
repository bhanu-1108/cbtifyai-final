import dns from 'node:dns';
import { MongoClient } from 'mongodb';

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (_e) {
  // Fallback if DNS server overrides are restricted
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
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  await clientInstance.connect();
  console.log('✅ Connected to MongoDB Atlas');

  dbInstance = clientInstance.db(); // uses the database name from the URI
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

  // Only seed if the database is empty
  const userCount = await db.collection('users').countDocuments();
  if (userCount > 0) return;

  console.log('📦 Database empty — seeding initial demo data...');

  const now = new Date();

  // ── Users ──────────────────────────────────────────────────────────────────
  await db.collection('users').insertMany([
    {
      _id: 'student-1',
      username: 'John Doe',
      email: 'student@cbtify.ai',
      password: 'password',
      role: 'student',
      organizationName: '',
      createdAt: now,
    },
    {
      _id: 'org-1',
      username: 'Admin Admin',
      email: 'school@cbtify.ai',
      password: 'password',
      role: 'organization',
      organizationName: 'IPU UNIVERSITY',
      createdAt: now,
    },
  ]);

  // ── Question pools ─────────────────────────────────────────────────────────
  const physicsQuestions = [
    {
      questionText:
        'Which law of thermodynamics states that entropy of an isolated system always increases over time?',
      options: ['Zeroth Law', 'First Law', 'Second Law', 'Third Law'],
      correctAnswer: 2,
      explanation:
        'The Second Law of Thermodynamics states that natural processes are irreversible, and the entropy of an isolated system always increases.',
    },
    {
      questionText: 'What is the speed of light in a vacuum (approximately)?',
      options: [
        '3 x 10^8 m/s',
        '3 x 10^6 m/s',
        '1.5 x 10^8 m/s',
        '2.9 x 10^5 m/s',
      ],
      correctAnswer: 0,
      explanation:
        'The speed of light in a vacuum is approximately 3 × 10^8 meters per second.',
    },
    {
      questionText: 'What physical quantity is measured in Henries?',
      options: ['Capacitance', 'Resistance', 'Inductance', 'Magnetic Flux'],
      correctAnswer: 2,
      explanation:
        'Inductance is measured in Henries, named after Joseph Henry who discovered electromagnetic induction independently.',
    },
  ];

  const ethicsQuestions = [
    {
      questionText:
        'What is the primary objective of reinforcement learning from human feedback (RLHF) in large language models?',
      options: [
        'To optimize gradient descent speeds on small datasets',
        'To align model outputs with human preferences regarding helpfulness, accuracy, and safety',
        'To automatically write documentation for neural networks',
        'To replace traditional feedforward architectures',
      ],
      correctAnswer: 1,
      explanation:
        'RLHF uses human feedback to train a reward model, which then tunes the main language model using reinforcement learning to achieve better alignment.',
    },
    {
      questionText:
        'Which ethical risk focuses on the potential of AI tools to generate highly realistic, misleading audio or visual media?',
      options: [
        'Algorithmic bias',
        'Explainable AI deficiency',
        'Deepfake generation & disinformation propagation',
        'Data scraping copyright violations',
      ],
      correctAnswer: 2,
      explanation:
        'Deepfakes use generative models to create highly convincing false media, presenting a threat to trust and safety.',
    },
    {
      questionText: 'Which global regulatory framework has categorized AI systems by risk tiers?',
      options: [
        'The EU AI Act',
        'The US Executive Order on AI',
        'The ISO/IEC 42001 Standard',
        'The UNESCO Recommendations on AI',
      ],
      correctAnswer: 0,
      explanation:
        "The European Union's AI Act introduces a risk-based approach, banning unacceptable risk systems and heavily regulating high-risk systems.",
    },
  ];

  const generalQuestions = [
    {
      questionText:
        'What is the primary execution runtime environment for JavaScript on the server side?',
      options: ['Deno', 'V8', 'Node.js', 'Bun'],
      correctAnswer: 2,
      explanation:
        "Node.js is the original and most widely used JavaScript runtime built on Chrome's V8 engine.",
    },
    {
      questionText:
        'Which CSS property is used to create a backdrop blur filter for glassmorphic elements?',
      options: ['blur-radius', 'backdrop-filter', 'background-blur', 'filter: blur()'],
      correctAnswer: 1,
      explanation:
        'The backdrop-filter CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element.',
    },
  ];

  // ── Tests ──────────────────────────────────────────────────────────────────
  const testPhysicsDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const testEthicsDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const testGeneralDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  await db.collection('tests').insertMany([
    {
      _id: 'test-physics',
      title: 'Introduction to Physics: Classical Mechanics',
      description: "Covers Newton's Laws, friction, rotational kinetic energy, and linear momentum.",
      timeLimit: 10,
      createdBy: 'system',
      createdAt: testPhysicsDate,
      questions: physicsQuestions.map((q, i) => ({ _id: `test-physics-q-${i}`, ...q })),
    },
    {
      _id: 'test-ethics',
      title: 'AI Ethics and Governance Quiz',
      description:
        'A standardized assessment testing core principles of safe alignment, generative risk, and governance structures.',
      timeLimit: 15,
      createdBy: 'system',
      createdAt: testEthicsDate,
      questions: ethicsQuestions.map((q, i) => ({ _id: `test-ethics-q-${i}`, ...q })),
    },
    {
      _id: 'test-general',
      title: 'General Aptitude: Web Development Basics',
      description:
        'Assesses standard knowledge in modern front-end styling, server runtimes, and version control structures.',
      timeLimit: 8,
      createdBy: 'system',
      createdAt: testGeneralDate,
      questions: generalQuestions.map((q, i) => ({ _id: `test-general-q-${i}`, ...q })),
    },
  ]);

  // ── Submissions ────────────────────────────────────────────────────────────
  const sub1Date = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  const sub2Date = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

  await db.collection('submissions').insertMany([
    {
      _id: 'sub-1',
      testId: 'test-ethics',
      testTitle: 'AI Ethics and Governance Quiz',
      userId: 'student-1',
      username: 'John Doe',
      score: 2,
      totalQuestions: 3,
      accuracy: 67,
      timeSpent: 280,
      answers: [1, 2, 0],
      questionStatus: ['correct', 'correct', 'wrong'],
      questions: ethicsQuestions,
      createdAt: sub1Date,
    },
    {
      _id: 'sub-2',
      testId: 'test-physics',
      testTitle: 'Introduction to Physics: Classical Mechanics',
      userId: 'student-1',
      username: 'John Doe',
      score: 2,
      totalQuestions: 3,
      accuracy: 67,
      timeSpent: 190,
      answers: [1, 2, 1],
      questionStatus: ['correct', 'correct', 'wrong'],
      questions: physicsQuestions,
      createdAt: sub2Date,
    },
  ]);

  // ── Documents ──────────────────────────────────────────────────────────────
  await db.collection('documents').insertMany([
    {
      _id: 'doc-physics',
      filename: 'classical_mechanics_notes.pdf',
      size: '2.4 MB',
      status: 'ready',
      testId: 'test-physics',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      _id: 'doc-ethics',
      filename: 'ai_governance_framework.pdf',
      size: '4.8 MB',
      status: 'ready',
      testId: 'test-ethics',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ]);

  // ── Students ───────────────────────────────────────────────────────────────
  await db.collection('students').insertMany([
    {
      _id: 'stud-1',
      name: 'Alice Smith',
      email: 'alice@ipu.ac.in',
      testsTaken: 5,
      avgAccuracy: 88,
      lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      _id: 'stud-2',
      name: 'Bob Johnson',
      email: 'bob@ipu.ac.in',
      testsTaken: 3,
      avgAccuracy: 74,
      lastActive: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      _id: 'stud-3',
      name: 'Charlie Davis',
      email: 'charlie@ipu.ac.in',
      testsTaken: 7,
      avgAccuracy: 91,
      lastActive: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      _id: 'stud-4',
      name: 'Diana Prince',
      email: 'diana@ipu.ac.in',
      testsTaken: 2,
      avgAccuracy: 82,
      lastActive: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      _id: 'stud-5',
      name: 'Ethan Hunt',
      email: 'ethan@ipu.ac.in',
      testsTaken: 4,
      avgAccuracy: 69,
      lastActive: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ]);

  // ── Schedules ──────────────────────────────────────────────────────────────
  await db.collection('schedules').insertMany([
    {
      _id: 'sched-1',
      title: 'Mid-Term Physics Mechanics Exam',
      date: '2026-09-10',
      time: '10:00 AM',
      duration: '60 mins',
      studentsCount: 45,
    },
    {
      _id: 'sched-2',
      title: 'AI Ethics Final Assessment',
      date: '2026-09-15',
      time: '02:00 PM',
      duration: '30 mins',
      studentsCount: 120,
    },
  ]);

  console.log('✅ Database seeded successfully!');
}
