import React from 'react';

const GlassCard = ({ children, className = '', glowColor = 'lime' }) => {
  return (
    <div
      className={`bg-[#141414] border border-white/10 rounded-2xl p-6 transition-all duration-200 hover:border-white/20 ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
