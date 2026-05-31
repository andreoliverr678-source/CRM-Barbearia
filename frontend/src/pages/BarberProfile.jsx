import React, { useState, useRef } from 'react';
import {
  User, Camera, Lock, Eye, EyeOff, Save, Trash2,
  CheckCircle, AlertCircle, Loader2, Scissors, Shield
} from 'lucide-react';
import { useBarberAuth } from '../context/BarberAuthContext';
import api from '../services/api';

// ─── Avatar Component ────────────────────────────────────────────
const AvatarSection = ({ barber, onAvatarUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Imagem muito grande. Máx 3MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await api.post('/barber/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onAvatarUpdated(res.data.avatar);
      showToast('Foto atualizada! ✂️');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao enviar foto.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    if (!barber?.avatar) return;
    setRemoving(true);
    try {
      await api.delete('/barber/profile/avatar');
      onAvatarUpdated(null);
      showToast('Foto removida.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao remover foto.', 'error');
    } finally {
      setRemoving(false);
    }
  };

  const initials = (barber?.name || barber?.nome || 'B')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
      {/* Toast inline */}
      {toast && (
        <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
          toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {toast.type === 'error'
            ? <AlertCircle size={13} />
            : <CheckCircle size={13} />}
          {toast.msg}
        </div>
      )}

      <h2 className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Camera size={13} />
        Foto de Perfil
      </h2>

      <div className="flex items-center gap-5">
        {/* Avatar circle */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-600 to-purple-700 flex items-center justify-center shadow-lg shadow-primary-900/30 ring-2 ring-primary-500/20">
            {barber?.avatar ? (
              <img
                src={barber.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
          </div>
          {/* Camera badge */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-primary-600 hover:bg-primary-500 flex items-center justify-center shadow-lg transition-all active:scale-90 disabled:opacity-50"
            title="Trocar foto"
          >
            {uploading
              ? <Loader2 size={13} className="animate-spin text-white" />
              : <Camera size={13} className="text-white" />
            }
          </button>
        </div>

        {/* Info + buttons */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{barber?.name || barber?.nome}</p>
          <p className="text-xs text-dark-400 mb-3">Barbeiro</p>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || removing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary-600/20 border border-primary-500/30 text-primary-400 hover:bg-primary-600/30 transition-all active:scale-95 disabled:opacity-40"
            >
              <Camera size={12} />
              {uploading ? 'Enviando…' : 'Trocar Foto'}
            </button>
            {barber?.avatar && (
              <button
                onClick={handleRemove}
                disabled={uploading || removing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-40"
              >
                {removing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {removing ? 'Removendo…' : 'Remover'}
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-dark-500">
        JPG, PNG ou WebP · máx. 3 MB
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

// ─── PasswordField (FORA do PasswordSection para evitar remount a cada keystroke) ──
const PasswordField = ({ id, label, field, showKey, form, show, setForm, setShow }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-dark-400 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={show[showKey] ? 'text' : 'password'}
        value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-dark-600 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-all"
        placeholder="••••••••"
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
      >
        {show[showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

// ─── Password Section ─────────────────────────────────────────────
const PasswordSection = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strengthLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Muito Forte'];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-400'];
  const s = strength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    if (form.newPassword.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.put('/barber/profile/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Senha atualizada com sucesso! 🔒');
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao trocar senha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fieldProps = { form, show, setForm, setShow };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
      {toast && (
        <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
          toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={13} /> : <CheckCircle size={13} />}
          {toast.msg}
        </div>
      )}

      <h2 className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Shield size={13} />
        Segurança — Trocar Senha
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <PasswordField id="current-pw" label="Senha Atual" field="currentPassword" showKey="current" {...fieldProps} />
        <PasswordField id="new-pw" label="Nova Senha" field="newPassword" showKey="new" {...fieldProps} />

        {/* Strength bar */}
        {form.newPassword && (
          <div>
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= s ? strengthColor[s] : 'bg-dark-800'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-dark-500">{strengthLabel[s]}</p>
          </div>
        )}

        <PasswordField id="confirm-pw" label="Confirmar Nova Senha" field="confirmPassword" showKey="confirm" {...fieldProps} />

        {/* Match indicator */}
        {form.confirmPassword && (
          <p className={`text-[10px] flex items-center gap-1 ${
            form.newPassword === form.confirmPassword ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {form.newPassword === form.confirmPassword
              ? <><CheckCircle size={11} /> Senhas conferem</>
              : <><AlertCircle size={11} /> Senhas não conferem</>
            }
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !form.currentPassword || !form.newPassword || !form.confirmPassword}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-700 hover:from-primary-500 hover:to-purple-600 text-white text-sm font-bold shadow-lg shadow-primary-900/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Salvando…</>
            : <><Save size={14} /> Salvar Nova Senha</>
          }
        </button>
      </form>
    </div>
  );
};


// ─── Info Card (readonly) ─────────────────────────────────────────
const InfoCard = ({ barber }) => (
  <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
    <h2 className="text-xs font-bold text-dark-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <User size={13} />
      Informações da Conta
    </h2>
    <div className="space-y-3">
      {[
        { label: 'Nome', value: barber?.name || barber?.nome },
        { label: 'E-mail', value: barber?.email },
        { label: 'Telefone', value: barber?.telefone || '—' },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between items-center py-2.5 border-b border-dark-800 last:border-0">
          <span className="text-xs text-dark-500 font-medium">{label}</span>
          <span className="text-xs text-white font-semibold max-w-[55%] truncate text-right">{value}</span>
        </div>
      ))}
    </div>
    <p className="mt-3 text-[10px] text-dark-600">
      Para alterar nome, e-mail ou telefone, fale com o administrador.
    </p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────
const BarberProfile = () => {
  const { barber, updateBarberState } = useBarberAuth();

  const handleAvatarUpdated = (newAvatarUrl) => {
    updateBarberState({ avatar: newAvatarUrl });
  };

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 pt-1">
        <div className="p-2 rounded-xl bg-primary-500/10 border border-primary-500/20">
          <Scissors size={16} className="text-primary-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Meu Perfil</h1>
          <p className="text-[10px] text-dark-400">Foto e segurança da conta</p>
        </div>
      </div>

      {/* Sections */}
      <AvatarSection barber={barber} onAvatarUpdated={handleAvatarUpdated} />
      <InfoCard barber={barber} />
      <PasswordSection />
    </div>
  );
};

export default BarberProfile;
