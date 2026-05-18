const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTkzMGRkNy00ZDFkLTRjMmItODA1YS05NGU2NmNjYjZhNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWJjOGVlYjMtNzVhMi00M2VlLWI1ZjMtNDAwYjU0MTIwNDIxIiwiaWF0IjoxNzc4NzEzNDQ4LCJleHAiOjE3ODEyMzY4MDB9.hlefld3pupIqYQ8D6thsvm-wHyy54oWUJLQMeUlMtos';
const url = 'https://n8n.andreverissimo.shop/api/v1/workflows/ocGuVNYkRL96jrgq';

fetch(url, { headers: { 'X-N8N-API-KEY': apikey } })
  .then(r => r.json())
  .then(w => {
    // Fix "Tem clientes inativos?" IF - was "notExists" should be "gt 0"
    const ifRea = w.nodes.find(n => n.name === 'Tem clientes inativos?');
    if (ifRea) {
      ifRea.parameters.conditions.conditions[0] = {
        "id": "1",
        "leftValue": "={{ $input.all().length }}",
        "rightValue": 0,
        "operator": {
          "type": "number",
          "operation": "gt"
        }
      };
      console.log('✅ "Tem clientes inativos?" corrigido: notExists → gt 0');
    }

    // Also check and fix 24h IF (it was using "gt" but browser said it was going to false 
    // when Supabase returns empty object {} — check if $input.all() returns [{json:{}}] for empty)
    // Actually the issue for 24h/2h is that Supabase returns {} (empty object) 
    // when no rows found, which n8n wraps as [{json:{}}] - length=1 triggers true!
    // Fix: check if the first item has an "id" field instead of just checking length
    
    const if24 = w.nodes.find(n => n.name === 'Tem agendamentos 24h?');
    if (if24) {
      if24.parameters.conditions.conditions[0] = {
        "id": "1",
        "leftValue": "={{ $input.first().json.id }}",
        "rightValue": "",
        "operator": {
          "type": "string",
          "operation": "notEmpty"
        }
      };
      console.log('✅ "Tem agendamentos 24h?" corrigido: length>0 → id não vazio');
    }
    
    const if2h = w.nodes.find(n => n.name === 'Tem agendamentos 2h?');
    if (if2h) {
      if2h.parameters.conditions.conditions[0] = {
        "id": "1",
        "leftValue": "={{ $input.first().json.id }}",
        "rightValue": "",
        "operator": {
          "type": "string",
          "operation": "notEmpty"
        }
      };
      console.log('✅ "Tem agendamentos 2h?" corrigido: length>0 → id não vazio');
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
    if (data.id) console.log('✅ Workflow Follow-up salvo! ID:', data.id);
    else console.log('❌ Erro:', JSON.stringify(data));
  })
  .catch(console.error);
