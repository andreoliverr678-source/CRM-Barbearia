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
    if (io) io.emit('appointment_created', mapToFrontend(data));

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
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('[appointments] Erro ao excluir agendamento:', error.message);
      return res.status(500).json({ error: 'Erro ao excluir agendamento', details: error.message });
    }

    const io = req.app.get('io');
    if (io) io.emit('appointment_deleted', { id: req.params.id });

    res.json({ message: 'Agendamento excluído com sucesso' });
  } catch (err) {
    console.error('[appointments] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
