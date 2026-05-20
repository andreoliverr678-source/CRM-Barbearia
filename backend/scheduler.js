/**
 * scheduler.js
 * Gerencia todas as automações de follow-up da Barbearia via cron (a cada 1 minuto).
 *
 * Fluxos:
 *  1. Cancela agendamentos pendentes vencidos
 *  2. Lembrete 24h antes — dispara webhook `crm-followup-confirmacao` (janela: +23h a +25h)
 *  3. Lembrete 2h antes  — dispara webhook `crm-followup-chegando`    (janela: +110min a +130min)
 *  4. Reativação         — dispara webhook `crm-followup-reativacao`  (ultimo_atendimento > 30 dias)
 *
 * n8n Workflow ID : FYxTAXGpDql3v6P0
 * Timezone        : America/Sao_Paulo (UTC-3)
 */

const cron = require('node-cron');
const supabase = require('./db');

const N8N_BASE = 'https://n8n.andreverissimo.shop';

// ── Helpers de tempo (America/Sao_Paulo = UTC-3) ──────────────────────────────

/** Retorna a data/hora atual ajustada para America/Sao_Paulo (UTC-3). */
function agoraSP() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

/**
 * Converte um Date para string ISO sem timezone (YYYY-MM-DDTHH:MM:SS),
 * compatível com o formato salvo em `data_hora_agendamento` no banco.
 */
function toISO(date) {
  return date.toISOString().substring(0, 19);
}

// ── Helper: disparar webhook no n8n ──────────────────────────────────────────

/**
 * Realiza POST para um webhook do n8n de forma segura.
 * @param {string} path  - Caminho do webhook, ex: '/webhook/lembrete-24h'
 * @param {object} payload - Dados a enviar no corpo JSON
 */
async function dispararWebhook(path, payload) {
  try {
    const res = await fetch(`${N8N_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[scheduler] ⚠️ Webhook ${path} retornou status ${res.status}`);
    }
  } catch (err) {
    console.error(`[scheduler] ❌ Erro ao chamar webhook ${path}:`, err.message);
  }
}

// ── Tarefa 1: Cancelar agendamentos pendentes vencidos ────────────────────────

/**
 * Chama a função SQL `cancelar_agendamentos_vencidos()` no Supabase.
 * Cancela automaticamente agendamentos com status "pendente" cuja data/hora já passou.
 */
async function cancelarAgendamentosVencidos() {
  try {
    const { data: qtd, error } = await supabase.rpc('cancelar_agendamentos_vencidos');

    if (error) {
      console.error('[scheduler] ❌ Erro ao cancelar agendamentos vencidos:', error.message);
      return 0;
    }

    if (qtd > 0) {
      console.log(`[scheduler] ✅ ${qtd} agendamento(s) pendente(s) cancelado(s) automaticamente.`);
    }

    return qtd ?? 0;
  } catch (err) {
    console.error('[scheduler] ❌ Erro inesperado (cancelar):', err.message);
    return 0;
  }
}

// ── Tarefa 2: Lembrete 24h antes do agendamento ───────────────────────────────

/**
 * Busca agendamentos com horário entre +23h e +25h a partir de agora.
 * Para cada um (que ainda não recebeu o lembrete), dispara o webhook `lembrete-24h`
 * e marca `lembrete_24h_enviado = true` no banco para não reenviar.
 */
async function verificarLembretes24h() {
  try {
    const agora  = agoraSP();
    const inicio = toISO(new Date(agora.getTime() + 23 * 60 * 60 * 1000)); // agora + 23h
    const fim    = toISO(new Date(agora.getTime() + 25 * 60 * 60 * 1000)); // agora + 25h

    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('id, nome, telefone, hora, data, data_hora_agendamento')
      .in('status', ['confirmado', 'pendente'])
      .eq('lembrete_24h_enviado', false)
      .gte('data_hora_agendamento', inicio)
      .lte('data_hora_agendamento', fim);

    if (error) {
      console.error('[scheduler] ❌ Erro ao buscar lembretes 24h:', error.message);
      return;
    }

    for (const ag of agendamentos || []) {
      await dispararWebhook('/webhook/crm-followup-confirmacao', {
        agendamento_id:        ag.id,
        telefone:              ag.telefone,
        nome:                  ag.nome,
        hora:                  ag.hora,
        data:                  ag.data,
        data_hora_agendamento: ag.data_hora_agendamento,
      });

      // Marca como enviado para evitar reenvio
      await supabase
        .from('agendamentos')
        .update({ lembrete_24h_enviado: true })
        .eq('id', ag.id);

      console.log(`[scheduler] 📅 Lembrete 24h → ${ag.nome} (${ag.telefone}) — ${ag.data} às ${ag.hora}`);
    }
  } catch (err) {
    console.error('[scheduler] ❌ Erro inesperado (lembrete 24h):', err.message);
  }
}

