import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, LogOut, ChevronDown, Wallet } from 'lucide-react';

interface AuthControlProps {
  onOpenBinanceConnect: () => void;
}

const AuthControl: React.FC<AuthControlProps> = ({ onOpenBinanceConnect }) => {
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (loading) {
    return <div className="w-28 h-10 bg-slate-700 rounded-lg animate-pulse"></div>;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors border border-slate-600"
      >
        <LogIn size={16} />
        Login
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)}
        className="flex items-center gap-2 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
      >
        <img
          src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`}
          alt="User Avatar"
          className="w-7 h-7 rounded-full"
        />
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20">
          <div className="p-4 border-b border-slate-700">
            <p className="font-semibold text-white truncate">{user.user_metadata.full_name || 'Usuário'}</p>
            <p className="text-sm text-slate-400 truncate">{user.email}</p>
          </div>
          <div className="p-2">
             <button
              onClick={() => {
                onOpenBinanceConnect();
                setIsMenuOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
            >
              <Wallet size={16} />
              Conectar Binance
            </button>
            <button
              onClick={signOut}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthControl;
