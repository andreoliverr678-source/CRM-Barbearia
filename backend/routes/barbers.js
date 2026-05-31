const express = require('express');
const router = express.Router();
const supabase = require('../db');
const bcrypt = require('bcryptjs');

// Adapter (Banco PT-BR <-> Frontend EN)
const mapToFrontend = (b) => ({
  id: b.id,
  name: b.nome,
  email: b.email,
  phone: b.telefone || '',
  avatar: b.avatar || null,
  active: b.ativo !== false,
  created_at: b.criado_em,
});

// GET /api/barbers — Lista todos os barbeiros
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('barbeiros')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    res.json(data.map(mapToFrontend));
  } catch (err) {
    console.error('[barbers] GET error:', err.message);
    res.status(500).json({ error: 'Erro ao buscar barbeiros', details: err.message });
  }
});

// GET /api/barbers/:id — Detalhes de um barbeiro
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('barbeiros')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Barbeiro não encontrado' });
    res.json(mapToFrontend(data));
  } catch (err) {
    console.error('[barbers] GET by ID error:', err.message);
    res.status(500).json({ error: 'Erro ao buscar barbeiro', details: err.message });
  }
});

// POST /api/barbers — Cria um novo barbeiro
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, password, avatar, active } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
    if (!email?.trim()) return res.status(400).json({ error: 'O campo "email" é obrigatório.' });
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'A senha é obrigatória e deve ter pelo menos 6 caracteres.' });
    }

    // Verifica se e-mail já existe
    const { data: existing } = await supabase
      .from('barbeiros')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: `O e-mail "${email}" já está cadastrado para outro barbeiro.` });
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('barbeiros')
      .insert([{
        nome: name.trim(),
        email: email.trim().toLowerCase(),
        telefone: phone?.trim() || null,
        password_hash,
        avatar: avatar || null,
        ativo: active !== false
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapToFrontend(data));
  } catch (err) {
    console.error('[barbers] POST error:', err.message);
    res.status(500).json({ error: 'Erro ao criar barbeiro', details: err.message });
  }
});

// PUT /api/barbers/:id — Atualiza um barbeiro
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, password, avatar, active } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Nome não pode ser vazio.' });
      updates.nome = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) return res.status(400).json({ error: 'E-mail não pode ser vazio.' });
      
      // Verifica se o e-mail está sendo usado por outro barbeiro
      const { data: existing } = await supabase
        .from('barbeiros')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .neq('id', req.params.id)
        .maybeSingle();

      if (existing) {
        return res.status(409).json({ error: `O e-mail "${email}" já está cadastrado para outro barbeiro.` });
      }
      updates.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) updates.telefone = phone?.trim() || null;
    if (avatar !== undefined) updates.avatar = avatar || null;
    if (active !== undefined) updates.ativo = active === true;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      }
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    const { data, error } = await supabase
      .from('barbeiros')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(mapToFrontend(data));
  } catch (err) {
    console.error('[barbers] PUT error:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar barbeiro', details: err.message });
  }
});

// DELETE /api/barbers/:id — Exclui um barbeiro
router.delete('/:id', async (req, res) => {
  try {
    // Verifica se existem agendamentos pendentes ou confirmados vinculados a este barbeiro
    const { count } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('barbeiro_id', req.params.id)
      .in('status', ['pendente', 'confirmado']);

    if (count > 0) {
      return res.status(409).json({
        error: `O barbeiro possui ${count} agendamento(s) ativo(s) vinculado(s) e não pode ser excluído. Desative-o em vez disso.`
      });
    }

    const { error } = await supabase
      .from('barbeiros')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Barbeiro excluído com sucesso.' });
  } catch (err) {
    console.error('[barbers] DELETE error:', err.message);
    res.status(500).json({ error: 'Erro ao excluir barbeiro', details: err.message });
  }
});

module.exports = router;
