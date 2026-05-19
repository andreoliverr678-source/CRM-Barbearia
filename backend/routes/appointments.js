const express = require('express');
const router = express.Router();
const supabase = require('../db');
const { cancelarAgendamentosVencidos } = require('../scheduler');


// ── Adapter (Banco PT-BR <-> Frontend EN) ────────────────────────────────────
const mapToFrontend = (a) => ({
  id:                  a.id,
  client_id:           a.cliente_id || null,
  client_name:         a.nome       || '',
  client_phone:        a.telefone   || '',
  service:             a.servico,
  service_id:          a.service_id || null,
  date:                a.data,
  time:                a.hora,
  datetime:            a.data_hora_agendamento || null,
  status:              a.status,
  confirmed:           a.confirmado || false,
  reminder_24h_sent:   a.lembrete_24h_enviado || false,
  reminder_2h_sent:    a.lembrete_2h_enviado  || false,
  created_at:          a.criado_em,
});

const mapToBackend = (a) => {
  const data = {};
  if (a.client_id    !== undefined) data.cliente_id  = a.client_id;
  if (a.client_name  !== undefined) data.nome        = a.client_name;
  if (a.client_phone !== undefined) data.telefone    = a.client_phone;
  if (a.service      !== undefined) data.servico     = a.service;
  if (a.service_id   !== undefined) data.service_id  = a.service_id || null;
  if (a.date         !== undefined) data.data        = a.date;
  if (a.time         !== undefined) data.hora        = a.time;
  if (a.status       !== undefined) data.status      = a.status;
  // Build combined datetime for reminder scheduling
  if (a.date && a.time) {
    data.data_hora_agendamento = `${a.date}T${a.time}:00`;
  }
  return data;
};

// ── Helper: atualiza status do cliente e emite evento realtime ───────────────
const emitClientStatusUpdate = async (io, telefone) => {
  if (!io || !telefone) return;
  try {
    // Chama a função SQL que recalcula e persiste o novo status
    await supabase.rpc('atualizar_status_cliente', { p_telefone: telefone });

    // Busca o cliente atualizado para enviar ao frontend
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, nome, telefone, status, score, observacoes, criado_em, ultima_interacao, ultimo_atendimento, reativacao_enviada')
      .or(`telefone.eq.${telefone}`)
      .single();

    if (cliente) {
      io.emit('client_status_updated', {
        id:                  cliente.id,
        name:                cliente.nome,
        phone:               cliente.telefone,
        status:              cliente.status,
        score:               cliente.score || 0,
        notes:               cliente.observacoes,
        created_at:          cliente.criado_em,
        ultima_interacao:    cliente.ultima_interacao,
        ultimo_atendimento:  cliente.ultimo_atendimento,
        reativacao_enviada:  cliente.reativacao_enviada || false,
      });
    }
  } catch (err) {
    console.error('[appointments] Erro ao emitir status do cliente:', err.message);
  }
};


