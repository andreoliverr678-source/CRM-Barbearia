const fs = require('fs');
const https = require('https');

const N8N_URL = 'n8n.andreverissimo.shop';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTkzMGRkNy00ZDFkLTRjMmItODA1YS05NGU2NmNjYjZhNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiODkxYjQ2MTUtMjJiNy00NDY4LWIxMTMtYTJiMTlkMzQ2MzlhIiwiaWF0IjoxNzgwMjU2MTcyfQ.yVE986YkceSNPPxUwHF5cW1Oklu_gSOjKb9Nj0tcUXg';
const WORKFLOW_ID = '1CUu2mqTMxbYCz9R';

const workflow = JSON.parse(fs.readFileSync('workflow_agent_v3.json', 'utf8'));

const payload = JSON.stringify({
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: {
    executionOrder: workflow.settings?.executionOrder || 'v1',
    timezone: workflow.settings?.timezone || 'America/Sao_Paulo',
    saveManualExecutions: workflow.settings?.saveManualExecutions ?? true,
    saveExecutionProgress: workflow.settings?.saveExecutionProgress ?? true,
    callerPolicy: workflow.settings?.callerPolicy || 'workflowsFromSameOwner'
  }
});

const options = {
  hostname: N8N_URL,
  path: `/api/v1/workflows/${WORKFLOW_ID}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': API_KEY,
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('📤 Enviando workflow_agent_v3.json para o n8n...');
console.log('🔒 Nova regra: bloqueio de agendamentos fora do horário de funcionamento');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const resp = JSON.parse(data);
      console.log(`\n✅ Workflow atualizado com sucesso! Status: ${res.statusCode}`);
      console.log('ID:', resp.id);
      console.log('Nome:', resp.name);
      console.log('Nodes:', resp.nodes?.length);
      console.log('\n🎉 Agente não agendará mais fora do horário de funcionamento!');
    } else {
      console.error(`❌ Erro HTTP ${res.statusCode}:`);
      console.error(data.substring(0, 500));
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Erro de conexão:', err.message);
});

req.write(payload);
req.end();
