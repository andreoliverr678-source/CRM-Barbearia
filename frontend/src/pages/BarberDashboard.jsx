import React from 'react';
import { Users, Calendar, ArrowUpRight, RefreshCw, AlertCircle, DollarSign, TrendingUp, Scissors } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useApi from '../hooks/useApi';
import { useSocket } from '../hooks/useSocket';
import { fetchBarberDashboard } from '../services/api';

// ------- Skeleton Stat Card -------
const StatSkeleton = () => (
  <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="w-8 h-8 rounded-lg bg-dark-800" />
    </div>
    <div className="h-3 w-16 rounded bg-dark-800 mb-2" />
    <div className="h-6 w-20 rounded bg-dark-800" />
  </div>
);

// ------- Stat Card Component -------
const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl transition-all duration-300">
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2 rounded-xl ${colorClass}`}>
        <Icon size={18} />
      </div>
    </div>
    <div>
      <h3 className="text-dark-400 text-xs font-semibold mb-1">{title}</h3>
      <h2 className="text-xl font-bold text-white truncate">{value}</h2>
      {subtitle && (
        <p className="text-[10px] text-dark-500 mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  </div>
);

// ------- Barber Dashboard Page -------
const BarberDashboard = () => {
  const { data: dashboard, loading, error, refetch } = useApi(fetchBarberDashboard, { interval: 30_000 });

  // Update on real-time events relevant to the barber
  useSocket(['financial_new', 'financial_updated', 'appointment_concluido'], () => {
    refetch();
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Meu Desempenho</h1>
          <p className="text-xs text-dark-400 mt-0.5">Métricas e resultados individuais no mês.</p>
        </div>
        <button
          onClick={refetch}
          title="Sincronizar"
          className="p-2.5 rounded-xl bg-dark-900 border border-dark-800 text-dark-400 hover:text-white transition-all active:scale-90"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          <span className="text-xs">Erro ao carregar métricas: {error}</span>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading && !dashboard ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Faturamento (Mês)"
              value={formatCurrency(dashboard?.revenue)}
              icon={DollarSign}
              colorClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              subtitle={dashboard?.avgTicket > 0 ? `Ticket médio ${formatCurrency(dashboard.avgTicket)}` : null}
            />
            <StatCard
              title="Agendamentos Hoje"
              value={dashboard?.appointmentsToday || 0}
              icon={Calendar}
              colorClass="bg-blue-500/10 text-blue-400 border border-blue-500/20"
            />
            <StatCard
              title="Clientes Fixos"
              value={dashboard?.totalClients || 0}
              icon={Users}
              colorClass="bg-purple-500/10 text-purple-400 border border-purple-500/20"
            />
            <StatCard
              title="Ticket Médio"
              value={formatCurrency(dashboard?.avgTicket)}
              icon={TrendingUp}
              colorClass="bg-orange-500/10 text-orange-400 border border-orange-500/20"
            />
          </>
        )}
      </div>

      {/* Weekly Chart */}
      <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl flex flex-col h-[280px] w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Atendimentos Semanais</h3>
            <p className="text-[10px] text-dark-400 mt-0.5">Fluxo de clientes por dia</p>
          </div>
          <span className="text-[9px] font-semibold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
            Realtime
          </span>
        </div>

        <div className="flex-1 min-h-0 w-full text-xs">
          {loading && !dashboard ? (
            <div className="w-full h-full bg-dark-950/60 rounded-xl animate-pulse" />
          ) : !dashboard?.chartData || dashboard.chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-dark-500">
              <TrendingUp size={24} className="mb-1 opacity-20" />
              <span className="text-xs">Sem dados suficientes</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.chartData} margin={{ top: 5, right: 5, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id="barberColorApt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc', fontSize: '11px' }}
                  itemStyle={{ color: '#c084fc', fontWeight: 650 }}
                />
                <Area type="monotone" dataKey="atendimentos" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#barberColorApt)" activeDot={{ r: 5, fill: '#a855f7', stroke: '#0f172a', strokeWidth: 1.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Services */}
      <div className="bg-dark-900 border border-dark-800 p-4 rounded-2xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
          <Scissors size={14} className="text-primary-400" />
          Serviços Mais Efetuados (Mês)
        </h3>
        <div className="space-y-2.5">
          {loading && !dashboard ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-10 bg-dark-950/60 rounded-xl animate-pulse" />
            ))
          ) : !dashboard?.popularServices?.length ? (
            <div className="py-4 text-center text-xs text-dark-500">Nenhum serviço efetuado ainda.</div>
          ) : (
            dashboard.popularServices.map((srv, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-dark-950/40 border border-dark-800 hover:border-dark-750 transition-colors">
                <span className="text-xs font-semibold text-dark-250 text-dark-300">{srv.name}</span>
                <span className="text-[10px] font-bold text-white bg-dark-900 border border-dark-850 px-2 py-0.5 rounded-lg shadow-sm">
                  {srv.count}x
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BarberDashboard;
