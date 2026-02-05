import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const themes = {
    success: "bg-emerald-600 shadow-emerald-200",
    error: "bg-rose-600 shadow-rose-200",
    info: "bg-indigo-600 shadow-indigo-200"
  };

  const icons = {
    success: <FaCheckCircle />,
    error: <FaExclamationCircle />,
    info: <FaInfoCircle />
  };

  return (
    <div className={`
      flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white
      animate-in slide-in-from-top-10 sm:slide-in-from-right-10 duration-500
      ${themes[type]}
    `}>
      <span className="text-lg">{icons[type]}</span>
      <p className="text-xs font-bold uppercase tracking-wider">{message}</p>
      <button title='close'
        onClick={onClose}
        className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <FaTimes size={12} />
      </button>
    </div>
  );
}