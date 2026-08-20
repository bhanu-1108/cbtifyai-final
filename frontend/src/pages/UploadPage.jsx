import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Play, 
  AlertCircle, 
  FileCheck, 
  RotateCw, 
  Link2, 
  Copy, 
  CheckCheck,
  Timer,
  Sparkles
} from 'lucide-react';
import GlassCard from '../components/GlassCard';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const UploadPage = () => {
  const { uploadDocument, uploadGeneratedTest, currentUser } = useApp();
  const navigate = useNavigate();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversionStatus, setConversionStatus] = useState(''); // 'uploading', 'processing', 'generating', 'ready', 'error'
  const [generatedTestId, setGeneratedTestId] = useState(null);
  const [conversionError, setConversionError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef(null);

  // Live timer during processing
  useEffect(() => {
    if (['uploading', 'processing', 'generating'].includes(conversionStatus)) {
      setElapsedSeconds(0);
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(((Date.now() - startTime) / 1000).toFixed(1));
      }, 100);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [conversionStatus]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setSelectedFile({ name: file.name, size: `${sizeMB} MB` });
    setConversionError('');

    const formData = new FormData();
    formData.append('file', file);
    if (currentUser?.id) {
      formData.append('createdBy', currentUser.id);
    }
    if (currentUser?.username) {
      formData.append('username', currentUser.username);
    }

    try {
      setConversionStatus('uploading');
      
      const responsePromise = fetch(`${apiBaseUrl}/api/convert-to-cbt`, {
        method: 'POST',
        body: formData,
      });

      // Quick visual stage transitions based on response progress
      const timer = setTimeout(() => {
        setConversionStatus('processing');
      }, 300);

      const genTimer = setTimeout(() => {
        setConversionStatus('generating');
      }, 1200);

      const response = await responsePromise;
      clearTimeout(timer);
      clearTimeout(genTimer);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed.');
      }

      setConversionStatus('generating');
      const testId = uploadGeneratedTest(file.name, `${sizeMB} MB`, data.test);

      setGeneratedTestId(testId);
      setConversionStatus('ready');
    } catch (error) {
      console.error(error);
      setConversionStatus('error');
      setConversionError(error.message || 'Could not convert this file. Please try again.');
    }
  };

  const copyTestLink = () => {
    const link = `${window.location.origin}/test/${generatedTestId}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setConversionStatus('');
    setGeneratedTestId(null);
    setConversionError('');
    setLinkCopied(false);
    setElapsedSeconds(0);
  };

  const selectMockFile = (name) => {
    setSelectedFile({ name, size: '1.2 MB' });
    setConversionError('');
    uploadDocument(name, '1.2 MB', (status, testId) => {
      setConversionStatus(status);
      if (status === 'ready' && testId) {
        setGeneratedTestId(testId);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#f7f7f4]">
            {currentUser?.role === 'organization' ? 'Create Computer-Based Assessment' : 'AI Assessment Generator'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Upload PDF notes, textbooks, or image documents to extract text and synthesize interactive CBT assessments with Qwen AI.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-white/5 border border-white/10 px-4 py-2 rounded-full self-start md:self-auto font-mono">
          <Sparkles className="w-3.5 h-3.5 text-lime-300" />
          <span>High-Speed AI Pipeline</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-200 relative ${
                dragActive
                  ? 'border-lime-300 bg-lime-300/10 scale-[1.01]'
                  : 'border-white/15 bg-[#141414] hover:border-white/25'
              }`}
            >
              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
              />
              <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <UploadCloud className="w-8 h-8 text-lime-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Drag and drop your document here</h3>
                  <p className="text-xs text-zinc-400 mt-1">or click to browse your files</p>
                </div>
                <div className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                  Supported formats: PDF, JPG, PNG, JPEG (up to 50MB). Automated OCR text processing with PaddleOCR and PyMuPDF.
                </div>
              </label>
            </div>
          ) : (
            <GlassCard className="p-7 space-y-7">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#1c1c1c] border border-white/10">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileText className="w-6 h-6 text-lime-300 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-semibold text-white truncate">{selectedFile.name}</h4>
                    <span className="text-xs text-zinc-500 font-mono">{selectedFile.size}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {['uploading', 'processing', 'generating'].includes(conversionStatus) && (
                    <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5 text-lime-300 animate-spin" />
                      {elapsedSeconds}s
                    </span>
                  )}
                  <div className="text-xs font-bold uppercase text-lime-300 font-mono">
                    {conversionStatus === 'ready' ? 'Complete' : conversionStatus === 'error' ? 'Failed' : 'Processing'}
                  </div>
                </div>
              </div>

              {conversionError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{conversionError}</span>
                </div>
              )}

              {/* Step Checklist */}
              <div className="space-y-5 relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                <div className="relative">
                  <div className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    conversionStatus === 'uploading' ? 'bg-lime-300/20 border-lime-300 text-lime-300 animate-pulse' : 'bg-lime-300/20 border-lime-300 text-lime-300'
                  }`}>
                    {conversionStatus === 'uploading' ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Uploading Document</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Sending document to backend pipeline...</p>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    conversionStatus === 'uploading' ? 'bg-white/5 border-white/10 text-zinc-500' :
                    conversionStatus === 'processing' ? 'bg-lime-300/20 border-lime-300 text-lime-300 animate-pulse' :
                    'bg-lime-300/20 border-lime-300 text-lime-300'
                  }`}>
                    {conversionStatus === 'uploading' ? '2' :
                     conversionStatus === 'processing' ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> :
                     <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${conversionStatus === 'uploading' ? 'text-zinc-500' : 'text-white'}`}>Layout &amp; Text Extraction</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Extracting passages, diagrams, and math formulas with PaddleOCR.</p>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    (conversionStatus === 'uploading' || conversionStatus === 'processing') ? 'bg-white/5 border-white/10 text-zinc-500' :
                    conversionStatus === 'generating' ? 'bg-lime-300/20 border-lime-300 text-lime-300 animate-pulse' :
                    'bg-lime-300/20 border-lime-300 text-lime-300'
                  }`}>
                    {(conversionStatus === 'uploading' || conversionStatus === 'processing') ? '3' :
                     conversionStatus === 'generating' ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> :
                     <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${(conversionStatus === 'uploading' || conversionStatus === 'processing') ? 'text-zinc-500' : 'text-white'}`}>Qwen AI Question Synthesis</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Synthesizing multiple choice questions, options, and explanations in parallel.</p>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    conversionStatus !== 'ready' ? 'bg-white/5 border-white/10 text-zinc-500' : 'bg-lime-300/20 border-lime-300 text-lime-300'
                  }`}>
                    {conversionStatus !== 'ready' ? '4' : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${conversionStatus !== 'ready' ? 'text-zinc-500' : 'text-white'}`}>Assessment Ready</h5>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {currentUser?.role === 'organization'
                        ? 'Assessment link is active and stored in MongoDB Atlas.'
                        : 'Your exam is generated. You can begin immediately!'}
                    </p>
                  </div>
                </div>
              </div>

              {conversionStatus === 'ready' && (
                <div className="pt-4 border-t border-white/10 space-y-4">
                  {currentUser?.role === 'organization' ? (
                    <>
                      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#1c1c1c] border border-white/10">
                        <Link2 className="w-4 h-4 text-lime-300 flex-shrink-0" />
                        <span className="text-xs text-zinc-300 font-mono truncate flex-1">
                          {window.location.origin}/test/{generatedTestId}
                        </span>
                        <button
                          onClick={copyTestLink}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                            linkCopied
                              ? 'bg-lime-300 text-zinc-950 font-bold'
                              : 'bg-white/5 border border-white/10 text-lime-300 hover:bg-white/10'
                          }`}
                        >
                          {linkCopied ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          onClick={copyTestLink}
                          className="w-full sm:flex-1 py-3.5 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 transition-all flex items-center justify-center space-x-2 shadow-md"
                        >
                          {linkCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{linkCopied ? 'Link Copied!' : 'Copy Shareable Link'}</span>
                        </button>

                        <button
                          onClick={() => navigate(`/test/${generatedTestId}`)}
                          className="w-full sm:flex-1 py-3.5 rounded-full bg-white/5 border border-white/15 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Preview Exam</span>
                        </button>

                        <button
                          onClick={resetForm}
                          className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-all"
                        >
                          Convert Another
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          onClick={() => navigate(`/test/${generatedTestId}`)}
                          className="w-full sm:flex-1 py-3.5 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold hover:bg-lime-200 transition-all flex items-center justify-center space-x-2 shadow-md"
                        >
                          <Play className="w-4 h-4 fill-zinc-950" />
                          <span>Start Exam Now</span>
                        </button>
                        <button
                          onClick={resetForm}
                          className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-all"
                        >
                          Convert Another
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Sidebar Presets */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Quick Sample Presets</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select a pre-loaded sample document to test the AI question generation immediately:
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { filename: 'sst_indian_history_national_movement.pdf', size: '1.2 MB', label: 'Social Studies & Indian History' },
              { filename: 'world_geography_climate_zones.pdf', size: '1.1 MB', label: 'Geography & Climate Zones' },
              { filename: 'physics_mechanics_lecture_notes.pdf', size: '1.2 MB', label: 'Physics mechanics' },
              { filename: 'ai_governance_framework_draft.pdf', size: '2.5 MB', label: 'AI ethics & governance' },
            ].map((mock) => (
              <button
                key={mock.filename}
                disabled={!!selectedFile}
                onClick={() => selectMockFile(mock.filename)}
                className="w-full p-4 rounded-2xl bg-[#141414] border border-white/10 hover:border-lime-300/40 hover:bg-white/5 transition-all text-left flex items-start space-x-3 group disabled:opacity-50"
              >
                <FileCheck className="w-5 h-5 text-lime-300 flex-shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate">{mock.filename}</h4>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">Topic: {mock.label} ({mock.size})</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
