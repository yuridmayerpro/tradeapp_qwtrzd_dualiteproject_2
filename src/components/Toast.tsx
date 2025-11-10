import React, { useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const colors = {
  success: 'bg-green-500/90 border-green-600',
  warning: 'bg-yellow-500/90 border-yellow-600',
  error: 'bg-red-500/90 border-red-600',
  info: 'bg-blue-500/90 border-blue-600',
};

const Toast: React.FC<{ id: number; message: string; type: 'success' | 'error' | 'info' | 'warning' }> = ({ id, message, type }) => {
  const { removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [id, removeToast]);

  return (
    <div className={`flex items-start p-4 mb-4 text-white rounded-lg shadow-lg border ${colors[type]} animate-fade-in-down`}>
      <div className="flex-shrink-0 mr-3">{icons[type]}</div>
      <div className="flex-grow text-sm font-medium">{message}</div>
      <button onClick={() => removeToast(id)} className="ml-4 -mr-1 p-1 rounded-full hover:bg-black/20 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} id={toast.id} message={toast.message} type={toast.type} />
      ))}
    </div>
  );
};

export default ToastContainer;
