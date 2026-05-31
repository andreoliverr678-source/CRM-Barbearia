const express = require('express');
const router = express.Router();
const supabase = require('../db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');

// Multer: memória, máx 3MB, apenas imagens
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Tipo não permitido. Use JPG, PNG ou WebP.'));
    }
    cb(null, true);
  },
});

// GET /api/barber/profile → dados do barbeiro logado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: barber, error } = await supabase
      .from('barbeiros')
      .select('id, nome, email, telefone, avatar, ativo, criado_em')
      .eq('id', req.user.id)
      .single();

    if (error || !barber) {
      return res.status(404).json({ error: 'Barbeiro não encontrado' });
    }

    res.json({ ...barber, name: barber.nome, role: 'barber' });
  } catch (err) {
    console.error('[BARBER PROFILE] Erro ao buscar:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT /api/barber/profile/password → troca de senha
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Busca hash atual
    const { data: barber, error } = await supabase
      .from('barbeiros')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !barber) {
      return res.status(404).json({ error: 'Barbeiro não encontrado' });
    }

    // Valida senha atual
    const isValid = await bcrypt.compare(currentPassword, barber.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Gera novo hash
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('barbeiros')
      .update({ password_hash: newHash })
      .eq('id', req.user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Erro ao salvar nova senha' });
    }

    res.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (err) {
    console.error('[BARBER PROFILE] Erro ao trocar senha:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/barber/profile/avatar → upload de foto
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const barberId = req.user.id;
    const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const filePath = `barbers/${barberId}.${ext}`;

    // Remove arquivo anterior (ignora erro)
    await supabase.storage.from('avatars').remove([filePath]);

    // Upload novo
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('[BARBER PROFILE] Erro upload:', uploadError.message);
      return res.status(500).json({ error: 'Erro ao fazer upload da foto.' });
    }

    // URL pública com cache-buster
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    // Salva URL no banco
    const { data, error: updateError } = await supabase
      .from('barbeiros')
      .update({ avatar: avatarUrl })
      .eq('id', barberId)
      .select('id, nome, email, telefone, avatar')
      .single();

    if (updateError) {
      console.error('[BARBER PROFILE] Erro ao salvar URL:', updateError.message);
      return res.status(500).json({ error: 'Foto salva, mas erro ao atualizar perfil.' });
    }

    res.json({ avatar: avatarUrl, barber: { ...data, name: data.nome } });
  } catch (err) {
    console.error('[BARBER PROFILE] Erro inesperado no upload:', err.message);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// DELETE /api/barber/profile/avatar → remove foto
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const barberId = req.user.id;

    // Busca URL atual para extrair nome do arquivo
    const { data: barber } = await supabase
      .from('barbeiros')
      .select('avatar')
      .eq('id', barberId)
      .single();

    if (barber?.avatar) {
      const urlParts = barber.avatar.split('?')[0].split('/');
      // Pega "barbers/uuid.ext"
      const filename = urlParts.slice(-2).join('/');
      if (filename) {
        await supabase.storage.from('avatars').remove([filename]);
      }
    }

    const { data, error } = await supabase
      .from('barbeiros')
      .update({ avatar: null })
      .eq('id', barberId)
      .select('id, nome, email, telefone, avatar')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erro ao remover foto.' });
    }

    res.json({ success: true, barber: { ...data, name: data.nome } });
  } catch (err) {
    console.error('[BARBER PROFILE] Erro ao remover avatar:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = router;
