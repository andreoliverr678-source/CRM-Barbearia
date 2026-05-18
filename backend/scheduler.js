/**
 * scheduler.js
 * Cancela automaticamente agendamentos com status "pendente"
 * cuja data/hora já passou em relação ao horário atual do sistema (America/Sao_Paulo).
 *
 * Regras:
 *  - Compara usando data e hora completas
 *  - Considera o timezone America/Sao_Paulo
 *  - Altera apenas agendamentos com status "pendente"
 *  - Não altera: confirmado, cancelado, concluído
 *  - Executa automaticamente a cada 1 minuto via node-cron
 */

const cron = require('node-cron');
const supabase = require('./db');

/**
 * Chama a função SQL `cancelar_agendamentos_vencidos()` no Supabase.
 * Retorna o número de agendamentos cancelados.
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
    console.error('[scheduler] ❌ Erro inesperado:', err.message);
    return 0;
  }
}

/**
 * Inicia o cron job — executa a cada minuto.
 * Timezone configurado para America/Sao_Paulo.
 */
function iniciarScheduler() {
  // Executa imediatamente ao iniciar o servidor
  cancelarAgendamentosVencidos();

  // Agenda execução a cada 1 minuto
  cron.schedule('* * * * *', cancelarAgendamentosVencidos, {
    timezone: 'America/Sao_Paulo',
  });

  console.log('[scheduler] 🕐 Scheduler iniciado — verificação de agendamentos vencidos a cada 1 minuto.');
}

module.exports = { iniciarScheduler, cancelarAgendamentosVencidos };
