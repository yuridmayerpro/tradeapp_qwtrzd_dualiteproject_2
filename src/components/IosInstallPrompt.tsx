import React from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

interface IosInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const IosInstallPrompt: React.FC<IosInstallPromptProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm flex flex-col shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Ativar Notificações no iOS</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors rounded-full p-1 hover:bg-slate-700">
            <X size={24} />
          </button>
        </header>
        <div className="p-6 space-y-6">
          <p className="text-slate-300 text-center">Para receber notificações no seu iPhone ou iPad, adicione este site à sua Tela de Início.</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600/20 text-blue-300 rounded-lg p-3">
                <Share size={24} />
              </div>
              <p className="text-slate-200 flex-1">
                <strong className="font-semibold">Passo 1:</strong> Toque no ícone de <strong className="font-semibold">Compartilhar</strong> na barra de navegação do Safari.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-blue-600/20 text-blue-300 rounded-lg p-3">
                <PlusSquare size={24} />
              </div>
              <p className="text-slate-200 flex-1">
                <strong className="font-semibold">Passo 2:</strong> Role para baixo e selecione a opção <strong className="font-semibold">"Adicionar à Tela de Início"</strong>.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-400 text-center pt-4 border-t border-slate-700">
            Depois de adicionar, abra o app pela Tela de Início e clique no ícone de sino (🔔) para ativar as notificações.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IosInstallPrompt;
