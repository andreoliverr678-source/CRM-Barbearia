const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTkzMGRkNy00ZDFkLTRjMmItODA1YS05NGU2NmNjYjZhNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWJjOGVlYjMtNzVhMi00M2VlLWI1ZjMtNDAwYjU0MTIwNDIxIiwiaWF0IjoxNzc4NzEzNDQ4LCJleHAiOjE3ODEyMzY4MDB9.hlefld3pupIqYQ8D6thsvm-wHyy54oWUJLQMeUlMtos';
const url = 'https://n8n.andreverissimo.shop/api/v1/workflows/ocGuVNYkRL96jrgq';

fetch(url, { headers: { 'X-N8N-API-KEY': apikey } })
  .then(r => r.json())
  .then(w => {
    const node = w.nodes.find(n => n.name === 'Marcar Reativacao Enviada');
    if (node) {
      node.parameters.filters.conditions[0].keyValue = "={{ $('Clientes Inativos 30d').item.json.telefone }}";
      console.log('✅ Sintaxe corrigida no nó Marcar Reativacao Enviada');
    }

    return fetch(url, {
      method: 'PUT',
      headers: { 'X-N8N-API-KEY': apikey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: w.nodes,
        name: w.name,
        connections: w.connections,
        settings: {
          executionOrder: w.settings.executionOrder || 'v1',
          timezone: w.settings.timezone || 'America/Sao_Paulo',
          callerPolicy: w.settings.callerPolicy || 'workflowsFromSameOwner'
        }
      })
    });
  })
  .then(r => r.json())
  .then(data => {
    if (data.id) console.log('\n✅ Workflow atualizado com sucesso! ID:', data.id);
    else console.log('❌ Erro:', JSON.stringify(data));
  })
  .catch(console.error);
