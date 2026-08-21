/* ─── CBTifyAI-Final — Express Backend Entry Point ────────────────────────────
 * Full MERN backend: Auth, Tests, Submissions, Analytics, Roster, Schedules,
 * plus AI Document-to-CBT Pipeline powered by FastAPI OCR & Hugging Face Qwen2.5.
 * ───────────────────────────────────────────────────────────────────────────── */

import "dotenv/config";
import dns from "node:dns";
import express from "express";
import cors from "cors";
import multer from "multer";
import { mkdir } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./db.js";
import { generateCbtFromFile } from "./services/questionGenerationService.js";

await mkdir("uploads", { recursive: true });

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../frontend/dist");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigin = process.env.CLIENT_ORIGIN;
      if (
        !origin ||
        !allowedOrigin ||
        allowedOrigin === "*" ||
        origin === allowedOrigin ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== "production") {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch (_e) {}
}

// Initialize Database Connection with retry handling
let db = null;
try {
  db = await getDb();
} catch (dbErr) {
  console.error("⚠️ Initial MongoDB Atlas connection attempt failed:", dbErr.message);
  console.log("🔄 Retrying database connection in 2 seconds...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  db = await getDb();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const serialize = (doc) => {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
};

const serializeAll = (docs) => docs.map(serialize);

// ── REST API ROUTES ──────────────────────────────────────────────────────────

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CBTifyAI-Final Backend",
    database: "MongoDB Atlas",
    aiEngine: "CBTify.ai Engine",
    ocrEngine: process.env.PYTHON_OCR_URL || "http://localhost:8000",
  });
});