// ── GET /api/appointments ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Cancela agendamentos pendentes vencidos antes de retornar a lista
    await cancelarAgendamentosVencidos();

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .order('data', { ascending: true })
      .order('hora', { ascending: true });

    if (error) {
      console.error('[appointments] Erro ao buscar agendamentos:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar agendamentos', details: error.message });
    }

    res.json(data.map(mapToFrontend));
  } catch (err) {
    console.error('[appointments] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── GET /api/appointments/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('[appointments] Erro ao buscar agendamento:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar agendamento', details: error.message });
    }

    if (!data) return res.status(404).json({ error: 'Agendamento não encontrado' });

    res.json(mapToFrontend(data));
  } catch (err) {
    console.error('[appointments] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── POST /api/appointments ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const backendData = mapToBackend(req.body);

    if (!backendData.data || !backendData.hora) {
      return res.status(400).json({ error: 'Os campos "date" e "time" são obrigatórios' });
    }

    // Verifica conflito de horário
    const { data: existing } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('data', backendData.data)
      .eq('hora', backendData.hora)
      .not('status', 'eq', 'cancelado');

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Já existe um agendamento para este horário.' });
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([{ ...backendData, status: backendData.status || 'confirmado' }])
      .select()
      .single();

    if (error) {
      console.error('[appointments] Erro ao criar agendamento:', error.message);
      return res.status(500).json({ error: 'Erro ao criar agendamento', details: error.message });
    }

    // Emite evento realtime
    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_created', mapToFrontend(data));
      // Atualiza status do cliente em tempo real
      await emitClientStatusUpdate(io, data.telefone);
    }

    // ── Lembrete 24h: disparo imediato se o agendamento é dentro das próximas 24h ──
    // Regras:
    //  • diff <= 24h  → dispara lembrete 24h (confirmação) AGORA
    //  • diff <= 2h   → também marca lembrete_2h_enviado = true (cliente já foi avisado,
    //                   não precisa receber o lembrete 2h do scheduler depois)
    //  • diff >  24h  → scheduler cuida dos dois lembretes no momento certo
    try {
      const dataHoraStr  = data.data_hora_agendamento || `${data.data}T${data.hora}:00`;
      const agoraSP      = new Date(Date.now() - 3 * 60 * 60 * 1000); // UTC-3
      const dataHoraAppt = new Date(dataHoraStr);
      const diffHoras    = (dataHoraAppt - agoraSP) / (1000 * 60 * 60);

      if (diffHoras > 0 && diffHoras <= 24) {
        // Dispara o MESMO webhook do scheduler — cliente recebe a mensagem de confirmação
        await fetch('https://n8n.andreverissimo.shop/webhook/crm-followup-confirmacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agendamento_id:        data.id,
            telefone:              data.telefone,
            nome:                  data.nome,
            hora:                  data.hora,
            data:                  data.data,
            servico:               data.servico,
            data_hora_agendamento: data.data_hora_agendamento || `${data.data}T${data.hora}:00`,
          })
        });

        // Monta quais flags marcar como enviado
        const flags = { lembrete_24h_enviado: true };

        // Se agendar com ≤ 2h de antecedência, o scheduler de 2h nunca vai pegar
        // esse agendamento — e o cliente já foi avisado pelo lembrete 24h
        if (diffHoras <= 2) {
          flags.lembrete_2h_enviado = true;
          console.log(`[appointments] ⚡ Agendamento em ${diffHoras.toFixed(1)}h — lembrete 24h enviado, lembrete 2h suprimido (cliente já foi avisado).`);
        } else {
          console.log(`[appointments] 📅 Lembrete 24h imediato → ${data.nome} (${data.telefone}) — faltam ${diffHoras.toFixed(1)}h. Scheduler enviará lembrete 2h quando chegar a hora.`);
        }

        await supabase
          .from('agendamentos')
          .update(flags)
          .eq('id', data.id);

      } else if (diffHoras > 24) {
        console.log(`[appointments] 🕐 Agendamento com ${diffHoras.toFixed(1)}h de antecedência — scheduler cuidará do lembrete 24h e do lembrete 2h.`);
      }
    } catch (whError) {
      console.error('[appointments] Erro ao chamar webhook crm-followup-confirmacao:', whError.message);
    }

    res.status(201).json(mapToFrontend(data));
  } catch (err) {
    console.error('[appointments] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── PUT /api/appointments/:id ────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const backendData = mapToBackend(req.body);

    // Verifica conflito se está mudando data/hora
    if (backendData.data && backendData.hora) {
      const { data: existing } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('data', backendData.data)
        .eq('hora', backendData.hora)
        .not('id', 'eq', req.params.id)
        .not('status', 'eq', 'cancelado');

      if (existing && existing.length > 0) {
        return res.status(409).json({ error: 'Já existe um agendamento para este horário.' });
      }
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .update(backendData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('[appointments] Erro ao atualizar agendamento:', error.message);
      return res.status(500).json({ error: 'Erro ao atualizar agendamento', details: error.message });
    }

    // Emite evento realtime
    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_updated', mapToFrontend(data));

      // Se ficou concluído, avisa o frontend para atualizar o financeiro
      if (data.status === 'concluido') {
        io.emit('appointment_concluido', mapToFrontend(data));
      }

      // Atualiza status do cliente em tempo real
      await emitClientStatusUpdate(io, data.telefone);
    }

    res.json(mapToFrontend(data));
  } catch (err) {
    console.error('[appointments] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ── DELETE /api/appointments/:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    // Busca o telefone ANTES de deletar para atualizar o status do cliente depois
    const { data: apptToDelete } = await supabase
      .from('agendamentos')
      .select('telefone')
      .eq('id', req.params.id)
      .single();

    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('[appointments] Erro ao excluir agendamento:', error.message);
      return res.status(500).json({ error: 'Erro ao excluir agendamento', details: error.message });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_deleted', { id: req.params.id });
      // Atualiza status do cliente em tempo real
      await emitClientStatusUpdate(io, apptToDelete?.telefone);
    }

    res.json({ message: 'Agendamento excluído com sucesso' });
  } catch (err) {
    console.error('[appointments] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
