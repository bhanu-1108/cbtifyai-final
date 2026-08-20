import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Clock, ShieldAlert, ChevronLeft, ChevronRight, HelpCircle, CheckCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const TestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tests, submitTest } = useApp();

  const [test, setTest] = useState(() => tests.find(t => t.id === id));
  const [loadingTest, setLoadingTest] = useState(!test);

  useEffect(() => {
    if (test && test.id === id) {
      setLoadingTest(false);
      return;
    }

    const existing = tests.find(t => t.id === id);
    if (existing) {
      setTest(existing);
      setLoadingTest(false);
      return;
    }

    let isMounted = true;
    setLoadingTest(true);
    fetch(`${apiBaseUrl}/api/tests/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted) {
          if (data) {
            setTest(data);
          } else {
            navigate('/dashboard');
          }
          setLoadingTest(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          navigate('/dashboard');
          setLoadingTest(false);
        }
      });

    return () => { isMounted = false; };
  }, [id, navigate]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(() => (test && test.questions ? Array(test.questions.length).fill(-1) : []));
  const [markedForReview, setMarkedForReview] = useState(() => (test && test.questions ? Array(test.questions.length).fill(false) : []));
  const [timeLeft, setTimeLeft] = useState(() => (test ? test.timeLimit * 60 : 600));
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (test && test.questions) {
      setAnswers(Array(test.questions.length).fill(-1));
      setMarkedForReview(Array(test.questions.length).fill(false));
      setTimeLeft(test.timeLimit * 60);
    }
  }, [test?.id]);

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [test?.id]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const selectOption = (optIdx) => {
    const updated = [...answers];
    updated[currentIdx] = optIdx;
    setAnswers(updated);
  };

  const toggleReview = () => {
    const updated = [...markedForReview];
    updated[currentIdx] = !updated[currentIdx];
    setMarkedForReview(updated);
  };

  const handleNext = () => {
    if (currentIdx < test.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleAutoSubmit = () => {
    alert('⏱️ Time has run out! Your exam is being submitted automatically.');
    triggerSubmission();
  };

  const triggerSubmission = () => {
    clearInterval(timerRef.current);
    const timeSpent = (test.timeLimit * 60) - timeLeft;
    submitTest(test.id, answers, timeSpent, test);
    navigate('/analytics');
  };

  if (loadingTest || !test || !test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#101010] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-lime-300 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-medium">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  const answeredCount = answers.filter(a => a !== -1).length;
  const currentQuestion = test.questions[currentIdx] || test.questions[0];

  return (
    <div className="min-h-screen bg-[#101010] text-[#f7f7f4] flex flex-col selection:bg-lime-300 selection:text-black">
      {/* Top Test Header Bar */}
      <div className="h-20 border-b border-white/10 bg-[#121212] px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <span className="text-xs bg-red-500/15 text-red-400 px-3 py-1 rounded-full border border-red-500/25 flex items-center gap-1.5 font-semibold font-mono">
            <ShieldAlert className="w-3.5 h-3.5" /> SECURE EXAM ACTIVE
          </span>
          <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">{test.title}</span>
        </div>
        
        <div className="flex items-center space-x-2 bg-[#1c1c1c] border border-white/10 px-4 py-2 rounded-full text-sm font-mono font-bold text-lime-300">
          <Clock className="w-4 h-4 text-lime-300" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] mx-auto w-full p-4 sm:p-6 md:p-8 gap-8">
        <div className="flex-1 space-y-6">
          <GlassCard className="p-6 md:p-8 space-y-6 relative min-h-[320px]">
            <div className="flex justify-between items-center text-xs pb-4 border-b border-white/10">
              <span className="font-bold text-lime-300 uppercase tracking-widest font-mono">
                QUESTION {currentIdx + 1} OF {test.questions.length}
              </span>
              <button
                onClick={toggleReview}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                  markedForReview[currentIdx]
                    ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {markedForReview[currentIdx] ? '★ Marked for Review' : '☆ Mark for Review'}
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-medium text-white leading-relaxed tracking-tight">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = answers[currentIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => selectOption(optIdx)}
                    className={`w-full p-4 rounded-xl border text-left text-xs font-medium transition-all flex items-center ${
                      isSelected 
                        ? 'bg-lime-300/10 border-lime-300 text-lime-300 font-semibold' 
                        : 'bg-[#181818] border-white/10 text-zinc-300 hover:bg-[#1f1f1f]'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full border text-center leading-7 mr-3.5 text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-lime-300 text-zinc-950 border-lime-300 shadow-sm' 
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1 leading-normal text-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 text-xs font-semibold text-white transition-all flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            {currentIdx === test.questions.length - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-8 py-3 rounded-full bg-lime-300 text-xs font-bold text-zinc-950 hover:bg-lime-200 active:scale-95 transition-all flex items-center gap-2 shadow-md"
              >
                <span>Submit Exam</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all flex items-center gap-2"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="w-full md:w-72 space-y-6">
          <GlassCard className="p-5 space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Question Navigator</h3>
            
            <div className="grid grid-cols-5 gap-2">
              {test.questions.map((_, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = answers[idx] !== -1;
                const isMarked = markedForReview[idx];

                let bgClass = 'bg-[#1a1a1a] border-white/10 text-zinc-400';
                if (isCurrent) {
                  bgClass = 'bg-lime-300 border-lime-300 text-zinc-950 font-bold';
                } else if (isMarked) {
                  bgClass = 'bg-amber-400/25 border-amber-400 text-amber-300 font-bold';
                } else if (isAnswered) {
                  bgClass = 'bg-lime-300/15 border-lime-300/35 text-lime-300 font-bold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${bgClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 text-xs text-zinc-400 pt-4 border-t border-white/10 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-lime-300/20 border border-lime-300/40 block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400/30 border border-amber-400 block" />
                <span>Marked for review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-[#1a1a1a] border border-white/10 block" />
                <span>Unattempted</span>
              </div>
            </div>
          </GlassCard>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full py-3.5 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 active:scale-95 transition-all shadow-md"
          >
            Submit Entire Attempt
          </button>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#151515] border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-lime-300/10 border border-lime-300/30 flex items-center justify-center mx-auto text-lime-300">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Submit practice exam?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                You have answered <strong className="text-lime-300 font-bold">{answeredCount}</strong> out of <strong className="text-white font-bold">{test.questions.length}</strong> questions.
              </p>
            </div>

            {answeredCount < test.questions.length && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Warning: You have unattempted questions. Unanswered questions will be evaluated as incorrect.</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors text-white"
              >
                Go back
              </button>
              <button
                onClick={triggerSubmission}
                className="flex-1 py-3 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 transition-transform shadow-md"
              >
                Yes, Submit Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;