// Admin Endpoint: Clear Demo Data & Test Counts
app.get("/api/admin/clear-demo-data", async (_req, res) => {
  try {
    const subRes = await db.collection("submissions").deleteMany({});
    const testRes = await db.collection("tests").deleteMany({});
    const studRes = await db.collection("students").deleteMany({});
    const docRes = await db.collection("documents").deleteMany({});
    const schedRes = await db.collection("schedules").deleteMany({});

    res.json({
      success: true,
      message: "Demo test counts and demo data cleared successfully!",
      deleted: {
        submissions: subRes.deletedCount,
        tests: testRes.deletedCount,
        students: studRes.deletedCount,
        documents: docRes.deletedCount,
        schedules: schedRes.deletedCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Authentication ───────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, role, organizationName } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required registration parameters." });
    }

    const userId = `user-${Date.now()}`;
    const newUser = {
      _id: userId,
      username,
      email: email.toLowerCase(),
      password,
      role,
      organizationName: role === "organization" ? organizationName || "" : "",
      createdAt: new Date(),
    };

    try {
      await db.collection("users").insertOne(newUser);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }
      throw err;
    }

    res.status(201).json({
      id: userId,
      username,
      email: email.toLowerCase(),
      role,
      organizationName: newUser.organizationName,
    });
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    res.status(500).json({ error: "Database error during registration." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter both email and password." });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Foolproof demo accounts auto-authentication
    if (password === "password" && (cleanEmail === "student@cbtify.ai" || cleanEmail === "school@cbtify.ai" || cleanEmail === "institute@cbtify.ai")) {
      const isOrg = cleanEmail !== "student@cbtify.ai";
      const demoUser = {
        _id: isOrg ? "org-1" : "student-1",
        username: isOrg ? "Institute Demo" : "Student Demo",
        email: cleanEmail,
        password: "password",
        role: isOrg ? "organization" : "student",
        organizationName: isOrg ? "CBTify Institute" : "",
      };
      try {
        await db.collection("users").updateOne(
          { email: cleanEmail },
          { $set: demoUser, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        );
      } catch (_e) {}
      return res.json({
        id: demoUser._id,
        username: demoUser.username,
        email: demoUser.email,
        role: demoUser.role,
        organizationName: demoUser.organizationName,
      });
    }

    const user = await db.collection("users").findOne({ email: cleanEmail, password });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      organizationName: user.organizationName,
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({ error: "Database error during login." });
  }
});

// ── Tests Library ────────────────────────────────────────────────────────────
app.get("/api/tests", async (req, res) => {
  try {
    const filter = {};
    if (req.query.createdBy) {
      const createdByValues = [req.query.createdBy];
      if (req.query.username) createdByValues.push(req.query.username);
      if (req.query.email) createdByValues.push(req.query.email);
      filter.createdBy = { $in: createdByValues };
    } else if (req.query.forUser) {
      const userIdentifiers = [req.query.forUser];
      if (req.query.username) userIdentifiers.push(req.query.username);
      if (req.query.email) userIdentifiers.push(req.query.email);

      filter.$or = [
        { createdBy: "system" },
        { createdBy: { $in: userIdentifiers } }
      ];
    }
    const tests = await db.collection("tests").find(filter).sort({ createdAt: -1 }).toArray();
    res.json(serializeAll(tests));
  } catch (error) {
    console.error("[Tests] Fetch error:", error);
    res.status(500).json({ error: "Database error fetching tests." });
  }
});

app.get("/api/tests/:id", async (req, res) => {
  try {
    const test = await db.collection("tests").findOne({ _id: req.params.id });

    if (!test) {
      return res.status(404).json({ error: "Test not found." });
    }

    res.json(serialize(test));
  } catch (error) {
    console.error("[Tests] Fetch test details error:", error);
    res.status(500).json({ error: "Database error fetching test details." });
  }
});

app.post("/api/tests", async (req, res) => {
  try {
    const { id, title, description, timeLimit, questions, createdBy } = req.body;
    const testId = id || `test-${Date.now()}`;

    const testDoc = {
      _id: testId,
      title,
      description: description || "",
      timeLimit: Number(timeLimit) || 10,
      createdBy: createdBy || "anonymous",
      createdAt: new Date(),
      questions: Array.isArray(questions)
        ? questions.map((q, i) => ({
            _id: `${testId}-q-${i}`,
            questionText: q.questionText || q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
          }))
        : [],
    };

    await db.collection("tests").insertOne(testDoc);
    res.status(201).json(serialize(testDoc));
  } catch (error) {
    console.error("[Tests] Create test error:", error);
    res.status(500).json({ error: "Database error saving test." });
  }
});


  app.put("/api/tests/:id", async (req, res) => {
    try {
      const testId = req.params.id;
      const { title, description, timeLimit, questions } = req.body;
      const existing = await db.collection("tests").findOne({ _id: testId });
      if (!existing) {
        return res.status(404).json({ error: "Test not found." });
      }

      const updatedQuestions = Array.isArray(questions)
        ? questions.map((q, i) => ({
            _id: q._id || `${testId}-q-${i}`,
            questionText: q.questionText || q.question || `Question ${i + 1}`,
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
            explanation: q.explanation || "",
            difficulty: q.difficulty || "Medium",
            topic: q.topic || "",
            bloomLevel: q.bloomLevel || "Understand",
          }))
        : existing.questions;

      const updateDoc = {
        $set: {
          title: title || existing.title,
          description: description !== undefined ? description : existing.description,
          timeLimit: Number(timeLimit) || existing.timeLimit,
          questions: updatedQuestions,
          updatedAt: new Date(),
        }
      };

      await db.collection("tests").updateOne({ _id: testId }, updateDoc);
      const updatedTest = await db.collection("tests").findOne({ _id: testId });
      res.json(serialize(updatedTest));
    } catch (error) {
      console.error("[Tests] Update test error:", error);
      res.status(500).json({ error: "Database error updating test." });
    }
  });

  app.delete("/api/tests/:id", async (req, res) => {
  try {
    const testId = req.params.id;
    const result = await db.collection("tests").deleteOne({ _id: testId });
    await db.collection("submissions").deleteMany({ testId });
    await db.collection("documents").deleteMany({ testId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Test not found." });
    }
    res.json({ success: true, message: "Test deleted successfully." });
  } catch (error) {
    console.error("[Tests] Delete test error:", error);
    res.status(500).json({ error: "Database error deleting test." });
  }
});

// ── Submissions / Attempts ───────────────────────────────────────────────────
app.get("/api/submissions", async (req, res) => {
  try {
    const filter = {};
    if (req.query.testId) filter.testId = req.query.testId;
    if (req.query.userId) filter.userId = req.query.userId;
    const rows = await db.collection("submissions").find(filter).sort({ createdAt: -1 }).toArray();
    res.json(serializeAll(rows));
  } catch (error) {
    console.error("[Submissions] Fetch error:", error);
    res.status(500).json({ error: "Database error fetching submissions." });
  }
});

app.post("/api/submissions", async (req, res) => {
  try {
    const {
      testId,
      testTitle,
      userId,
      userEmail,
      username,
      score,
      totalQuestions,
      accuracy,
      timeSpent,
      answers,
      questionStatus,
      questions,
    } = req.body;

    const studentEmail = userEmail || req.body.email || userId;
    const subId = `sub-${Date.now()}`;
    const subDoc = {
      _id: subId,
      testId,
      testTitle,
      userId,
      userEmail: studentEmail,
      username: username || "Student",
      score,
      totalQuestions,
      accuracy,
      timeSpent,
      answers: Array.isArray(answers) ? answers : [],
      questionStatus: Array.isArray(questionStatus) ? questionStatus : [],
      questions: Array.isArray(questions) ? questions : [],
      createdAt: new Date(),
    };

    await db.collection("submissions").insertOne(subDoc);

    // Update roster student metrics if student exists or auto-add student to roster
    const student = await db.collection("students").findOne({
      $or: [{ email: studentEmail }, { email: userId }, { name: username }]
    });

    if (student) {
      const newTestsTaken = (student.testsTaken || 0) + 1;
      const newAvgAccuracy = Math.round(((student.avgAccuracy || 0) * (student.testsTaken || 0) + accuracy) / newTestsTaken);
      await db.collection("students").updateOne(
        { _id: student._id },
        {
          $set: {
            testsTaken: newTestsTaken,
            avgAccuracy: newAvgAccuracy,
            lastActive: new Date().toISOString().split("T")[0],
          },
        }
      );
    } else if (username || studentEmail) {
      await db.collection("students").insertOne({
        _id: `stud-${Date.now()}`,
        name: username || "Student Candidate",
        email: studentEmail,
        testsTaken: 1,
        avgAccuracy: accuracy,
        lastActive: new Date().toISOString().split("T")[0],
      });
    }

    res.status(201).json(serialize(subDoc));
  } catch (error) {
    console.error("[Submissions] Create submission error:", error);
    res.status(500).json({ error: "Database error saving submission." });
  }
});

// ── Per-Test Analytics (Admin) ───────────────────────────────────────────────
app.get("/api/analytics/test/:testId", async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await db.collection("tests").findOne({ _id: testId });
    if (!test) {
      return res.status(404).json({ error: "Test not found." });
    }

    const submissions = await db.collection("submissions").find({ testId }).sort({ createdAt: -1 }).toArray();

    const totalAttempts = submissions.length;
    const avgScore = totalAttempts ? Math.round(submissions.reduce((s, r) => s + r.accuracy, 0) / totalAttempts) : 0;
    const avgTime = totalAttempts ? Math.round(submissions.reduce((s, r) => s + (r.timeSpent || 0), 0) / totalAttempts) : 0;

    const questionWrongCount = Array(test.questions ? test.questions.length : 0).fill(0);
    const questionAttemptCount = Array(test.questions ? test.questions.length : 0).fill(0);
    submissions.forEach((sub) => {
      if (Array.isArray(sub.questionStatus)) {
        sub.questionStatus.forEach((status, idx) => {
          if (idx < questionAttemptCount.length) {
            questionAttemptCount[idx]++;
            if (status === "wrong") questionWrongCount[idx]++;
          }
        });
      }
    });

    const questionHeatmap = questionWrongCount.map((wrongCount, idx) => ({
      questionIndex: idx,
      questionText: test.questions?.[idx]?.questionText || `Question ${idx + 1}`,
      wrongCount,
      attemptCount: questionAttemptCount[idx],
      wrongRate: questionAttemptCount[idx] ? Math.round((wrongCount / questionAttemptCount[idx]) * 100) : 0,
    }));

    res.json({
      test: serialize(test),
      totalAttempts,
      avgScore,
      avgTime,
      submissions: serializeAll(submissions),
      questionHeatmap,
    });
  } catch (error) {
    console.error("[Analytics] Fetch error:", error);
    res.status(500).json({ error: "Database error fetching test analytics." });
  }
});

// ── Documents Metadata ───────────────────────────────────────────────────────
app.get("/api/documents", async (_req, res) => {
  try {
    const docs = await db.collection("documents").find().sort({ createdAt: -1 }).toArray();
    res.json(serializeAll(docs));
  } catch (error) {
    console.error("[Documents] Fetch error:", error);
    res.status(500).json({ error: "Database error fetching documents." });
  }
});

app.post("/api/documents", async (req, res) => {
  try {
    const { id, filename, size, status, testId } = req.body;
    const docId = id || `doc-${Date.now()}`;

    const docDoc = {
      _id: docId,
      filename,
      size,
      status: status || "ready",
      testId: testId || null,
      createdAt: new Date(),
    };

    await db.collection("documents").insertOne(docDoc);
    res.status(201).json(serialize(docDoc));
  } catch (error) {
    console.error("[Documents] Register error:", error);
    res.status(500).json({ error: "Database error registering document." });
  }
});

// ── Students Roster ──────────────────────────────────────────────────────────
app.get("/api/students", async (_req, res) => {
  try {
    const students = await db.collection("students").find().sort({ name: 1 }).toArray();
    res.json(serializeAll(students));
  } catch (error) {
    console.error("[Students] Fetch error:", error);
    res.status(500).json({ error: "Database error fetching students." });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    const studId = `stud-${Date.now()}`;
    const studDoc = {
      _id: studId,
      name,
      email,
      testsTaken: 0,
      avgAccuracy: 0,
      lastActive: new Date().toISOString().split("T")[0],
    };

    try {
      await db.collection("students").insertOne(studDoc);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "A student with this email already exists." });
      }
      throw err;
    }

    res.status(201).json(serialize(studDoc));
  } catch (error) {
    console.error("[Students] Add error:", error);
    res.status(500).json({ error: "Database error adding student." });
  }
});

