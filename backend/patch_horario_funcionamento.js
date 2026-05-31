const fs = require('fs');
const https = require('https');
const http = require('http');

// Fetch simples usando http/https nativo
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const body = options.body ? options.body : null;
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    if (body) reqOptions.headers['Content-Length'] = Buffer.byteLength(body);

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: () => data, json: () => JSON.parse(data) });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ═══════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════
const WORKFLOW_FILE = 'workflow_agent_v2.json';
const AGENT_NODE_ID = '5be25f9d-d631-446e-8819-05103bc74937';

// Carregar .env manualmente
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n').filter(l => l.includes('='));
const env = {};
envLines.forEach(line => {
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
});

const N8N_URL = env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = env.N8N_API_KEY;
const WORKFLOW_ID = '1CUu2mqTMxbYCz9R';

// ═══════════════════════════════════════════════
// 1. CARREGAR WORKFLOW ATUAL
// ═══════════════════════════════════════════════
const w = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
const agent = w.nodes.find(x => x.id === AGENT_NODE_ID);

if (!agent || !agent.parameters) {
  console.error('❌ Nó do agente não encontrado!');
  process.exit(1);
}

const currentPrompt = agent.parameters.options?.systemMessage || agent.parameters.systemMessage || '';

// ═══════════════════════════════════════════════
// 2. BLOCO DA REGRA DE HORÁRIO DE FUNCIONAMENTO
// ═══════════════════════════════════════════════
const blocoHorario = `━━━━━━━━━━━━
HORÁRIO DE FUNCIONAMENTO
━━━━━━━━━━━━

ANTES de confirmar qualquer agendamento, o agente DEVE verificar se o horário solicitado está dentro do horário de funcionamento da barbearia.

FLUXO OBRIGATÓRIO:

1. Chamar a tool "horario_funcionamento" para obter os horários disponíveis
2. Verificar se o dia da semana solicitado está no retorno
3. Verificar se a hora solicitada está dentro do intervalo hora_inicio e hora_fim

REGRAS CRÍTICAS:

* PROIBIDO agendar em domingos ou feriados (verificar retorno da tool)
* PROIBIDO agendar antes da hora_inicio do dia
* PROIBIDO agendar após a hora_fim do dia
* PROIBIDO agendar se o dia não estiver no retorno da tool

SE o horário estiver FORA do funcionamento:

PROIBIDO:
* chamar "Agendar"
* confirmar disponibilidade

OBRIGATÓRIO:
* informar o cliente que não há atendimento naquele horário
* informar o horário de funcionamento do dia solicitado (ou que a barbearia não funciona naquele dia)
* sugerir um horário dentro do funcionamento

Exemplo de resposta obrigatória:

Esse horário tá fora do nosso expediente 🙅
Atendemos de segunda a sábado, das 9h às 22h. Bora marcar dentro desse horário?

━━━━━━━━━━━━
`;

// ═══════════════════════════════════════════════
// 3. INJETAR BLOCO ANTES DA SEÇÃO "VERIFICAÇÃO DE DISPONIBILIDADE"
// ═══════════════════════════════════════════════
const MARCADOR = '━━━━━━━━━━━━\nVERIFICAÇÃO DE DISPONIBILIDADE\n━━━━━━━━━━━━';

let novoPrompt;
if (currentPrompt.includes(blocoHorario.trim())) {
  console.log('ℹ️ Regra de horário de funcionamento já existe no prompt — nenhuma alteração necessária.');
  novoPrompt = currentPrompt;
} else if (currentPrompt.includes(MARCADOR)) {
  novoPrompt = currentPrompt.replace(MARCADOR, blocoHorario + MARCADOR);
  console.log('✅ Bloco de horário de funcionamento inserido antes de "VERIFICAÇÃO DE DISPONIBILIDADE"');
} else {
  // Fallback: inserir no início das regras críticas
  const MARCADOR_FALLBACK = '━━━━━━━━━━━━\nNOVO AGENDAMENTO\n━━━━━━━━━━━━';
  if (currentPrompt.includes(MARCADOR_FALLBACK)) {
    novoPrompt = currentPrompt.replace(MARCADOR_FALLBACK, blocoHorario + MARCADOR_FALLBACK);
    console.log('✅ Bloco inserido antes de "NOVO AGENDAMENTO" (fallback)');
  } else {
    // Último fallback: adiciona antes das regras invioláveis
    const MARCADOR_FINAL = '━━━━━━━━━━━━\nREGRAS INVIOLÁVEIS\n━━━━━━━━━━━━';
    novoPrompt = currentPrompt.replace(MARCADOR_FINAL, blocoHorario + MARCADOR_FINAL);
    console.log('✅ Bloco inserido antes de "REGRAS INVIOLÁVEIS" (último fallback)');
  }
}

// ═══════════════════════════════════════════════
// 4. ATUALIZAR "REGRAS INVIOLÁVEIS" — adicionar linha explícita
// ═══════════════════════════════════════════════
const REGRA_ANTIGA = '* nunca confirmar horário ocupado sem retorno real da tool';
const REGRA_NOVA = `* nunca confirmar horário ocupado sem retorno real da tool
* nunca agendar fora do horário de funcionamento (verificar tool "horario_funcionamento" ANTES de qualquer agendamento)
* nunca agendar em domingos ou dias não listados pela tool "horario_funcionamento"`;

if (novoPrompt.includes(REGRA_ANTIGA) && !novoPrompt.includes('nunca agendar fora do horário de funcionamento')) {
  novoPrompt = novoPrompt.replace(REGRA_ANTIGA, REGRA_NOVA);
  console.log('✅ Regras invioláveis atualizadas com restrição de horário');
}

// ═══════════════════════════════════════════════
// 5. SALVAR LOCALMENTE
// ═══════════════════════════════════════════════
if (agent.parameters.options) {
  agent.parameters.options.systemMessage = novoPrompt;
} else {
  agent.parameters.systemMessage = novoPrompt;
}

const OUTPUT_FILE = 'workflow_agent_v3.json';
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(w, null, 2));
console.log(`\n✅ Workflow salvo como ${OUTPUT_FILE}`);

// ═══════════════════════════════════════════════
// 6. ENVIAR PARA O N8N VIA API
// ═══════════════════════════════════════════════
async function uploadToN8n() {
  if (!N8N_API_KEY) {
    console.log('⚠️ N8N_API_KEY não configurada — apenas arquivo local salvo.');
    return;
  }

  console.log('\n📤 Enviando para o n8n via API...');

  try {
    // Buscar workflow atual do n8n para obter campos obrigatórios
    const getRes = await fetchJson(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!getRes.ok) {
      throw new Error(`GET falhou: ${getRes.status} ${await getRes.text()}`);
    }

    const workflowRemoto = await getRes.json();

    // Substituir apenas o nó do agente
    const nodeIndex = workflowRemoto.nodes.findIndex(x => x.id === AGENT_NODE_ID);
    if (nodeIndex === -1) {
      throw new Error('Nó do agente não encontrado no workflow remoto');
    }

    workflowRemoto.nodes[nodeIndex] = agent;

    // PUT para atualizar
    const putRes = await fetchJson(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowRemoto)
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`PUT falhou: ${putRes.status} ${errText}`);
    }

    console.log('✅ Workflow atualizado com sucesso no n8n!');
    console.log('🔒 Regra: agente não agendará fora do horário de funcionamento.');

  } catch (err) {
    console.error('❌ Erro ao enviar para o n8n:', err.message);
    console.log('💡 O arquivo workflow_agent_v3.json foi salvo. Importe manualmente no n8n se necessário.');
  }
}

uploadToN8n();

