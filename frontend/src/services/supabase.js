import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://btzxsjszxbgmlcyiyjwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0enhzanN6eGJnbWxjeWl5andoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzMzOTcsImV4cCI6MjA5MjM0OTM5N30.UeadDwrFN2FauedxHK35Y4hAFWKyAZunwivSXUnymm8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Leads de Barbearias ───────────────────────────────────────────────────────

/**
 * Insere um novo lead no Supabase (público, sem autenticação).
 * @param {Object} data - Dados do formulário de cadastro
 */
export const createLead = async (data) => {
  const { error } = await supabase
    .from('leads_barbearias')
    .insert([data]);
  if (error) throw error;
  return true;
};


/**
 * Busca todos os leads (requer autenticação via JWT do admin).
 * @param {Object} params - { status, search, page, limit }
 */
export const fetchLeads = async ({ status, search, page = 1, limit = 20, sortBy = 'created_at_desc' } = {}) => {
  let query = supabase
    .from('leads_barbearias')
    .select('*', { count: 'exact' });

  if (status && status !== 'todos') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(
      `nome_barbearia.ilike.%${search}%,nome_proprietario.ilike.%${search}%,email.ilike.%${search}%,whatsapp.ilike.%${search}%,cidade.ilike.%${search}%`
    );
  }

  // Ordenação
  if (sortBy === 'created_at_asc') {
    query = query.order('created_at', { ascending: true });
  } else if (sortBy === 'nome_barbearia_asc') {
    query = query.order('nome_barbearia', { ascending: true });
  } else if (sortBy === 'nome_proprietario_asc') {
    query = query.order('nome_proprietario', { ascending: true });
  } else if (sortBy === 'faturamento_desc') {
    query = query.order('faturamento_ordem', { ascending: false, nullsFirst: false });
  } else {
    // Padrão: mais recente
    query = query.order('created_at', { ascending: false });
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data, count };
};

/**
 * Atualiza o status ou nota interna de um lead.
 * @param {string} id - UUID do lead
 * @param {Object} updates - { status, nota_interna }
 */
export const updateLead = async (id, updates) => {
  const { data, error } = await supabase
    .from('leads_barbearias')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/**
 * Exclui um lead pelo ID.
 */
export const deleteLead = async (id) => {
  const { error } = await supabase
    .from('leads_barbearias')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
