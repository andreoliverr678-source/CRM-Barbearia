const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTkzMGRkNy00ZDFkLTRjMmItODA1YS05NGU2NmNjYjZhNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWJjOGVlYjMtNzVhMi00M2VlLWI1ZjMtNDAwYjU0MTIwNDIxIiwiaWF0IjoxNzc4NzEzNDQ4LCJleHAiOjE3ODEyMzY4MDB9.hlefld3pupIqYQ8D6thsvm-wHyy54oWUJLQMeUlMtos';
const url = 'https://n8n.andreverissimo.shop/api/v1/workflows/ocGuVNYkRL96jrgq';

fetch(url, { headers: { 'X-N8N-API-KEY': apikey } })
  .then(r => r.json())
  .then(w => {
    let fixes = 0;

    // 1. Disable "alwaysOutputData" on Supabase nodes
    ['Agendamentos - Lembrete 24h', 'Agendamentos - Lembrete 2h', 'Clientes Inativos 30d'].forEach(name => {
      const node = w.nodes.find(n => n.name === name);
      if (node) {
        if (!node.onError) node.onError = 'stopWorkflow';
        // Set alwaysOutputData to false in node settings
        if (!node.parameters) node.parameters = {};
        // This is in the node's global settings, not parameters
        if (node.alwaysOutputData === true) {
          node.alwaysOutputData = false;
          fixes++;
          console.log('✅ Desativado alwaysOutputData em:', name);
        } else {
          console.log(name + ': alwaysOutputData =', node.alwaysOutputData, '(já correto ou não definido)');
        }
      }
    });

    // 2. Fix IF 24h/2h back to use $input.all().length > 0
    // The issue with notEmpty on id is that Supabase DOES return id when record found
    // but {} when not found (alwaysOutputData). If we disable alwaysOutputData,
    // the node will have 0 items and the if node won't even receive any input.
    // Actually with alwaysOutputData=false:
    //   - 0 results → node outputs nothing → IF not reached → workflow ends
    // But we need the IF for the case where 24h returns 0 to stop the flow!
    // So better approach: revert to $input.all().length > 0 which handles both cases

    const if24 = w.nodes.find(n => n.name === 'Tem agendamentos 24h?');
    if (if24) {
      if24.parameters.conditions.conditions[0] = {
        "id": "1",
        "leftValue": "={{ $input.all().length }}",
        "rightValue": 0,
        "operator": { "type": "number", "operation": "gt" }
      };
      console.log('✅ IF 24h revertido para: $input.all().length > 0');
    }

    const if2h = w.nodes.find(n => n.name === 'Tem agendamentos 2h?');
    if (if2h) {
      if2h.parameters.conditions.conditions[0] = {
        "id": "1",
        "leftValue": "={{ $input.all().length }}",
        "rightValue": 0,
        "operator": { "type": "number", "operation": "gt" }
      };
      console.log('✅ IF 2h revertido para: $input.all().length > 0');
    }

    // 3. Check all Supabase nodes for alwaysOutputData
    const supaNodes = w.nodes.filter(n => n.type === 'n8n-nodes-base.supabase');
    supaNodes.forEach(n => {
      console.log(`\nSupabase nó "${n.name}": alwaysOutputData=${n.alwaysOutputData}`);
      if (n.alwaysOutputData === true) {
        n.alwaysOutputData = false;
        console.log('  → Corrigido para false');
      }
    });

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
    if (data.id) console.log('\n✅ Workflow salvo! ID:', data.id);
    else console.log('❌ Erro:', JSON.stringify(data));
  })
  .catch(console.error);
