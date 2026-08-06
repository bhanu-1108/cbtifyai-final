import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  BarChart3,
  Clock,
  Trophy,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingDown,
  Copy,
  CheckCheck,
  Target,
  Activity,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const formatTime = (secs) => {
  if (!secs) return '0m 0s';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

const AdminAnalyticsPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/analytics/test/${testId}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load analytics.');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [testId]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/test/${testId}`).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const exportCSV = () => {
    if (!data?.submissions?.length) return;
    const headers = 'Student Name,Email,Score,Accuracy %,Time Spent,Submitted At\r\n';
    const rows = data.submissions
      .map(
        (s) =>
          `"${s.username}","${s.userId}",${s.score}/${s.totalQuestions},${s.accuracy}%,"${formatTime(s.timeSpent)}","${new Date(s.createdAt).toLocaleString()}"`
      )
      .join('\r\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `cbtify_${testId}_roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderScoreChart = () => {
    if (!data?.submissions?.length) return null;
    const buckets = [
      { label: '0–20%', min: 0, max: 20, color: '#ef4444' },
      { label: '21–40%', min: 21, max: 40, color: '#f97316' },
      { label: '41–60%', min: 41, max: 60, color: '#eab308' },
      { label: '61–80%', min: 61, max: 80, color: '#22c55e' },
      { label: '81–100%', min: 81, max: 100, color: '#06b6d4' },
    ];
    const counts = buckets.map(
      (b) => data.submissions.filter((s) => s.accuracy >= b.min && s.accuracy <= b.max).length
    );
    const maxCount = Math.max(...counts, 1);
    const chartH = 120;
    const barW = 44;
    const gap = 16;
    const width = buckets.length * (barW + gap);

    return (
      <svg viewBox={`0 0 ${width} ${chartH + 36}`} className="w-full">
        {counts.map((count, i) => {
          const barH = (count / maxCount) * chartH;
          const x = i * (barW + gap);
          const y = chartH - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx={6} fill={buckets[i].color} opacity={0.75} />
              {count > 0 && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                  {count}
                </text>
              )}
              <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fill="#6b7280" fontSize="9">
                {buckets[i].label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-accentBlue border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-mutedGray">Loading test analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => navigate('/organization')} className="text-xs text-accentBlue underline">
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  const { test, totalAttempts, avgScore, avgTime, submissions, questionHeatmap } = data;

  const statCards = [
    { label: 'Total Attempts', value: totalAttempts, icon: Users, color: 'blue' },
    { label: 'Average Score', value: `${avgScore}%`, icon: Trophy, color: 'green' },
    { label: 'Avg Time Taken', value: formatTime(avgTime), icon: Clock, color: 'purple' },
    { label: 'Total Questions', value: test?.questions?.length ?? '—', icon: Target, color: 'cyan' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/organization')}
            className="mt-1 p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-mutedGray hover:text-white transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">{test?.title}</h1>
            <p className="text-xs text-mutedGray mt-1">{test?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={copyLink}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              linkCopied
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-cyanAccent/10 border border-cyanAccent/30 text-cyanAccent hover:bg-cyanAccent/20'
            }`}
          >
            {linkCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {linkCopied ? 'Copied!' : 'Copy Test Link'}
          </button>
          <button
            onClick={exportCSV}
            disabled={!submissions?.length}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-cyanAccent" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} glowColor={stat.color} className="p-5 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] text-mutedGray uppercase tracking-wider block font-semibold">{stat.label}</span>
                <h3 className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${
                stat.color === 'blue' ? 'text-accentBlue' :
                stat.color === 'green' ? 'text-green-400' :
                stat.color === 'purple' ? 'text-purpleGlow' : 'text-cyanAccent'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accentBlue" />
            Score Distribution
          </h3>
          <GlassCard glowColor="blue" className="p-6 h-56 flex items-end">
            {submissions?.length > 0 ? renderScoreChart() : (
              <div className="w-full text-center text-xs text-mutedGray">No attempts yet.</div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            Question Difficulty (Wrong Rate)
          </h3>
          <GlassCard glowColor="purple" className="p-5 space-y-3 h-56 overflow-y-auto">
            {questionHeatmap?.length > 0 ? (
              questionHeatmap
                .sort((a, b) => b.wrongRate - a.wrongRate)
                .slice(0, 8)
                .map((q) => (
                  <div key={q.questionIndex} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-300 truncate max-w-[70%]">Q{q.questionIndex + 1}: {q.questionText.slice(0, 50)}...</span>
                      <span className={`font-bold ml-2 flex-shrink-0 ${q.wrongRate >= 60 ? 'text-red-400' : q.wrongRate >= 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {q.wrongRate}% wrong
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${q.wrongRate >= 60 ? 'bg-red-500' : q.wrongRate >= 30 ? 'bg-yellow-400' : 'bg-green-400'}`}
                        style={{ width: `${q.wrongRate}%` }}
                      />
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center text-xs text-mutedGray py-6">No attempt data available.</div>
            )}
          </GlassCard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyanAccent" />
          Student Attempt Roster
          <span className="text-[10px] text-mutedGray font-normal normal-case ml-1">({submissions?.length || 0} attempts recorded)</span>
        </h3>

        <GlassCard glowColor="cyan" className="p-0 overflow-hidden border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-mutedGray uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-4 px-5 font-semibold">Student</th>
                  <th className="py-4 px-5 font-semibold">Email / ID</th>
                  <th className="py-4 px-5 font-semibold text-center">Score</th>
                  <th className="py-4 px-5 font-semibold text-center">Accuracy</th>
                  <th className="py-4 px-5 font-semibold text-center">Time Taken</th>
                  <th className="py-4 px-5 font-semibold">Submitted At</th>
                  <th className="py-4 px-5 font-semibold text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions?.length > 0 ? submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-5 font-semibold text-white">{sub.username}</td>
                    <td className="py-4 px-5 text-mutedGray font-mono text-[10px]">{sub.userId}</td>
                    <td className="py-4 px-5 text-center font-bold text-slate-300">
                      {sub.score}/{sub.totalQuestions}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`font-bold text-sm ${sub.accuracy >= 80 ? 'text-green-400' : sub.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {sub.accuracy}%
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-slate-300">{formatTime(sub.timeSpent)}</td>
                    <td className="py-4 px-5 text-mutedGray font-mono text-[10px]">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-center">
                      {sub.accuracy >= 60 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-400 bg-green-500/15 border border-green-500/25 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded">
                          <XCircle className="w-3 h-3" /> Fail
                        </span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-mutedGray">
                      No students have attempted this test yet. Share the link to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
