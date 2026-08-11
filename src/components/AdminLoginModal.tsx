import React, { useState } from 'react';
import { Lock, ShieldCheck, X, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
      onLoginSuccess();
      onClose();
    } else {
      setError('Usuário ou senha de Administrador incorretos. Tente admin / admin123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">Acesso Restrito Admin</h3>
              <p className="text-[11px] text-slate-400">Painel Autônomo da Farmácia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Você desbloqueou o acesso administrativo oculto. Digite suas credenciais para gerenciar a loja. (Padrão: <strong>admin</strong> / <strong>admin123</strong>)
            </span>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">Usuário Administrador</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite 'admin'"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 text-sm font-medium outline-none transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">Senha de Segurança</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite 'admin123'"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-rose-600 focus:ring-2 focus:ring-rose-100 text-sm font-medium outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/20 active:scale-98 transition text-sm flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Entrar no Painel Admin</span>
          </button>
        </form>
      </div>
    </div>
  );
};
