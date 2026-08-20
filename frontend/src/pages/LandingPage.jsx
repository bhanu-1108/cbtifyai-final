import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, CheckCircle2, Sparkles, UploadCloud, Cpu, Trophy, BarChart3, ShieldCheck } from 'lucide-react';

const CourseCard = ({ title, description, tone, className = "" }) => (
  <article className={`absolute w-60 rounded-[1.8rem] border border-white/25 p-5 text-slate-950 shadow-2xl transition-transform hover:scale-105 duration-300 ${tone} ${className}`}>
    <span className="grid size-9 place-items-center rounded-full bg-white/70 text-lg font-bold">⌘</span>
    <h3 className="mt-5 text-xl font-bold leading-5 tracking-tight">{title}</h3>
    <p className="mt-4 text-xs font-medium leading-5 opacity-75">{description}</p>
    <Link to="/upload" className="mt-5 inline-block rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors">
      Explore
    </Link>
  </article>
);

const steps = [
  ["01", "Upload your material", "Drop in a PDF, image, or question bank. CBTify keeps every source neatly organized."],
  ["02", "AI extracts questions", "Our AI reads the content with OCR, identifies questions, and structures them in seconds."],
  ["03", "Build your CBT exam", "Choose questions, set duration and pass rules, and create a focused online assessment."],
  ["04", "Students take the test", "Share one secure link. Learners complete their exam in a distraction-free space."],
  ["05", "See what to improve", "Get instant results, mistake reviews, and rank insights that reveal learning growth."],
];

const commitments = [
  ["Clear learning feedback", "Give every learner a useful explanation—not just a score—so they know exactly what to improve next."],
  ["Confident, secure assessment", "Create focused testing experiences with the controls educators need and the simplicity students expect."],
  ["Less admin, more teaching", "Turn existing notes and materials into ready-to-use assessments without hours of manual setup."],
];

