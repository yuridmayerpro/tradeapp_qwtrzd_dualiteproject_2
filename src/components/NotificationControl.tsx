import React, { useState } from 'react';
import { Bell, BellOff, BellRing, LoaderCircle, Info } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../contexts/AuthContext';
import IosInstallPrompt from './IosInstallPrompt';

const NotificationControl: React.FC = () => {
  const { user } = useAuth();
  const { isSubscribed, handleToggle, permissionStatus, isLoading, isSupported, isApple } = usePushNotifications();
  const [isIosPromptOpen, setIsIosPromptOpen] = useState(false);

  if (!user) {
    return null; // Don't show if not logged in
  }

  if (isApple && !isSupported) {
    return (
      <>
        <div className="relative group">
          <button
            onClick={() => setIsIosPromptOpen(true)}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-700"
            aria-label="Ativar notificações no iOS"
          >
            <Info size={20} className="text-blue-400" />
          </button>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs rounded py-1 px-2 pointer-events-none">
            Ativar notificações no iOS
          </div>
        </div>
        <IosInstallPrompt isOpen={isIosPromptOpen} onClose={() => setIsIosPromptOpen(false)} />
      </>
    );
  }

  if (!isSupported && !isApple) {
    return null; // Don't show the button if not supported on non-Apple devices
  }

  const getIcon = () => {
    if (isLoading) return <LoaderCircle size={20} className="animate-spin text-slate-400" />;
    if (permissionStatus === 'denied') return <BellOff size={20} className="text-red-400" />;
    if (isSubscribed) return <BellRing size={20} className="text-green-400" />;
    return <Bell size={20} className="text-slate-400" />;
  };

  const getTooltip = () => {
    if (isLoading) return 'Verificando status...';
    if (permissionStatus === 'denied') return 'Notificações bloqueadas';
    if (isSubscribed) return 'Desativar notificações de trading';
    return 'Ativar notificações de trading';
  };

  return (
    <div className="relative group">
      <button
        onClick={handleToggle}
        disabled={isLoading || permissionStatus === 'denied'}
        className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={getTooltip()}
      >
        {getIcon()}
      </button>
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs rounded py-1 px-2 pointer-events-none">
        {getTooltip()}
      </div>
    </div>
  );
};

export default NotificationControl;
