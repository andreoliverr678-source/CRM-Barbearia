import React from 'react';
import { Users, Calendar, MessageSquare, ArrowUpRight, RefreshCw, AlertCircle, DollarSign, TrendingUp, Clock, Scissors } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useApi from '../hooks/useApi';
import { useSocket } from '../hooks/useSocket';
import { fetchDashboard } from '../services/api';

// ------- Skeleton -------
const StatSkeleton = () => (
  <div className="glass-panel p-4 md:p-6 rounded-2xl animate-pulse">
    <div className="flex justify-between items-start mb-3 md:mb-4">
      <div className="w-10 h-10 rounded-xl bg-dark-200 dark:bg-dark-700" />
      <div className="w-14 h-5 rounded-full bg-dark-200 dark:bg-dark-700" />
    </div>
    <div className="h-3 w-20 rounded bg-dark-200 dark:bg-dark-700 mb-2" />
    <div className="h-7 w-24 rounded bg-dark-200 dark:bg-dark-700" />
  </div>
);

// ------- Stat Card -------
const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass, subtitle }) => (
  <div className="glass-panel p-4 md:p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl duration-300 active:scale-[0.98]">
    <div className="flex justify-between items-start mb-3 md:mb-4">
      <div className={`p-2.5 md:p-3 rounded-xl ${colorClass}`}>
        <Icon size={20} />
      </div>
      {trend === 'up' && (
        <span className="flex items-center text-[10px] sm:text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <ArrowUpRight size={14} className="mr-0.5" />
          {trendValue}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-dark-500 dark:text-dark-400 text-xs md:text-sm font-medium mb-1">{title}</h3>
      <h2 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white truncate">{value}</h2>
      {subtitle && (
        <p className="text-xs text-dark-400 mt-1 truncate">{subtitle}</p>
      )}
    </div>
  </div>
);

// ------- Dashboard -------
const Dashboard = () => {
  const { data: dashboard, loading, error, refetch } = useApi(fetchDashboard, { interval: 30_000 });

  // Realtime: atualiza ao receber eventos financeiros via Socket.io
  useSocket(['financial_new', 'financial_updated', 'appointment_concluido'], () => {
    refetch();
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-24 md:pb-0">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-dark-900 dark:text-white mb-1">
            Visão Geral
          </h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 hidden sm:block">
            Acompanhe os resultados da sua barbearia hoje.
          </p>
        </div>
        <button
          onClick={refetch}
          title="Atualizar métricas"
          className="p-2.5 rounded-xl text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 transition-all active:scale-90 flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline text-sm font-medium">Sincronizar</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-xs md:text-sm">Erro ao carregar métricas: {error}</span>
        </div>
      )}

      {/* Stat Cards — 2 col mobile, 4 col lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {loading && !dashboard ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Faturamento Mensal"
              value={formatCurrency(dashboard?.revenue)}
              icon={DollarSign}
              trend="up"
              trendValue="mês"
              colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              subtitle={dashboard?.avgTicket > 0 ? `Ticket médio ${formatCurrency(dashboard.avgTicket)}` : null}
            />
            <StatCard
              title="Agendamentos Hoje"
              value={dashboard?.appointmentsToday || 0}
              icon={Calendar}
              trend="up"
              trendValue="hoje"
              colorClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
            />
            <StatCard
              title="Total de Clientes"
              value={dashboard?.totalClients || 0}
              icon={Users}
              trend="up"
              trendValue="total"
              colorClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
            />
            <StatCard
              title="Conversas Ativas"
              value={dashboard?.activeConversations || 0}
              icon={MessageSquare}
              trend="up"
              trendValue="24h"
              colorClass="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
            />
          </>
        )}
      </div>

      {/* Main Content Grid: Chart + Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Gráfico */}
        <div className="lg:col-span-2 glass-panel p-4 md:p-6 rounded-2xl flex flex-col h-[350px] md:h-[400px]">
          <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
            <div>
              <h3 className="text-base md:text-lg font-bold text-dark-900 dark:text-white">
                Atendimentos da Semana
              </h3>
              <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">Comparativo de fluxo diário</p>
            </div>
            <span className="text-xs text-dark-500 dark:text-dark-400 bg-dark-50 dark:bg-dark-800 px-3 py-1.5 rounded-full border border-dark-100 dark:border-dark-700">
              Tempo Real
            </span>
          </div>

          <div className="flex-1 min-h-0 w-full">
            {loading && !dashboard ? (
              <div className="w-full h-full bg-dark-50 dark:bg-dark-800/50 rounded-xl animate-pulse" />
            ) : dashboard?.chartData?.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-dark-400">
                <TrendingUp size={32} className="mb-2 opacity-30" />
                <span className="text-sm">Sem dados suficientes</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard?.chartData || []} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: '13px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#60a5fa', fontWeight: 600 }}
                    cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area type="monotone" dataKey="atendimentos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorApt)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Listas Laterais */}
        <div className="flex flex-col gap-4 md:gap-6">

          {/* Top Serviços */}
          <div className="glass-panel p-4 md:p-6 rounded-2xl flex-1 flex flex-col">
            <h3 className="text-sm md:text-base font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Scissors size={16} className="text-primary-500" />
              Serviços Populares (Mês)
            </h3>
            <div className="flex-1 space-y-3">
              {loading && !dashboard ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-dark-50 dark:bg-dark-800/50 rounded-xl animate-pulse" />
                ))
              ) : !dashboard?.popularServices?.length ? (
                <div className="h-full flex items-center justify-center text-sm text-dark-400">Nenhum serviço</div>
              ) : (
                dashboard.popularServices.map((srv, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-dark-50/50 dark:bg-dark-800/30 border border-dark-100 dark:border-dark-800 hover:border-dark-200 dark:hover:border-dark-700 transition-colors">
                    <span className="text-sm font-medium text-dark-800 dark:text-dark-200 truncate pr-4">{srv.name}</span>
                    <span className="text-xs font-bold text-dark-900 dark:text-white bg-white dark:bg-dark-900 px-2.5 py-1 rounded-lg shadow-sm border border-dark-100 dark:border-dark-800">
                      {srv.count}x
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Horários de Pico */}
          <div className="glass-panel p-4 md:p-6 rounded-2xl flex-1 flex flex-col">
            <h3 className="text-sm md:text-base font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              Horários de Pico
            </h3>
            <div className="flex-1 space-y-3">
              {loading && !dashboard ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-dark-50 dark:bg-dark-800/50 rounded-xl animate-pulse" />
                ))
              ) : !dashboard?.popularTimes?.length ? (
                <div className="h-full flex items-center justify-center text-sm text-dark-400">Nenhum horário</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {dashboard.popularTimes.map((t, index) => (
                    <div key={index} className="flex flex-col items-center justify-center p-3 rounded-xl bg-dark-50/50 dark:bg-dark-800/30 border border-dark-100 dark:border-dark-800 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors">
                      <span className="text-base font-bold text-dark-900 dark:text-white">{t.time}</span>
                      <span className="text-[10px] text-dark-500 uppercase font-medium mt-0.5">{t.count} agend.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Faturamento por Barbeiro */}
          <div className="glass-panel p-4 md:p-6 rounded-2xl flex-1 flex flex-col">
            <h3 className="text-sm md:text-base font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              Faturamento por Barbeiro (Mês)
            </h3>
            <div className="flex-1 space-y-3">
              {loading && !dashboard ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-12 bg-dark-50 dark:bg-dark-800/50 rounded-xl animate-pulse" />
                ))
              ) : !dashboard?.revenueByBarber || Object.keys(dashboard.revenueByBarber).length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-dark-400">Nenhum faturamento</div>
              ) : (
                Object.entries(dashboard.revenueByBarber).map(([name, val], index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-dark-50/50 dark:bg-dark-800/30 border border-dark-100 dark:border-dark-800">
                    <span className="text-sm font-medium text-dark-800 dark:text-dark-200">{name}</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(val)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
