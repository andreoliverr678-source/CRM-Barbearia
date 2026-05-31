import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Phone, MoreVertical, AlertCircle, RefreshCw, UserX, Edit2, Trash2, X, Check, Mail, ShieldAlert } from 'lucide-react';
import useApi from '../hooks/useApi';
import { fetchBarbers, createBarber, updateBarber, deleteBarber } from '../services/api';

// ------- Skeleton Row -------
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-dark-200 dark:bg-dark-700" />
        <div className="h-4 w-32 rounded bg-dark-200 dark:bg-dark-700" />
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-4 w-36 rounded bg-dark-200 dark:bg-dark-700" /></td>
    <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-dark-200 dark:bg-dark-700" /></td>
    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-dark-200 dark:bg-dark-700" /></td>
    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-dark-200 dark:bg-dark-700 ml-auto" /></td>
  </tr>
);

// ------- Skeleton Card -------
const SkeletonCard = () => (
  <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-dark-200 dark:bg-dark-700 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-28 rounded bg-dark-200 dark:bg-dark-700" />
      <div className="h-3 w-24 rounded bg-dark-200 dark:bg-dark-700" />
    </div>
    <div className="h-5 w-16 rounded-full bg-dark-200 dark:bg-dark-700" />
  </div>
);

// ------- Barbers List Page -------
const Barbers = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: barbersRaw, loading, error, refetch } = useApi(fetchBarbers);
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    if (barbersRaw) setBarbers(barbersRaw);
  }, [barbersRaw]);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [deletingBarber, setDeletingBarber] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    active: true,
  });

  // Prevent background scroll when modals are open
  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isModalOpen, isDeleteModalOpen]);

  const filtered = useMemo(() => {
    if (!barbers) return [];
    const q = debouncedSearch.toLowerCase();
    return barbers.filter(
      (b) =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.email || '').toLowerCase().includes(q) ||
        (b.phone || '').includes(q)
    );
  }, [barbers, debouncedSearch]);

  const getInitial = (barber) =>
    (barber.name || barber.email || '?').charAt(0).toUpperCase();

  const handleOpenModal = (barber = null) => {
    if (barber) {
      setEditingBarber(barber);
      setFormData({
        name: barber.name || '',
        email: barber.email || '',
        phone: barber.phone || '',
        password: '', // Não carrega senha atual por segurança
        active: barber.active,
      });
    } else {
      setEditingBarber(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingBarber) {
        // Se a senha estiver em branco, não envia para o backend
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        
        await updateBarber(editingBarber.id, payload);
        showToast('Barbeiro atualizado com sucesso');
      } else {
        await createBarber(formData);
        showToast('Barbeiro cadastrado com sucesso');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao salvar barbeiro', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBarber) return;
    setIsSubmitting(true);
    try {
      await deleteBarber(deletingBarber.id);
      showToast('Barbeiro excluído com sucesso');
      setIsDeleteModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao excluir barbeiro', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-0 relative z-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-1">Equipe</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 hidden sm:block">
            Gerencie os barbeiros cadastrados no sistema.{' '}
            {!loading && barbers && (
              <span className="font-medium text-dark-700 dark:text-dark-300">{barbers.length} profissionais</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            title="Atualizar lista"
            className="p-2.5 rounded-xl text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 transition-all active:scale-90"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => handleOpenModal()} 
            className="hidden md:flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/30"
          >
            <Plus size={18} />
            <span>Cadastrar Profissional</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-xs md:text-sm">Erro ao carregar barbeiros: {error}</span>
        </div>
      )}

      {/* Busca */}
      <div className="sticky top-14 md:top-20 z-20 bg-dark-50/95 dark:bg-dark-950/95 backdrop-blur-sm py-2 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:backdrop-blur-none md:py-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou telefone..."
            className="w-full bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-dark-100 placeholder-dark-400 shadow-sm transition-shadow hover:shadow-md"
          />
        </div>
      </div>

      {/* ===== MOBILE: Lista de Cards ===== */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl py-16 flex flex-col items-center gap-3 text-dark-400">
            <UserX size={28} />
            <span className="text-sm text-center px-6">
              {search ? 'Nenhum profissional encontrado.' : 'Nenhum barbeiro cadastrado.'}
            </span>
          </div>
        ) : (
          filtered.map((barber) => (
            <div
              key={barber.id}
              className="glass-panel rounded-2xl p-4 flex items-center gap-4 border border-dark-100 dark:border-dark-800"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20 shrink-0">
                {getInitial(barber)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dark-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                  {barber.name}
                  {!barber.active && (
                    <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full">Inativo</span>
                  )}
                </p>
                <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{barber.email}</p>
                {barber.phone && <p className="text-[10px] text-dark-400 mt-0.5">{barber.phone}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => handleOpenModal(barber)}
                  className="p-2 text-dark-400 hover:text-emerald-500 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => { setDeletingBarber(barber); setIsDeleteModalOpen(true); }}
                  className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== DESKTOP: Tabela ===== */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-50/50 dark:bg-dark-800/50 text-dark-500 dark:text-dark-400 text-sm border-b border-dark-200 dark:border-dark-800">
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">E-mail</th>
                <th className="px-6 py-4 font-medium">Telefone</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200 dark:divide-dark-800">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-dark-400">
                      <UserX size={32} />
                      <span className="text-sm">
                        {search ? 'Nenhum profissional encontrado.' : 'Nenhum profissional cadastrado.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((barber) => (
                  <tr key={barber.id} className="hover:bg-dark-50/50 dark:hover:bg-dark-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20 shrink-0">
                          {getInitial(barber)}
                        </div>
                        <span className="font-medium text-dark-900 dark:text-white">{barber.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-300">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-dark-400" />
                        {barber.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-300">
                      {barber.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-dark-400" />
                          {barber.phone}
                        </div>
                      ) : (
                        <span className="text-dark-400 italic">Não informado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${barber.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                        {barber.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(barber)}
                          className="p-2 text-dark-400 hover:text-emerald-500 hover:bg-dark-100 dark:hover:bg-dark-850 rounded-xl transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => { setDeletingBarber(barber); setIsDeleteModalOpen(true); }}
                          className="p-2 text-dark-400 hover:text-red-500 hover:bg-dark-100 dark:hover:bg-dark-850 rounded-xl transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== FAB — Novo Barbeiro (mobile) ===== */}
      <button
        onClick={() => handleOpenModal()}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl shadow-primary-500/40 flex items-center justify-center transition-all active:scale-90"
        aria-label="Novo barbeiro"
      >
        <Plus size={24} />
      </button>

      {/* Toast */}
      {toast && createPortal(
        <div className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[10000] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white animate-fade-in ${toast.type === 'error' ? 'bg-red-600 shadow-red-500/20' : 'bg-emerald-600 shadow-emerald-500/20'}`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>,
        document.body
      )}

      {/* Modal Criar/Editar (Portal) */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-dark-200 dark:border-dark-800 shrink-0">
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                {editingBarber ? 'Editar Profissional' : 'Novo Barbeiro'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form id="barberForm" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Nome Completo <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Nome do barbeiro"
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">E-mail <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  required
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  placeholder="exemplo@barber.com"
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Telefone</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="(00) 99999-9999"
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">
                  Senha {editingBarber ? <span className="text-xs text-dark-400 font-normal">(deixe em branco se não quiser alterar)</span> : <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="password" 
                  required={!editingBarber}
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  placeholder="Minimo de 6 caracteres"
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none transition-shadow"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.active} 
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 border-dark-300 dark:border-dark-700 dark:bg-dark-800"
                />
                <label htmlFor="active" className="text-sm font-semibold text-dark-700 dark:text-dark-300 cursor-pointer select-none">
                  Profissional Ativo (pode fazer login e receber agendamentos)
                </label>
              </div>
            </form>
            
            <div className="p-5 sm:p-6 border-t border-dark-200 dark:border-dark-800 shrink-0 flex justify-end gap-3 bg-dark-50/30 dark:bg-dark-900/30">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="barberForm"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                {editingBarber ? 'Salvar Alterações' : 'Cadastrar Barbeiro'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Excluir (Portal) */}
      {isDeleteModalOpen && deletingBarber && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-sm shadow-2xl p-6 sm:p-8 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <ShieldAlert size={40} />
            </div>
            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">Excluir Profissional?</h3>
            <p className="text-sm md:text-base text-dark-500 dark:text-dark-400 mb-8 leading-relaxed">
              Tem certeza que deseja excluir <strong>{deletingBarber.name}</strong>? Esta ação não será permitida se ele tiver agendamentos futuros pendentes ou confirmados.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-white font-semibold rounded-xl hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/30"
              >
                {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Barbers;
