const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTkzMGRkNy00ZDFkLTRjMmItODA1YS05NGU2NmNjYjZhNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWJjOGVlYjMtNzVhMi00M2VlLWI1ZjMtNDAwYjU0MTIwNDIxIiwiaWF0IjoxNzc4NzEzNDQ4LCJleHAiOjE3ODEyMzY4MDB9.hlefld3pupIqYQ8D6thsvm-wHyy54oWUJLQMeUlMtos';
const SUPABASE_URL = 'https://btzxsjszxbgmlcyiyjwh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0enhzanN6eGJnbWxjeWl5andoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc5MzY2MiwiZXhwIjoyMDYxMzY5NjYyfQ.M_iC3kl6Ons4U8ZFe2q5iqXzUCK2-3E7FKXjHoX2z14';
const WFLOW = 'ocGuVNYkRL96jrgq';

async function supaQuery(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

async function n8nGet(path) {
  const r = await fetch(`https://n8n.andreverissimo.shop/api/v1/${path}`, {
    headers: { 'X-N8N-API-KEY': apikey }
  });
  return r.json();
}

async function getLastExec(after, wid = WFLOW) {
  await new Promise(r => setTimeout(r, 10000));
  const d = await n8nGet(`executions?limit=5&workflowId=${wid}`);
  return (d.data || []).filter(e => new Date(e.startedAt) > after);
}

async function inspectNodes(execId) {
  const d = await n8nGet(`executions/${execId}?includeData=true`);
  const rD = d.data?.resultData?.runData || {};
  return rD;
}

(async () => {
  const now = new Date();

  // Janelas
  const gte24 = new Date(now.getTime() + 23*3600000).toISOString().slice(0,19);
  const lte24 = new Date(now.getTime() + 25*3600000).toISOString().slice(0,19);
  const gte2  = new Date(now.getTime() + 1*3600000).toISOString().slice(0,19);
  const lte2  = new Date(now.getTime() + 3*3600000).toISOString().slice(0,19);
  const lteRea = new Date(now.getTime() - 30*24*3600000).toISOString();

  // ─── PRÉ-CHECK: o que o Supabase retornaria para cada fluxo ───
  console.log('\n📋 PRÉ-CHECK SUPABASE (o que cada nó vai encontrar)\n');

  const ag24 = await supaQuery(`agendamentos?status=in.(pendente,confirmado)&lembrete_24h_enviado=eq.false&data_hora_agendamento=gte.${gte24}&data_hora_agendamento=lte.${lte24}&select=nome,status,hora`);
  console.log(`Lembrete 24h → ${Array.isArray(ag24) ? ag24.length : '?'} agendamentos: ${JSON.stringify(ag24)}`);

  const ag2 = await supaQuery(`agendamentos?status=in.(pendente,confirmado)&lembrete_2h_enviado=eq.false&data_hora_agendamento=gte.${gte2}&data_hora_agendamento=lte.${lte2}&select=nome,status,hora`);
  console.log(`Lembrete 2h  → ${Array.isArray(ag2) ? ag2.length : '?'} agendamentos: ${JSON.stringify(ag2)}`);

  const rea = await supaQuery(`clientes?reativacao_enviada=eq.false&ultimo_atendimento=lte.${lteRea}&select=nome,telefone`);
  console.log(`Reativação   → ${Array.isArray(rea) ? rea.length : '?'} clientes inativos: ${JSON.stringify(rea)}`);

  // ─── EXECUTAR fluxo via trigger manual ───
  console.log('\n\n🚀 EXECUTANDO OS 3 FLUXOS...\n');

  const [wf] = await Promise.all([n8nGet(`workflows/${WFLOW}`)]);
  const n24  = wf.nodes.find(n => n.name === 'A cada hora 24h');
  const n2   = wf.nodes.find(n => n.name === 'A cada hora 2h');
  const nRea = wf.nodes.find(n => n.name === 'Reativacao' || n.name === 'Reativação');

  // ─── 24H FLOW ───
  console.log('── Lembrete 24h ──');
  let before = new Date();
  const r24 = await fetch(`https://n8n.andreverissimo.shop/api/v1/workflows/${WFLOW}/run`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': apikey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startNodes: n24 ? [n24.id] : [] })
  });
  const run24 = await r24.json();
  console.log('Resposta:', run24);
  let execs = await getLastExec(before);
  if (execs.length > 0) {
    const rD = await inspectNodes(execs[0].id);
    const ag24node = rD['Agendamentos - Lembrete 24h']?.[0];
    const items24 = ag24node?.data?.main?.[0]?.length || 0;
    const ifNode = rD['Tem agendamentos 24h?']?.[0];
    const trueItems = ifNode?.data?.main?.[0]?.length || 0;
    const envio24 = rD['Enviar Lembrete 24h']?.[0];
    console.log(`  ✅ Exec ${execs[0].id} | Agendamentos encontrados: ${items24} | Enviados: ${trueItems} | Envio: ${envio24 ? (envio24.error ? '❌ ERRO: '+envio24.error.message.slice(0,60) : '✅ OK') : '⚠️ Não atingido'}`);
  } else {
    console.log('  ⚠️ Sem nova execução (API /run pode não suportar schedule triggers)');
  }

  await new Promise(r => setTimeout(r, 5000));

  // ─── 2H FLOW ───
  console.log('\n── Lembrete 2h ──');
  before = new Date();
  const r2 = await fetch(`https://n8n.andreverissimo.shop/api/v1/workflows/${WFLOW}/run`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': apikey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startNodes: n2 ? [n2.id] : [] })
  });
  const run2 = await r2.json();
  console.log('Resposta:', run2);
  execs = await getLastExec(before);
  if (execs.length > 0) {
    const rD = await inspectNodes(execs[0].id);
    const ag2node = rD['Agendamentos - Lembrete 2h']?.[0];
    const items2 = ag2node?.data?.main?.[0]?.length || 0;
    const ifNode = rD['Tem agendamentos 2h?']?.[0];
    const trueItems = ifNode?.data?.main?.[0]?.length || 0;
    const envio2 = rD['Enviar Lembrete 2h']?.[0];
    console.log(`  ✅ Exec ${execs[0].id} | Agendamentos encontrados: ${items2} | Enviados: ${trueItems} | Envio: ${envio2 ? (envio2.error ? '❌ ERRO: '+envio2.error.message.slice(0,60) : '✅ OK') : '⚠️ Não atingido'}`);
  } else {
    console.log('  ⚠️ Sem nova execução');
  }

  await new Promise(r => setTimeout(r, 5000));

  // ─── REATIVAÇÃO FLOW ───
  console.log('\n── Reativação 30d ──');
  before = new Date();
  const rRea = await fetch(`https://n8n.andreverissimo.shop/api/v1/workflows/${WFLOW}/run`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': apikey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startNodes: nRea ? [nRea.id] : [] })
  });
  const runRea = await rRea.json();
  console.log('Resposta:', runRea);
  execs = await getLastExec(before);
  if (execs.length > 0) {
    const rD = await inspectNodes(execs[0].id);
    const clNode = rD['Clientes Inativos 30d']?.[0];
    const itemsRea = clNode?.data?.main?.[0]?.length || 0;
    const ifRea = rD['Tem clientes inativos?']?.[0];
    const trueRea = ifRea?.data?.main?.[0]?.length || 0;
    const envioRea = rD['Enviar Convite Reativacao']?.[0];
    console.log(`  ✅ Exec ${execs[0].id} | Clientes inativos: ${itemsRea} | Com convite: ${trueRea} | Envio: ${envioRea ? (envioRea.error ? '❌ ERRO: '+envioRea.error.message.slice(0,60) : '✅ OK') : '⚠️ Não atingido'}`);
  } else {
    console.log('  ⚠️ Sem nova execução');
  }

  // ─── PÓS-CHECK ───
  console.log('\n\n📋 PÓS-CHECK SUPABASE (após envios)\n');
  const ag24Post = await supaQuery(`agendamentos?status=in.(pendente,confirmado)&lembrete_24h_enviado=eq.false&data_hora_agendamento=gte.${gte24}&data_hora_agendamento=lte.${lte24}&select=nome,lembrete_24h_enviado`);
  console.log(`Lembrete 24h pendentes: ${Array.isArray(ag24Post) ? ag24Post.length : '?'} ${ag24Post.length === 0 ? '✅ (foi marcado como enviado)' : '⚠️ Ainda pendente'}`);

  const ag2Post = await supaQuery(`agendamentos?status=in.(pendente,confirmado)&lembrete_2h_enviado=eq.false&data_hora_agendamento=gte.${gte2}&data_hora_agendamento=lte.${lte2}&select=nome,lembrete_2h_enviado`);
  console.log(`Lembrete 2h pendentes:  ${Array.isArray(ag2Post) ? ag2Post.length : '?'} ${ag2Post.length === 0 ? '✅ (foi marcado como enviado)' : '⚠️ Ainda pendente'}`);

  const reaPost = await supaQuery(`clientes?reativacao_enviada=eq.false&ultimo_atendimento=lte.${lteRea}&select=nome`);
  console.log(`Reativação pendentes:   ${Array.isArray(reaPost) ? reaPost.length : '?'} ${reaPost.length === 0 ? '✅ (foi marcado como enviado)' : '⚠️ Ainda pendente'}`);

  console.log('\n✅ TESTES CONCLUÍDOS');
})();