// Removido: Tarefa 2b (Lembrete imediato para agendamentos dentro de 24h)

// ── Tarefa 3: Lembrete 2h antes do agendamento ───────────────────────────────

/**
 * Busca agendamentos com horário entre +110min e +130min (janela de 2h antes) a partir de agora.
 * Para cada um (que ainda não recebeu o lembrete), dispara o webhook `crm-followup-chegando`
 * e marca `lembrete_2h_enviado = true` no banco para não reenviar.
 */
async function verificarLembretes2h() {
  try {
    const agora  = agoraSP();
    const inicio = toISO(new Date(agora.getTime() + 110 * 60 * 1000)); // +1h50min
    const fim    = toISO(new Date(agora.getTime() + 130 * 60 * 1000)); // +2h10min

    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('id, nome, telefone, hora, data, data_hora_agendamento')
      .in('status', ['confirmado', 'pendente'])
      .eq('lembrete_2h_enviado', false)
      .gte('data_hora_agendamento', inicio)
      .lte('data_hora_agendamento', fim);

    if (error) {
      console.error('[scheduler] ❌ Erro ao buscar lembretes 1h:', error.message);
      return;
    }

    for (const ag of agendamentos || []) {
      await dispararWebhook('/webhook/crm-followup-chegando', {
        agendamento_id:        ag.id,
        telefone:              ag.telefone,
        nome:                  ag.nome,
        hora:                  ag.hora,
        data:                  ag.data,
        data_hora_agendamento: ag.data_hora_agendamento,
      });

      // Marca como enviado e também já altera o status para confirmado
      // pois não há fluxo de resposta neste momento (já está na hora)
      await supabase
        .from('agendamentos')
        .update({ lembrete_2h_enviado: true, status: 'confirmado' })
        .eq('id', ag.id);

      console.log(`[scheduler] ⏰ Lembrete 2h → ${ag.nome} (${ag.telefone}) — ${ag.data} às ${ag.hora}`);
    }
  } catch (err) {
    console.error('[scheduler] ❌ Erro inesperado (lembrete 2h):', err.message);
  }
}

// ── Tarefa 3b: Lembrete imediato para agendamentos feitos com < 2h de antecedência ──

/**
 * Se o cliente agendar faltando menos de 1h50 para o corte, o scheduler de 2h normal
 * não o pegaria na janela +110 a +130min. Esta função cobre isso, disparando
 * o lembrete de 2h IMEDIATAMENTE (pois já estamos dentro das 2h antes).
 */
async function verificarAgendamentosDentroDe2h() {
  try {
    const agora  = agoraSP();
    const agora_iso  = toISO(agora);
    const limite_iso = toISO(new Date(agora.getTime() + 110 * 60 * 1000)); // agora + 1h50min

    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('id, nome, telefone, hora, data, data_hora_agendamento, servico')
      .in('status', ['confirmado', 'pendente'])
      .eq('lembrete_2h_enviado', false)
      .gt('data_hora_agendamento', agora_iso)   // futuro
      .lt('data_hora_agendamento', limite_iso); // dentro de 1h50min

    if (error) {
      console.error('[scheduler] ❌ Erro ao buscar agendamentos imediatos de 2h:', error.message);
      return;
    }

    for (const ag of agendamentos || []) {
      await dispararWebhook('/webhook/crm-followup-chegando', {
        agendamento_id:        ag.id,
        telefone:              ag.telefone,
        nome:                  ag.nome,
        hora:                  ag.hora,
        data:                  ag.data,
        servico:               ag.servico,
        data_hora_agendamento: ag.data_hora_agendamento,
      });

      // Marca como enviado e também já altera o status para confirmado
      // pois se ele agendou agora em cima da hora, já está confirmado
      await supabase
        .from('agendamentos')
        .update({ lembrete_2h_enviado: true, status: 'confirmado' })
        .eq('id', ag.id);

      console.log(`[scheduler] ⚡ Lembrete 2h IMEDIATO → ${ag.nome} (${ag.telefone}) — ${ag.data} às ${ag.hora}`);
    }
  } catch (err) {
    console.error('[scheduler] ❌ Erro inesperado (imediato 2h):', err.message);
  }
}

