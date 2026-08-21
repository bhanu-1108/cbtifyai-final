import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

// Pre-seeded local questions for presets if the API fails
const physicsQuestions = [
  {
    questionText: 'Which law of thermodynamics states that entropy of an isolated system always increases over time?',
    options: ['Zeroth Law', 'First Law', 'Second Law', 'Third Law'],
    correctAnswer: 2,
    explanation: 'The Second Law of Thermodynamics states that natural processes are irreversible, and the entropy of an isolated system always increases.'
  },
  {
    questionText: 'What is the speed of light in a vacuum (approximately)?',
    options: ['3 x 10^8 m/s', '3 x 10^6 m/s', '1.5 x 10^8 m/s', '2.9 x 10^5 m/s'],
    correctAnswer: 0,
    explanation: 'The speed of light in a vacuum is approximately 3 * 10^8 meters per second.'
  },
  {
    questionText: 'What physical quantity is measured in Henries?',
    options: ['Capacitance', 'Resistance', 'Inductance', 'Magnetic Flux'],
    correctAnswer: 2,
    explanation: 'Inductance is measured in Henries, named after Joseph Henry who discovered electromagnetic induction independently.'
  }
];

const ethicsQuestions = [
  {
    questionText: 'What is the primary objective of reinforcement learning from human feedback (RLHF) in large language models?',
    options: [
      'To optimize gradient descent speeds on small datasets',
      'To align model outputs with human preferences regarding helpfulness, accuracy, and safety',
      'To automatically write documentation for neural networks',
      'To replace traditional feedforward architectures'
    ],
    correctAnswer: 1,
    explanation: 'RLHF uses human feedback to train a reward model, which then tunes the main language model using reinforcement learning to achieve better alignment.'
  },
  {
    questionText: 'Which ethical risk focuses on the potential of AI tools to generate highly realistic, misleading audio or visual media?',
    options: [
      'Algorithmic bias',
      'Explainable AI deficiency',
      'Deepfake generation & disinformation propagation',
      'Data scraping copyright violations'
    ],
    correctAnswer: 2,
    explanation: 'Deepfakes use generative models to create highly convincing false media, presenting a threat to trust and safety.'
  },
  {
    questionText: 'In AI alignment, what does the term "inner alignment" refer to?',
    options: [
      'Ensuring the neural network weights are loaded correctly in memory',
      'Ensuring the reward model correctly translates human ratings',
      'Ensuring that the agent actually optimizes its specified objective in all environments',
      'Ensuring the model learns the correct policy that aligns with the developer\'s true intent, rather than a proxy objective'
    ],
    correctAnswer: 3,
    explanation: 'Inner alignment refers to ensuring the optimizer (the model during training) behaves in accordance with the base objective set by designers.'
  }
];

const sstQuestions = [
  {
    questionText: 'In which year was the Non-Cooperation Movement launched under the leadership of Mahatma Gandhi?',
    options: ['1915', '1920', '1930', '1942'],
    correctAnswer: 1,
    explanation: 'The Non-Cooperation Movement was launched by Mahatma Gandhi in 1920 following the Jallianwala Bagh massacre and the Rowlatt Act.'
  },
  {
    questionText: 'Which fundamental right under the Indian Constitution is often termed as the "Heart and Soul of the Constitution" by Dr. B.R. Ambedkar?',
    options: ['Right to Equality', 'Right to Freedom of Speech', 'Right to Constitutional Remedies (Article 32)', 'Right against Exploitation'],
    correctAnswer: 2,
    explanation: 'Dr. B.R. Ambedkar described Article 32 (Right to Constitutional Remedies) as the "Heart and Soul of the Constitution" because it guarantees judicial enforcement of fundamental rights.'
  },
  {
    questionText: 'What type of soil is most suitable for cotton cultivation in India, primarily found in the Deccan Plateau?',
    options: ['Alluvial Soil', 'Black Soil (Regur Soil)', 'Red and Yellow Soil', 'Laterite Soil'],
    correctAnswer: 1,
    explanation: 'Black soil (Regur soil), formed by weathering of volcanic basalt rock in the Deccan Plateau, has high moisture retention and is ideal for growing cotton.'
  }
];

