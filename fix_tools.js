const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4OTkzMGRkNy00ZDFkLTRjMmItODA1YS05NGU2NmNjYjZhNDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNWJjOGVlYjMtNzVhMi00M2VlLWI1ZjMtNDAwYjU0MTIwNDIxIiwiaWF0IjoxNzc4NzEzNDQ4LCJleHAiOjE3ODEyMzY4MDB9.hlefld3pupIqYQ8D6thsvm-wHyy54oWUJLQMeUlMtos';
const url = 'https://n8n.andreverissimo.shop/api/v1/workflows/1CUu2mqTMxbYCz9R';

fetch(url, { headers: { 'X-N8N-API-KEY': apikey } })
  .then(r => r.json())
  .then(w => {

    // ── FIX 1: Confirmar Agendamento - adicionar description clara e filtro por telefone como fallback
    const confirmar = w.nodes.find(n => n.name === 'Confirmar Agendamento');
    if (confirmar) {
      // Adicionar description para o AI saber quando usar
      confirmar.parameters.descriptionType = 'manual';
      confirmar.parameters.toolDescription = 
        'Use esta ferramenta para confirmar a presença de um cliente no agendamento. ' +
        'Chame SEMPRE quando o cliente disser "sim", "confirmo", "vou sim", "pode confirmar", "estarei aí", "ok", "fechado". ' +
        'ANTES de usar esta ferramenta, chame consultar_agendamento para obter o agendamento_id. ' +
        'Parâmetro obrigatório: agendamento_id (o id do agendamento retornado pelo consultar_agendamento).';
      console.log('✅ Confirmar Agendamento - description atualizada');
    }

    // ── FIX 2: Confirma_Agenda - corrigir filtro (estava com "Pendente" maiúsculo e sem $fromAI)
    const confirmaAgenda = w.nodes.find(n => n.name === 'Confirma_Agenda');
    if (confirmaAgenda) {
      // Desabilitar esta tool duplicada tornando-a inacessível ao AI
      confirmaAgenda.parameters.descriptionType = 'manual';
      confirmaAgenda.parameters.toolDescription = 
        'NAO USE ESTA FERRAMENTA. Use apenas confirmar_agendamento.';
      // Corrigir o filtro de status para minúsculo
      const statusFilter = confirmaAgenda.parameters.filters?.conditions?.find(c => c.keyName === 'status');
      if (statusFilter) {
        statusFilter.keyValue = 'pendente'; // era "Pendente" maiúsculo
      }
      console.log('✅ Confirma_Agenda - desativada para o AI e status corrigido para minúsculo');
    }

    // ── FIX 3: Consultar Agendamento - adicionar description mais clara
    const consultar = w.nodes.find(n => n.name === 'Consultar Agendamento');
    if (consultar) {
      consultar.parameters.descriptionType = 'manual';
      consultar.parameters.toolDescription = 
        'Use para buscar todos os agendamentos de um cliente pelo telefone. ' +
        'Retorna: id do agendamento, nome, serviço, data, hora, status. ' +
        'Chame SEMPRE antes de confirmar, cancelar ou remarcar. ' +
        'Parâmetro: telefone (o telefone do cliente, disponível em $("Dados").item.json.telefone).';
      console.log('✅ Consultar Agendamento - description atualizada');
    }

    // ── FIX 4: Cancelar Agendamento - garantir description
    const cancelar = w.nodes.find(n => n.name === 'Cancelar Agendamento');
    if (cancelar) {
      cancelar.parameters.descriptionType = 'manual';
      cancelar.parameters.toolDescription = 
        'Use para cancelar o agendamento de um cliente. ' +
        'Chame SEMPRE que o cliente disser que não pode comparecer ou quiser cancelar. ' +
        'ANTES: chame consultar_agendamento para obter o agendamento_id. ' +
        'Parâmetro obrigatório: agendamento_id.';
      console.log('✅ Cancelar Agendamento - description atualizada');
    }

    // ── FIX 5: Remarcar Agendamento - garantir description
    const remarcar = w.nodes.find(n => n.name === 'Remarcar Agendamento');
    if (remarcar) {
      remarcar.parameters.descriptionType = 'manual';
      remarcar.parameters.toolDescription = 
        'Use para alterar data e/ou hora do agendamento de um cliente. ' +
        'ANTES: chame consultar_agendamento para obter o agendamento_id. ' +
        'Parâmetros obrigatórios: agendamento_id, nova_data (formato YYYY-MM-DD), nova_hora (formato HH:MM).';
      console.log('✅ Remarcar Agendamento - description atualizada');
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
    if (data.id) {
      console.log('\n✅ Workflow Agente salvo! ID:', data.id);
    } else {
      console.log('❌ Erro:', JSON.stringify(data));
    }
  })
  .catch(console.error);
