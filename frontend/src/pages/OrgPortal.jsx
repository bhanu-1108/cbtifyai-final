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
    <div className="space-y-8 max-w-[1500px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#f7f7f4]">Organization Console</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage candidate rosters, generate custom CBT assessments, monitor test links, and export analytics.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-semibold text-white transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-lime-300" />
          <span>Export Student Roster</span>
        </button>
      </div>

      {/* My Tests Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-lime-300" />
            <span>My Created Assessments</span>
            <span className="text-xs text-zinc-500 font-mono font-normal">({myTests.length} total)</span>
          </h2>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New CBT</span>
          </button>
        </div>

        {myTests.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <Link2 className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
            <p className="text-xs text-zinc-400">No tests created yet. Upload a PDF or image to generate your first CBT exam.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {myTests.map((test) => (
              <GlassCard key={test.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/20 transition-all">
                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{test.title}</h4>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-500" /> {test.timeLimit} mins</span>
                    <span>•</span>
                    <span>{test.questions?.length || 0} Questions</span>
                    <span>•</span>
                    <span>{new Date(test.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-400 font-mono pt-0.5">
                    <Link2 className="w-3.5 h-3.5 text-lime-300" />
                    <span className="truncate">{window.location.origin}/test/{test.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyTestLink(test.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      copiedTestId === test.id
                        ? 'bg-lime-300 text-zinc-950 font-bold'
                        : 'bg-white/5 border border-white/10 text-lime-300 hover:bg-white/10'
                    }`}
                  >
                    {copiedTestId === test.id ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                  </button>
                  <button
                    onClick={() => navigate(`/admin/test/${test.id}`)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-200 text-xs font-semibold hover:border-white/25 transition-all"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-lime-300" /> View Analytics
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-lime-300" />
              <span>Enrolled Student Roster</span>
            </h2>
            <button
              onClick={() => setShowStudentForm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold hover:border-lime-300/40 hover:text-lime-300 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
          </div>

          {showStudentForm && (
            <GlassCard className="p-5 animate-slideIn bg-[#181818]">
              <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Candidate Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-lime-300 focus:border-lime-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="jane@university.edu"
                      className="w-full pl-9 pr-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-lime-300 focus:border-lime-300"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 active:scale-95 transition-all shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStudentForm(false)}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {studentSuccess && (
                <div className="mt-3 flex items-center space-x-1.5 text-xs text-lime-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{studentSuccess}</span>
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard className="p-0 overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181818] text-zinc-400 uppercase tracking-wider text-[10px] border-b border-white/10 font-semibold">
                  <tr>
                    <th className="py-4 px-5">Student Name</th>
                    <th className="py-4 px-5">Email</th>
                    <th className="py-4 px-5 text-center">Tests Taken</th>
                    <th className="py-4 px-5 text-center">Avg Accuracy</th>
                    <th className="py-4 px-5">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-semibold text-white">{student.name}</td>
                      <td className="py-4 px-5 text-zinc-400 font-mono text-[11px]">{student.email}</td>
                      <td className="py-4 px-5 text-center font-bold text-zinc-300">{student.testsTaken}</td>
                      <td className="py-4 px-5 text-center">
                        <span className={`font-bold font-mono ${
                          student.avgAccuracy >= 80 ? 'text-lime-300' :
                          student.avgAccuracy >= 60 ? 'text-amber-300' : 'text-rose-400'
                        }`}>
                          {student.avgAccuracy}%
                        </span>
                      </td>
                      <td className="py-4 px-5 text-zinc-500 font-mono text-[11px]">{student.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-lime-300" />
              <span>Exam Schedule</span>
            </h2>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold hover:border-lime-300/40 hover:text-lime-300 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Exam</span>
            </button>
          </div>

          {showScheduleForm && (
            <GlassCard className="p-5 animate-slideIn bg-[#181818]">
              <form onSubmit={handleScheduleExam} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Exam Title</label>
                  <input
                    type="text"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Mid-Term Assessment"
                    className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-lime-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-lime-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Time</label>
                    <input
                      type="time"
                      required
                      value={examTime}
                      onChange={(e) => setExamTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-lime-300"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 active:scale-95 transition-all shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Publish Schedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {scheduleSuccess && (
                <div className="mt-3 flex items-center space-x-1.5 text-xs text-lime-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{scheduleSuccess}</span>
                </div>
              )}
            </GlassCard>
          )}

          <div className="space-y-3">
            {schedules.map((schedule) => (
              <GlassCard key={schedule.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">{schedule.title}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-zinc-400 font-mono">
                      <span>Date: {schedule.date}</span>
                      <span>•</span>
                      <span>Time: {schedule.time} ({schedule.duration})</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Locked</span>
                  </span>
                </div>

                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <span>Enrolled: {schedule.studentsCount} candidates</span>
                  <span className="text-lime-300 font-semibold">
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
