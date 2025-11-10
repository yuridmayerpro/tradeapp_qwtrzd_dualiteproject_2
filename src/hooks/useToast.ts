import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

export const useToast = () => {
  const context = useContext(ToastContext);
  // CORREÇÃO: A verificação de contexto indefinido foi removida.
  // Agora, se o hook for usado fora do provider, o erro lançado pelo
  // valor padrão do `createContext` será mais descritivo.
  return context;
};
