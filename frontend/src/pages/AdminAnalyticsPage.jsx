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
    const headers = 'Student Name,Email,Score,Total Questions,Accuracy (%),Time Spent,Submitted At\r\n';
    const rows = data.submissions
      .map(
        (s) =>
          `"${(s.username || 'Student').replace(/"/g, '""')}","${(s.userEmail || s.email || s.userId || 'N/A').replace(/"/g, '""')}",${s.score},${s.totalQuestions || data?.test?.questions?.length || 10},"${s.accuracy}%","${formatTime(s.timeSpent)}","${new Date(s.createdAt).toLocaleString()}"`
      )
      .join('\r\n');
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers + rows);
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
      { label: '0–20%', min: 0, max: 20, color: '#fb7185' },
      { label: '21–40%', min: 21, max: 40, color: '#fb923c' },
      { label: '41–60%', min: 41, max: 60, color: '#facc15' },
      { label: '61–80%', min: 61, max: 80, color: '#a3e635' },
      { label: '81–100%', min: 81, max: 100, color: '#bef264' },
    ];
    const counts = buckets.map(
      (b) => data.submissions.filter((s) => s.accuracy >= b.min && s.accuracy <= b.max).length
    );
    const maxCount = Math.max(...counts, 1);

    return (
      <div className="w-full h-full flex items-end justify-between gap-3 px-2 pb-1">
        {buckets.map((b, i) => {
          const count = counts[i];
          const heightPct = count > 0 ? Math.max(14, Math.round((count / maxCount) * 80)) : 4;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
              <span className={`text-[11px] font-bold font-mono transition-opacity ${count > 0 ? 'text-white' : 'opacity-0'}`}>
                {count}
              </span>
              <div 
                className="w-full max-w-[48px] rounded-lg transition-all duration-300 shadow-sm"
                style={{ 
                  height: `${heightPct}%`, 
                  backgroundColor: count > 0 ? b.color : 'rgba(255,255,255,0.05)',
                  opacity: count > 0 ? 0.9 : 0.4
                }}
              />
              <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap mt-1">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-lime-300 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-medium">Loading assessment analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <p className="text-sm text-rose-400">{error}</p>
          <button onClick={() => navigate('/org-portal')} className="text-xs text-lime-300 underline font-semibold">
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  const { test, totalAttempts, avgScore, avgTime, submissions, questionHeatmap } = data;

  const statCards = [
    { label: 'Total Attempts', value: totalAttempts, icon: Users },
    { label: 'Average Score', value: `${avgScore}%`, icon: Trophy },
    { label: 'Avg Time Taken', value: formatTime(avgTime), icon: Clock },
    { label: 'Total Questions', value: test?.questions?.length ?? '—', icon: Target },
  ];

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/org-portal')}
            className="mt-1 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#f7f7f4] leading-tight">{test?.title}</h1>
            <p className="text-xs text-zinc-400 mt-1">{test?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={copyLink}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              linkCopied
                ? 'bg-lime-300 text-zinc-950 font-bold'
                : 'bg-white/5 border border-white/10 text-lime-300 hover:bg-white/10'
            }`}
          >
            {linkCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {linkCopied ? 'Copied!' : 'Copy Test Link'}
          </button>
          <button
            onClick={exportCSV}
            disabled={!submissions?.length}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-lime-300" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">{stat.label}</span>
                <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lime-300">
                <Icon className="w-5 h-5" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-lime-300" />
            Score Distribution
          </h3>
          <GlassCard className="p-6 h-56 flex items-end">
            {submissions?.length > 0 ? renderScoreChart() : (
              <div className="w-full text-center text-xs text-zinc-500">No attempts recorded yet.</div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            Question Difficulty (Mistake Rate)
          </h3>
          <GlassCard className="p-6 h-56 overflow-y-auto space-y-3">
            {questionHeatmap?.length > 0 ? (
              questionHeatmap
                .slice()
                .sort((a, b) => b.wrongRate - a.wrongRate)
                .map((q) => (
                  <div key={q.questionIndex} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-300 truncate max-w-[70%]">Q{q.questionIndex + 1}: {q.questionText.slice(0, 50)}...</span>
                      <span className={`font-bold font-mono ml-2 flex-shrink-0 ${q.wrongRate >= 60 ? 'text-rose-400' : q.wrongRate >= 30 ? 'text-amber-400' : 'text-lime-300'}`}>
                        {q.wrongRate}% wrong
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${q.wrongRate >= 60 ? 'bg-rose-500' : q.wrongRate >= 30 ? 'bg-amber-400' : 'bg-lime-300'}`}
                        style={{ width: `${q.wrongRate}%` }}
                      />
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center text-xs text-zinc-500 py-6">No attempt data available.</div>
            )}
          </GlassCard>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-lime-300" />
          Candidate Attempt Roster
          <span className="text-xs text-zinc-500 font-normal font-mono ml-1">({submissions?.length || 0} attempts recorded)</span>
        </h3>

        <GlassCard className="p-0 overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181818] text-zinc-400 uppercase tracking-wider text-[10px] border-b border-white/10 font-semibold">
                <tr>
                  <th className="py-4 px-5">Candidate</th>
                  <th className="py-4 px-5">Email / ID</th>
                  <th className="py-4 px-5 text-center">Score</th>
                  <th className="py-4 px-5 text-center">Accuracy</th>
                  <th className="py-4 px-5 text-center">Time Taken</th>
                  <th className="py-4 px-5">Submitted At</th>
                  <th className="py-4 px-5 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions?.length > 0 ? submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 font-semibold text-white">{sub.username}</td>
                    <td className="py-4 px-5 text-zinc-400 font-mono text-[11px]">{sub.userEmail || sub.userId}</td>
                    <td className="py-4 px-5 text-center font-bold text-zinc-300">
                      {sub.score}/{sub.totalQuestions}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`font-bold font-mono text-sm ${sub.accuracy >= 80 ? 'text-lime-300' : sub.accuracy >= 60 ? 'text-amber-300' : 'text-rose-400'}`}>
                        {sub.accuracy}%
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center font-mono text-zinc-300">{formatTime(sub.timeSpent)}</td>
                    <td className="py-4 px-5 text-zinc-500 font-mono text-[11px]">
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-center">
                      {sub.accuracy >= 60 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-lime-300 bg-lime-300/10 border border-lime-300/25 px-2.5 py-0.5 rounded-full font-bold">
                          <CheckCircle className="w-3 h-3" /> Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full font-bold">
                          <XCircle className="w-3 h-3" /> Fail
                        </span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                      No candidates have attempted this test yet. Share the link to get started!
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
