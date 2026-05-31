import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Search, Calendar as CalendarIcon, Clock, User,
  CheckCircle, XCircle, Clock3, AlertCircle, RefreshCw, CalendarX, MoreVertical, X, Trash2, Edit2, Check, MessageCircle, CreditCard
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useApi from '../hooks/useApi';
import { useSocket } from '../hooks/useSocket';
import { toast } from '../hooks/useToast';
import { fetchAppointments, createAppointment, updateAppointment, deleteAppointment, createFinancial, fetchServices, fetchBarbers } from '../services/api';

// ------- Skeleton Row (desktop) -------
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 rounded bg-dark-200 dark:bg-dark-700" style={{ width: `${[48, 32, 28, 20, 24, 16][i]}%` }} />
      </td>
    ))}
  </tr>
);

// ------- Skeleton Card (mobile) -------
const SkeletonCard = () => (
  <div className="glass-panel rounded-2xl p-4 animate-pulse border-l-4 border-dark-200 dark:border-dark-700">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-dark-200 dark:bg-dark-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-dark-200 dark:bg-dark-700" />
        <div className="h-3 w-24 rounded bg-dark-200 dark:bg-dark-700" />
        <div className="h-3 w-20 rounded bg-dark-200 dark:bg-dark-700" />
      </div>
      <div className="h-5 w-20 rounded-full bg-dark-200 dark:bg-dark-700" />
    </div>
  </div>
);