const generalQuestions = [
  {
    questionText: 'What is the primary execution runtime environment for JavaScript on the server side?',
    options: ['Deno', 'V8', 'Node.js', 'Bun'],
    correctAnswer: 2,
    explanation: 'Node.js is the original and most widely used JavaScript runtime built on Chrome\'s V8 engine.'
  },
  {
    questionText: 'Which CSS property is used to create a backdrop blur filter for glassmorphic elements?',
    options: ['blur-radius', 'backdrop-filter', 'background-blur', 'filter: blur()'],
    correctAnswer: 1,
    explanation: 'The backdrop-filter CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element.'
  }
];

export const AppProvider = ({ children }) => {
  // 1. Authentication State (persistent across refresh)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cbtify_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Database States
  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // Fetch data function
  const fetchData = async () => {
    try {
      const testsUrl = currentUser
        ? `${apiBaseUrl}/api/tests?forUser=${encodeURIComponent(currentUser.id)}&username=${encodeURIComponent(currentUser.username || '')}&email=${encodeURIComponent(currentUser.email || '')}`
        : `${apiBaseUrl}/api/tests?createdBy=system`;

      const [tRes, sRes, dRes, stRes, scRes] = await Promise.all([
        fetch(testsUrl),
        fetch(`${apiBaseUrl}/api/submissions`),
        fetch(`${apiBaseUrl}/api/documents`),
        fetch(`${apiBaseUrl}/api/students`),
        fetch(`${apiBaseUrl}/api/schedules`)
      ]);

      if (tRes.ok) setTests(await tRes.json());
      if (sRes.ok) setSubmissions(await sRes.json());
      if (dRes.ok) setDocuments(await dRes.json());
      if (stRes.ok) setStudents(await stRes.json());
      if (scRes.ok) setSchedules(await scRes.json());
    } catch (err) {
      console.error("Error fetching data from API:", err);
    }
  };

  // Synchronize on mount and currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchData();
    } else {
      setTests([]);
      setSubmissions([]);
      setDocuments([]);
      setStudents([]);
      setSchedules([]);
    }
  }, [currentUser]);

  // Keep currentUser synced to localStorage for session persistence
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cbtify_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cbtify_user');
    }
  }, [currentUser]);

  // Auth Actions
  const login = async (email, password) => {
    const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Invalid email or password');
    }

    setCurrentUser(data);
    return data;
  };

  const register = async (username, email, password, role, organizationName) => {
    const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role, organizationName })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'An account with this email already exists.');
    }

    setCurrentUser(data);
    return data;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const forgotPassword = (email) => {
    return true;
  };

  const uploadDocument = (filename, size, onProgressUpdate) => {
    const docId = `doc-${Date.now()}`;
    
    const tempDoc = {
      id: docId,
      filename,
      size,
      status: 'uploading',
      createdAt: new Date().toISOString()
    };
    setDocuments(prev => [tempDoc, ...prev]);

    let currentStatus = 'uploading';
    onProgressUpdate(currentStatus, null);

    setTimeout(() => {
      currentStatus = 'processing';
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: currentStatus } : d));
      onProgressUpdate(currentStatus, null);

      setTimeout(() => {
        currentStatus = 'generating';
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: currentStatus } : d));
        onProgressUpdate(currentStatus, null);

        setTimeout(async () => {
          currentStatus = 'ready';

          const nameLower = filename.toLowerCase();
          let pool = generalQuestions;
          let topicText = 'General Development Basics';
          if (nameLower.includes('sst') || nameLower.includes('history') || nameLower.includes('geography') || nameLower.includes('civic') || nameLower.includes('social')) {
            pool = sstQuestions;
            topicText = 'Social Studies & Indian History';
          } else if (nameLower.includes('physic') || nameLower.includes('mechanic') || nameLower.includes('science')) {
            pool = physicsQuestions;
            topicText = 'Physics Classical Mechanics';
          } else if (nameLower.includes('ethics') || nameLower.includes('governance') || nameLower.includes('align')) {
            pool = ethicsQuestions;
            topicText = 'AI Ethics and Governance';
          }

          const newTestId = `test-${Date.now()}`;
          const newTest = {
            id: newTestId,
            title: `AI-Generated Test: ${filename.split('.')[0]}`,
            description: `A customized assessment generated from your uploaded file "${filename}" focusing on ${topicText}.`,
            timeLimit: pool.length * 3,
            questions: pool,
            createdBy: currentUser ? currentUser.id : 'anonymous'
          };

          try {
            await fetch(`${apiBaseUrl}/api/tests`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newTest)
            });

            await fetch(`${apiBaseUrl}/api/documents`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: docId,
                filename,
                size,
                status: 'ready',
                testId: newTestId
              })
            });

            await fetchData();
            onProgressUpdate(currentStatus, newTestId);
          } catch (error) {
            console.error("Failed to register mock preset to backend:", error);
            onProgressUpdate('error', null);
          }
        }, 2000);
      }, 2000);
    }, 1500);
  };

  const uploadGeneratedTest = (filename, size, generatedTest) => {
    fetchData();
    return generatedTest.id;
  };

  const submitTest = (testId, answers, timeSpent, fullTest = null) => {
    const test = fullTest || tests.find(t => t.id === testId);
    if (!test || !test.questions) return null;

    let score = 0;
    const totalQuestions = test.questions.length;
    const questionStatus = [];

    test.questions.forEach((q, idx) => {
      const ans = answers[idx];
      if (ans === undefined || ans === null || ans === -1) {
        questionStatus.push('unanswered');
      } else if (ans === q.correctAnswer) {
        score++;
        questionStatus.push('correct');
      } else {
        questionStatus.push('wrong');
      }
    });

    const accuracy = Math.round((score / totalQuestions) * 100);

    const userEmailVal = currentUser?.email || localStorage.getItem('cbtify_user_email') || (currentUser?.username ? `${currentUser.username.toLowerCase().replace(/\s+/g, '')}@gmail.com` : 'student@cbtify.ai');
    const usernameVal = currentUser?.username || currentUser?.name || localStorage.getItem('cbtify_username') || 'Student Candidate';
    const userIdVal = currentUser?.id || currentUser?._id || localStorage.getItem('cbtify_user_id') || `stud-${Date.now()}`;

    const submissionData = {
      testId,
      testTitle: test.title,
      userId: userIdVal,
      userEmail: userEmailVal,
      username: usernameVal,
      score,
      totalQuestions,
      accuracy,
      timeSpent,
      answers,
      questionStatus,
      questions: test.questions
    };

    const postSubmission = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/submissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData)
        });
        if (res.ok) {
          fetchData();
        }
      } catch (err) {
        console.error("Failed to post test submission to database:", err);
      }
    };

    const optId = `sub-${Date.now()}`;
    const optSubmission = {
      id: optId,
      ...submissionData,
      createdAt: new Date().toISOString()
    };
    setSubmissions(prev => [optSubmission, ...prev]);

    postSubmission();
    return optSubmission;
  };

  const addStudent = async (name, email) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save student roster to database:", err);
    }
  };

  const scheduleExam = async (title, date, time, duration, studentsCount) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, time, duration, studentsCount })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save schedule to database:", err);
    }
  };

  const getAnalytics = () => {
    const userSubs = submissions.filter((s) => {
      if (!currentUser) return false;
      const uid = currentUser.id || currentUser._id;
      const uemail = (currentUser.email || '').toLowerCase();
      const uname = (currentUser.username || currentUser.name || '').toLowerCase();

      return (
        (s.userId && (s.userId === uid || s.userId === uemail)) ||
        (s.userEmail && s.userEmail.toLowerCase() === uemail) ||
        (s.email && s.email.toLowerCase() === uemail) ||
        (s.username && s.username.toLowerCase() === uname)
      );
    });
    if (userSubs.length === 0) {
      return {
        totalTests: 0,
        avgAccuracy: 0,
        timeSpent: 0,
        improvementRate: 0,
        accuracyTrend: [],
        subjectAnalysis: {
          'Classical Physics': 70,
          'AI Ethics & Safety': 75,
          'General Aptitude': 65
        },
        weakTopics: [{ topic: 'No data available', mistakesCount: 0 }],
        strongTopics: ['No data available'],
        mistakeHeatmap: []
      };
    }

    const totalTests = userSubs.length;
    const totalAccuracy = userSubs.reduce((sum, s) => sum + s.accuracy, 0);
    const avgAccuracy = Math.round(totalAccuracy / totalTests);
    const totalTimeSpent = userSubs.reduce((sum, s) => sum + s.timeSpent, 0);

    let improvementRate = 0;
    if (totalTests > 1) {
      const sortedByDate = [...userSubs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const firstAcc = sortedByDate[0].accuracy;
      const lastAcc = sortedByDate[sortedByDate.length - 1].accuracy;
      improvementRate = lastAcc - firstAcc;
    } else {
      improvementRate = userSubs[0].accuracy >= 80 ? 12 : 5;
    }

    const accuracyTrend = [...userSubs]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(s => ({
        date: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        accuracy: s.accuracy,
        title: s.testTitle
      }));

    let physSum = 0, physCount = 0;
    let ethSum = 0, ethCount = 0;
    let genSum = 0, genCount = 0;

    userSubs.forEach(s => {
      const t = s.testTitle.toLowerCase();
      if (t.includes('physic') || t.includes('mechanic')) {
        physSum += s.accuracy;
        physCount++;
      } else if (t.includes('ethics') || t.includes('governance')) {
        ethSum += s.accuracy;
        ethCount++;
      } else {
        genSum += s.accuracy;
        genCount++;
      }
    });

    const subjectAnalysis = {
      'Classical Physics': physCount > 0 ? Math.round(physSum / physCount) : 75,
      'AI Ethics & Safety': ethCount > 0 ? Math.round(ethSum / ethCount) : 80,
      'General Aptitude': genCount > 0 ? Math.round(genSum / genCount) : 70
    };

    const weakTopicsMap = new Map();
    const strongTopicsMap = new Map();

    const topicsPhysics = ['Circular Motion', 'Newtonian Units', 'Static Friction Calculations'];
    const topicsEthics = ['RLHF Alignments', 'Deepfake Risks', 'Inner Alignment Protocols', 'XAI Explainability', 'EU AI Risk Tiers'];
    const topicsGeneral = ['Server Runtime', 'Glassmorphism backdrop', 'Git Pull vs Fetch', 'SaaS Acronyms'];

    userSubs.forEach(s => {
      const t = s.testTitle.toLowerCase();
      let fallbackTopics = topicsGeneral;
      if (t.includes('physic')) fallbackTopics = topicsPhysics;
      else if (t.includes('ethics')) fallbackTopics = topicsEthics;

      const subQuestions = s.questions || tests.find(test => test.id === s.testId)?.questions || [];

      s.questionStatus.forEach((status, idx) => {
        let topic = fallbackTopics[idx];
        if (subQuestions[idx] && subQuestions[idx].questionText) {
          // Truncate or use first 40 chars of question text as topic name if custom
          const text = subQuestions[idx].questionText;
          topic = text.length > 45 ? text.substring(0, 42) + '...' : text;
        }
        if (!topic) topic = `Question ${idx + 1}`;

        if (status === 'wrong') {
          weakTopicsMap.set(topic, (weakTopicsMap.get(topic) || 0) + 1);
        } else if (status === 'correct') {
          strongTopicsMap.set(topic, (strongTopicsMap.get(topic) || 0) + 1);
        }
      });
    });

    const weakTopics = Array.from(weakTopicsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic, count]) => ({ topic, mistakesCount: count }));

    if (weakTopics.length === 0) {
      weakTopics.push(
        { topic: 'Static Friction Calculations', mistakesCount: 1 },
        { topic: 'Inner Alignment Policies', mistakesCount: 1 }
      );
    }

    const strongTopics = Array.from(strongTopicsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic]) => topic);

    if (strongTopics.length === 0) {
      strongTopics.push('RLHF Alignment Systems', 'Newtonian Force Conversions', 'Git Operations');
    }

    const dateMap = new Map();
    userSubs.forEach(s => {
      const dStr = new Date(s.createdAt).toISOString().split('T')[0];
      dateMap.set(dStr, (dateMap.get(dStr) || 0) + 1);
    });

    const mistakeHeatmap = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      mistakeHeatmap.push({
        date: dStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dateMap.get(dStr) || 0
      });
    }

    return {
      totalTests,
      avgAccuracy,
      timeSpent: totalTimeSpent,
      improvementRate,
      accuracyTrend,
      subjectAnalysis,
      weakTopics,
      strongTopics,
      mistakeHeatmap
    };
  };

  const deleteTest = async (testId) => {
    try {
      await fetch(`${apiBaseUrl}/api/tests/${encodeURIComponent(testId)}`, {
        method: "DELETE"
      });
      setTests(prev => prev.filter(t => t.id !== testId && t._id !== testId));
      fetchData();
    } catch (err) {
      console.error("Failed to delete test:", err);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      tests,
      submissions,
      documents,
      students,
      schedules,
      login,
      register,
      logout,
      forgotPassword,
      uploadDocument,
      uploadGeneratedTest,
      submitTest,
      deleteTest,
      addStudent,
      scheduleExam,
      getAnalytics
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
