import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  BarChart2, 
  Users, 
  LogOut,
  Sparkles
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isOrg = currentUser?.role === 'organization';

  const navItems = isOrg
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Generate CBT Exam', path: '/upload', icon: Sparkles },
        { name: 'Organization Portal', path: '/organization', icon: Users },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Upload Files', path: '/upload', icon: UploadCloud },
        { name: 'My Analytics', path: '/analytics', icon: BarChart2 },
      ];

  return (
    <aside className="w-64 h-[calc(100vh-6rem)] sticky top-24 hidden md:flex flex-col border-r border-white/5 bg-[#101010]/60 backdrop-blur-md p-4 justify-between">
      <div className="space-y-6">
        {/* User profile card */}
        <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-lime-300 text-zinc-950 flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(190,242,100,0.3)]">
            {currentUser?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-semibold text-white truncate">{currentUser?.username}</h4>
              {isOrg && (
                <span className="text-[9px] bg-lime-300/20 text-lime-300 px-1.5 py-0.5 rounded border border-lime-300/30 font-bold">
                  ORG
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 truncate">{currentUser?.email}</p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex flex-col space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-lime-300/10 border-l-4 border-lime-300 text-lime-300 font-semibold' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Logout */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-full text-xs font-semibold text-zinc-400 hover:bg-red-500/10 hover:text-red-400 hover:border hover:border-red-500/20 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
