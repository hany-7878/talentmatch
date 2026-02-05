import { useEffect, useState, useCallback } from 'react';
import { FaDownload, FaTimes, FaShareSquare, FaPlusSquare } from 'react-icons/fa';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const checkAndShow = useCallback(() => {
    const lastDismissed = localStorage.getItem('pwa_dismissed');
    if (!lastDismissed || Date.now() - parseInt(lastDismissed) > 86400000) {
      setTimeout(() => setIsVisible(true), 3000);
    }
  }, []);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) return; 

    if (isIOS) {
      setPlatform('ios');
      checkAndShow(); 
    } else {
      setPlatform('android');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      checkAndShow(); 
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [checkAndShow]); 

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsVisible(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-[env(safe-area-inset-bottom,1.5rem)] pt-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 shadow-2xl rounded-[2rem] p-5 backdrop-blur-xl">
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">T</div>
            <div>
              <h4 className="text-white font-bold">TalentMatch App</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Native Experience</p>
            </div>
          </div>
          <button
          title='cancel' onClick={dismiss} className="text-slate-500 hover:text-white p-1"><FaTimes /></button>
        </div>

        {platform === 'ios' ? (
          <div className="space-y-3 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <p className="text-xs text-slate-200 leading-relaxed">
              Install TalentMatch on your iPhone for the best experience:
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-[11px] text-white font-medium">
                <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">1</span>
                Tap the <FaShareSquare className="text-blue-400" /> <span className="text-blue-400 ml-1">Share</span> button below.
              </div>
              <div className="flex items-center gap-3 text-[11px] text-white font-medium">
                <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">2</span>
                Select <FaPlusSquare className="mr-1" /> <span className="font-bold">Add to Home Screen</span>.
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleAndroidInstall}
            className="w-full bg-white text-slate-900 py-3 rounded-xl text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <FaDownload /> Install TalentMatch
          </button>
        )}
      </div>
    </div>
  );
}