// ── Schedules ────────────────────────────────────────────────────────────────
app.get("/api/schedules", async (_req, res) => {
  try {
    const schedules = await db.collection("schedules").find().sort({ date: 1 }).toArray();
    res.json(serializeAll(schedules));
  } catch (error) {
    console.error("[Schedules] Fetch error:", error);
    res.status(500).json({ error: "Database error fetching exam schedules." });
  }
});

app.post("/api/schedules", async (req, res) => {
  try {
    const { title, date, time, duration, studentsCount } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ error: "Title, date, and time are required." });
    }

    const schedId = `sched-${Date.now()}`;
    const schedDoc = {
      _id: schedId,
      title,
      date,
      time,
      duration: duration || "30 mins",
      studentsCount: Number(studentsCount) || 60,
    };

    await db.collection("schedules").insertOne(schedDoc);
    res.status(201).json(serialize(schedDoc));
  } catch (error) {
    console.error("[Schedules] Create error:", error);
    res.status(500).json({ error: "Database error creating schedule." });
  }
});

// ── Document to CBT Converter (HuggingFace + OCR Pipeline) ───────────────────
app.post("/api/convert-to-cbt", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded. Send file under field 'file'." });
  }

  try {
    const createdBy = req.body?.createdBy || req.query?.createdBy || "system";
    const answerKey = req.body?.answerKey || req.query?.answerKey || null;

    const { testDoc, extractedText } = await generateCbtFromFile(
      file.buffer,
      file.mimetype,
      file.originalname,
      createdBy,
      db
    );

    res.json({
      extractedText,
      test: {
        id: testDoc._id,
        title: testDoc.title,
        description: testDoc.description,
        timeLimit: testDoc.timeLimit,
        questions: testDoc.questions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        })),
      },
    });
  } catch (error) {
    console.error("[Pipeline Error]:", error);
    res.status(500).json({ error: error.message || "Failed to convert document to CBT questions." });
  }
});

// ── Production: Serve React static build ─────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const indexPath = path.join(distDir, "index.html");
  if (fs.existsSync(indexPath)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(indexPath);
    });
  } else {
    app.get("/", (_req, res) => {
      res.json({
        status: "ok",
        message: "🚀 CBTify.ai Express API Backend is running live!",
        health: "/api/health"
      });
    });
  }
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`\n🚀 CBTifyAI-Final Backend running on http://localhost:${port}`);
  console.log(`🤖 AI Engine: CBTify.ai Engine`);
  console.log(`📄 OCR Microservice URL: ${process.env.PYTHON_OCR_URL || "http://localhost:8000"}\n`);
});
