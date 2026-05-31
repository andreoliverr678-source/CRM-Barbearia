const express = require('express');
const router = express.Router();
const supabase = require('../db');
const authMiddleware = require('../middleware/auth');
const { startOfWeek, endOfWeek, parseISO, isValid, getDay } = require('date-fns');

// GET /api/barber/dashboard
router.get('/', authMiddleware, async (req, res) => {
  try {
    const barberId = req.user.id;
    const now = new Date();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

    // ── Períodos ──────────────────────────────────────────────────────────────
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const startWeek = startOfWeek(now, { weekStartsOn: 1 }).toISOString().split('T')[0];
    const endWeek   = endOfWeek(now,   { weekStartsOn: 1 }).toISOString().split('T')[0];

    // ── Executa as queries paralelas específicas do barbeiro ─────────────────
    const [apptTodayRes, clientsRes, financialRes, weekApptRes] = await Promise.all([
      // 1. Agendamentos de hoje do barbeiro
      supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('barbeiro_id', barberId)
        .eq('data', today)
        .neq('status', 'cancelado'),

      // 2. Clientes fixos vinculados a este barbeiro
      supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('barbeiro_id', barberId),

      // 3. Faturamento mensal gerado por este barbeiro
      // Usa inner join para filtrar apenas registros do barbeiro logado
      supabase
        .from('financial_records')
        .select('amount, service, agendamentos!inner(barbeiro_id)')
        .eq('status', 'pago')
        .eq('agendamentos.barbeiro_id', barberId)
        .gte('created_at', firstDayOfMonth)
        .lt('created_at', firstDayNextMonth),

      // 4. Fluxo semanal de agendamentos concluídos/confirmados dele
      supabase
        .from('agendamentos')
        .select('data')
        .eq('barbeiro_id', barberId)
        .gte('data', startWeek)
        .lte('data', endWeek)
        .neq('status', 'cancelado'),
    ]);

    // Trata erros de requisições
    if (financialRes.error) {
      console.warn('[barberDashboard] Erro ao buscar registros financeiros:', financialRes.error.message);
    }

    const appointmentsToday = apptTodayRes.count || 0;
    const totalClients = clientsRes.count || 0;

    const monthFinancial = financialRes.data || [];
    const revenue = monthFinancial.reduce((acc, r) => acc + Number(r.amount), 0);
    const avgTicket = monthFinancial.length > 0 ? revenue / monthFinancial.length : 0;

    // Serviços mais realizados pelo barbeiro no mês
    const servicesCount = {};
    monthFinancial.forEach(r => {
      const s = r.service || 'Outros';
      servicesCount[s] = (servicesCount[s] || 0) + 1;
    });

    const popularServices = Object.entries(servicesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // Dados do gráfico semanal do barbeiro
    const weekAppointments = weekApptRes.data || [];
    const daysMap  = { Seg: 0, Ter: 0, Qua: 0, Qui: 0, Sex: 0, 'Sáb': 0, Dom: 0 };
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    weekAppointments.forEach(a => {
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

    res.json({
      appointmentsToday,
      totalClients,
      revenue,
      avgTicket,
      popularServices,
      chartData,
    });

  } catch (err) {
    console.error('[barberDashboard] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno ao processar painel do barbeiro' });
  }
});

module.exports = router;
