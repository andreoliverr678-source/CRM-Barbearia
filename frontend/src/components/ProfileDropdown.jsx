import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Building, Mail, User, ShieldCheck, Camera, Loader2 } from 'lucide-react';
import api, { uploadAvatar } from '../services/api';

const ProfileDropdown = () => {
  const { user, logout, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Estados modal edição
  const [name, setName] = useState(user?.name || '');
  const [barbershopName, setBarbershopName] = useState(user?.barbershop_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(null); // URL de preview local
  const [avatarFile, setAvatarFile] = useState(null);       // File object
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Sincroniza estado quando user carrega
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBarbershopName(user.barbershop_name || '');
    }
  }, [user]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = () => {
    setIsOpen(false);
    setMessage('');
    setCurrentPassword('');
    setNewPassword('');
    setAvatarPreview(null);
    setAvatarFile(null);
    setIsModalOpen(true);
  };

  // Quando o usuário seleciona um arquivo
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação no frontend
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setMessage('Tipo de arquivo inválido. Use JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage('');
    try {
      // 1. Upload do avatar (se houver novo arquivo)
      if (avatarFile) {
        setUploadingAvatar(true);
        const result = await uploadAvatar(avatarFile);
        updateUser({ avatar: result.avatar });
        setAvatarFile(null);
        setAvatarPreview(null);
        setUploadingAvatar(false);
      }

      // 2. Atualiza nome/barbearia
      await api.put('/profile', { name, barbershop_name: barbershopName });
      updateUser({ name, barbershop_name: barbershopName });

      // 3. Troca senha (se preenchido)
      if (currentPassword && newPassword) {
        await api.put('/profile/password', { currentPassword, newPassword });
        setCurrentPassword('');
        setNewPassword('');
      }

      setMessage('Perfil salvo com sucesso!');
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (err) {
      setUploadingAvatar(false);
      setMessage(err.response?.data?.error || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  // Avatar atual a exibir (preview local ou salvo)
  const currentAvatar = avatarPreview || user?.avatar;
  const initials = user?.name?.charAt(0).toUpperCase() || '?';

  if (!user) return null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger (Avatar) */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 cursor-pointer rounded-full md:rounded-xl p-1 md:pr-4 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold border border-primary-200 dark:border-primary-800 text-sm overflow-hidden shrink-0">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-dark-900 dark:text-white leading-tight">
              {user.name.split(' ')[0]}
            </p>
            <p className="text-xs text-dark-500 dark:text-dark-400 truncate max-w-[120px]">
              {user.barbershop_name || 'Admin'}
            </p>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 glass-panel bg-white/95 dark:bg-dark-900/95 rounded-2xl shadow-xl border border-dark-200 dark:border-dark-800 overflow-hidden z-50 animate-fade-in origin-top-right">
            <div className="p-4 border-b border-dark-100 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-800/50">
              <p className="font-bold text-dark-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{user.email}</p>
            </div>

            <div className="p-2">
              <button
                onClick={openModal}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
              >
                <Settings size={16} /> Configurações da Conta
              </button>
            </div>

            <div className="p-2 border-t border-dark-100 dark:border-dark-800">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium"
              >
                <LogOut size={16} /> Sair do sistema
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Edição Perfil */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Wrapper de centralização — garante distância segura do topo/fundo */}
          <div className="flex min-h-full items-center justify-center p-4 py-8">
          <div className="glass-panel w-full max-w-md bg-white dark:bg-dark-900 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-6">Configurações</h2>

              <div className="space-y-4">
                {/* Feedback */}
                {message && (
                  <div className={`p-3 rounded-xl text-sm ${
                    message.includes('sucesso')
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {message}
                  </div>
                )}

                {/* ── Seção Avatar ─────────────────────────── */}
                <div className="flex flex-col items-center gap-3 pb-4 border-b border-dark-100 dark:border-dark-800">
                  <p className="text-xs font-medium text-dark-500 dark:text-dark-400 self-start flex items-center gap-1.5">
                    <Camera size={13} /> Foto do Perfil
                  </p>

                  {/* Avatar clicável */}
                  <div className="relative group">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-800 bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-3xl cursor-pointer transition-all group-hover:border-primary-400 dark:group-hover:border-primary-600 shadow-lg"
                    >
                      {currentAvatar ? (
                        <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Overlay ao hover */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                    >
                      {uploadingAvatar ? (
                        <Loader2 size={24} className="text-white animate-spin" />
                      ) : (
                        <Camera size={22} className="text-white" />
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-dark-400 dark:text-dark-500 text-center">
                    Clique na foto para alterar<br />
                    <span className="text-dark-300">JPG, PNG, WebP ou GIF • máx. 2MB</span>
                  </p>

                  {/* Indicador de arquivo selecionado */}
                  {avatarFile && (
                    <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg">
                      <Camera size={12} />
                      <span className="truncate max-w-[200px]">{avatarFile.name}</span>
                      <button
                        onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                        className="ml-1 text-dark-400 hover:text-red-500 transition-colors font-bold"
                      >×</button>
                    </div>
                  )}

                  {/* Input de arquivo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* ── Nome ─────────────────────────────────── */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-dark-500 dark:text-dark-400 mb-1.5">
                    <User size={14} /> Nome
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* ── Barbearia ─────────────────────────────── */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-dark-500 dark:text-dark-400 mb-1.5">
                    <Building size={14} /> Barbearia
                  </label>
                  <input
                    type="text"
                    value={barbershopName}
                    onChange={e => setBarbershopName(e.target.value)}
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* ── Trocar Senha ──────────────────────────── */}
                <div className="pt-4 border-t border-dark-100 dark:border-dark-800">
                  <label className="flex items-center gap-2 text-xs font-medium text-dark-500 dark:text-dark-400 mb-3">
                    <ShieldCheck size={14} /> Trocar Senha (opcional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Senha atual"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="password"
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-3 py-2 text-sm text-dark-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex justify-center items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      {uploadingAvatar ? 'Enviando foto...' : 'Salvando...'}
                    </>
                  ) : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;
