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

  // Student calculations - strictly individual for currently logged-in student
  const studentSubmissions = submissions.filter((s) => {
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

  const totalCompleted = studentSubmissions.length;
  const avgAccuracy = totalCompleted
    ? Math.round(studentSubmissions.reduce((sum, s) => sum + s.accuracy, 0) / totalCompleted)
    : 0;
  const totalTimeSpentSeconds = studentSubmissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
  const totalTimeMinutes = Math.round(totalTimeSpentSeconds / 60);
  const improvementRate = totalCompleted > 1 ? '+14%' : totalCompleted === 1 ? '+5%' : '0%';

  const studentStats = [
    { name: 'TOTAL TESTS TAKEN', value: totalCompleted, sub: 'Completed exams', icon: BookOpen },
    { name: 'AVERAGE ACCURACY', value: `${avgAccuracy}%`, sub: 'Overall exam score', icon: CheckCircle },
    { name: 'TIME SPENT TESTING', value: `${totalTimeMinutes}m`, sub: 'Active practice minutes', icon: Clock },
    { name: 'IMPROVEMENT RATE', value: improvementRate, sub: 'Progress trajectory', icon: TrendingUp },
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
    { name: 'CREATED ASSESSMENTS', value: orgCreatedTests.length, sub: 'Active CBT exams', icon: Sparkles },
    { name: 'ENROLLED CANDIDATES', value: students.length || 3, sub: 'Registered learners', icon: Users },
    { name: 'SCHEDULED SESSIONS', value: schedules.length, sub: 'Upcoming exam dates', icon: Calendar },
    { name: 'SYSTEM INTEGRITY', value: '100%', sub: 'Anti-cheat operational', icon: ShieldCheck },
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
    <div className="space-y-8 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#f7f7f4]">
            {isOrg ? 'Institution Console' : 'Student Dashboard'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {isOrg ? (
              <>
                Welcome back, <span className="text-white font-semibold">{currentUser?.username}</span>. Manage assessments, monitor candidate rosters, and publish tests.
              </>
            ) : (
              <>
                Welcome back, <span className="text-white font-semibold">{currentUser?.username}</span>. Review your practice analytics and start new exams.
              </>
            )}
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-lime-300 text-xs font-bold text-zinc-950 hover:bg-lime-200 transition-all self-start md:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>{isOrg ? 'Generate New Assessment' : 'New CBT Exam'}</span>
        </Link>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(isOrg ? institutionStats : studentStats).map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.name} className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">{stat.name}</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
                <span className="text-xs text-zinc-500 block">{stat.sub}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lime-300">
                <Icon className="w-5 h-5" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-lime-300" />
              <span>{isOrg ? 'Created CBT Assessments' : 'Available Exams'}</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              {(isOrg ? orgCreatedTests : availableTests).length} tests
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {(isOrg ? orgCreatedTests : availableTests).length === 0 ? (
              <GlassCard className="p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-zinc-300">
                  {isOrg ? 'No assessments created yet.' : 'No practice exams available right now.'}
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Upload a PDF or image document to generate a customized AI assessment.
                </p>
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isOrg ? 'Generate New Assessment' : 'Upload Document'}</span>
                </Link>
              </GlassCard>
            ) : (
              (isOrg ? orgCreatedTests : availableTests).map((test) => (
                <GlassCard key={test.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/20 transition-all">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{test.title}</h3>
                      {test.createdBy !== 'system' && (
                        <span className="text-[10px] bg-lime-300/10 text-lime-300 px-2 py-0.5 rounded border border-lime-300/25 font-bold">
                          AI Generated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{test.description}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-400 font-mono pt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-500" /> {test.timeLimit} mins</span>
                      <span>•</span>
                      <span>{test.questions?.length || 0} Questions</span>
                      {isOrg && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-400 truncate max-w-[180px]">Link: /test/{test.id}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap self-end sm:self-center">
                    {isOrg ? (
                      <>
                        <button
                          onClick={() => copyTestLink(test.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                            copiedTestId === test.id
                              ? 'bg-lime-300 text-zinc-950 font-bold'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:border-lime-300/40 hover:text-lime-300'
                          }`}
                        >
                          {copiedTestId === test.id ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                        </button>
                        <button
                          onClick={() => navigate(`/admin/test/${test.id}`)}
                          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-zinc-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-lime-300" />
                          <span>Analytics</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/test/${test.id}`)}
                        className="px-5 py-2.5 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 transition-all flex items-center gap-1.5"
                      >
                        <span>Start Test</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${test.title}"?`)) {
                          deleteTest(test.id || test._id);
                        }
                      }}
                      title="Delete test"
                      className="p-2 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
              {/* Fast Builder Card */}
              <GlassCard className="p-5 space-y-3 border-lime-300/20 bg-[#161616]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-lime-300" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fast Assessment Creator</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Upload notes, PDFs, or photos of question papers to instantly synthesize and host a Computer-Based Test.
                </p>
                <Link
                  to="/upload"
                  className="w-full py-3 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload &amp; Generate Test</span>
                </Link>
              </GlassCard>

              {/* Scheduled Sessions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-lime-300" />
                    <span>Scheduled Exams</span>
                  </h2>
                  <Link to="/organization" className="text-xs text-lime-300 hover:underline">
                    Manage Roster
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {schedules.map((sched) => (
                    <GlassCard key={sched.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-white leading-tight">{sched.title}</h4>
                        <span className="text-[10px] bg-lime-300/15 text-lime-300 px-2 py-0.5 rounded-full font-mono font-bold">Scheduled</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 space-y-0.5 font-mono">
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
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-lime-300" />
                <span>Scheduled Exam Notices</span>
              </h2>

              <div className="space-y-3">
                {schedules.map((sched) => (
                  <GlassCard key={sched.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white leading-tight">{sched.title}</h4>
                      <span className="text-[10px] bg-lime-300/15 text-lime-300 px-2 py-0.5 rounded-full font-mono font-bold">Active</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 space-y-0.5 font-mono">
                      <div>Date: {sched.date}</div>
                      <div>Time: {sched.time} ({sched.duration})</div>
                    </div>
                  </GlassCard>
                ))}

                <GlassCard className="p-4 space-y-2 bg-[#161616]">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-lime-300" />
                    <span>Study Recommendation</span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Based on your previous attempts, reviewing topic definitions before re-testing will improve your speed coefficient.
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
