import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, RefreshCw, AlertCircle, Phone, Sparkles, CreditCard, Check, X } from 'lucide-react';
import { format, parseISO, isToday, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBarberAuth } from '../context/BarberAuthContext';
import { useSocket } from '../hooks/useSocket';
import { fetchAppointments, updateAppointment, createFinancial } from '../services/api';

const STATUS_MAP = {
  confirmado: { style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Confirmado' },
  concluido:  { style: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Concluído' },
  cancelado:  { style: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Cancelado' },
  pendente:   { style: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'Pendente' },
};

// ------- Componente: Modal de Pagamento -------
const PaymentModal = ({ isOpen, onClose, onConfirm, isSubmitting, clientName }) => {
  const [method, setMethod] = useState('');
  useEffect(() => { if (isOpen) setMethod(''); }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-dark-900 border border-dark-800 rounded-3xl w-full max-w-sm overflow-hidden p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 mb-4">
          <CreditCard size={20} className="text-emerald-400" />
          <h3 className="font-bold text-white text-lg">Concluir & Receber</h3>
        </div>
        
        <p className="text-xs text-dark-400 mb-5 leading-relaxed">
          Selecione a forma de pagamento do cliente <strong className="text-white">{clientName}</strong>:
        </p>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[
            { value: 'pix', label: 'PIX', icon: '📱' },
            { value: 'dinheiro', label: 'Dinheiro', icon: '💵' },
            { value: 'cartao', label: 'Cartão', icon: '💳' }
          ].map(m => (
            <button 
              key={m.value} 
              type="button"
              onClick={() => setMethod(m.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                method === m.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-dark-800 bg-dark-850 hover:border-dark-750 text-dark-300'
              }`}
            >
              <span className="text-xl">{m.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-3 bg-dark-800 hover:bg-dark-750 text-dark-300 font-semibold rounded-xl text-xs transition-colors"
          >
            Voltar
          </button>
          <button 
            type="button"
            onClick={() => onConfirm(method)} 
            disabled={!method || isSubmitting}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ------- Componente: Agenda -------
const BarberAgenda = () => {
  const { barber } = useBarberAuth();
  const [tab, setTab] = useState('hoje'); // 'hoje' | 'semana' | 'todos'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);
  
  // Payment Modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentApt, setPaymentApt] = useState(null);

  const loadAppointments = async () => {
    if (!barber) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAppointments({ barber_id: barber.id });
      setAppointments(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar sua agenda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [barber]);

  // Realtime updates using existing hook
  useSocket(['appointment_created', 'appointment_updated', 'appointment_deleted', 'appointment_concluido'], () => {
    loadAppointments();
  });

  const filtered = useMemo(() => {
    if (!appointments) return [];
    
    return appointments.filter(a => {
      if (tab === 'hoje') {
        return a.date && isToday(parseISO(a.date));
      }
      if (tab === 'semana') {
        return a.date && isSameWeek(parseISO(a.date), new Date(), { weekStartsOn: 1 });
      }
      return true;
    });
  }, [appointments, tab]);

  const handleCancel = async (aptId) => {
    if (!window.confirm('Deseja realmente cancelar este atendimento?')) return;
    setSubmittingId(aptId);
    try {
      await updateAppointment(aptId, { status: 'cancelado' });
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao cancelar atendimento.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCompleteClick = (apt) => {
    setPaymentApt(apt);
    setIsPaymentOpen(true);
  };

  const handleConfirmPayment = async (paymentMethod) => {
    if (!paymentApt || !paymentMethod) return;
    setSubmittingId(paymentApt.id);
    setIsPaymentOpen(false);
    try {
      // Conclui o agendamento
      await updateAppointment(paymentApt.id, { status: 'concluido' });
      // Cria registro financeiro associado
      await createFinancial({
        appointment_id: paymentApt.id,
        service: paymentApt.service,
        payment_method: paymentMethod,
        status: 'pago'
      });
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao concluir atendimento.');
    } finally {
      setSubmittingId(null);
      setPaymentApt(null);
    }
  };

  const formatDateLabel = (dateStr) => {
    try {
      return format(parseISO(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Sparkles size={18} className="text-primary-500 animate-pulse" /> Minha Agenda
        </h1>
        <p className="text-xs text-dark-400 mt-0.5">Veja seus atendimentos e controle seus horários.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-900/60 p-1 border border-dark-800 rounded-2xl gap-1 shrink-0">
        {[
          { id: 'hoje', label: 'Hoje' },
          { id: 'semana', label: 'Esta Semana' },
          { id: 'todos', label: 'Ver Todos' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
              tab === t.id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/10'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      )}

      {/* List Container */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-dark-900 border border-dark-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel border border-dark-800 bg-dark-900/40 rounded-3xl py-12 flex flex-col items-center justify-center text-center gap-3 text-dark-500">
            <CalendarIcon size={32} className="opacity-20" />
            <p className="text-sm px-6">Nenhum agendamento encontrado para este período.</p>
          </div>
        ) : (
          filtered.map(apt => {
            const st = STATUS_MAP[apt.status] || { style: 'bg-dark-800 text-dark-400 border-dark-750', label: apt.status };
            const isCompletedOrCanceled = apt.status === 'concluido' || apt.status === 'cancelado';
            
            return (
              <div 
                key={apt.id} 
                className="glass-panel border border-dark-800 bg-dark-900/50 rounded-3xl p-5 flex flex-col gap-4 relative"
              >
                {/* Header card */}
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{apt.client_name}</h3>
                    <p className="text-xs text-primary-400 font-semibold mt-0.5">{apt.service || 'Corte Geral'}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${st.style}`}>
                    {st.label}
                  </span>
                </div>

                {/* Detail card */}
                <div className="flex flex-col gap-1.5 text-xs text-dark-400 bg-dark-950/40 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={13} className="text-dark-500 shrink-0" />
                    <span>{formatDateLabel(apt.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-dark-500 shrink-0" />
                    <span className="font-medium text-white">{apt.time?.substring(0, 5)}</span>
                  </div>
                  {apt.client_phone && (
                    <div className="flex items-center gap-2 pt-1 border-t border-dark-850/50 mt-1">
                      <Phone size={13} className="text-dark-500 shrink-0" />
                      <a href={`tel:${apt.client_phone}`} className="text-primary-400 active:underline">{apt.client_phone}</a>
                    </div>
                  )}
                </div>

                {/* Actions card (only for active appointments) */}
                {!isCompletedOrCanceled && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={submittingId === apt.id}
                      onClick={() => handleCancel(apt.id)}
                      className="flex-1 py-2.5 bg-dark-850 hover:bg-dark-800 text-red-400 hover:text-red-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-dark-800"
                    >
                      <XCircle size={14} /> Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={submittingId === apt.id}
                      onClick={() => handleCompleteClick(apt)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
                    >
                      <CheckCircle2 size={14} /> Concluir
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Payment Confirmation Modal */}
      <PaymentModal 
        isOpen={isPaymentOpen}
        clientName={paymentApt?.client_name || ''}
        isSubmitting={submittingId === paymentApt?.id}
        onClose={() => { setIsPaymentOpen(false); setPaymentApt(null); }}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
};

export default BarberAgenda;
