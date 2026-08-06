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
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={paddingLeft - 10} y={y + 4} fill="#9CA3AF" fontSize="9" textAnchor="end">{tick}%</text>
            </g>
          );
        })}

        {points.map((pt, idx) => (
          <text key={idx} x={pt.x} y={height - 10} fill="#9CA3AF" fontSize="8" textAnchor="middle">
            {pt.val.date}
          </text>
        ))}

        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#glow)"
          />
        )}

        {points.map((pt, idx) => (
          <g key={idx}>
            <circle cx={pt.x} cy={pt.y} r="5" fill="#080B14" stroke="#3B82F6" strokeWidth="2.5" />
            <title>{`${pt.val.title}: ${pt.val.accuracy}%`}</title>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="pb-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Visual Analytics</h1>
          <p className="text-xs text-mutedGray mt-1">
            Deep dive into your strengths, weak concepts, and mistake trends over recent attempts.
          </p>
        </div>
        <span className="text-xs text-accentBlue font-bold bg-accentBlue/10 border border-accentBlue/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Trophy className="w-4 h-4" /> Grade: Master
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-accentBlue" />
            <span>Accuracy Timeline Trend</span>
          </h3>
          <GlassCard glowColor="blue" className="p-6 h-64 flex items-center justify-center">
            {userSubmissions.length > 0 ? (
              renderTrendLine()
            ) : (
              <div className="text-xs text-mutedGray text-center">No submissions recorded yet.</div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-cyanAccent" />
            <span>Subject Analysis</span>
          </h3>
          <GlassCard glowColor="cyan" className="p-6 space-y-4.5 justify-center flex flex-col h-64">
            {Object.entries(analytics.subjectAnalysis).map(([subject, val]) => (
              <div key={subject} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{subject}</span>
                  <span className="text-cyanAccent">{val}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 relative">
                  <div 
                    className="bg-gradient-to-r from-accentBlue to-cyanAccent h-full rounded-full" 
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-purpleGlow" />
            <span>14-Day Practice Heatmap</span>
          </h3>
          <GlassCard glowColor="purple" className="p-5 flex flex-col justify-center h-48">
            <div className="grid grid-cols-7 gap-2.5 max-w-sm mx-auto w-full">
              {analytics.mistakeHeatmap.map((day) => {
                let colorClass = 'bg-white/5 border-white/5';
                if (day.count === 1) colorClass = 'bg-accentBlue/30 border-accentBlue/40 text-accentBlue shadow-glowBlue';
                else if (day.count >= 2) colorClass = 'bg-cyanAccent/50 border-cyanAccent/60 text-white shadow-glowCyan';

                return (
                  <div
                    key={day.date}
                    className={`w-9 h-9 rounded-lg border text-[8px] font-bold flex flex-col items-center justify-center font-mono transition-all ${colorClass}`}
                  >
                    <span>{day.label.split(' ')[1]}</span>
                    {day.count > 0 && <span className="text-[7px] text-white opacity-80 mt-0.5">{day.count}x</span>}
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-mutedGray text-center mt-4 italic">Cyan indicates multiple CBT exams attempted on that date.</div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
            <span>Weak Topics (Mistake Tally)</span>
          </h3>
          <GlassCard glowColor="purple" className="p-5 space-y-3.5 h-48 overflow-y-auto">
            {analytics.weakTopics.map((topic) => (
              <div key={topic.topic} className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold truncate max-w-[180px]">{topic.topic}</span>
                <span className="text-[10px] bg-red-500/25 border border-red-500/30 text-red-400 font-bold px-2 py-0.5 rounded">
                  {topic.mistakesCount} mistakes
                </span>
              </div>
            ))}
          </GlassCard>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-green-400" />
            <span>Strong Topics (Mastered)</span>
          </h3>
          <GlassCard glowColor="green" className="p-5 space-y-3.5 h-48 overflow-y-auto">
            {analytics.strongTopics.map((topic) => (
              <div key={topic} className="flex items-center text-xs text-slate-300 gap-2.5">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="font-semibold truncate">{topic}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historical Assessment Logs</h3>
        
        <div className="space-y-3">
          {userSubmissions.map((sub) => {
            const isExpanded = expandedSubId === sub.id;
            return (
              <GlassCard key={sub.id} glowColor="blue" className="p-0 overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
                <div
                  onClick={() => toggleExpand(sub.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.01]"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{sub.testTitle}</h4>
                    <p className="text-[10px] text-mutedGray font-mono">Attempted on: {new Date(sub.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <span className="block text-[10px] text-mutedGray font-mono">ACCURACY</span>
                      <span className={`text-base font-bold ${sub.accuracy >= 80 ? 'text-green-400' : sub.accuracy >= 60 ? 'text-yellow-500' : 'text-red-400'}`}>
                        {sub.accuracy}% ({sub.score}/{sub.totalQuestions})
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4.5 h-4.5 text-mutedGray" /> : <ChevronDown className="w-4.5 h-4.5 text-mutedGray" />}
                  </div>
                </div>

                {isExpanded && (() => {
                  const testObj = tests.find(t => t.id === sub.testId);
                  const questionsList = sub.questions && sub.questions.length > 0 ? sub.questions : (testObj?.questions || []);

                  return (
                    <div className="px-5 pb-6 pt-2 border-t border-white/5 bg-slate-950/40 space-y-5">
                      <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest pt-2">Detailed Question Audit</h5>
                      
                      <div className="space-y-4">
                        {sub.questionStatus.map((status, qIdx) => {
                          const qData = questionsList[qIdx];
                          const questionText = qData?.questionText || qData?.question || `Question ${qIdx + 1}`;
                          const explanation = qData?.explanation || 'No detailed explanation provided for this question.';
                          const userAns = sub.answers ? sub.answers[qIdx] : -1;
                          const options = qData?.options || [];

                          return (
                            <div key={qIdx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                              <div className="flex items-start justify-between text-[10px] pb-2 border-b border-white/5 font-mono">
                                <span className="font-bold text-slate-400">Question {qIdx + 1}</span>
                                {status === 'correct' ? (
                                  <span className="text-green-400 flex items-center gap-1 font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Correct</span>
                                ) : status === 'wrong' ? (
                                  <span className="text-red-400 flex items-center gap-1 font-semibold"><XCircle className="w-3.5 h-3.5" /> Incorrect</span>
                                ) : (
                                  <span className="text-yellow-500 flex items-center gap-1 font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Unanswered</span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-white leading-relaxed pt-1">
                                {questionText}
                              </p>
                              
                              {options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  {options.map((opt, optIdx) => {
                                    const isUserChoice = userAns === optIdx;
                                    const isCorrectOpt = qData?.correctAnswer === optIdx;
                                    
                                    let badgeStyle = 'bg-white/5 border-white/5 text-slate-400';
                                    if (isCorrectOpt) {
                                      badgeStyle = 'bg-green-500/15 border-green-500/30 text-green-400 font-semibold';
                                    } else if (isUserChoice && !isCorrectOpt) {
                                      badgeStyle = 'bg-red-500/15 border-red-500/30 text-red-400 font-semibold line-through';
                                    }

                                    return (
                                      <div key={optIdx} className={`p-2.5 rounded-lg border flex items-center justify-between ${badgeStyle}`}>
                                        <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                        {isUserChoice && (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-current font-mono">Your Ans</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div className="text-[11px] bg-slate-950/60 p-3 rounded-lg border border-white/5 leading-relaxed">
                                <span className="text-accentBlue font-bold block mb-1">AI Explanation:</span>
                                <span className="text-slate-300">{explanation}</span>
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
