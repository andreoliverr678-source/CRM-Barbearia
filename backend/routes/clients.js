const express = require('express');
const router = express.Router();
const supabase = require('../db');

// Funções auxiliares para mapear os dados (Banco em PT-BR <-> Frontend em EN)
const mapToFrontend = (c) => ({
  id: c.id,
  name: c.nome,
  phone: c.telefone,
  notes: c.observacoes,
  status: c.status,
  score: c.score || 0,
  ultima_interacao: c.ultima_interacao || null,
  ultimo_atendimento: c.ultimo_atendimento || null,
  reativacao_enviada: c.reativacao_enviada || false,
  created_at: c.criado_em,
  updated_at: c.ultima_interacao || c.criado_em,
});

const mapToBackend = (c) => {
  const data = {};
  if (c.name !== undefined) data.nome = c.name;
  if (c.phone !== undefined) data.telefone = c.phone;
  if (c.notes !== undefined) data.observacoes = c.notes;
  if (c.status !== undefined) data.status = c.status;
  return data;
};

// GET /api/clients — busca todos os clientes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('[clients] Erro ao buscar clientes:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar clientes', details: error.message });
    }

    res.json(data.map(mapToFrontend));
  } catch (err) {
    console.error('[clients] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/clients/:id — busca cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('[clients] Erro ao buscar cliente:', error.message);
      return res.status(500).json({ error: 'Erro ao buscar cliente', details: error.message });
    }

    if (!data) return res.status(404).json({ error: 'Cliente não encontrado' });

    res.json(mapToFrontend(data));
  } catch (err) {
    console.error('[clients] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/clients — cria um novo cliente
router.post('/', async (req, res) => {
  try {
    const backendData = mapToBackend(req.body);

    if (!backendData.telefone) {
      return res.status(400).json({ error: 'O campo "phone" é obrigatório' });
    }

    // Garante que o status padrão seja sempre 'lead' caso não seja fornecido
    if (!backendData.status) {
      backendData.status = 'lead';
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert([backendData])
      .select()
      .single();

    if (error) {
      console.error('[clients] Erro ao criar cliente:', error.message);
      return res.status(500).json({ error: 'Erro ao criar cliente', details: error.message });
    }

    res.status(201).json(mapToFrontend(data));
  } catch (err) {
    console.error('[clients] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/clients/:id — atualiza um cliente
router.put('/:id', async (req, res) => {
  try {
    const backendData = mapToBackend(req.body);

    const { data, error } = await supabase
      .from('clientes')
      .update(backendData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('[clients] Erro ao atualizar cliente:', error.message);
      return res.status(500).json({ error: 'Erro ao atualizar cliente', details: error.message });
    }

    res.json(mapToFrontend(data));
  } catch (err) {
    console.error('[clients] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/clients/:id — exclui um cliente
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('[clients] Erro ao excluir cliente:', error.message);
      return res.status(500).json({ error: 'Erro ao excluir cliente', details: error.message });
    }

    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (err) {
    console.error('[clients] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
