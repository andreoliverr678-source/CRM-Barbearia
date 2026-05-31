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
  barber_id:           a.barbeiro_id || null,
  barber_name:         a.barbeiros ? a.barbeiros.nome : null,
  barber_avatar:       a.barbeiros ? a.barbeiros.avatar : null,
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
  if (a.barber_id    !== undefined) data.barbeiro_id = a.barber_id || null;
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

    let query = supabase
      .from('agendamentos')
      .select('*, barbeiros(nome, avatar)');

    if (req.query.barber_id) {
      query = query.eq('barbeiro_id', req.query.barber_id);
    }

    const { data, error } = await query
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
      .select('*, barbeiros(nome, avatar)')
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

    // ── Auto-atribuição de barbeiro livre ────────────────────────────────────
    // Se barbeiro_id não foi informado (null ou string vazia), buscar o próximo livre
    if (!backendData.barbeiro_id) {
      // 1. Buscar todos os barbeiros ativos
      const { data: barbeirosAtivos, error: barbeirosErr } = await supabase
        .from('barbeiros')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (barbeirosErr || !barbeirosAtivos || barbeirosAtivos.length === 0) {
        return res.status(409).json({ error: 'Nenhum barbeiro ativo disponível no momento.' });
      }

      // 2. Buscar barbeiros que já têm agendamento neste horário
      const { data: ocupados } = await supabase
        .from('agendamentos')
        .select('barbeiro_id')
        .eq('data', backendData.data)
        .eq('hora', backendData.hora)
        .not('status', 'eq', 'cancelado')
        .not('barbeiro_id', 'is', null);

      const idsOcupados = new Set((ocupados || []).map(a => a.barbeiro_id));

      // 3. Encontrar o primeiro barbeiro livre
      const barbeiroLivre = barbeirosAtivos.find(b => !idsOcupados.has(b.id));

      if (!barbeiroLivre) {
        return res.status(409).json({
          error: 'Todos os barbeiros estão ocupados neste horário. Por favor, escolha outro horário.'
        });
      }

      // 4. Atribuir o barbeiro livre
      backendData.barbeiro_id = barbeiroLivre.id;
      console.log(`[appointments] Auto-atribuindo barbeiro "${barbeiroLivre.nome}" (${barbeiroLivre.id}) para ${backendData.data} ${backendData.hora}`);
    }

    // Verifica conflito de horário (com barbeiro já definido)
    const { data: existing } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('data', backendData.data)
      .eq('hora', backendData.hora)
      .eq('barbeiro_id', backendData.barbeiro_id)
      .not('status', 'eq', 'cancelado');

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Já existe um agendamento para este barbeiro neste horário.' });
    }

    // Busca dados do barbeiro para retornar na resposta mapeada
    let barberInfo = null;
    const { data: barber } = await supabase
      .from('barbeiros')
      .select('nome, avatar')
      .eq('id', backendData.barbeiro_id)
      .single();
    barberInfo = barber;

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([{ ...backendData, status: backendData.status || 'confirmado' }])
      .select()
      .single();

    if (error) {
      console.error('[appointments] Erro ao criar agendamento:', error.message);
      return res.status(500).json({ error: 'Erro ao criar agendamento', details: error.message });
    }

    // Vincula barberInfo ao objeto retornado
    if (data && barberInfo) {
      data.barbeiros = barberInfo;
    }

    // Emite evento realtime
    const io = req.app.get('io');
    if (io) {
      io.emit('appointment_created', mapToFrontend(data));
      // Atualiza status do cliente em tempo real
      await emitClientStatusUpdate(io, data.telefone);
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

    // Verifica conflito se está mudando data/hora ou barbeiro
    if (backendData.data && backendData.hora) {
      let bId = backendData.barbeiro_id;
      if (bId === undefined) {
        // Busca barbeiro atual para validação de conflito se não foi informado no PUT
        const { data: currentAppt } = await supabase
          .from('agendamentos')
          .select('barbeiro_id')
          .eq('id', req.params.id)
          .single();
        bId = currentAppt?.barbeiro_id || null;
      }

      let conflictQuery = supabase
        .from('agendamentos')
        .select('id')
        .eq('data', backendData.data)
        .eq('hora', backendData.hora)
        .not('id', 'eq', req.params.id)
        .not('status', 'eq', 'cancelado');

      if (bId) {
        conflictQuery = conflictQuery.eq('barbeiro_id', bId);
      } else {
        conflictQuery = conflictQuery.is('barbeiro_id', null);
      }

      const { data: existing } = await conflictQuery;

      if (existing && existing.length > 0) {
        return res.status(409).json({ error: 'Já existe um agendamento para este barbeiro neste horário.' });
      }
    }

    // Se houver alteração de barbeiro_id ou o agendamento atual tiver barbeiro, busca os dados dele
    let barberInfo = null;
    const targetBarberId = backendData.barbeiro_id !== undefined ? backendData.barbeiro_id : null;
    
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

    if (data && data.barbeiro_id) {
      const { data: barber } = await supabase
        .from('barbeiros')
        .select('nome, avatar')
        .eq('id', data.barbeiro_id)
        .single();
      data.barbeiros = barber;
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
