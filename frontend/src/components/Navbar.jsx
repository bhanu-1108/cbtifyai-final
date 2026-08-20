import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Menu, X, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const isOrg = currentUser?.role === 'organization';

  const navLinks = currentUser
    ? (isOrg
        ? [
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Generate CBT Exam', path: '/upload' },
            { name: 'Organization Portal', path: '/organization' }
          ]
        : [
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Upload PDF / Image', path: '/upload' },
            { name: 'Analytics', path: '/analytics' }
          ])
    : [
        { name: 'Home', path: '/#home' },
        { name: 'How it works', path: '/#how-it-works' },
        { name: 'About', path: '/#about' },
        { name: 'Contact', path: '/#contact' }
      ];

  const handleNavClick = (path) => {
    setMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      const elementId = path.substring(2);
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(elementId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/5 bg-[#101010]/90 text-white backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-20 md:h-24 max-w-[1600px] items-center justify-between px-6 sm:px-12 lg:px-20">

        {/* Brand Logo */}
        <Link to="/" className="group flex items-center gap-3" aria-label="CBTify home">
          <span className="text-2xl font-black tracking-[-0.08em] text-white">
            CBTi<span className="text-lime-300"> f y. a i</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-9 text-[15px] font-medium text-zinc-300 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavClick(link.path)}
              className={`transition-colors hover:text-lime-300 ${
                isActive(link.path) ? 'text-lime-300 font-semibold' : 'text-zinc-300'
              }`}
            >
              {link.name}
            </button>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white">
                <User className="w-3.5 h-3.5 text-lime-300" />
                <span className="font-semibold">{currentUser.username}</span>
                {isOrg && (
                  <span className="rounded-full bg-lime-300/20 px-2 py-0.5 text-[9px] font-bold text-lime-300 border border-lime-300/30">
                    ORG
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-red-400 hover:border-red-500/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-lime-300 px-6 py-3 text-sm font-bold text-zinc-950 transition-all hover:-translate-y-0.5 hover:bg-lime-200 shadow-md"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full p-2 text-zinc-400 hover:text-white bg-white/5 border border-white/10"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#101010]/95 backdrop-blur-2xl px-6 pt-4 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.path)}
                className={`text-left py-2 text-sm font-medium transition-colors ${
                  isActive(link.path) ? 'text-lime-300 font-semibold' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          <hr className="border-white/10" />

          <div>
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 py-2 text-sm text-white">
                  <User className="w-4 h-4 text-lime-300" />
                  <span>{currentUser.username}</span>
                  {isOrg && (
                    <span className="rounded-full bg-lime-300/20 px-2 py-0.5 text-[9px] font-bold text-lime-300 border border-lime-300/30">
                      ORG
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2.5">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-lime-300 text-zinc-950 text-xs font-bold shadow-md hover:bg-lime-200"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
