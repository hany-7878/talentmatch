import { useRef, useEffect, useState, useCallback } from 'react';
import { FaPaperPlane, FaSmile, FaPaperclip, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface MessageInputProps {
  text: string;
  setText: (val: string) => void;
  onSend: (file?: File | null) => void;
  onTyping: (val: string) => void;
  isSending: boolean;
}

const MAX_FILE_SIZE_MB = 5;

export default function MessageInput({ text, setText, onSend, onTyping, isSending }: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Added for debounce
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 1. Memory leak protection
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [previewUrl]);

  // 2. ACTUAL Debounced Typing Logic
  // We send the typing signal 500ms after the user stops typing
  const debouncedTyping = useCallback(
    (val: string) => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        onTyping(val);
      }, 500);
    },
    [onTyping]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large (max ${MAX_FILE_SIZE_MB}MB)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !selectedFile) || isSending) return;

    // Clear typing timeout immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    onSend(selectedFile);
    clearFile();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 pt-0 bg-slate-950">
      {/* File Preview Area */}
      {selectedFile && (
        <div className="mb-2 p-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          {previewUrl ? (
            <img src={previewUrl} className="w-12 h-12 rounded object-cover border border-slate-700 shadow-lg" alt="preview" />
          ) : (
            <div className="w-12 h-12 bg-indigo-900/30 rounded flex items-center justify-center text-indigo-400">
              <FaPaperclip size={14} />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-[10px] text-white font-bold truncate">{selectedFile.name}</p>
            <p className="text-[8px] text-slate-500 uppercase font-black">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <button type="button" onClick={clearFile} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
            <FaTimes size={12} />
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:ring-1 ring-indigo-500/50 transition-all group shadow-inner">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            debouncedTyping(e.target.value); // Triggering the real debounce
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          rows={1}
          placeholder="Type a message..."
          disabled={isSending}
          className="w-full bg-transparent resize-none border-none px-4 py-3 text-sm text-white focus:ring-0 placeholder-slate-700 max-h-40 custom-scrollbar disabled:opacity-50"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-1">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,application/pdf,.doc,.docx"
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-500 hover:text-indigo-400 transition-colors">
              <FaPaperclip size={14} />
            </button>
            <button type="button" className="p-2.5 text-slate-500 hover:text-yellow-500 transition-colors">
              <FaSmile size={14} />
            </button>
          </div>

          <button 
            type="submit" 
            disabled={(!text.trim() && !selectedFile) || isSending} 
            className={`p-2.5 rounded-xl transition-all shadow-lg ${
              (!text.trim() && !selectedFile) || isSending 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 active:scale-95'
            }`}
          >
            {isSending ? (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <FaPaperPlane size={12} />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}