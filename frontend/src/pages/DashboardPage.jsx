import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  Calendar, 
  Trash2,
  Users,
  BarChart2,
  Copy,
  CheckCheck,
  Link2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const DashboardPage = () => {
  const { tests, submissions, schedules, students, currentUser, deleteTest } = useApp();
  const navigate = useNavigate();
  const [copiedTestId, setCopiedTestId] = useState(null);

  const isOrg = currentUser?.role === 'organization';

  const copyTestLink = (testId) => {
    navigator.clipboard.writeText(`${window.location.origin}/test/${testId}`).then(() => {
      setCopiedTestId(testId);
      setTimeout(() => setCopiedTestId(null), 2500);
    });
  };

  // Student calculations
  const totalCompleted = submissions.length;
  const avgAccuracy = totalCompleted 
    ? Math.round(submissions.reduce((sum, s) => sum + s.accuracy, 0) / totalCompleted) 
    : 0;
  const totalTimeSpentSeconds = submissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
  const totalTimeMinutes = Math.round(totalTimeSpentSeconds / 60);

  const studentStats = [
    { name: 'TOTAL TESTS TAKEN', value: totalCompleted, sub: 'Exams completed', icon: BookOpen, color: 'blue' },
    { name: 'AVERAGE ACCURACY', value: `${avgAccuracy}%`, sub: 'Overall test score', icon: CheckCircle, color: 'green' },
    { name: 'TIME SPENT TESTING', value: `${totalTimeMinutes}m`, sub: 'Total active minutes', icon: Clock, color: 'purple' },
    { name: 'IMPROVEMENT RATE', value: '+14%', sub: 'Since first attempt', icon: TrendingUp, color: 'cyan' },
  ];

  // Institution calculations
  const orgCreatedTests = tests.filter(test => {
    if (!currentUser) return false;
    return (
      test.createdBy === currentUser.id ||
      test.createdBy === currentUser.username ||
      test.createdBy === currentUser.email
    );
  });

  const institutionStats = [
    { name: 'CREATED ASSESSMENTS', value: orgCreatedTests.length, sub: 'Active CBT exams', icon: Sparkles, color: 'purple' },
    { name: 'ENROLLED CANDIDATES', value: students.length || 3, sub: 'Registered students', icon: Users, color: 'blue' },
    { name: 'SCHEDULED SESSIONS', value: schedules.length, sub: 'Upcoming exam dates', icon: Calendar, color: 'cyan' },
    { name: 'SYSTEM INTEGRITY', value: '100%', sub: 'Anti-cheating active', icon: ShieldCheck, color: 'green' },
  ];

  const availableTests = tests.filter(test => {
    if (test.createdBy === 'system') return true;
    if (!currentUser) return false;
    return (
      test.createdBy === currentUser.id ||
      test.createdBy === currentUser.username ||
      test.createdBy === currentUser.email
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {isOrg ? 'Institution Dashboard' : 'Student Dashboard'}
          </h1>
          <p className="text-xs text-mutedGray mt-1">
            {isOrg ? (
              <>
                Welcome back, <span className="text-purpleGlow font-medium">{currentUser?.username}</span>. Generate exams, manage rosters, and distribute CBT links.
              </>
            ) : (
              <>
                Welcome back, <span className="text-accentBlue font-medium">{currentUser?.username}</span>. Track your metrics and convert new files.
              </>
            )}
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accentBlue to-purpleGlow text-xs font-semibold text-white shadow-glowBlue hover:scale-105 transition-all self-start md:self-auto"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>{isOrg ? 'Generate New CBT Exam' : 'New CBT Exam'}</span>
        </Link>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(isOrg ? institutionStats : studentStats).map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.name} glowColor={stat.color} className="p-5 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[10px] text-mutedGray uppercase tracking-wider block font-semibold">{stat.name}</span>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{stat.value}</h3>
                <span className="text-[10px] text-mutedGray block">{stat.sub}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${
                stat.color === 'blue' ? 'text-accentBlue' :
                stat.color === 'green' ? 'text-green-400' :
                stat.color === 'purple' ? 'text-purpleGlow' : 'text-cyanAccent'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accentBlue" />
              <span>{isOrg ? 'My Created CBT Assessments' : 'Available Practice Exams'}</span>
            </h2>
            <span className="text-xs text-mutedGray font-mono">
              {(isOrg ? orgCreatedTests : availableTests).length} tests loaded
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(isOrg ? orgCreatedTests : availableTests).length === 0 ? (
              <GlassCard glowColor="purple" className="p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-gray-300">
                  {isOrg ? 'No assessments created yet.' : 'No practice exams available right now.'}
                </p>
                <p className="text-xs text-mutedGray">
                  Upload a PDF/Image document to generate a customized AI assessment.
                </p>
                <Link
                  to="/upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-accentBlue/20 text-accentBlue border border-accentBlue/30 text-xs font-semibold hover:bg-accentBlue hover:text-white transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isOrg ? 'Generate New CBT Exam' : 'Upload PDF or Image'}</span>
                </Link>
              </GlassCard>
            ) : (
              (isOrg ? orgCreatedTests : availableTests).map((test) => (
                <GlassCard key={test.id} glowColor="purple" className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/15 transition-all">
                  <div className="space-y-1.5 max-w-xl">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{test.title}</span>
                      {test.createdBy !== 'system' && (
                        <span className="text-[9px] bg-purpleGlow/25 text-purpleGlow px-2 py-0.5 rounded border border-purpleGlow/30">AI Extracted</span>
                      )}
                    </h3>
                    <p className="text-xs text-mutedGray leading-relaxed">{test.description}</p>
                    <div className="flex items-center space-x-4 text-[10px] text-mutedGray font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {test.timeLimit} mins</span>
                      <span>•</span>
                      <span>{test.questions?.length || 0} Questions</span>
                      {isOrg && (
                        <>
                          <span>•</span>
                          <span className="text-cyanAccent truncate max-w-[200px]">Link: /test/{test.id}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {isOrg ? (
                      <>
                        <button
                          onClick={() => copyTestLink(test.id)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            copiedTestId === test.id
                              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                              : 'bg-cyanAccent/10 border border-cyanAccent/30 text-cyanAccent hover:bg-cyanAccent/20'
                          }`}
                        >
                          {copiedTestId === test.id ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                        </button>
                        <button
                          onClick={() => navigate(`/admin/test/${test.id}`)}
                          className="px-3.5 py-2 rounded-xl bg-accentBlue/15 border border-accentBlue/30 hover:bg-accentBlue/25 text-accentBlue text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>Class Analytics</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/test/${test.id}`)}
                        className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-accentBlue hover:border-accentBlue text-xs font-semibold text-white transition-all flex items-center gap-1.5 group"
                      >
                        <span>Attempt Test</span>
                        <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${test.title}"?`)) {
                          deleteTest(test.id || test._id);
                        }
                      }}
                      title="Remove test"
                      className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {isOrg ? (
            <>
              {/* Institution Fast Actions */}
              <GlassCard glowColor="purple" className="p-5 space-y-4 border border-purpleGlow/25">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purpleGlow" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fast CBT Builder</h3>
                </div>
                <p className="text-xs text-mutedGray leading-relaxed">
                  Upload lecture notes, sample papers, or question banks with optional answer keys to deploy an online exam in seconds.
                </p>
                <Link
                  to="/upload"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purpleGlow to-accentBlue text-white text-xs font-bold shadow-glowBlue hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate New CBT Exam</span>
                </Link>
              </GlassCard>

              {/* Scheduled Sessions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-cyanAccent" />
                    <span>Scheduled Exams</span>
                  </h2>
                  <Link to="/organization" className="text-xs text-accentBlue hover:underline">
                    Manage All
                  </Link>
                </div>

                <div className="space-y-3">
                  {schedules.map((sched) => (
                    <GlassCard key={sched.id} glowColor="cyan" className="p-4 space-y-2.5">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-white leading-tight">{sched.title}</h4>
                        <span className="text-[9px] bg-cyanAccent/20 text-cyanAccent px-1.5 py-0.5 rounded border border-cyanAccent/20 font-mono">Scheduled</span>
                      </div>
                      <div className="text-[11px] text-mutedGray space-y-0.5 font-mono">
                        <div>Date: {sched.date}</div>
                        <div>Time: {sched.time} ({sched.duration})</div>
                        <div>Registered: {sched.studentsCount} candidates</div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyanAccent" />
                <span>Scheduled Exam Alerts</span>
              </h2>

              <div className="space-y-4">
                {schedules.map((sched) => (
                  <GlassCard key={sched.id} glowColor="cyan" className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white leading-tight">{sched.title}</h4>
                      <span className="text-[9px] bg-cyanAccent/20 text-cyanAccent px-1.5 py-0.5 rounded border border-cyanAccent/20 font-mono">Exam Lock</span>
                    </div>
                    <div className="text-[11px] text-mutedGray space-y-1 font-mono">
                      <div>Date: {sched.date}</div>
                      <div>Time: {sched.time} ({sched.duration})</div>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-mutedGray font-medium">
                      <span>Registered Candidates: {sched.studentsCount}</span>
                      <span className="text-accentBlue hover:underline cursor-pointer">Rules info</span>
                    </div>
                  </GlassCard>
                ))}

                <GlassCard glowColor="purple" className="p-4 bg-gradient-to-tr from-purpleGlow/5 to-transparent border-purpleGlow/25">
                  <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purpleGlow" />
                    <span>AI Preparation Tip</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Based on your last attempt on <strong>AI Ethics Quiz</strong>, we recommend spending 5 minutes reviewing <strong>Inner Alignment Policies</strong> before re-testing.
                  </p>
                </GlassCard>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