// ── Tarefa 4: Reativação de clientes inativos (> 30 dias sem corte concluído) ──

/**
 * Busca clientes cujo último atendimento (corte concluído) ocorreu há mais de 30 dias
 * e que ainda não receberam a reativação.
 * Dispara o webhook `reativacao-cliente` e marca `reativacao_enviada = true`.
 */
async function verificarReativacao() {
  try {
    const agora  = agoraSP();
    const limite = toISO(new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)); // agora - 30 dias

    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('id, nome, telefone, ultimo_atendimento, ultima_interacao')
      .eq('reativacao_enviada', false)
      .not('ultimo_atendimento', 'is', null)
      .lte('ultimo_atendimento', limite);

    if (error) {
      console.error('[scheduler] ❌ Erro ao buscar clientes para reativação:', error.message);
      return;
    }

    for (const cliente of clientes || []) {
      await dispararWebhook('/webhook/crm-followup-reativacao', {
        cliente_id:         cliente.id,
        telefone:           cliente.telefone,
        nome:               cliente.nome,
        ultimo_atendimento: cliente.ultimo_atendimento || cliente.ultima_interacao,
      });

      // Marca como enviado para evitar reenvio
      await supabase
        .from('clientes')
        .update({ reativacao_enviada: true })
        .eq('id', cliente.id);

      console.log(`[scheduler] 🔄 Reativação → ${cliente.nome} (${cliente.telefone}) — inativo desde corte em ${cliente.ultimo_atendimento}`);
    }
  } catch (err) {
    console.error('[scheduler] ❌ Erro inesperado (reativação):', err.message);
  }
}

// ── Inicialização do Scheduler ────────────────────────────────────────────────

/**
 * Inicia todos os cron jobs — executa a cada minuto.
 * Também executa todas as verificações imediatamente ao iniciar o servidor.
 * Timezone configurado para America/Sao_Paulo.
 */
function iniciarScheduler() {
  // Executa todas as verificações imediatamente ao iniciar o servidor
  cancelarAgendamentosVencidos();
  verificarLembretes24h();
  verificarLembretes2h();
  verificarAgendamentosDentroDe2h();
  verificarReativacao();

  // Agenda todas as verificações a cada 1 minuto
  cron.schedule('* * * * *', async () => {
    await cancelarAgendamentosVencidos();
    await verificarLembretes24h();
    await verificarLembretes2h();
    await verificarAgendamentosDentroDe2h();
    await verificarReativacao();
  }, {
    timezone: 'America/Sao_Paulo',
  });

  console.log('[scheduler] 🚀 Scheduler iniciado (verificação a cada 1 minuto) — n8n: FYxTAXGpDql3v6P0');
  console.log('[scheduler]    ✓ Cancelamento de agendamentos pendentes vencidos');
  console.log('[scheduler]    ✓ Lembrete 24h antes do agendamento         → /webhook/crm-followup-confirmacao');
  console.log('[scheduler]    ✓ Lembrete 2h antes do agendamento          → /webhook/crm-followup-chegando');
  console.log('[scheduler]    ✓ Lembrete 2h imediato (agendamentos <2h)   → /webhook/crm-followup-chegando');
  console.log('[scheduler]    ✓ Reativação de clientes inativos            → /webhook/crm-followup-reativacao');
}

module.exports = { iniciarScheduler, cancelarAgendamentosVencidos };
