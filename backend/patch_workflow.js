const fs = require('fs');

const w = JSON.parse(fs.readFileSync('workflow_agent.json', 'utf8'));

// ═══════════════════════════════════════════════
// 1. ATUALIZAR NÓ "Agendar" — adicionar barbeiro_id
// ═══════════════════════════════════════════════
const agendar = w.nodes.find(x => x.id === '18657b9d-5970-47c4-b4f6-bae5f2d7da99');
if (agendar) {
  // Atualizar descrição da tool
  agendar.parameters.descriptionType = 'manual';
  agendar.parameters.toolDescription =
    'Cria um novo agendamento. Campos obrigatórios: nome, telefone, servico, data (YYYY-MM-DD), hora (HH:MM), status="pendente". Campo opcional: barbeiro_id (UUID do barbeiro — deixar como string vazia se cliente escolheu sem preferência para atribuição automática).';

  // Adicionar campo barbeiro_id se ainda não existir
  const jaTemBarbeiro = agendar.parameters.fieldsUi.fieldValues.find(f => f.fieldId === 'barbeiro_id');
  if (!jaTemBarbeiro) {
    agendar.parameters.fieldsUi.fieldValues.push({
      fieldId: 'barbeiro_id',
      fieldValue: "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('barbeiro_id', '') }}"
    });
  }
  console.log('✅ Nó Agendar atualizado com barbeiro_id');
}

// ═══════════════════════════════════════════════
// 2. CRIAR NÓ "buscar_barbeiros" — nova supabaseTool
// ═══════════════════════════════════════════════
const agentNodeId = '5be25f9d-d631-446e-8819-05103bc74937'; // André, Atendente (agent)
const agentNode = w.nodes.find(x => x.id === agentNodeId);

// Posição baseada nos outros tools do agente
const barbeirosToolNode = {
  parameters: {
    descriptionType: 'manual',
    toolDescription: 'Busca a lista de barbeiros ativos da barbearia. Use ANTES de oferecer opção de barbeiro ao cliente. Retorna: id (UUID), nome de cada barbeiro disponível. Não requer parâmetros.',
    operation: 'getAll',
    tableId: 'barbeiros',
    returnAll: true,
    filterType: 'string',
    filterString: '=ativo=eq.true'
  },
  id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'buscar_barbeiros',
  type: 'n8n-nodes-base.supabaseTool',
  typeVersion: 1,
  position: [200, 10688],
  credentials: {
    supabaseApi: {
      id: 'HoI9l5OTgXnvzb6O',
      name: 'Supabase account'
    }
  }
};

// Verificar se o nó já existe
const jaExiste = w.nodes.find(x => x.name === 'buscar_barbeiros');
if (!jaExiste) {
  w.nodes.push(barbeirosToolNode);
  console.log('✅ Nó buscar_barbeiros criado');
} else {
  console.log('ℹ️ Nó buscar_barbeiros já existe');
}

// ═══════════════════════════════════════════════
// 3. CONECTAR buscar_barbeiros ao agente
// ═══════════════════════════════════════════════
if (!w.connections['buscar_barbeiros']) {
  w.connections['buscar_barbeiros'] = { main: [] };
}

// Adicionar conexão do agente para o novo tool
if (w.connections[agentNodeId]) {
  // Encontrar conexão de ai_tool existente
  if (!w.connections[agentNodeId].ai_tool) {
    w.connections[agentNodeId].ai_tool = [[]];
  }
  // Verificar se já está conectado
  const jaConectado = w.connections[agentNodeId].ai_tool[0].find(c => c.node === 'buscar_barbeiros');
  if (!jaConectado) {
    w.connections[agentNodeId].ai_tool[0].push({
      node: 'buscar_barbeiros',
      type: 'ai_tool',
      index: 0
    });
    console.log('✅ buscar_barbeiros conectado ao agente');
  }
} else {
  // Tentar pelo nome do agente
  const agentName = 'André, Atendente';
  if (w.connections[agentName]) {
    if (!w.connections[agentName].ai_tool) {
      w.connections[agentName].ai_tool = [[]];
    }
    const jaConectado = w.connections[agentName].ai_tool[0].find(c => c.node === 'buscar_barbeiros');
    if (!jaConectado) {
      w.connections[agentName].ai_tool[0].push({
        node: 'buscar_barbeiros',
        type: 'ai_tool',
        index: 0
      });
      console.log('✅ buscar_barbeiros conectado ao agente (pelo nome)');
    }
  }
}

