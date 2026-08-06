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
    submitTest(test.id, answers, timeSpent);
    navigate('/analytics');
  };

  if (loadingTest || !test || !test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-accentBlue border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-mutedGray">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  const answeredCount = answers.filter(a => a !== -1).length;
  const currentQuestion = test.questions[currentIdx] || test.questions[0];

  return (
    <div className="min-h-screen bg-darkBg text-white flex flex-col">
      <div className="h-16 border-b border-white/10 bg-darkSec/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> SECURE BROWSER ACTIVE
          </span>
          <span className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-md">{test.title}</span>
        </div>
        
        <div className="flex items-center space-x-2.5 bg-white/5 border border-white/10 px-4 py-1.5 rounded-lg text-sm font-mono font-bold text-accentBlue">
          <Clock className="w-4 h-4 text-cyanAccent animate-pulse" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 md:p-8 gap-8">
        <div className="flex-1 space-y-6">
          <GlassCard glowColor="blue" className="p-6 md:p-8 space-y-6 relative min-h-[300px]">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-white/10">
              <span className="font-bold text-accentBlue">QUESTION {currentIdx + 1} OF {test.questions.length}</span>
              <button
                onClick={toggleReview}
                className={`px-3 py-1 rounded border transition-colors ${
                  markedForReview[currentIdx]
                    ? 'bg-purpleGlow/20 border-purpleGlow text-purpleGlow'
                    : 'bg-white/5 border-white/10 text-mutedGray hover:text-white'
                }`}
              >
                {markedForReview[currentIdx] ? '★ Marked for Review' : '☆ Mark for Review'}
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = answers[currentIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => selectOption(optIdx)}
                    className={`w-full p-4 rounded-xl border text-left text-xs font-medium transition-all flex items-center ${
                      isSelected 
                        ? 'bg-accentBlue/10 border-accentBlue text-accentBlue shadow-glowBlue' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full border text-center leading-6 mr-3 font-semibold transition-all ${
                      isSelected 
                        ? 'bg-accentBlue text-white border-accentBlue' 
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>
            
            {currentIdx === test.questions.length - 1 ? (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-xs font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Submit Exam</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full md:w-64 space-y-6">
          <GlassCard glowColor="purple" className="p-5 space-y-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Question Navigation</h3>
            
            <div className="grid grid-cols-5 gap-2.5">
              {test.questions.map((_, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = answers[idx] !== -1;
                const isMarked = markedForReview[idx];

                let bgClass = 'bg-white/5 border-white/10 text-slate-400';
                if (isCurrent) {
                  bgClass = 'bg-accentBlue border-accentBlue text-white shadow-glowBlue';
                } else if (isMarked) {
                  bgClass = 'bg-purpleGlow/30 border-purpleGlow text-purpleGlow';
                } else if (isAnswered) {
                  bgClass = 'bg-accentBlue/20 border-accentBlue/30 text-accentBlue';
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

            <div className="space-y-2 text-[10px] text-mutedGray pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-accentBlue/25 border border-accentBlue/30 block"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-purpleGlow/30 border border-purpleGlow block"></span>
                <span>Marked for review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-white/5 border border-white/10 block"></span>
                <span>Unattempted</span>
              </div>
            </div>
          </GlassCard>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full py-3.5 rounded-24px bg-gradient-to-r from-accentBlue to-purpleGlow text-white text-xs font-semibold hover:scale-105 active:scale-95 transition-all shadow-glowBlue"
          >
            Submit Entire Attempt
          </button>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-darkSec border border-white/10 rounded-24px p-6 space-y-6 shadow-2xl">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-accentBlue/10 border border-accentBlue/20 flex items-center justify-center mx-auto text-accentBlue">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Submit practice test?</h3>
              <p className="text-xs text-mutedGray leading-relaxed">
                You have answered <strong className="text-white">{answeredCount}</strong> out of <strong className="text-white">{test.questions.length}</strong> questions.
              </p>
            </div>

            {answeredCount < test.questions.length && (
              <div className="p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[11px] leading-relaxed flex items-start">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mr-2" />
                <span>Warning: You have unanswered questions remaining. If you submit, they will be marked incorrect.</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors text-white"
              >
                Go back
              </button>
              <button
                onClick={triggerSubmission}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-xs font-bold hover:scale-102 active:scale-98 transition-transform text-white shadow-lg"
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
