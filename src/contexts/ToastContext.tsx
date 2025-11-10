import React, { createContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
  toasts: ToastMessage[];
}

// CORREÇÃO: Fornece um valor padrão seguro para o contexto.
// Isso evita erros de inicialização se o contexto for acessado incorretamente
// e torna o sistema mais robusto.
export const ToastContext = createContext<ToastContextType>({
  addToast: () => { throw new Error('O componente tentou usar o Toast fora do ToastProvider.'); },
  removeToast: () => { throw new Error('O componente tentou usar o Toast fora do ToastProvider.'); },
  toasts: [],
});

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
