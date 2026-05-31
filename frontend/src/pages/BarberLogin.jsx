import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBarberAuth } from '../context/BarberAuthContext';
import { Scissors, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const BarberLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useBarberAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/barber', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login. Verifique seus dados de barbeiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4 transition-colors">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center gap-2 text-primary-500">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Scissors size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wider">
              BARBER<span className="text-primary-550 text-primary-500 font-extrabold">APP</span>
            </h1>
          </div>
          <span className="text-xs text-dark-400 mt-2 font-medium tracking-widest uppercase flex items-center gap-1.5 bg-dark-900 border border-dark-800 px-3 py-1 rounded-full">
            <ShieldCheck size={12} className="text-primary-450" /> Área do Barbeiro
          </span>
        </div>

        {/* Card */}
        <div className="glass-panel border border-dark-800 bg-dark-900/60 rounded-3xl p-8 animate-fade-in relative overflow-hidden shadow-2xl">
          {/* Decoração bg */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-650/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-xl font-bold text-white mb-1.5 relative z-10">
            Entrar como Profissional
          </h2>
          <p className="text-dark-400 text-sm mb-8 relative z-10">
            Acesse sua agenda e lista de clientes fixos.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 relative z-10 animate-shake">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-dark-300 mb-1.5">
                E-mail Profissional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white transition-all outline-none"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-semibold text-dark-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-750 text-white font-semibold rounded-xl py-3 px-4 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex justify-center items-center h-[48px] shadow-lg shadow-primary-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Acessar Agenda'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BarberLogin;