const LandingPage = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    }, 1000);
  };

  return (
    <main id="home" className="min-h-screen overflow-hidden bg-[#101010] text-[#f7f7f4] selection:bg-lime-300 selection:text-black">
      {/* HERO SECTION */}
      <section className="relative mx-auto min-h-[calc(100vh-5rem)] max-w-[1600px] px-6 pb-20 pt-28 sm:px-12 lg:px-20 lg:pt-36">
        {/* Subtle background radial glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(190,242,100,0.12),transparent_60%)]" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <h1 className="max-w-4xl text-[clamp(4rem,9vw,9.5rem)] font-medium leading-[0.84] tracking-[-0.075em] text-[#f7f7f4]">
            Learn.<br />Assess.<br /><span className="text-lime-300">Excel.</span>
          </h1>

          <div className="flex max-w-xl flex-col justify-center lg:pt-6">
            <p className="max-w-md text-lg leading-8 text-zinc-400 sm:text-xl font-normal">
              Convert notes, textbooks, and images into interactive Computer-Based Tests with AI in seconds. Guide every learner with precision analytics.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={currentUser ? "/upload" : "/register"}
                className="rounded-full bg-lime-300 px-8 py-4 text-base font-bold text-zinc-950 transition-all hover:-translate-y-1 hover:bg-lime-200 shadow-glowLime"
              >
                Start now
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-white/15 px-6 py-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/35 hover:bg-white/5"
              >
                See how it works
              </a>
            </div>

            {/* Micro Feature Badges */}
            <div className="mt-10 flex flex-wrap items-center gap-6 pt-6 border-t border-white/10 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-lime-300" />
                PaddleOCR & PDF Extraction
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-lime-300" />
                Qwen AI Question Engine
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-lime-300" />
                Timed Exam
              </span>
            </div>
          </div>
        </div>

        {/* Floating cards & Glowing concentric radar orb */}
        <div className="relative z-10 mt-14 h-[410px] sm:mt-10 lg:h-[430px]">
          {/* Concentric Glowing Radar Orb */}
          <div className="absolute left-1/2 top-0 grid size-72 -translate-x-1/2 place-items-center rounded-full border border-lime-300/30 bg-[radial-gradient(circle_at_50%_45%,rgba(190,242,100,0.35),rgba(30,33,22,0.75)_35%,rgba(17,17,17,0)_70%)] shadow-[0_0_100px_rgba(190,242,100,0.12)] sm:size-80 lg:left-[59%] lg:size-96">
            <div className="grid size-[72%] place-items-center rounded-full border border-white/10 bg-zinc-900/70 shadow-[inset_0_0_45px_rgba(190,242,100,0.15)]">
              <div className="grid size-[55%] place-items-center rounded-full border border-lime-300/50 bg-black/50">
                <span className="size-5 rounded-full bg-lime-300 shadow-[0_0_30px_12px_rgba(190,242,100,0.55)]" />
              </div>
            </div>
          </div>

          {/* Floating Course/Feature Cards */}
          <CourseCard
            title="Exam Essentials"
            description="Build clear, thoughtful assessments designed around your learning goals."
            tone="bg-rose-300"
            className="-left-6 top-36 -rotate-[14deg] sm:left-2 lg:left-0"
          />
          <CourseCard
            title="Learning Insights"
            description="Understand student performance at a glance and help every learner move forward."
            tone="bg-cyan-300"
            className="left-28 top-44 rotate-[-2deg] sm:left-56 lg:left-[17%]"
          />
          <CourseCard
            title="Strategic Practice"
            description="Shape focused study plans using AI-powered error tagging that actually makes sense."
            tone="bg-zinc-100"
            className="left-[50%] top-52 rotate-[11deg] sm:left-[53%] lg:left-[36%]"
          />
        </div>
      </section>

      {/* HOW IT WORKS / THE PROCESS */}
      <section id="how-it-works" className="relative border-y border-white/5 bg-[#0c0c0c] px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="relative mx-auto max-w-[1600px]">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-lime-300">The process</p>
              <h2 className="max-w-3xl text-5xl font-medium leading-[0.94] tracking-[-0.06em] text-[#f7f7f4] sm:text-7xl">
                Five small steps.<br />One better learning loop.
              </h2>
            </div>
            <p className="max-w-md text-lg leading-8 text-zinc-400 lg:justify-self-end">
              A clear path from raw documents to actionable assessment and rich feedback—built to save educators hours of prep.
            </p>
          </div>

          <div className="mt-20 grid border-t border-white/15 sm:grid-cols-2 xl:grid-cols-5">
            {steps.map(([number, title, description]) => (
              <article key={number} className="group relative min-h-64 border-b border-white/10 px-0 py-8 sm:px-6 xl:border-b-0 xl:border-r xl:px-7 xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0">
                <span className="absolute -top-1.5 left-0 size-3 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(190,242,100,0.7)] sm:left-6 xl:first:left-0" />
                <p className="text-xs font-bold tracking-[0.2em] text-zinc-500">{number}</p>
                <h3 className="mt-12 max-w-48 text-2xl font-medium leading-7 tracking-[-0.045em] text-white transition-colors group-hover:text-lime-300">
                  {title}
                </h3>
                <p className="mt-5 max-w-56 text-sm leading-6 text-zinc-400 font-normal">
                  {description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/upload"
              className="inline-flex items-center gap-3 rounded-full bg-white/5 border border-white/15 px-8 py-4 text-sm font-semibold text-white hover:border-lime-300/50 hover:bg-lime-300/10 hover:text-lime-300 transition-all"
            >
              Try Uploading a File Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT CBTIFY */}
      <section id="about" className="relative overflow-hidden bg-[#101010] px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="pointer-events-none absolute -right-48 top-24 size-[34rem] rounded-full bg-lime-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-[1600px]">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-300">About CBTify</p>
            <h2 className="max-w-5xl text-5xl font-medium leading-[0.94] tracking-[-0.06em] text-[#f7f7f4] sm:text-7xl">
              Good assessment should feel like part of learning—not the end of it.
            </h2>
          </div>

          <div className="mt-24 grid gap-16 border-t border-white/15 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <div>
              <p className="max-w-md text-2xl leading-9 tracking-[-0.035em] text-zinc-300">
                We make it effortless for educators and institutions to create moments of practice, reflection, and progress from the material they already have.
              </p>
              <div className="mt-14 flex gap-12 border-l-2 border-lime-300 pl-5">
                <div>
                  <p className="text-3xl font-medium tracking-[-0.06em] text-white">One place</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-500 font-semibold">For every assessment</p>
                </div>
                <div>
                  <p className="text-3xl font-medium tracking-[-0.06em] text-lime-300">Less busywork</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-500 font-semibold">More teaching time</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">What we care about</p>
              <div className="mt-6 border-t border-white/10">
                {commitments.map(([title, description], index) => (
                  <div key={title} className="grid gap-4 border-b border-white/10 py-7 sm:grid-cols-[3.5rem_1fr]">
                    <span className="text-sm font-bold text-lime-300">0{index + 1}</span>
                    <div>
                      <h4 className="text-xl font-medium tracking-[-0.035em] text-white">{title}</h4>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400 font-normal">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / GET IN TOUCH */}
      <section id="contact" className="relative overflow-hidden border-t border-white/10 bg-[#0c0c0c] px-6 py-24 sm:px-12 lg:px-20 lg:py-32">
        <div className="pointer-events-none absolute -bottom-72 left-1/2 size-[48rem] -translate-x-1/2 rounded-full bg-lime-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-[1600px]">
          <div className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-24">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-lime-300">Get in touch</p>
              <h2 className="max-w-3xl text-5xl font-medium leading-[0.94] tracking-[-0.06em] text-[#f7f7f4] sm:text-7xl">
                Let’s make learning easier to measure.
              </h2>
              <p className="mt-8 max-w-lg text-lg leading-8 text-zinc-400">
                Have a question, a partnership idea, or want a custom deployment for your institution? We would love to hear from you.
              </p>
              <div className="mt-14 flex flex-wrap gap-x-10 gap-y-6 border-t border-white/10 pt-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">Email us</p>
                  <a className="mt-2 block text-base text-zinc-200 transition-colors hover:text-lime-300" href="mailto:hello@cbtify.ai">
                    hello@cbtify.ai
                  </a>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">Response time</p>
                  <p className="mt-2 text-base text-zinc-200">Within 1–2 business days</p>
                </div>
              </div>
            </div>

            <div>
              {submitted && (
                <div className="mb-6 p-4 rounded-2xl bg-lime-300/15 border border-lime-300/30 text-lime-300 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Thank you! Your message has been sent successfully.
                </div>
              )}
              <form className="border-t border-white/15 pt-2" onSubmit={handleContactSubmit}>
                <label className="block border-b border-white/15 pb-5">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Your name</span>
                  <input
                    className="mt-4 w-full bg-transparent text-xl text-white outline-none placeholder:text-zinc-700"
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="What should we call you?"
                    required
                  />
                </label>
                <label className="mt-7 block border-b border-white/15 pb-5">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Email address</span>
                  <input
                    className="mt-4 w-full bg-transparent text-xl text-white outline-none placeholder:text-zinc-700"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label className="mt-7 block border-b border-white/15 pb-5">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Message</span>
                  <textarea
                    className="mt-4 min-h-28 w-full resize-none bg-transparent text-xl text-white outline-none placeholder:text-zinc-700"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us a little about what you need."
                    rows={3}
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-8 inline-flex items-center gap-3 rounded-full bg-lime-300 px-7 py-4 text-sm font-bold text-zinc-950 transition-all hover:-translate-y-1 hover:bg-lime-200 shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send message'} <span aria-hidden="true">↗</span>
                </button>
              </form>
            </div>
          </div>

          <div className="mt-24 flex flex-col gap-5 border-t border-white/10 pt-7 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 CBTify.ai. Built for smarter assessment.</span>
            <a href="#home" className="transition-colors hover:text-lime-300">
              Back to top ↑
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