// ═══════════════════════════════════════════════
// 4. ATUALIZAR SYSTEM PROMPT DO AGENTE
// ═══════════════════════════════════════════════
const agent = w.nodes.find(x => x.id === agentNodeId);
if (agent && agent.parameters) {
  const currentPrompt = agent.parameters.options?.systemMessage || agent.parameters.systemMessage || '';
  
  // Bloco a inserir ANTES da seção de AGENDAMENTO
  const barbeiroBLoco = `
━━━━━━━━━━━━
ESCOLHA DO BARBEIRO
━━━━━━━━━━━━

Após confirmar data e horário, SEMPRE perguntar:

Você tem preferência de barbeiro?

Em seguida, chamar a tool "buscar_barbeiros" para listar os disponíveis e mostrar as opções:

Exemplo obrigatório:

Temos os seguintes barbeiros disponíveis:

1. [nome do barbeiro 1]
2. [nome do barbeiro 2]
... 

Ou se preferir, posso escolher o próximo disponível para o seu horário 😎

REGRAS OBRIGATÓRIAS:
* SEMPRE chamar "buscar_barbeiros" antes de listar nomes
* Nunca inventar nomes de barbeiros
* Se cliente escolher um barbeiro: usar o id (UUID) dele no campo barbeiro_id ao chamar "Agendar"
* Se cliente escolher sem preferência: deixar barbeiro_id como string vazia "" ao chamar "Agendar"
* O sistema atribuirá automaticamente o barbeiro livre

━━━━━━━━━━━━
`;

  const marcador = '━━━━━━━━━━━━\nAGENDAMENTO\n━━━━━━━━━━━━';
  
  let novoPrompt;
  if (currentPrompt.includes(marcador)) {
    novoPrompt = currentPrompt.replace(marcador, barbeiroBLoco + marcador);
    // Também atualizar a seção de campos obrigatórios do Agendar
    novoPrompt = novoPrompt.replace(
      'Campos obrigatórios:\n\nnome\ntelefone\nservico\ndata\nhora\nstatus = pendente',
      'Campos obrigatórios:\n\nnome\ntelefone\nservico\ndata\nhora\nstatus = pendente\nbarbeiro_id = UUID do barbeiro ou "" para sem preferência'
    );
    // Atualizar a regra após sucesso
    novoPrompt = novoPrompt.replace(
      'Após sucesso da tool:\n\nAgendado! ✅ [serviço] [data] às [hora]. Te espero lá 👊',
      'Após sucesso da tool:\n\nAgendado! ✅ [serviço] [data] às [hora] com [nome do barbeiro se escolhido, senão "nosso time"]. Te espero lá 👊'
    );
    console.log('✅ System prompt atualizado com fluxo de barbeiro');
  } else {
    console.log('⚠️ Marcador não encontrado no prompt — prompt não alterado');
    novoPrompt = currentPrompt;
  }

  if (agent.parameters.options) {
    agent.parameters.options.systemMessage = novoPrompt;
  } else {
    agent.parameters.systemMessage = novoPrompt;
  }
}

// ═══════════════════════════════════════════════
// 5. SALVAR WORKFLOW ATUALIZADO
// ═══════════════════════════════════════════════
fs.writeFileSync('workflow_agent_v2.json', JSON.stringify(w, null, 2));
console.log('\n✅ Workflow salvo como workflow_agent_v2.json');
console.log('Nodes total:', w.nodes.length);
