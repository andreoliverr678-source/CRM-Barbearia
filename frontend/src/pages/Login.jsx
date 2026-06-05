import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scissors, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950 p-4 transition-colors">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <img 
              src="/cadeira_cheia_logo.jpg" 
              className="w-12 h-12 rounded-2xl object-cover border border-amber-500/20" 
              alt="Logo Cadeira Cheia" 
            />
            <h1 className="text-3xl font-bold text-dark-900 dark:text-white tracking-wider">
              Cadeira<span className="text-amber-500">Cheia</span>
            </h1>
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 animate-fade-in relative overflow-hidden">
          {/* Decoração bg */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2 relative z-10">
            Bem-vindo de volta
          </h2>
          <p className="text-dark-500 dark:text-dark-400 text-sm mb-8 relative z-10">
            Entre para gerenciar sua barbearia
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-3 relative z-10">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@barbercrm.com"
                className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-dark-900 dark:text-white transition-all"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent text-dark-900 dark:text-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 dark:hover:text-dark-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl py-3 px-4 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex justify-center items-center h-[48px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
