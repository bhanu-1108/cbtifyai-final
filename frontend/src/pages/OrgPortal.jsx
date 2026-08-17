import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  Calendar, 
  Plus, 
  Download, 
  Mail, 
  User, 
  CheckCircle2, 
  ShieldAlert, 
  FileSpreadsheet, 
  Clock, 
  BarChart2, 
  Copy, 
  CheckCheck, 
  Link2, 
  FileText 
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const OrgPortal = () => {
  const { students, schedules, addStudent, scheduleExam, currentUser } = useApp();
  const navigate = useNavigate();

  const [myTests, setMyTests] = useState([]);
  const [copiedTestId, setCopiedTestId] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    const queryParams = new URLSearchParams({
      createdBy: currentUser.id,
      username: currentUser.username || '',
      email: currentUser.email || ''
    }).toString();
    fetch(`${apiBaseUrl}/api/tests?${queryParams}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setMyTests(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [currentUser]);

  const copyTestLink = (testId) => {
    navigator.clipboard.writeText(`${window.location.origin}/test/${testId}`).then(() => {
      setCopiedTestId(testId);
      setTimeout(() => setCopiedTestId(null), 2500);
    });
  };

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentSuccess, setStudentSuccess] = useState('');

  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [examDuration, setExamDuration] = useState('30 mins');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  const handleAddStudent = (e) => {
    e.preventDefault();
    setStudentSuccess('');
    if (!studentName || !studentEmail) return;

    addStudent(studentName, studentEmail);
    setStudentName('');
    setStudentEmail('');
    setStudentSuccess('Student added successfully!');
    setTimeout(() => {
      setStudentSuccess('');
      setShowStudentForm(false);
    }, 1500);
  };

  const handleScheduleExam = (e) => {
    e.preventDefault();
    setScheduleSuccess('');
    if (!examTitle || !examDate || !examTime) return;

    scheduleExam(examTitle, examDate, examTime, examDuration, 45);
    setExamTitle('');
    setExamDate('');
    setExamTime('');
    setScheduleSuccess('Exam scheduled successfully!');
    setTimeout(() => {
      setScheduleSuccess('');
      setShowScheduleForm(false);
    }, 1500);
  };

  const exportCSV = () => {
    const headers = 'Student Name,Email,Tests Completed,Average Accuracy %,Last Active\r\n';
    const rows = students.map(s => 
      `"${s.name}","${s.email}",${s.testsTaken},${s.avgAccuracy},"${s.lastActive}"`
    ).join('\r\n');
    
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'cbtify_student_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Organization Console</h1>
          <p className="text-xs text-mutedGray mt-1">
            Manage student registrations, launch secure tests, track accuracy percentiles and export rosters.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-cyanAccent" />
          <span>Export Student Roster</span>
        </button>
      </div>

      {/* My Tests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-accentBlue" />
            <span>My Created Tests</span>
            <span className="text-[10px] text-mutedGray font-normal normal-case ml-1">({myTests.length} total)</span>
          </h2>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-accentBlue/10 border border-accentBlue/30 text-accentBlue text-xs font-semibold hover:bg-accentBlue/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New CBT</span>
          </button>
        </div>

        {myTests.length === 0 ? (
          <GlassCard glowColor="blue" className="p-6 text-center">
            <Link2 className="w-8 h-8 text-mutedGray mx-auto mb-3" />
            <p className="text-xs text-mutedGray">No tests created yet. Upload a PDF or image to generate your first CBT exam.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {myTests.map((test) => (
              <GlassCard key={test.id} glowColor="blue" className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/15 transition-all">
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{test.title}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-mutedGray font-mono">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.timeLimit} mins</span>
                    <span>•</span>
                    <span>{test.questions?.length || 0} Questions</span>
                    <span>•</span>
                    <span>{new Date(test.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Link2 className="w-3 h-3 text-cyanAccent" />
                    <span className="truncate">{window.location.origin}/test/{test.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyTestLink(test.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      copiedTestId === test.id
                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                        : 'bg-cyanAccent/10 border border-cyanAccent/30 text-cyanAccent hover:bg-cyanAccent/20'
                    }`}
                  >
                    {copiedTestId === test.id ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                  </button>
                  <button
                    onClick={() => navigate(`/admin/test/${test.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accentBlue/10 border border-accentBlue/30 text-accentBlue text-[10px] font-semibold hover:bg-accentBlue/20 transition-all"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> View Analytics
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-accentBlue" />
              <span>Enrolled Student Roster</span>
            </h2>
            <button
              onClick={() => setShowStudentForm(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-accentBlue/10 border border-accentBlue/30 text-accentBlue text-xs font-semibold hover:bg-accentBlue/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>

          {showStudentForm && (
            <GlassCard glowColor="blue" className="p-5 animate-slideIn">
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300">Student Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-mutedGray" />
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentBlue focus:border-accentBlue"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-mutedGray" />
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="jane@university.edu"
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentBlue focus:border-accentBlue"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-accentBlue to-purpleGlow text-white text-xs font-semibold hover:scale-105 active:scale-95 transition-all shadow-glowBlue flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStudentForm(false)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-mutedGray hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {studentSuccess && (
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{studentSuccess}</span>
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard glowColor="blue" className="p-0 overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] text-mutedGray uppercase tracking-wider text-[10px] border-b border-white/5">
                  <tr>
                    <th className="py-4 px-5 font-semibold">Student Name</th>
                    <th className="py-4 px-5 font-semibold">Email</th>
                    <th className="py-4 px-5 font-semibold text-center">Tests Taken</th>
                    <th className="py-4 px-5 font-semibold text-center">Avg Accuracy</th>
                    <th className="py-4 px-5 font-semibold">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-5 font-semibold text-white">{student.name}</td>
                      <td className="py-4 px-5 text-mutedGray font-mono text-[10px]">{student.email}</td>
                      <td className="py-4 px-5 text-center font-bold text-slate-300">{student.testsTaken}</td>
                      <td className="py-4 px-5 text-center">
                        <span className={`font-bold ${
                          student.avgAccuracy >= 80 ? 'text-green-400' :
                          student.avgAccuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {student.avgAccuracy}%
                        </span>
                      </td>
                      <td className="py-4 px-5 text-mutedGray font-mono text-[10px]">{student.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyanAccent" />
              <span>Exam Schedule</span>
            </h2>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyanAccent/10 border border-cyanAccent/30 text-cyanAccent text-xs font-semibold hover:bg-cyanAccent/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Exam</span>
            </button>
          </div>

          {showScheduleForm && (
            <GlassCard glowColor="cyan" className="p-5 animate-slideIn">
              <form onSubmit={handleScheduleExam} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-300">Exam Title</label>
                  <input
                    type="text"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Mid-Term Assessment"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyanAccent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300">Date</label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyanAccent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-300">Time</label>
                    <input
                      type="time"
                      required
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyanAccent"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-cyanAccent to-accentBlue text-white text-xs font-semibold hover:scale-105 active:scale-95 transition-all shadow-glowCyan flex items-center justify-center space-x-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Publish Schedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-mutedGray hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {scheduleSuccess && (
                <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{scheduleSuccess}</span>
                </div>
              )}
            </GlassCard>
          )}

          <div className="space-y-4">
            {schedules.map((schedule) => (
              <GlassCard key={schedule.id} glowColor="cyan" className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{schedule.title}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-mutedGray font-mono">
                      <span>Date: {schedule.date}</span>
                      <span>•</span>
                      <span>Time: {schedule.time} ({schedule.duration})</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Exam Lock</span>
                  </span>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-mutedGray">
                  <span>Enrolled: {schedule.studentsCount} candidates</span>
                  <span className="text-accentBlue hover:text-cyanAccent transition-colors cursor-pointer font-semibold">
                    Scheduled
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgPortal;
