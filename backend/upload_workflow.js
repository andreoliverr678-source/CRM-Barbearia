const fs = require('fs');
const https = require('https');

const N8N_URL = 'https://n8n.andreverissimo.shop';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTkzMGRkNy00ZDFkLTRjMmItODA1YS05NGU2NmNjYjZhNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiODkxYjQ2MTUtMjJiNy00NDY4LWIxMTMtYTJiMTlkMzQ2MzlhIiwiaWF0IjoxNzgwMjU2MTcyfQ.yVE986YkceSNPPxUwHF5cW1Oklu_gSOjKb9Nj0tcUXg';
const WORKFLOW_ID = '1CUu2mqTMxbYCz9R';

const workflow = JSON.parse(fs.readFileSync('workflow_agent_v2.json', 'utf8'));

// Preparar payload para a API do n8n (apenas campos aceitos pela API)
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
  hostname: 'n8n.andreverissimo.shop',
  path: `/api/v1/workflows/${WORKFLOW_ID}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': API_KEY,
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`📤 Enviando workflow para n8n (PUT /api/v1/workflows/${WORKFLOW_ID})...`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`✅ Workflow atualizado com sucesso! Status: ${res.statusCode}`);
      const resp = JSON.parse(data);
      console.log('ID:', resp.id);
      console.log('Nome:', resp.name);
      console.log('Nodes:', resp.nodes?.length);
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
