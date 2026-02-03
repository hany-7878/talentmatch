import React from 'react';

export const LoadingState = () => (
  <div className="flex items-center justify-center h-screen bg-white">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">
        Establishing Session
      </p>
    </div>
  </div>
);


interface FinalizingProps {
  onRefresh: () => void;
}

export const FinalizingState = ({ onRefresh }: FinalizingProps) => (
  <div className="flex items-center justify-center h-screen bg-slate-50">
    <div className="text-center p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-sm mx-4">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter uppercase">
        Syncing Node
      </h3>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">
        Securing workspace and profile data...
      </p>
      <button 
        onClick={onRefresh} 
        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-200"
      >
        Refresh Connection
      </button>
    </div>
  </div>
);