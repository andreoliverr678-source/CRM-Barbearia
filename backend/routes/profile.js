const express = require('express');
const router = express.Router();
const supabase = require('../db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');

// Multer: armazena em memória (buffer), limita a 2MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.'));
    }
    cb(null, true);
  },
});

// GET /api/profile -> Obtém dados do usuário (também coberto por /api/auth/me)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, avatar, barbershop_name')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    res.json(user);
  } catch (err) {
    console.error('[PROFILE] Erro:', err.message);
    res.status(500).json({ error: 'Erro interno ao buscar perfil' });
  }
});

// PUT /api/profile -> Atualiza dados
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, barbershop_name, avatar } = req.body;

    // TODO: Se email mudar, verificar se já existe
    const { data, error } = await supabase
      .from('users')
      .update({ name, email, barbershop_name, avatar })
      .eq('id', req.user.id)
      .select('id, name, email, avatar, barbershop_name')
      .single();

    if (error) {
      console.error('[PROFILE] Erro ao atualizar:', error.message);
      return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }

    res.json(data);
  } catch (err) {
    console.error('[PROFILE] Erro inesperado:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PUT /api/profile/password -> Altera senha
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova são obrigatórias' });
    }

    // Busca usuário com hash
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Valida senha atual
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Hash nova senha
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Atualiza
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', req.user.id);

    if (updateError) {
      return res.status(500).json({ error: 'Erro ao salvar nova senha' });
    }

    res.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (err) {
    console.error('[PROFILE] Erro inesperado ao trocar senha:', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/profile/avatar -> Upload de avatar para o Supabase Storage
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const userId = req.user.id;
    const ext = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const filePath = `${userId}.${ext}`;

    // Remove arquivo anterior (ignora erro se não existir)
    await supabase.storage.from('avatars').remove([filePath]);

    // Faz upload do novo arquivo
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('[PROFILE] Erro no upload do avatar:', uploadError.message);
      return res.status(500).json({ error: 'Erro ao fazer upload do avatar.' });
    }

    // Obtém URL pública e adiciona timestamp para invalidar cache do navegador
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrlWithCachebuster = `${publicUrl}?t=${Date.now()}`;

    // Salva a URL no perfil do usuário
    const { data, error: updateError } = await supabase
      .from('users')
      .update({ avatar: publicUrlWithCachebuster })
      .eq('id', userId)
      .select('id, name, email, avatar, barbershop_name')
      .single();

    if (updateError) {
      console.error('[PROFILE] Erro ao salvar URL do avatar:', updateError.message);
      return res.status(500).json({ error: 'Avatar salvo, mas erro ao atualizar perfil.' });
    }

    res.json({ avatar: publicUrlWithCachebuster, user: data });
  } catch (err) {
    console.error('[PROFILE] Erro inesperado no upload:', err.message);
    res.status(500).json({ error: err.message || 'Erro interno' });
  }
});

// DELETE /api/profile/avatar -> Remove o avatar
router.delete('/avatar', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Busca o usuário para saber a URL atual do avatar e extrair o nome do arquivo
    const { data: user } = await supabase.from('users').select('avatar').eq('id', userId).single();
    
    if (user && user.avatar) {
      const urlParts = user.avatar.split('?')[0].split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        await supabase.storage.from('avatars').remove([filename]);
      }
    }

    // Atualiza o banco para remover a URL
    const { data, error } = await supabase
      .from('users')
      .update({ avatar: null })
      .eq('id', userId)
      .select('id, name, email, avatar, barbershop_name')
      .single();

    if (error) {
      console.error('[PROFILE] Erro ao remover URL do avatar no banco:', error.message);
      return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }

    res.json({ success: true, user: data });
  } catch (err) {
    console.error('[PROFILE] Erro inesperado ao remover avatar:', err.message);
    res.status(500).json({ error: 'Erro interno ao remover avatar' });
  }
});

module.exports = router;
