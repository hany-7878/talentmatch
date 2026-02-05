
import type { IconType } from 'react-icons';

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  variant?: 'indigo' | 'rose' | 'amber';
}

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction,
  variant = 'indigo'
}: EmptyStateProps) {
  
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100'
  };

  const buttonColors = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
    rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
    amber: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className={`w-20 h-20 rounded-[2rem] border-2 flex items-center justify-center text-3xl mb-6 ${colors[variant]}`}>
        <Icon />
      </div>
      
      <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
        {title}
      </h3>
      
      <p className="text-slate-500 text-sm max-w-[280px] mb-8 leading-relaxed font-medium">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className={`px-8 py-4 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl ${buttonColors[variant]}`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}