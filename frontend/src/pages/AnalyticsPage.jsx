import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  Clock, 
  Trophy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const AnalyticsPage = () => {
  const { currentUser, tests, submissions, getAnalytics } = useApp();
  const userSubmissions = submissions.filter(s => s.userId === (currentUser?.id || 'student-1'));
  const analytics = getAnalytics();
  const [expandedSubId, setExpandedSubId] = useState(null);

  const toggleExpand = (subId) => {
    setExpandedSubId(expandedSubId === subId ? null : subId);
  };

  const renderTrendLine = () => {
    const trend = analytics.accuracyTrend;
    if (trend.length === 0) return null;

    const width = 500;
    const height = 150;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;
    
    const points = trend.map((val, idx) => {
      const x = paddingLeft + (trend.length > 1 ? (idx / (trend.length - 1)) * chartWidth : chartWidth / 2);
      const y = paddingTop + chartHeight - (val.accuracy / 100) * chartHeight;
      return { x, y, val };
    });

    let pathD = '';
    points.forEach((pt, idx) => {
      if (idx === 0) {
        pathD = `M ${pt.x} ${pt.y}`;
      } else {
        const prevPt = points[idx - 1];
        const cpX1 = prevPt.x + (pt.x - prevPt.x) / 2;
        const cpY1 = prevPt.y;
        const cpX2 = prevPt.x + (pt.x - prevPt.x) / 2;
        const cpY2 = pt.y;
        pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`;
      }
    });

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = paddingTop + chartHeight - (tick / 100) * chartHeight;
          return (
            <g key={tick}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={paddingLeft - 10} y={y + 4} fill="#71717a" fontSize="9" textAnchor="end">{tick}%</text>
            </g>
          );
        })}

        {points.map((pt, idx) => (
          <text key={idx} x={pt.x} y={height - 10} fill="#a1a1aa" fontSize="8" textAnchor="middle">
            {pt.val.date}
          </text>
        ))}

        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#bef264"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {points.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt.x} cy={pt.y} r="4.5" fill="#101010" stroke="#bef264" strokeWidth="2.5" />
            <title>{`${pt.val.title}: ${pt.val.accuracy}%`}</title>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto pb-12">
      <div className="pb-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#f7f7f4]">Performance Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review detailed insights into your assessment accuracy, weak areas, and question-level history.
          </p>
        </div>
        <span className="text-xs text-zinc-950 font-bold bg-lime-300 px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-zinc-950" /> Grade: Master
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-lime-300" />
            <span>Accuracy Timeline</span>
          </h3>
          <GlassCard className="p-6 h-64 flex items-center justify-center">
            {userSubmissions.length > 0 ? (
              renderTrendLine()
            ) : (
              <div className="text-xs text-zinc-500 text-center">No exam attempts recorded yet.</div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-lime-300" />
            <span>Subject Accuracy</span>
          </h3>
          <GlassCard className="p-6 space-y-4 justify-center flex flex-col h-64">
            {Object.entries(analytics.subjectAnalysis).map(([subject, val]) => (
              <div key={subject} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-300">{subject}</span>
                  <span className="text-lime-300 font-mono">{val}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className="bg-lime-300 h-full rounded-full" 
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-lime-300" />
            <span>14-Day Activity Heatmap</span>
          </h3>
          <GlassCard className="p-5 flex flex-col justify-center h-48">
            <div className="grid grid-cols-7 gap-2 max-w-sm mx-auto w-full">
              {analytics.mistakeHeatmap.map((day) => {
                let colorClass = 'bg-[#181818] border-white/5 text-zinc-600';
                if (day.count === 1) colorClass = 'bg-lime-300/20 border-lime-300/40 text-lime-300';
                else if (day.count >= 2) colorClass = 'bg-lime-300 text-zinc-950 font-black';

                return (
                  <div
                    key={day.date}
                    className={`w-9 h-9 rounded-xl border text-[9px] font-bold flex flex-col items-center justify-center font-mono transition-all ${colorClass}`}
                  >
                    <span>{day.label.split(' ')[1]}</span>
                    {day.count > 0 && <span className="text-[8px] opacity-80 mt-0.5">{day.count}x</span>}
                  </div>
                );
              })}
            </div>
            <div className="text-[11px] text-zinc-500 text-center mt-3">Lime indicates exam attempts on that day.</div>
          </GlassCard>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Weak Topics (Mistake Review)</span>
          </h3>
          <GlassCard className="p-5 space-y-3 h-48 overflow-y-auto">
            {analytics.weakTopics.map((topic) => (
              <div key={topic.topic} className="flex justify-between items-center text-xs">
                <span className="text-zinc-300 font-medium truncate max-w-[180px]">{topic.topic}</span>
                <span className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold px-2 py-0.5 rounded-full">
                  {topic.mistakesCount} mistakes
                </span>
              </div>
            ))}
          </GlassCard>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-lime-300" />
            <span>Mastered Topics</span>
          </h3>
          <GlassCard className="p-5 space-y-3 h-48 overflow-y-auto">
            {analytics.strongTopics.map((topic) => (
              <div key={topic} className="flex items-center text-xs text-zinc-300 gap-2.5">
                <CheckCircle className="w-4 h-4 text-lime-300 flex-shrink-0" />
                <span className="font-semibold truncate">{topic}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Exam Attempt History</h3>
        
        <div className="space-y-3">
          {userSubmissions.map((sub) => {
            const isExpanded = expandedSubId === sub.id;
            return (
              <GlassCard key={sub.id} className="p-0 overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
                <div
                  onClick={() => toggleExpand(sub.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02]"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{sub.testTitle}</h4>
                    <p className="text-xs text-zinc-500 font-mono">Attempted on: {new Date(sub.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <span className="block text-[10px] text-zinc-500 font-mono">ACCURACY</span>
                      <span className={`text-sm font-bold font-mono ${sub.accuracy >= 80 ? 'text-lime-300' : sub.accuracy >= 60 ? 'text-amber-300' : 'text-rose-400'}`}>
                        {sub.accuracy}% ({sub.score}/{sub.totalQuestions})
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </div>
                </div>

                {isExpanded && (() => {
                  const testObj = tests.find(t => t.id === sub.testId);
                  const questionsList = sub.questions && sub.questions.length > 0 ? sub.questions : (testObj?.questions || []);

                  return (
                    <div className="px-5 pb-6 pt-2 border-t border-white/10 bg-[#101010] space-y-4">
                      <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pt-2">Question Breakdown &amp; Explanations</h5>
                      
                      <div className="space-y-3">
                        {sub.questionStatus.map((status, qIdx) => {
                          const qData = questionsList[qIdx];
                          const questionText = qData?.questionText || qData?.question || `Question ${qIdx + 1}`;
                          const explanation = qData?.explanation || 'No detailed explanation provided for this question.';
                          const userAns = sub.answers ? sub.answers[qIdx] : -1;
                          const options = qData?.options || [];

                          return (
                            <div key={qIdx} className="p-4 rounded-xl bg-[#181818] border border-white/10 space-y-3">
                              <div className="flex items-start justify-between text-xs pb-2 border-b border-white/5 font-mono">
                                <span className="font-bold text-zinc-400">Question {qIdx + 1}</span>
                                {status === 'correct' ? (
                                  <span className="text-lime-300 flex items-center gap-1 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Correct</span>
                                ) : status === 'wrong' ? (
                                  <span className="text-rose-400 flex items-center gap-1 font-semibold"><XCircle className="w-3.5 h-3.5" /> Incorrect</span>
                                ) : (
                                  <span className="text-amber-400 flex items-center gap-1 font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Unanswered</span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-white leading-relaxed pt-1">
                                {questionText}
                              </p>
                              
                              {options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {options.map((opt, optIdx) => {
                                    const isUserChoice = userAns === optIdx;
                                    const isCorrectOpt = qData?.correctAnswer === optIdx;
                                    
                                    let badgeStyle = 'bg-[#121212] border-white/5 text-zinc-400';
                                    if (isCorrectOpt) {
                                      badgeStyle = 'bg-lime-300/10 border-lime-300/30 text-lime-300 font-semibold';
                                    } else if (isUserChoice && !isCorrectOpt) {
                                      badgeStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-semibold line-through';
                                    }

                                    return (
                                      <div key={optIdx} className={`p-2.5 rounded-lg border flex items-center justify-between ${badgeStyle}`}>
                                        <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                        {isUserChoice && (
                                          <span className="text-[9px] px-2 py-0.5 rounded bg-black/40 border border-current font-mono">Your Ans</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="text-xs bg-[#121212] p-3 rounded-lg border border-white/5 leading-relaxed">
                                <span className="text-lime-300 font-bold block mb-1">AI Explanation:</span>
                                <span className="text-zinc-300">{explanation}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
