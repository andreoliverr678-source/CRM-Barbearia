const express = require('express');
const router = express.Router();
const supabase = require('../db');

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .order('ordem', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[services] GET error:', err.message);
    res.status(500).json({ error: 'Erro ao buscar serviços', details: err.message });
  }
});

// POST /api/services
router.post('/', async (req, res) => {
  try {
    const { nome, preco, duracao } = req.body;
    if (!nome?.trim()) return res.status(400).json({ error: '"nome" é obrigatório.' });
    if (preco === undefined || Number(preco) < 0) return res.status(400).json({ error: '"preco" é obrigatório e deve ser >= 0.' });

    const { data: existing } = await supabase.from('servicos').select('id').ilike('nome', nome.trim()).maybeSingle();
    if (existing) return res.status(409).json({ error: `Serviço "${nome}" já existe.` });

    const { data, error } = await supabase
      .from('servicos')
      .insert([{ nome: nome.trim(), preco: Number(preco), duracao: duracao ? Number(duracao) : null }])
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('[services] POST error:', err.message);
    res.status(500).json({ error: 'Erro ao criar serviço', details: err.message });
  }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
  try {
    const { nome, preco, duracao } = req.body;
    const updates = {};
    if (nome !== undefined) {
      if (!nome.trim()) return res.status(400).json({ error: 'Nome não pode ser vazio.' });
      const { data: dup } = await supabase.from('servicos').select('id').ilike('nome', nome.trim()).neq('id', req.params.id).maybeSingle();
      if (dup) return res.status(409).json({ error: `Já existe outro serviço "${nome}".` });
      updates.nome = nome.trim();
    }
    if (preco !== undefined) updates.preco = Number(preco);
    if (duracao !== undefined) updates.duracao = duracao ? Number(duracao) : null;
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nenhum campo para atualizar.' });

    const { data, error } = await supabase.from('servicos').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[services] PUT error:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar serviço', details: err.message });
  }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    const { count } = await supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('service_id', req.params.id);
    if (count > 0) return res.status(409).json({ error: `Serviço vinculado a ${count} agendamento(s). Não pode ser excluído.` });
    const { error } = await supabase.from('servicos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Serviço excluído com sucesso.' });
  } catch (err) {
    console.error('[services] DELETE error:', err.message);
    res.status(500).json({ error: 'Erro ao excluir serviço', details: err.message });
  }
});

module.exports = router;
