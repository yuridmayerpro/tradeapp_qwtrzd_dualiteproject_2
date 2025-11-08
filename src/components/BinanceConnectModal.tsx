import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { X, KeyRound, Shield, LoaderCircle, CheckCircle, AlertTriangle, ExternalLink, Power, PowerOff } from 'lucide-react';

interface BinanceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BinanceConnectModal: React.FC<BinanceConnectModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [maskedApiKey, setMaskedApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchConnectionStatus = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('binance_api_key')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.binance_api_key) {
        setIsConnected(true);
        setMaskedApiKey(`${data.binance_api_key.substring(0, 4)}...${data.binance_api_key.slice(-4)}`);
      } else {
        setIsConnected(false);
        setMaskedApiKey('');
      }
    } catch (err: any) {
      setError('Falha ao verificar status da conexão.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchConnectionStatus();
    }
  }, [isOpen, fetchConnectionStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !apiKey || !secretKey) {
      setError('Por favor, preencha a API Key e a Secret Key.');
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          binance_api_key: apiKey,
          binance_secret_key: secretKey,
          updated_at: new Date().toISOString(),
        });
      
      if (upsertError) throw upsertError;

      setSuccess('Conta Binance conectada com sucesso!');
      setApiKey('');
      setSecretKey('');
      fetchConnectionStatus();
    } catch (err: any) {
      setError('Falha ao salvar as chaves. Verifique o console para mais detalhes.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          binance_api_key: null,
          binance_secret_key: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setSuccess('Conta desconectada com sucesso.');
      setIsConnected(false);
    } catch (err: any) {
      setError('Falha ao desconectar a conta.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg flex flex-col shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <img src="https://i.ibb.co/XDrpC2G/binance-logo.png" alt="Binance Logo" className="w-6 h-6" />
            <h2 className="text-lg font-semibold text-white">Conexão com a Binance</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors rounded-full p-1 hover:bg-slate-700">
            <X size={24} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <LoaderCircle className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : isConnected ? (
            <div className="space-y-4 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">Conta Conectada</h3>
              <p className="text-slate-400">Sua conta Binance está conectada com a chave:</p>
              <p className="font-mono text-lg text-blue-300 bg-slate-800 py-2 px-4 rounded-lg inline-block">{maskedApiKey}</p>
              <button 
                onClick={handleDisconnect}
                disabled={isSaving}
                className="w-full mt-4 bg-red-600 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:bg-red-800 disabled:cursor-not-allowed"
              >
                {isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <PowerOff size={18} />}
                Desconectar
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="apiKey">API Key</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" id="apiKey" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cole sua API Key aqui" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="secretKey">Secret Key</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="password" id="secretKey" value={secretKey} onChange={e => setSecretKey(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cole sua Secret Key aqui" />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
              >
                {isSaving ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Power size={18} />}
                Conectar Conta
              </button>
            </form>
          )}

          {error && <div className="bg-red-500/10 text-red-300 text-sm p-3 rounded-lg flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>}
          {success && <div className="bg-green-500/10 text-green-300 text-sm p-3 rounded-lg flex items-center gap-2"><CheckCircle size={16} /> {success}</div>}

          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm p-4 rounded-lg space-y-2">
            <p className="font-bold flex items-center gap-2"><AlertTriangle size={18} />Aviso de Segurança</p>
            <p>Suas chaves de API são armazenadas de forma segura e nunca são expostas no frontend. Para máxima segurança, recomendamos criar uma chave de API com permissões de **apenas leitura**.</p>
            <a href="https://www.binance.com/pt-BR/support/faq/como-criar-uma-api-key-e-api-secret-na-binance-360002502072" target="_blank" rel="noopener noreferrer" className="font-semibold inline-flex items-center gap-1 hover:underline">
              Aprenda a criar uma API Key na Binance <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BinanceConnectModal;
