import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { Plus, Search, Phone, Clock, MoreVertical, AlertCircle, RefreshCw, UserX, ChevronRight, Edit2, Trash2, Eye, Calendar, MessageCircle, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { fetchClients, createClient, updateClient, deleteClient } from '../services/api';

// ------- Skeleton Row (desktop) -------
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
    <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-dark-200 dark:bg-dark-700 ml-auto" /></td>
  </tr>
);

// ------- Skeleton Card (mobile) -------
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

// ------- Status Badge -------
const StatusBadge = ({ status }) => {
  const map = {
    cliente:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    lead:     'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    agendado: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  };
  const label = { cliente: 'Cliente', lead: 'Lead', agendado: 'Agendado' };
  if (!status) return null;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-dark-100 text-dark-500'}`}>
      {label[status] || status}
    </span>
  );
};

// ------- Action Modal (Menu de 3 Pontos) -------
const ActionModal = ({ client, isOpen, onClose, onEdit, onDelete, onView }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !client) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-dark-200 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-800/50">
          <h3 className="font-bold text-dark-900 dark:text-white text-lg">Ações do Cliente</h3>
          <button 
            onClick={onClose} 
            className="p-2 text-dark-400 hover:text-dark-900 dark:hover:text-white rounded-xl hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-3 space-y-1">
          <button onClick={() => { onClose(); onView(client); }} className="w-full text-left px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl flex items-center gap-3 transition-colors">
            <Eye size={18} className="text-blue-500" /> Visualizar Detalhes
          </button>
          <button onClick={() => { onClose(); onEdit(client); }} className="w-full text-left px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl flex items-center gap-3 transition-colors">
            <Edit2 size={18} className="text-emerald-500" /> Editar Cliente
          </button>
          <button onClick={() => { onClose(); window.open(`https://wa.me/${client.phone?.replace(/\D/g, '')}`, '_blank'); }} className="w-full text-left px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl flex items-center gap-3 transition-colors">
            <MessageCircle size={18} className="text-emerald-400" /> Abrir WhatsApp
          </button>
          <button onClick={() => { onClose(); navigate('/appointments'); }} className="w-full text-left px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl flex items-center gap-3 transition-colors">
            <Calendar size={18} className="text-purple-500" /> Criar Agendamento
          </button>
          <div className="h-px bg-dark-200 dark:bg-dark-800 my-2"></div>
          <button onClick={() => { onClose(); onDelete(client); }} className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors">
            <Trash2 size={18} /> Excluir Cliente
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ------- Clients Page -------
const Clients = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: clientsRaw, loading, error, refetch } = useApi(fetchClients, { interval: 60_000 });

  // Estado local espelhado — permite patches em tempo real sem refetch completo
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (clientsRaw) setClients(clientsRaw);
  }, [clientsRaw]);

  // Socket.io — atualiza status do cliente em tempo real
  useEffect(() => {
    const socket = io('https://agente-backend.amxxqr.easypanel.host');

    socket.on('client_status_updated', (updatedClient) => {
      setClients((prev) =>
        prev.map((c) =>
          c.id === updatedClient.id ? { ...c, ...updatedClient } : c
        )
      );
    });

    return () => socket.disconnect();
  }, []);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionClient, setActionClient] = useState(null); // Controls the Action Modal
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [deletingClient, setDeletingClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ name: '', phone: '', status: 'lead', notes: '' });

  // Prevent background scroll when modals are open
  useEffect(() => {
    if (isModalOpen || isViewModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isModalOpen, isViewModalOpen, isDeleteModalOpen]);

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = debouncedSearch.toLowerCase();
    return clients.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q)
    );
  }, [clients, debouncedSearch]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getInitial = (client) =>
    (client.name || client.phone || '?').charAt(0).toUpperCase();

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({ name: client.name || '', phone: client.phone || '', status: client.status || 'lead', notes: client.notes || '' });
    } else {
      setEditingClient(null);
      setFormData({ name: '', phone: '', status: 'lead', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        showToast('Cliente atualizado com sucesso');
      } else {
        await createClient(formData);
        showToast('Cliente criado com sucesso');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao salvar cliente', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    setIsSubmitting(true);
    try {
      await deleteClient(deletingClient.id);
      showToast('Cliente excluído com sucesso');
      setIsDeleteModalOpen(false);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao excluir cliente', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-0 relative z-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-1">Clientes</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 hidden sm:block">
            Gestão de carteira.{' '}
            {!loading && clients && (
              <span className="font-medium text-dark-700 dark:text-dark-300">{clients.length} cadastrados</span>
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
          {/* Botão "Novo" — só desktop */}
          <button 
            onClick={() => handleOpenModal()} 
            className="hidden md:flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary-500/30"
          >
            <Plus size={18} />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-xs md:text-sm">Erro ao carregar clientes: {error}</span>
        </div>
      )}

      {/* Campo de Busca — sticky no topo em mobile */}
      <div className="sticky top-14 md:top-20 z-20 bg-dark-50/95 dark:bg-dark-950/95 backdrop-blur-sm py-2 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:backdrop-blur-none md:py-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-dark-100 placeholder-dark-400 shadow-sm transition-shadow hover:shadow-md"
          />
        </div>
      </div>

      {/* ===== MOBILE: Lista de Cards ===== */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl py-16 flex flex-col items-center gap-3 text-dark-400">
            <UserX size={28} />
            <span className="text-sm text-center px-6">
              {search ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}
            </span>
          </div>
        ) : (
          filtered.map((client) => (
            <div
              key={client.id}
              onClick={() => { setViewingClient(client); setIsViewModalOpen(true); }}
              className="glass-panel rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform cursor-pointer"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20 shrink-0">
                {getInitial(client)}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dark-900 dark:text-white text-sm truncate">
                  {client.name || <span className="text-dark-400 italic">Sem nome</span>}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone size={12} className="text-dark-400 shrink-0" />
                  <span className="text-xs text-dark-500 dark:text-dark-400 truncate">{client.phone || '—'}</span>
                </div>
              </div>
              {/* Status + Ações */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <StatusBadge status={client.status} />
                <button 
                  onClick={(e) => { e.stopPropagation(); setActionClient(client); }}
                  className="text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors p-2 -mr-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== DESKTOP: Tabela ===== */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
        {/* Search toolbar desktop */}
        <div className="p-6 border-b border-dark-200 dark:border-dark-800 bg-white/50 dark:bg-dark-900/50 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-dark-100 placeholder-dark-400 shadow-sm transition-shadow hover:shadow-md"
            />
          </div>
          {!loading && clients && (
            <span className="text-sm text-dark-500 dark:text-dark-400 shrink-0">{clients.length} clientes</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-50/50 dark:bg-dark-800/50 text-dark-500 dark:text-dark-400 text-sm border-b border-dark-200 dark:border-dark-800">
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Telefone</th>
                <th className="px-6 py-4 font-medium">Cadastrado em</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200 dark:divide-dark-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-dark-400">
                      <UserX size={32} />
                      <span className="text-sm">
                        {search ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-dark-50/50 dark:hover:bg-dark-800/30 transition-colors">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => { setViewingClient(client); setIsViewModalOpen(true); }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20 shrink-0">
                          {getInitial(client)}
                        </div>
                        <span className="font-medium text-dark-900 dark:text-white">
                          {client.name || <span className="text-dark-400 italic">Sem nome</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-300">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-dark-400" />
                        {client.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-300">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-dark-400" />
                        {formatDate(client.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActionClient(client); }}
                          className="text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
                        >
                          <MoreVertical size={18} />
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

      {/* ===== FAB — Novo Cliente (mobile) ===== */}
      <button
        onClick={() => handleOpenModal()}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl shadow-primary-500/40 flex items-center justify-center transition-all active:scale-90"
        aria-label="Novo cliente"
      >
        <Plus size={24} />
      </button>

      {/* Action Modal Centralizado (Substitui o ActionDropdown antigo) */}
      <ActionModal 
        isOpen={!!actionClient}
        client={actionClient}
        onClose={() => setActionClient(null)}
        onEdit={(client) => handleOpenModal(client)}
        onDelete={(client) => { setDeletingClient(client); setIsDeleteModalOpen(true); }}
        onView={(client) => { setViewingClient(client); setIsViewModalOpen(true); }}
      />

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
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form id="clientForm" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Nome</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Nome do cliente"
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Telefone <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="(00) 00000-0000"
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none transition-shadow"
                >
                  <option value="lead">Lead</option>
                  <option value="cliente">Cliente</option>
                  <option value="agendado">Agendado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Observações</label>
                <textarea 
                  rows="4"
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                  placeholder="Detalhes adicionais..."
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none transition-shadow resize-none"
                />
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
                form="clientForm"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Visualizar (Portal) */}
      {isViewModalOpen && viewingClient && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsViewModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-sm sm:max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-dark-200 dark:border-dark-800 shrink-0">
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">Ficha do Cliente</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 flex flex-col items-center gap-5 overflow-y-auto">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-primary-500/20 shrink-0">
                {getInitial(viewingClient)}
              </div>
              <div className="text-center w-full">
                <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-1 truncate">{viewingClient.name || 'Sem nome'}</h3>
                <p className="text-dark-500 dark:text-dark-400 text-base">{viewingClient.phone}</p>
                <div className="mt-3"><StatusBadge status={viewingClient.status} /></div>
              </div>
              
              <div className="w-full mt-2 space-y-4 text-sm">
                <div className="bg-dark-50 dark:bg-dark-800 rounded-2xl p-4">
                  <p className="text-dark-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider mb-1.5">Cadastrado em</p>
                  <p className="text-dark-900 dark:text-white font-medium">{formatDate(viewingClient.created_at)}</p>
                </div>
                {viewingClient.notes && (
                  <div className="bg-dark-50 dark:bg-dark-800 rounded-2xl p-4">
                    <p className="text-dark-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider mb-1.5">Observações</p>
                    <p className="text-dark-900 dark:text-white font-medium whitespace-pre-wrap leading-relaxed">{viewingClient.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-5 bg-dark-50/50 dark:bg-dark-800/50 border-t border-dark-200 dark:border-dark-800 flex justify-end shrink-0">
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="px-6 py-2.5 bg-dark-200 dark:bg-dark-700 text-dark-900 dark:text-white rounded-xl text-sm font-semibold hover:bg-dark-300 dark:hover:bg-dark-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Excluir (Portal) */}
      {isDeleteModalOpen && deletingClient && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-sm shadow-2xl p-6 sm:p-8 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">Excluir Cliente?</h3>
            <p className="text-sm md:text-base text-dark-500 dark:text-dark-400 mb-8 leading-relaxed">
              Tem certeza que deseja excluir <strong>{deletingClient.name}</strong>? Esta ação não pode ser desfeita e removerá todo o histórico.
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

export default Clients;
