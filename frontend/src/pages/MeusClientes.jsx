import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, Filter, ExternalLink, Phone, Mail,
  MapPin, Building2, TrendingUp, Eye, Trash2, X,
  CheckCircle2, Clock, AlertCircle, RefreshCw,
  ChevronLeft, ChevronRight, Scissors, AtSign,
  MessageCircle, Star, StickyNote, Save, Calendar,
} from 'lucide-react';
import { fetchLeads, updateLead, deleteLead } from '../services/supabase';

/* ─────────────────────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  novo: {
    label: 'Novo Lead',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
    icon: Star,
  },
  em_contato: {
    label: 'Em Contato',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    icon: Phone,
  },
  convertido: {
    label: 'Convertido',
    color: 'bg-green-500/10 text-green-400 border-green-500/30',
    dot: 'bg-green-400',
    icon: CheckCircle2,
  },
  perdido: {
    label: 'Perdido',
    color: 'bg-red-500/10 text-red-400 border-red-500/30',
    dot: 'bg-red-400',
    icon: X,
  },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, ...v }));

const FATURAMENTO_ORDER = [
  'Até R$ 5.000', 'R$ 5.000 - R$ 10.000', 'R$ 10.000 - R$ 20.000',
  'R$ 20.000 - R$ 50.000', 'Acima de R$ 50.000',
];

const DIA_MAP = {
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
  dom: 'Domingo',
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const formatDate = (iso) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
};

const formatPhone = (p) => p || '—';

const whatsappLink = (phone) => {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean) return null;
  const num = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${num}`;
};

/* ─────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────────────────────── */
const MeusClientes = () => {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  // Modal de detalhes
  const [selected, setSelected] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Carregamento ──────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await fetchLeads({
        status: statusFilter,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      setLeads(data || []);
      setTotal(count || 0);
    } catch (e) {
      setError('Erro ao carregar clientes. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Debounce de busca
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  /* ── Atualizar status ──────────────────────────────────── */
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await updateLead(id, { status: newStatus });
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      if (selected?.id === id) setSelected(updated);
    } catch (_) {}
    setUpdatingStatus(false);
  };

  /* ── Salvar nota ───────────────────────────────────────── */
  const handleSaveNote = async () => {
    if (!selected) return;
    setSavingNote(true);
    try {
      const updated = await updateLead(selected.id, { nota_interna: noteText });
      setLeads((prev) => prev.map((l) => (l.id === selected.id ? updated : l)));
      setSelected(updated);
    } catch (_) {}
    setSavingNote(false);
  };

  /* ── Excluir ───────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLead(deleteTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch (_) {}
    setDeleteTarget(null);
    setDeleting(false);
  };

  /* ── Abrir modal ───────────────────────────────────────── */
  const openModal = (lead) => {
    setSelected(lead);
    setNoteText(lead.nota_interna || '');
  };

  const totalPages = Math.ceil(total / LIMIT);

  /* ── Estatísticas rápidas ──────────────────────────────── */
  const stats = {
    total,
    novo: leads.filter((l) => l.status === 'novo').length,
    em_contato: leads.filter((l) => l.status === 'em_contato').length,
    convertido: leads.filter((l) => l.status === 'convertido').length,
  };

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen bg-dark-50 dark:bg-dark-950 animate-fade-in">

      {/* ── Cabeçalho ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Users size={20} />
            </div>
            Meus Clientes
          </h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
            Leads captados pelo formulário de cadastro do Cadeira Cheia
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-700 text-sm font-medium transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* ── Cards de métricas ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Leads', value: total, icon: Users, color: 'text-primary-500', bg: 'bg-primary-500/10' },
          { label: 'Novos', value: stats.novo, icon: Star, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Em Contato', value: stats.em_contato, icon: Phone, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Convertidos', value: stats.convertido, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-800 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-dark-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-dark-500 dark:text-dark-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, barbearia, email, WhatsApp ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 text-sm text-dark-900 dark:text-white placeholder-dark-400 dark:placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
          />
        </div>

        {/* Filtro status */}
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 text-sm text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all appearance-none cursor-pointer"
          >
            <option value="todos">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabela / Grid ──────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-800 p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-dark-200 dark:bg-dark-700 rounded w-3/4" />
              <div className="h-3 bg-dark-200 dark:bg-dark-700 rounded w-1/2" />
              <div className="h-3 bg-dark-200 dark:bg-dark-700 rounded w-2/3" />
              <div className="h-8 bg-dark-200 dark:bg-dark-700 rounded-xl w-24 mt-2" />
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-dark-100 dark:bg-dark-800 flex items-center justify-center mx-auto">
            <Users size={28} className="text-dark-400" />
          </div>
          <p className="text-dark-500 dark:text-dark-400 font-medium">
            {search || statusFilter !== 'todos' ? 'Nenhum lead encontrado com esses filtros.' : 'Nenhum lead cadastrado ainda.'}
          </p>
          {(search || statusFilter !== 'todos') && (
            <button onClick={() => { setSearch(''); setStatusFilter('todos'); }} className="text-sm text-amber-500 hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => {
              const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.novo;
              const wa = whatsappLink(lead.whatsapp);
              return (
                <div
                  key={lead.id}
                  className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-800 p-5 flex flex-col gap-4 hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all hover:shadow-lg group"
                >
                  {/* Header do card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <Scissors size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-dark-900 dark:text-white text-sm truncate">{lead.nome_barbearia}</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{lead.nome_proprietario}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sc.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 text-xs text-dark-500 dark:text-dark-400">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="shrink-0 text-dark-400" />
                      <span className="truncate">{[lead.cidade, lead.estado].filter(Boolean).join(' — ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="shrink-0 text-dark-400" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="shrink-0 text-dark-400" />
                      <span>{formatPhone(lead.whatsapp)}</span>
                    </div>
                    {lead.num_barbeiros && (
                      <div className="flex items-center gap-2">
                        <Users size={12} className="shrink-0 text-dark-400" />
                        <span>{lead.num_barbeiros} barbeiro{lead.num_barbeiros > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="shrink-0 text-dark-400" />
                      <span>{formatDate(lead.created_at)}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-1 border-t border-dark-100 dark:border-dark-800">
                    <button
                      onClick={() => openModal(lead)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800"
                    >
                      <Eye size={14} /> Detalhes
                    </button>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteTarget(lead)}
                      className="ml-auto flex items-center gap-1 text-xs text-dark-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                      title="Excluir lead"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total} leads
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-dark-700 dark:text-dark-200 px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800 disabled:opacity-40 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal de Detalhes ────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-900 rounded-3xl border border-dark-200 dark:border-dark-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-dark-200 dark:border-dark-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-dark-900 dark:text-white">{selected.nome_barbearia}</h2>
                  <p className="text-sm text-dark-500 dark:text-dark-400">{selected.nome_proprietario}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-900 dark:hover:text-white transition-all shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-3">Status do Lead</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => {
                    const isActive = selected.status === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => handleStatusChange(selected.id, s.value)}
                        disabled={updatingStatus}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-60 ${
                          isActive ? s.color + ' ring-2 ring-offset-1 ring-offset-white dark:ring-offset-dark-900 ring-current' : 'bg-dark-50 dark:bg-dark-800 border-dark-200 dark:border-dark-700 text-dark-500 dark:text-dark-400 hover:border-dark-400'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dados em grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoBlock icon={Mail} label="E-mail" value={selected.email} />
                <InfoBlock icon={Phone} label="WhatsApp" value={selected.whatsapp} link={whatsappLink(selected.whatsapp)} />
                <InfoBlock icon={MapPin} label="Cidade / Estado" value={[selected.cidade, selected.estado].filter(Boolean).join(' - ')} />
                <InfoBlock icon={Building2} label="CNPJ" value={selected.cnpj} />
                <InfoBlock icon={Instagram} label="Instagram" value={selected.instagram} />
                <InfoBlock icon={Phone} label="Tel. Barbearia" value={selected.telefone_barbearia} />
                <InfoBlock icon={Users} label="Nº de Barbeiros" value={selected.num_barbeiros} />
                <InfoBlock icon={TrendingUp} label="Faturamento" value={selected.faturamento_mensal} />
                <InfoBlock icon={Clock} label="Horário" value={selected.horario_abertura && selected.horario_fechamento ? `${selected.horario_abertura} – ${selected.horario_fechamento}` : null} />
                <InfoBlock icon={Calendar} label="Cadastrado em" value={formatDate(selected.created_at)} />
              </div>

              {/* Endereço */}
              {(selected.rua || selected.bairro || selected.cep) && (
                <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-2xl">
                  <p className="text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MapPin size={13} /> Endereço Completo
                  </p>
                  <p className="text-sm text-dark-700 dark:text-dark-200">
                    {[selected.rua, selected.numero, selected.complemento].filter(Boolean).join(', ')}
                    {selected.bairro && ` — ${selected.bairro}`}
                    {selected.cep && ` — CEP ${selected.cep}`}
                  </p>
                </div>
              )}

              {/* Dias e Serviços */}
              {selected.dias_funcionamento?.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-2">Dias de Funcionamento</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.dias_funcionamento.map((d) => (
                      <span key={d} className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">{d.toUpperCase()}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.servicos_interesse?.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-2">Serviços</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.servicos_interesse.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Barbeiros Cadastrados */}
              {selected.barbeiros_nomes?.length > 0 && (
                <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-2xl">
                  <p className="text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users size={13} /> Barbeiros Cadastrados ({selected.barbeiros_nomes.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.barbeiros_nomes.map((nome, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-dark-900 text-dark-800 dark:text-dark-200 border border-dark-200 dark:border-dark-700 shadow-sm">
                        {nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Horários por Dia */}
              {selected.horarios_por_dia && typeof selected.horarios_por_dia === 'object' && Object.keys(selected.horarios_por_dia).length > 0 && (
                <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-2xl">
                  <p className="text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock size={13} /> Horários de Funcionamento por Dia
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-dark-700 dark:text-dark-200">
                    {Object.entries(selected.horarios_por_dia).map(([dia, h]) => {
                      const label = DIA_MAP[dia] || dia.toUpperCase();
                      return (
                        <div key={dia} className="flex justify-between items-center border-b border-dark-200 dark:border-dark-700 pb-1.5">
                          <span className="font-semibold text-xs text-dark-500 dark:text-dark-400">{label}</span>
                          <span className="text-xs font-bold text-dark-800 dark:text-dark-100">{h.abertura} às {h.fechamento}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected.como_conheceu && (
                <InfoBlock icon={Star} label="Como nos conheceu" value={selected.como_conheceu} />
              )}

              {selected.observacoes && (
                <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-2xl">
                  <p className="text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-2">Observações do Cliente</p>
                  <p className="text-sm text-dark-700 dark:text-dark-200 leading-relaxed">{selected.observacoes}</p>
                </div>
              )}

              {/* Nota Interna */}
              <div>
                <label className="block text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <StickyNote size={13} /> Nota Interna (visível só para você)
                </label>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Anotações sobre o contato, negociação, próximos passos..."
                  className="w-full bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all resize-none"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 text-xs font-bold transition-all disabled:opacity-60"
                >
                  {savingNote ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  {savingNote ? 'Salvando...' : 'Salvar Nota'}
                </button>
              </div>

              {/* Ações do modal */}
              <div className="flex items-center gap-3 pt-2 border-t border-dark-200 dark:border-dark-800">
                {whatsappLink(selected.whatsapp) && (
                  <a
                    href={whatsappLink(selected.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all"
                  >
                    <MessageCircle size={16} /> Abrir WhatsApp
                  </a>
                )}
                <button
                  onClick={() => { setSelected(null); setDeleteTarget(selected); }}
                  className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-semibold transition-all"
                >
                  <Trash2 size={15} /> Excluir Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmação de Exclusão ─────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-900 rounded-2xl border border-dark-200 dark:border-dark-800 p-8 max-w-sm w-full text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-dark-900 dark:text-white">Excluir Lead?</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                O cadastro de <strong className="text-dark-700 dark:text-dark-200">{deleteTarget.nome_barbearia}</strong> será excluído permanentemente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 text-sm font-semibold text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-all disabled:opacity-60"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SUBCOMPONENTE
───────────────────────────────────────────────────────────── */
const Instagram = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const InfoBlock = ({ icon: Icon, label, value, link }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-dark-400 dark:text-dark-500 uppercase tracking-wider flex items-center gap-1.5">
        <Icon size={11} /> {label}
      </p>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
          {String(value)} <ExternalLink size={11} />
        </a>
      ) : (
        <p className="text-sm text-dark-800 dark:text-dark-100 font-medium">{String(value)}</p>
      )}
    </div>
  );
};

export default MeusClientes;
