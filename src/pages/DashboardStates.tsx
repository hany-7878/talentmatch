import React from 'react';

/**
 * LoadingState: Used for the initial app launch.
 * Designed to look like a native splash screen.
 */
export const LoadingState = () => (
  // Using h-[100dvh] to prevent jumping when mobile browser chrome disappears
  <div className="flex items-center justify-center h-[100dvh] bg-slate-950">
    <div className="flex flex-col items-center">
      {/* Brand Icon Placeholder */}
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-[2rem] flex items-center justify-center text-white font-black italic text-2xl shadow-2xl shadow-indigo-500/20 animate-bounce">
          TM
        </div>
        {/* Modern Spinner Overlay */}
        <div className="absolute -inset-2 border-2 border-indigo-500/20 rounded-[2.5rem] animate-[spin_4s_linear_infinite]" />
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
        </div>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">
          Initialising
        </p>
      </div>
    </div>
  </div>
);

interface FinalizingProps {
  onRefresh: () => void;
}

/**
 * FinalizingState: Used when profile data is being synced.
 * Optimized for thumb-reachability on mobile.
 */
export const FinalizingState = ({ onRefresh }: FinalizingProps) => (
  <div className="flex items-end sm:items-center justify-center h-[100dvh] bg-slate-50">
    {/* Card slides up from bottom on mobile for "Native Sheet" feel */}
    <div className="w-full sm:max-w-sm bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)] border-t sm:border border-slate-100 animate-in slide-in-from-bottom-10 duration-700 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      
      {/* Progress Graphic */}
      <div className="relative w-20 h-20 mx-auto mb-8">
        <svg className="w-full h-full rotate-[-90deg]">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray="226"
            strokeDashoffset="60"
            className="text-indigo-600 animate-[pulse_2s_ease-in-out_infinite]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter uppercase text-center">
        Syncing Profile
      </h3>
      <p className="text-slate-500 text-sm mb-10 leading-relaxed text-center px-4">
        We're securing your workspace and fetching your latest messages.
      </p>

      <button 
        onClick={onRefresh} 
        className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.97] shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
      >
        <span>Refresh Connection</span>
      </button>

      {/* Mobile Home Indicator Spacing */}
      <div className="h-2 sm:hidden" />
    </div>
  </div>
);