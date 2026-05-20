const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { startOfWeek, endOfWeek, parseISO, isValid, getDay } = require('date-fns');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    // Pega a data atual já ajustada para o fuso do Brasil (ex: 2024-05-19)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    // ── Períodos ──────────────────────────────────────────────────────────────
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const startWeek = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0];
    const endWeek   = endOfWeek(now,   { weekStartsOn: 1 }).toISOString().split('T')[0];

    // ── 1. Total de Clientes ──────────────────────────────────────────────────
    const { count: totalClients } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    // ── 2. Agendamentos Hoje ──────────────────────────────────────────────────
    const { count: appointmentsToday } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('data', today);

    // ── 3. Conversas Ativas (últimas 24h) ────────────────────────────────────
    const { data: conversas } = await supabase
      .from('conversas')
      .select('telefone')
      .gte('criado_em', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    const activeConversations = conversas ? new Set(conversas.map(c => c.telefone)).size : 0;

    // ── 4. Faturamento real (financial_records) ───────────────────────────────
    const { data: monthFinancial, error: finErr } = await supabase
      .from('financial_records')
      .select('amount, service, payment_method, created_at')
      .eq('status', 'pago')
      .gte('created_at', firstDayOfMonth)
      .lt('created_at', firstDayNextMonth);

    if (finErr) console.error('[dashboard] financial_records error:', finErr.message);

    const revenue = (monthFinancial || []).reduce((acc, r) => acc + Number(r.amount), 0);
    const avgTicket = monthFinancial && monthFinancial.length > 0
      ? revenue / monthFinancial.length
      : 0;

    // ── 5. Serviços populares (real) ─────────────────────────────────────────
    const servicesCount = {};
    (monthFinancial || []).forEach(r => {
      const s = r.service || 'Outros';
      servicesCount[s] = (servicesCount[s] || 0) + 1;
    });

    // Fallback: se não há dados em financial_records, usa agendamentos
    if (Object.keys(servicesCount).length === 0) {
      const { data: monthAppointments } = await supabase
        .from('agendamentos')
        .select('servico')
        .gte('data', now.toISOString().split('T')[0].substring(0, 7) + '-01')
        .neq('status', 'cancelado');
      (monthAppointments || []).forEach(a => {
        const s = a.servico || 'Corte Padrão';
        servicesCount[s] = (servicesCount[s] || 0) + 1;
      });
    }

    const popularServices = Object.entries(servicesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // ── 6. Gráfico semanal (agendamentos concluídos) ──────────────────────────
    const { data: weekAppointments } = await supabase
      .from('agendamentos')
      .select('data')
      .gte('data', startWeek)
      .lte('data', endWeek)
      .neq('status', 'cancelado');

    const daysMap  = { Seg: 0, Ter: 0, Qua: 0, Qui: 0, Sex: 0, 'Sáb': 0, Dom: 0 };
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    (weekAppointments || []).forEach(a => {
      const date = parseISO(a.data);
      if (isValid(date)) {
        const dayName = dayNames[getDay(date)];
        if (daysMap[dayName] !== undefined) daysMap[dayName]++;
      }
    });

    const chartData = [
      { name: 'Seg', atendimentos: daysMap['Seg'] },
      { name: 'Ter', atendimentos: daysMap['Ter'] },
      { name: 'Qua', atendimentos: daysMap['Qua'] },
      { name: 'Qui', atendimentos: daysMap['Qui'] },
      { name: 'Sex', atendimentos: daysMap['Sex'] },
      { name: 'Sáb', atendimentos: daysMap['Sáb'] },
      { name: 'Dom', atendimentos: daysMap['Dom'] },
    ];

    // ── 7. Horários de pico ───────────────────────────────────────────────────
    const { data: monthAppointmentsAll } = await supabase
      .from('agendamentos')
      .select('hora')
      .gte('data', now.toISOString().split('T')[0].substring(0, 7) + '-01')
      .neq('status', 'cancelado');

    const timesCount = {};
    (monthAppointmentsAll || []).forEach(a => {
      if (a.hora) {
        const hour = a.hora.substring(0, 5);
        timesCount[hour] = (timesCount[hour] || 0) + 1;
      }
    });
    const popularTimes = Object.entries(timesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([time, count]) => ({ time, count }));

    // ── Resposta ──────────────────────────────────────────────────────────────
    res.json({
      totalClients:       totalClients || 0,
      appointmentsToday:  appointmentsToday || 0,
      activeConversations: activeConversations || 0,
      revenue,
      avgTicket,
      popularServices,
      popularTimes,
      chartData,
    });

  } catch (err) {
    console.error('[dashboard] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