// ------- Status config -------
const STATUS_MAP = {
  confirmado: { style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', label: 'Confirmado', icon: <CheckCircle size={13} className="mr-1" />, border: 'border-emerald-500' },
  confirmed:  { style: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', label: 'Confirmado', icon: <CheckCircle size={13} className="mr-1" />, border: 'border-emerald-500' },
  cancelado:  { style: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-800', label: 'Cancelado', icon: <XCircle size={13} className="mr-1" />, border: 'border-red-500' },
  cancelled:  { style: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-800', label: 'Cancelado', icon: <XCircle size={13} className="mr-1" />, border: 'border-red-500' },
  concluido:  { style: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800', label: 'Concluído', icon: <CheckCircle size={13} className="mr-1" />, border: 'border-blue-500' },
  pendente:    { style: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-800', label: 'Pendente', icon: <Clock3 size={13} className="mr-1" />, border: 'border-orange-400' },
  pending:    { style: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-800', label: 'Pendente', icon: <Clock3 size={13} className="mr-1" />, border: 'border-orange-400' },
};

// ------- Status Badge -------
const StatusBadge = ({ status }) => {
  const config = STATUS_MAP[status] || { style: 'bg-dark-100 text-dark-500 border-dark-200', label: status || '—', icon: null };
  return (
    <span className={`flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.style}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ------- Helpers -------
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try { return format(parseISO(dateStr), "dd 'de' MMM", { locale: ptBR }); }
  catch { return dateStr; }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  return timeStr.substring(0, 5);
};

// ------- Action Modal (Portal) -------
const ActionModal = ({ apt, isOpen, onClose, onEdit, onDelete, onStatusChange }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen || !apt) return null;

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
          <h3 className="font-bold text-dark-900 dark:text-white text-lg">Ações</h3>
          <button 
            onClick={onClose} 
            className="p-2 text-dark-400 hover:text-dark-900 dark:hover:text-white rounded-xl hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-3 space-y-1">
          <button onClick={() => { onClose(); onEdit(apt); }} className="w-full text-left px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl flex items-center gap-3 transition-colors">
            <Edit2 size={18} className="text-blue-500" /> Editar Agendamento
          </button>
          {apt.status !== 'concluido' && (
            <button onClick={() => { onClose(); onStatusChange(apt, 'concluido'); }} className="w-full text-left px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl flex items-center gap-3 transition-colors">
              <CheckCircle size={18} className="text-emerald-500" /> Marcar como Concluído
            </button>
          )}
          {apt.status !== 'cancelado' && (
            <button onClick={() => { onClose(); onStatusChange(apt, 'cancelado'); }} className="w-full text-left px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl flex items-center gap-3 transition-colors">
              <XCircle size={18} className="text-orange-500" /> Cancelar Agendamento
            </button>
          )}
          <button onClick={() => { onClose(); window.open(`https://wa.me/${apt.client_phone?.replace(/\D/g, '')}`, '_blank'); }} className="w-full text-left px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl flex items-center gap-3 transition-colors">
            <MessageCircle size={18} className="text-emerald-400" /> Abrir WhatsApp
          </button>
          <div className="h-px bg-dark-200 dark:bg-dark-800 my-2"></div>
          <button onClick={() => { onClose(); onDelete(apt); }} className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors">
            <Trash2 size={18} /> Excluir Agendamento
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ------- Payment Modal -------
const PAYMENT_METHODS = [
  { value: 'pix',      label: 'PIX',    emoji: '📱' },
  { value: 'dinheiro', label: 'Dinheiro', emoji: '💵' },
  { value: 'cartao',   label: 'Cartão',  emoji: '💳' },
];

const PaymentModal = ({ apt, isOpen, onClose, onConfirm, isSubmitting }) => {
  const [method, setMethod] = useState('');
  useEffect(() => { if (isOpen) setMethod(''); }, [isOpen]);
  if (!isOpen || !apt) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-dark-200 dark:border-dark-800">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-emerald-500" />
            <h3 className="font-bold text-dark-900 dark:text-white">Registrar Pagamento</h3>
          </div>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-200 dark:hover:bg-dark-700 rounded-xl transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-dark-500 dark:text-dark-400">Selecione o método de pagamento para <strong className="text-dark-900 dark:text-white">{apt.client_name}</strong>:</p>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map(m => (
              <button key={m.value} onClick={() => setMethod(m.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  method === m.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
                }`}>
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs font-semibold text-dark-700 dark:text-dark-200">{m.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-white font-semibold rounded-xl hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors text-sm">Cancelar</button>
            <button onClick={() => onConfirm(method)} disabled={!method || isSubmitting}
              className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
              {isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ------- Appointments Page -------
const Appointments = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: appointments, loading, error, refetch } = useApi(fetchAppointments, { interval: 30_000 });
  const { data: services } = useApi(fetchServices);
  const { data: barbers } = useApi(fetchBarbers);
  const [barberFilter, setBarberFilter] = useState('todos');

  // Realtime: atualiza lista ao receber eventos de agendamento
  useSocket(['appointment_created', 'appointment_updated', 'appointment_deleted', 'appointment_concluido'], () => {
    refetch();
  });

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [actionApt, setActionApt] = useState(null);
  const [editingApt, setEditingApt] = useState(null);
  const [deletingApt, setDeletingApt] = useState(null);
  const [pendingConcluido, setPendingConcluido] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ 
    client_name: '', 
    client_phone: '', 
    service: '', 
    service_id: '',
    date: '', 
    time: '', 
    barber_id: '', 
    notes: '', 
    status: 'pendente' 
  });

  const filtered = useMemo(() => {
    if (!appointments) return [];
    const q = debouncedSearch.toLowerCase();
    return appointments.filter(
      (a) => {
        const matchesSearch = (a.client_name || '').toLowerCase().includes(q) ||
          (a.client_phone || '').includes(q) ||
          (a.service || '').toLowerCase().includes(q);
        
        const matchesStatus = statusFilter === 'todos' || a.status === statusFilter;
        const matchesBarber = barberFilter === 'todos' || a.barber_id === barberFilter;
        
        return matchesSearch && matchesStatus && matchesBarber;
      }
    );
  }, [appointments, debouncedSearch, statusFilter, barberFilter]);

  const handleOpenModal = (apt = null) => {
    if (apt) {
      setEditingApt(apt);
      setFormData({ 
        client_name: apt.client_name || '', 
        client_phone: apt.client_phone || '', 
        service: apt.service || '', 
        service_id: apt.service_id || '',
        date: apt.date || '', 
        time: apt.time?.substring(0, 5) || '', 
        barber_id: apt.barber_id || '', 
        notes: apt.notes || '', 
        status: apt.status || 'pendente' 
      });
    } else {
      setEditingApt(null);
      setFormData({ 
        client_name: '', 
        client_phone: '', 
        service: '', 
        service_id: '',
        date: '', 
        time: '', 
        barber_id: '', 
        notes: '', 
        status: 'pendente' 
      });
    }
    setIsModalOpen(true);
  };

  const handleStatusChange = (apt, newStatus) => {
    if (newStatus === 'concluido') {
      // Abre modal de pagamento antes de marcar como concluído
      setPendingConcluido(apt);
      setIsPaymentModalOpen(true);
      return;
    }
    _doStatusChange(apt, newStatus);
  };

  const _doStatusChange = async (apt, newStatus, paymentMethod = null) => {
    setIsSubmitting(true);
    try {
      await updateAppointment(apt.id, { status: newStatus });
      // Se concluído, registra/atualiza o financial_record com método de pagamento
      if (newStatus === 'concluido' && paymentMethod) {
        await createFinancial({
          appointment_id: apt.id,
          service: apt.service,
          payment_method: paymentMethod,
          status: 'pago',
        });
      }
      toast.success(newStatus === 'concluido' ? 'Atendimento concluído e pagamento registrado!' : 'Status atualizado com sucesso.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentConfirm = async (paymentMethod) => {
    if (!pendingConcluido || !paymentMethod) return;
    setIsPaymentModalOpen(false);
    await _doStatusChange(pendingConcluido, 'concluido', paymentMethod);
    setPendingConcluido(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Front-end Validations
    const [hours, minutes] = formData.time.split(':').map(Number);
    if (hours < 8 || hours > 20) {
      toast.error('O horário deve estar entre 08:00 e 20:00.');
      return;
    }

    if (!editingApt || (editingApt.date !== formData.date || editingApt.time.substring(0, 5) !== formData.time || editingApt.barber_id !== formData.barber_id)) {
      // Validate conflict
      const hasConflict = appointments?.some(a => 
        a.date === formData.date && 
        a.time.substring(0, 5) === formData.time && 
        a.status !== 'cancelado' &&
        a.barber_id === (formData.barber_id || null) &&
        a.id !== editingApt?.id
      );
      if (hasConflict) {
        toast.error('Conflito: Este barbeiro já possui um agendamento para este horário.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingApt) {
        await updateAppointment(editingApt.id, formData);
        toast.success('Agendamento atualizado com sucesso.');
      } else {
        await createAppointment(formData);
        toast.success('Agendamento criado com sucesso.');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingApt) return;
    setIsSubmitting(true);
    try {
      await deleteAppointment(deletingApt.id);
      toast.success('Agendamento excluído com sucesso.');
      setIsDeleteModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir agendamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-0 relative z-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-1">Agendamentos</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 hidden sm:block">
            Gerencie os horários da barbearia.{' '}
            {!loading && appointments && (
              <span className="font-medium text-dark-700 dark:text-dark-300">{appointments.length} no total</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            title="Atualizar"
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
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-xs md:text-sm">Erro ao carregar agendamentos: {error}</span>
        </div>
      )}

      {/* Campo de Busca e Filtros */}
      <div className="sticky top-14 md:top-20 z-20 bg-dark-50/95 dark:bg-dark-950/95 backdrop-blur-sm py-2 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:backdrop-blur-none md:py-0 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente ou serviço..."
              className="w-full bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-dark-100 placeholder-dark-400 shadow-sm transition-shadow hover:shadow-md"
            />
          </div>
          <div>
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="w-full bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-dark-100 shadow-sm outline-none"
            >
              <option value="todos">Filtrar: Todos os Barbeiros</option>
              {barbers?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {[
            { id: 'todos', label: 'Todos', color: 'gray' },
            { id: 'pendente', label: 'Pendentes', color: 'orange' },
            { id: 'confirmado', label: 'Confirmados', color: 'emerald' },
            { id: 'concluido', label: 'Concluídos', color: 'blue' },
            { id: 'cancelado', label: 'Cancelados', color: 'red' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                statusFilter === filter.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
                  : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-400 border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== MOBILE: Lista de Cards ===== */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl py-16 flex flex-col items-center gap-3 text-dark-400">
            <CalendarX size={28} />
            <span className="text-sm text-center px-6">
              {search ? 'Nenhum agendamento encontrado para essa busca.' : 'Nenhum agendamento cadastrado.'}
            </span>
          </div>
        ) : (
          filtered.map((apt) => {
            const statusConfig = STATUS_MAP[apt.status] || {};
            const borderColor = statusConfig.border || 'border-dark-300 dark:border-dark-600';
            return (
              <div
                key={apt.id}
                className={`glass-panel rounded-2xl p-4 flex items-start gap-3 border-l-4 ${borderColor} active:scale-[0.98] transition-transform`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center text-dark-500 dark:text-dark-400 shrink-0 mt-0.5">
                  <User size={16} />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark-900 dark:text-white text-sm truncate">
                    {apt.client_name || <span className="text-dark-400 italic">Sem nome</span>}
                  </p>
                  {apt.service && (
                    <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5 truncate">{apt.service}</p>
                  )}
                  {apt.barber_name && (
                    <p className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold mt-0.5">Barbeiro: {apt.barber_name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-dark-400">
                      <CalendarIcon size={11} />
                      {formatDate(apt.date)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-dark-400">
                      <Clock size={11} />
                      {formatTime(apt.time)}
                    </span>
                  </div>
                </div>
                {/* Status + Ações */}
                <div className="shrink-0 mt-0.5 flex flex-col items-end gap-2">
                  <StatusBadge status={apt.status} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActionApt(apt); }}
                    className="text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors p-2 -mr-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== DESKTOP: Tabela ===== */}
      <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-dark-200 dark:border-dark-800 flex justify-between items-center bg-white/50 dark:bg-dark-900/50">
          <div className="text-sm text-dark-500 dark:text-dark-400 font-medium">
            {format(new Date(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-50/50 dark:bg-dark-800/50 text-dark-500 dark:text-dark-400 text-sm border-b border-dark-200 dark:border-dark-800">
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Serviço</th>
                <th className="px-6 py-4 font-medium">Barbeiro</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Horário</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200 dark:divide-dark-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-dark-400">
                      <CalendarX size={32} />
                      <span className="text-sm">
                        {search ? 'Nenhum agendamento encontrado para essa busca.' : 'Nenhum agendamento cadastrado.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-dark-50/50 dark:hover:bg-dark-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center text-dark-500 dark:text-dark-400 shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <span className="font-medium text-dark-900 dark:text-white block">
                            {apt.client_name || <span className="text-dark-400 italic">Sem nome</span>}
                          </span>
                          {apt.client_phone && (
                            <span className="text-xs text-dark-400">{apt.client_phone}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-300">{apt.service || '—'}</td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-300 font-semibold text-primary-600 dark:text-primary-400">
                      {apt.barber_name || <span className="text-dark-400 italic font-normal">Sem barbeiro</span>}
                    </td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-300">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={16} className="text-dark-400" />
                        {formatDate(apt.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-300">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-dark-400" />
                        {formatTime(apt.time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActionApt(apt); }}
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

      {/* ===== FAB — Novo Agendamento (mobile) ===== */}
      <button
        onClick={() => handleOpenModal()}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-xl shadow-primary-500/40 flex items-center justify-center transition-all active:scale-90"
        aria-label="Novo agendamento"
      >
        <Plus size={24} />
      </button>

      {/* Action Modal */}
      <ActionModal 
        isOpen={!!actionApt}
        apt={actionApt}
        onClose={() => setActionApt(null)}
        onEdit={(apt) => handleOpenModal(apt)}
        onDelete={(apt) => { setDeletingApt(apt); setIsDeleteModalOpen(true); }}
        onStatusChange={handleStatusChange}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        apt={pendingConcluido}
        isSubmitting={isSubmitting}
        onClose={() => { setIsPaymentModalOpen(false); setPendingConcluido(null); }}
        onConfirm={handlePaymentConfirm}
      />

      {/* Modal Criar/Editar (Portal) */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-dark-200 dark:border-dark-800 shrink-0">
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">
                {editingApt ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form id="apt-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Cliente (Nome)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.client_name} 
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})} 
                    placeholder="Ex: João Silva"
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Telefone <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.client_phone} 
                    onChange={(e) => setFormData({...formData, client_phone: e.target.value})} 
                    placeholder="(00) 00000-0000"
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Serviço <span className="text-red-500">*</span></label>
                  <select 
                    required
                    value={formData.service_id} 
                    onChange={(e) => {
                      const srv = services?.find(s => s.id === e.target.value);
                      setFormData({...formData, service_id: e.target.value, service: srv?.nome || ''});
                    }}
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none"
                  >
                    <option value="">Selecione um serviço</option>
                    {services ? [...services].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(s => (
                      <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco}</option>
                    )) : null}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Data <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    required
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})} 
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Horário <span className="text-red-500">*</span></label>
                  <input 
                    type="time" 
                    required
                    value={formData.time} 
                    onChange={(e) => setFormData({...formData, time: e.target.value})} 
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Barbeiro</label>
                  <select 
                    value={formData.barber_id} 
                    onChange={(e) => setFormData({...formData, barber_id: e.target.value})}
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none"
                  >
                    <option value="">Sem barbeiro específico</option>
                    {barbers?.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-dark-700 dark:text-dark-300 mb-1.5">Observação</label>
                  <textarea 
                    rows="3"
                    value={formData.notes} 
                    onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                    placeholder="Ex: Primeira vez, prefere fade..."
                    className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white outline-none resize-none"
                  />
                </div>
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
                form="apt-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors shadow-lg shadow-primary-500/30 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Excluir (Portal) */}
      {isDeleteModalOpen && deletingApt && createPortal(
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
            <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-2">Excluir Agendamento?</h3>
            <p className="text-sm md:text-base text-dark-500 dark:text-dark-400 mb-8 leading-relaxed">
              Tem certeza que deseja excluir o agendamento de <strong>{deletingApt.client_name}</strong>? Esta ação não pode ser desfeita.
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
                {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Appointments;
