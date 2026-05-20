const express = require('express');
const router = express.Router();
const supabase = require('../db');

// Adapter (Banco em PT-BR <-> Frontend em EN)
const mapToFrontend = (c) => {
  // Converte "origem" ou "tipo" para um "sender" mais claro (client, admin, ai)
  let sender = 'client';
  if (c.origem === 'crm' && c.tipo === 'humano') sender = 'admin';
  if (c.tipo === 'ia') sender = 'ai';
  if (c.origem === 'whatsapp') sender = 'client';

  return {
    id: c.id,
    client_id: c.cliente_id || null,
    phone: c.telefone,
    message: c.mensagem,
    sender: sender,
    created_at: c.criado_em,
  };
};

// GET /api/messages — busca todas as mensagens (histórico completo)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversas')
      .select('*')
      .order('criado_em', { ascending: true });

    if (error) {
      console.error('[messages] Erro ao buscar conversas:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar conversas', details: error.message });
    }

    res.json(data.map(mapToFrontend));
  } catch (err) {
    console.error('[messages] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/messages/:phone — busca histórico de um telefone específico
router.get('/:phone', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversas')
      .select('*')
      .eq('telefone', req.params.phone)
      .order('criado_em', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar mensagens', details: error.message });
    }

    res.json(data.map(mapToFrontend));
  } catch (err) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/messages/send — envia mensagem ativa via CRM
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Os campos "phone" e "message" são obrigatórios' });
    }

    const payload = {
      telefone: phone,
      mensagem: message,
      origem: 'crm',
      tipo: 'humano', // admin sending
      criado_em: new Date().toISOString(),
    };

    // 1. Salva no banco primeiro
    const { data: created, error } = await supabase
      .from('conversas')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[messages] Erro ao salvar mensagem enviada:', error.message);
      return res.status(500).json({ error: 'Erro ao salvar no banco', details: error.message });
    }

    const msgFront = mapToFrontend(created);

    // 2. Emite via Socket.io para atualização Realtime
    const io = req.app.get('io');
    if (io) io.emit('new_message', msgFront);

    // 3. Integração Real Evolution API (Fire and forget, ou aguardar resposta)
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    const evolutionKey = process.env.EVOLUTION_API_KEY || 'global';
    const evolutionInstance = process.env.EVOLUTION_API_INSTANCE || 'crm';

    try {
      fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey
        },
        body: JSON.stringify({
          number: phone,
          options: { delay: 1000 },
          textMessage: { text: message }
        })
      }).catch(err => console.error('[Evolution API] Falha silenciosa no envio:', err.message));
    } catch (e) {
      console.error('[Evolution API] Catch sync error', e.message);
    }

    res.status(201).json(msgFront);
  } catch (err) {
    console.error('[messages] Erro inesperado /send:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/messages/webhook — webhook do n8n/Evolution para mensagens recebidas
router.post('/webhook', async (req, res) => {
  try {
    // Pode vir do n8n no formato antigo ou da Evolution
    const { telefone, mensagem, origem, tipo } = req.body;

    if (!mensagem || !telefone) {
      return res.status(400).json({ error: 'Os campos "mensagem" e "telefone" são obrigatórios' });
    }

    // 1. Verifica se o cliente já existe, se não, cria como 'lead'
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', telefone)
      .single();

    if (!clienteExistente) {
      await supabase
        .from('clientes')
        .insert([{
          telefone,
          status: 'lead',
          nome: 'Novo Contato'
        }]);
    }

    // 2. Salva a mensagem
    const { data: created, error } = await supabase
      .from('conversas')
      .insert([{
        telefone,
        mensagem,
        origem: origem || 'whatsapp',
        tipo: tipo || 'humano', // ou cliente
        criado_em: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('[messages] Erro ao salvar mensagem do webhook:', error.message);
      return res.status(500).json({ error: 'Erro ao salvar mensagem', details: error.message });
    }

    // Emite o evento Realtime
    const msgFront = mapToFrontend(created);
    const io = req.app.get('io');
    if (io) io.emit('new_message', msgFront);

    res.status(200).json({ status: 'received' });
  } catch (err) {
    console.error('[messages] Erro inesperado no webhook:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
