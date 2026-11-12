window.fullstackNew = (() => {
  const pergunta = (prompt, choices, answer, feedback) => ({prompt, choices, answer, feedback});
  const teste = (label, args, expected) => ({label, args, expected});

  const exportacoes = [
    {id: 'EXP-42', estado: 'processando', arquivo: 'rascunho-interno.csv'},
    {id: 'EXP-43', estado: 'pronto', arquivo: 'pedidos-outubro.csv'},
    {id: 'EXP-44', estado: 'falhou'},
    {id: 'EXP-45', estado: 'em_fila'}
  ];
  const processando = {status: 200, body: {id: 'EXP-42', estado: 'processando'}};
  const arquivoPronto = {status: 200, body: {id: 'EXP-43', estado: 'pronto', arquivo: 'pedidos-outubro.csv'}};
  const geracaoFalhou = {status: 200, body: {id: 'EXP-44', estado: 'falhou'}};
  const emFila = {status: 200, body: {id: 'EXP-45', estado: 'em_fila'}};
  const exportacaoAusente = {status: 404, body: {erro: 'exportacao_nao_encontrada'}};
  const telaAguardando = {state: 'ready', message: 'Preparando a exportação.'};
  const telaArquivo = {
    state: 'success',
    message: 'Seu arquivo está pronto.',
    items: [{id: 'EXP-43', label: 'pedidos-outubro.csv', detail: 'Disponível para download'}]
  };
  const telaFalha = {state: 'error', message: 'A exportação falhou. Solicite outra.'};
  const telaAusente = {state: 'error', message: 'Exportação não encontrada.'};

  const pedidos = [
    {id: 104, status: 'pago'},
    {id: 105, status: 'aguardando_pagamento'},
    {id: 106, status: 'pago'}
  ];
  const todosProntos = {status: 200, body: {prontos: [104, 106], bloqueados: []}};
  const loteMisto = {
    status: 200,
    body: {
      prontos: [104],
      bloqueados: [{id: 105, motivo: 'status_incompativel'}, {id: 999, motivo: 'nao_encontrado'}]
    }
  };
  const todosBloqueados = {
    status: 200,
    body: {
      prontos: [],
      bloqueados: [{id: 105, motivo: 'status_incompativel'}, {id: 999, motivo: 'nao_encontrado'}]
    }
  };
  const loteVazio = {status: 400, body: {erro: 'selecao_vazia'}};
  const itemPronto104 = {id: 104, label: 'Pedido 104', detail: 'Pronto para expedir'};
  const itensBloqueados = [
    {id: 105, label: 'Pedido 105', detail: 'Status incompatível'},
    {id: 999, label: 'Pedido 999', detail: 'Pedido não encontrado'}
  ];
  const telaTodosProntos = {
    state: 'success', message: 'Todos os pedidos podem seguir.',
    items: [itemPronto104, {id: 106, label: 'Pedido 106', detail: 'Pronto para expedir'}]
  };
  const telaLoteMisto = {
    state: 'ready', message: 'Separe os pedidos bloqueados.',
    items: [itemPronto104, ...itensBloqueados]
  };
  const telaTodosBloqueados = {state: 'empty', message: 'Nenhum pedido pode seguir.', items: itensBloqueados};
  const telaLoteVazio = {state: 'error', message: 'Selecione pelo menos um pedido.'};

  return [
    {
      id: 'FS-207',
      title: 'Cadê o arquivo da exportação?',
      category: 'Exportação assíncrona',
      description: 'Consulte o estado de uma exportação e mostre na tela quando aguardar, baixar ou solicitar uma nova.',
      minutes: 20,
      icon: 'activity',
      theme: 'mint',
      skills: ['HTTP', 'API assíncrona', 'Estados de interface', 'Jira', 'Slack'],
      story: {
        person: 'Eva',
        role: 'Financeiro',
        message: 'Ao exportar o histórico mensal, a tela diz que o arquivo não existe. Pouco depois, ele aparece se eu recarregar. Preciso saber se ainda está sendo gerado ou se houve falha.',
        criteria: [
          'Uma exportação existente tem um estado consultável, inclusive durante a geração.',
          'O nome do arquivo só aparece quando ele está pronto.',
          'A interface diferencia preparação, arquivo disponível e falha.'
        ],
        evidence: {
          label: 'Network · consulta de status',
          code: 'GET /api/exportacoes/EXP-42\n404 Not Found\n\nRegistro interno: EXP-42 · processando'
        },
        question: pergunta('O que o endpoint de status deve responder enquanto uma exportação existente é gerada?',
          ['404 até surgir um arquivo.', '200 com o estado do processamento.', '200 com um link de download provisório.'], 1,
          ['A consulta é sobre a exportação, que já existe.', 'O cliente consegue mostrar a preparação sem disponibilizar um arquivo antes da hora.', 'Um link provisório pode induzir a uma tentativa de download prematura.'])
      },
      backend: {
        goal: 'Implemente responder(requisicao, exportacoes). Encontre o registro com id igual a requisicao.id. Se não existir, retorne {status:404,body:{erro:"exportacao_nao_encontrada"}}. Se existir, retorne {status:200,body:{id,estado}} e inclua arquivo no body somente quando estado for "pronto".',
        functionName: 'responder',
        starter: `function responder(requisicao, exportacoes) {
  const exportacao = exportacoes.find(item => item.id === requisicao.id);
  if (!exportacao || exportacao.estado !== 'pronto') {
    return {status: 404, body: {erro: 'exportacao_nao_encontrada'}};
  }
  return {status: 200, body: exportacao};
}`,
        answer: `function responder(requisicao, exportacoes) {
  const exportacao = exportacoes.find(item => item.id === requisicao.id);
  if (!exportacao) return {status: 404, body: {erro: 'exportacao_nao_encontrada'}};

  const {id, estado, arquivo} = exportacao;
  const body = {id, estado};
  if (estado === 'pronto') body.arquivo = arquivo;
  return {status: 200, body};
}`,
        hints: [
          'Use a existência do registro para decidir entre 200 e 404.',
          'Monte o body com os campos permitidos e acrescente arquivo apenas no estado pronto.'
        ],
        note: 'O laboratório recebe uma fotografia da fila e simula GET. A geração do CSV ocorreria em um processo de trabalho separado.',
        tests: [
          teste('Preparação em andamento, sem publicar o rascunho', [{id: 'EXP-42'}, exportacoes], processando),
          teste('Arquivo pronto com nome disponível', [{id: 'EXP-43'}, exportacoes], arquivoPronto),
          teste('Falha ainda é um estado consultável', [{id: 'EXP-44'}, exportacoes], geracaoFalhou),
          teste('Na fila, antes de iniciar', [{id: 'EXP-45'}, exportacoes], emFila),
          teste('Identificador inexistente', [{id: 'EXP-99'}, exportacoes], exportacaoAusente)
        ]
      },
      frontend: {
        goal: 'Implemente renderizar(resposta). Para 404, retorne {state:"error",message:"Exportação não encontrada."}. Para body.estado igual a "falhou", retorne {state:"error",message:"A exportação falhou. Solicite outra."}. Para "em_fila" ou "processando", use {state:"ready",message:"Preparando a exportação."}. Para "pronto", use state "success", message "Seu arquivo está pronto." e items com um objeto {id:body.id,label:body.arquivo,detail:"Disponível para download"}. Omita items nos outros casos.',
        functionName: 'renderizar',
        starter: `function renderizar(resposta) {
  if (resposta.status === 404) {
    return {state: 'error', message: 'Exportação não encontrada.'};
  }
  return {
    state: 'success',
    message: 'Seu arquivo está pronto.',
    items: [{id: resposta.body.id, label: resposta.body.arquivo, detail: 'Disponível para download'}]
  };
}`,
        answer: `function renderizar(resposta) {
  if (resposta.status === 404) {
    return {state: 'error', message: 'Exportação não encontrada.'};
  }

  const {id, estado, arquivo} = resposta.body;
  if (estado === 'falhou') {
    return {state: 'error', message: 'A exportação falhou. Solicite outra.'};
  }
  if (estado === 'pronto') {
    return {
      state: 'success',
      message: 'Seu arquivo está pronto.',
      items: [{id, label: arquivo, detail: 'Disponível para download'}]
    };
  }
  return {state: 'ready', message: 'Preparando a exportação.'};
}`,
        hints: [
          'O HTTP 200 indica que a consulta funcionou. Leia também body.estado.',
          'A tela só precisa listar um arquivo quando o backend informar o estado pronto.'
        ],
        note: 'O laboratório usa uma requisição por cenário. Uma interface com atualização automática poderia repetir a consulta com intervalo e encerrar ao chegar em pronto ou falhou.',
        tests: [
          teste('Mostrar a preparação sem arquivo', [processando], telaAguardando),
          teste('Exibir o arquivo disponível', [arquivoPronto], telaArquivo),
          teste('Explicar como agir após falha', [geracaoFalhou], telaFalha),
          teste('Tratar a fila como preparação', [emFila], telaAguardando),
          teste('Explicar que o identificador não existe', [exportacaoAusente], telaAusente)
        ]
      },
      integration: [
        {label: 'Relatório em processamento', method: 'GET', path: '/api/exportacoes/EXP-42', args: [{id: 'EXP-42'}, exportacoes], response: processando, view: telaAguardando},
        {label: 'CSV pronto para baixar', method: 'GET', path: '/api/exportacoes/EXP-43', args: [{id: 'EXP-43'}, exportacoes], response: arquivoPronto, view: telaArquivo},
        {label: 'Geração interrompida', method: 'GET', path: '/api/exportacoes/EXP-44', args: [{id: 'EXP-44'}, exportacoes], response: geracaoFalhou, view: telaFalha}
      ],
      handoff: {
        channel: '#financeiro',
        slack: 'FS-207 · A consulta agora distingue exportação em preparo, arquivo pronto e falha. Passei os três cenários do Portal. Eva, pode validar em homologação se a mensagem de preparação resolve a dúvida?',
        pr: 'FS-207 · GET de exportações devolve o estado da tarefa existente e inclui o nome do arquivo só quando pronto. A tela usa esse estado para orientar o usuário. Testei preparação sem arquivo, arquivo pronto e falha, além de ID inexistente no teste de API.'
      },
      recall: [
        pergunta('A consulta de uma exportação falha durante a geração. Qual detalhe ajuda a separar erro HTTP e falha da tarefa?',
          ['O tempo total da requisição.', 'O status HTTP e o campo estado no body.', 'A extensão do arquivo.'], 1,
          ['A duração, sozinha, não identifica o resultado.', 'Um GET 200 pode descrever uma tarefa que terminou com falha.', 'A extensão não indica como a consulta ou a geração terminou.']),
        pergunta('A interface atualiza o status automaticamente. Quando a sequência de consultas pode terminar?',
          ['Ao receber o primeiro 200.', 'Somente depois de baixar o CSV.', 'Quando o estado indicar pronto ou falhou.'], 2,
          ['Um 200 também pode indicar que a tarefa segue em andamento.', 'A atualização do estado e a ação de download são independentes.', 'Pronto e falhou encerram a geração neste fluxo.']),
        pergunta('O processo de exportação já criou um rascunho privado. O que o backend informa ao cliente enquanto a tarefa está processando?',
          ['O ID e o estado da exportação.', 'O nome do rascunho e uma mensagem de sucesso.', 'Um 404 porque ainda não há arquivo definitivo.'], 0,
          ['O contrato mantém o usuário informado sem publicar um arquivo incompleto.', 'O arquivo só está disponível no estado pronto.', 'A exportação existe e pode ser consultada.'])
      ],
      refs: [
        {label: 'Microsoft Learn · Padrão de requisição e resposta assíncronas', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/asynchronous-request-reply'},
        {label: 'RFC 9110 · HTTP 404', url: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found'}
      ]
    },
    {
      id: 'FS-208',
      title: 'Uma triagem antes da expedição',
      category: 'Operação em lote',
      description: 'Crie uma prévia de expedição que classifica cada pedido e explica os bloqueios à operação.',
      minutes: 22,
      icon: 'layers',
      theme: 'orange',
      skills: ['API em lote', 'Regras de negócio', 'Estados de interface', 'Jira', 'Slack'],
      story: {
        person: 'Bia',
        role: 'Operações',
        message: 'Quando seleciono dez pedidos, quero ver quais podem seguir para expedição e o motivo dos bloqueios. Hoje aparece só uma mensagem de sucesso, até quando há pedidos aguardando pagamento.',
        criteria: [
          'Cada ID aparece uma vez. Cada lista mantém a ordem original da seleção.',
          'A API retorna os pedidos prontos e a razão de cada bloqueio, sem alterar os pedidos.',
          'A tela diferencia seleção totalmente elegível, lote misto e lote sem pedidos prontos.'
        ],
        evidence: {
          label: 'Homologação · lista de pedidos',
          code: 'Seleção: [104, 105, 999, 104]\n104: pago · 105: aguardando pagamento · 999: não encontrado\nTela atual: “Todos os pedidos podem seguir.”'
        },
        question: pergunta('Que contrato ajuda o operador a corrigir uma seleção parcialmente elegível?',
          ['Devolver apenas a quantidade de pedidos selecionados.', 'Enviar um erro único quando qualquer pedido não puder seguir.', 'Devolver os IDs prontos e o motivo de bloqueio por ID.'], 2,
          ['A quantidade não diz quais pedidos separar.', 'A prévia perderia os detalhes que orientam o operador.', 'A tela pode mostrar o resultado individual e preservar os pedidos elegíveis.'])
      },
      backend: {
        goal: 'Implemente responder(requisicao, pedidos). A seleção é requisicao.ids, uma lista de números. Se estiver vazia, retorne {status:400,body:{erro:"selecao_vazia"}}. Para cada ID único, seguindo a ordem original, inclua o ID em prontos quando o pedido estiver "pago". Caso contrário, inclua {id,motivo} em bloqueados com motivo "nao_encontrado" se não existir ou "status_incompativel" se existir em outro estado. Retorne {status:200,body:{prontos,bloqueados}}.',
        functionName: 'responder',
        starter: `function responder(requisicao, pedidos) {
  if (!requisicao.ids.length) {
    return {status: 400, body: {erro: 'selecao_vazia'}};
  }
  return {status: 200, body: {prontos: requisicao.ids, bloqueados: []}};
}`,
        answer: `function responder(requisicao, pedidos) {
  if (!requisicao.ids.length) {
    return {status: 400, body: {erro: 'selecao_vazia'}};
  }

  const prontos = [];
  const bloqueados = [];
  const pedidosPorId = new Map(pedidos.map(pedido => [pedido.id, pedido]));
  for (const id of new Set(requisicao.ids)) {
    const pedido = pedidosPorId.get(id);
    if (pedido?.status === 'pago') {
      prontos.push(id);
    } else {
      bloqueados.push({id, motivo: pedido ? 'status_incompativel' : 'nao_encontrado'});
    }
  }
  return {status: 200, body: {prontos, bloqueados}};
}`,
        hints: [
          'Um Set elimina IDs repetidos e conserva a ordem da primeira ocorrência.',
          'Consulte cada ID e use razões distintas para pedido ausente e status não elegível.'
        ],
        note: 'Esta API simula uma prévia de seleção. A expedição real teria uma operação separada com nova verificação dos estados.',
        tests: [
          teste('Dois pedidos pagos', [{ids: [104, 106]}, pedidos], todosProntos),
          teste('Pedido pago, pedido bloqueado, ID ausente e repetição', [{ids: [104, 105, 999, 104]}, pedidos], loteMisto),
          teste('Seleção com todos bloqueados', [{ids: [105, 999]}, pedidos], todosBloqueados),
          teste('Seleção vazia', [{ids: []}, pedidos], loteVazio),
          teste('Mantém a ordem e elimina repetições entre os prontos', [{ids: [106, 104, 106]}, pedidos],
            {status: 200, body: {prontos: [106, 104], bloqueados: []}})
        ]
      },
      frontend: {
        goal: 'Implemente renderizar(resposta). Em 400, retorne {state:"error",message:"Selecione pelo menos um pedido."} sem items. Em 200, liste em items primeiro os prontos e depois os bloqueados, na ordem de cada lista. Cada item tem id, label "Pedido " seguido do ID e detail "Pronto para expedir", "Status incompatível" ou "Pedido não encontrado" conforme o resultado. Com todos prontos, use state "success" e message "Todos os pedidos podem seguir.". Com lote misto, use state "ready" e message "Separe os pedidos bloqueados.". Sem prontos, use state "empty" e message "Nenhum pedido pode seguir." e mantenha items com os motivos.',
        functionName: 'renderizar',
        starter: `function renderizar(resposta) {
  if (resposta.status === 400) {
    return {state: 'error', message: 'Selecione pelo menos um pedido.'};
  }
  const items = resposta.body.prontos.map(id => ({
    id, label: 'Pedido ' + id, detail: 'Pronto para expedir'
  }));
  return {state: 'success', message: 'Todos os pedidos podem seguir.', items};
}`,
        answer: `function renderizar(resposta) {
  if (resposta.status === 400) {
    return {state: 'error', message: 'Selecione pelo menos um pedido.'};
  }

  const {prontos, bloqueados} = resposta.body;
  const items = [
    ...prontos.map(id => ({id, label: 'Pedido ' + id, detail: 'Pronto para expedir'})),
    ...bloqueados.map(({id, motivo}) => ({
      id,
      label: 'Pedido ' + id,
      detail: motivo === 'nao_encontrado' ? 'Pedido não encontrado' : 'Status incompatível'
    }))
  ];

  if (!prontos.length) return {state: 'empty', message: 'Nenhum pedido pode seguir.', items};
  if (bloqueados.length) return {state: 'ready', message: 'Separe os pedidos bloqueados.', items};
  return {state: 'success', message: 'Todos os pedidos podem seguir.', items};
}`,
        hints: [
          'Mapeie as duas listas em itens da interface, usando o motivo para compor o detalhe.',
          'Verifique primeiro se faltam pedidos prontos e depois se a seleção é mista.'
        ],
        tests: [
          teste('Exibir dois pedidos prontos', [todosProntos], telaTodosProntos),
          teste('Listar prontos e bloqueados no mesmo lote', [loteMisto], telaLoteMisto),
          teste('Explicar os bloqueios mesmo sem pedidos prontos', [todosBloqueados], telaTodosBloqueados),
          teste('Orientar após envio da seleção vazia', [loteVazio], telaLoteVazio)
        ]
      },
      integration: [
        {label: 'Seleção totalmente elegível', method: 'POST', path: '/api/expedicao/previa', args: [{ids: [104, 106]}, pedidos], response: todosProntos, view: telaTodosProntos},
        {label: 'Seleção mista com ID repetido', method: 'POST', path: '/api/expedicao/previa', args: [{ids: [104, 105, 999, 104]}, pedidos], response: loteMisto, view: telaLoteMisto},
        {label: 'Nenhum pedido elegível', method: 'POST', path: '/api/expedicao/previa', args: [{ids: [105, 999]}, pedidos], response: todosBloqueados, view: telaTodosBloqueados}
      ],
      handoff: {
        channel: '#operacoes',
        slack: 'FS-208 · A prévia agora lista os pedidos que podem seguir e explica cada bloqueio. Validei lote todo elegível, lote misto com repetição e lote sem elegíveis. Bia, pode conferir se os motivos ajudam a separar o próximo lote?',
        pr: 'FS-208 · POST de prévia deduplica IDs, classifica a seleção sem alterar pedidos e mantém a ordem dentro de cada lista. A interface mostra o motivo por item. Validei todos elegíveis, lote misto, nenhum elegível e seleção vazia.'
      },
      recall: [
        pergunta('A prévia devolveu HTTP 200, mas nenhum pedido pode seguir. Qual informação a tela deve preservar?',
          ['Os IDs e os motivos de bloqueio.', 'Só um indicador verde de sucesso.', 'Só o número total de pedidos.'], 0,
          ['O operador pode corrigir a seleção com base nos motivos.', 'O status HTTP descreve a execução da prévia, não a elegibilidade.', 'A quantidade não mostra o que impede cada pedido de seguir.']),
        pergunta('Um pedido foi marcado duas vezes na interface. Onde a regra que impede duplicidade deve ser garantida?',
          ['Apenas no CSS que desabilita o botão.', 'No backend que classifica os IDs.', 'Apenas na descrição do Jira.'], 1,
          ['A API ainda pode receber IDs repetidos de outros clientes ou de um erro de interface.', 'O backend garante um resultado por pedido, independentemente de quem montou a seleção.', 'O critério documentado ainda precisa de código e teste.']),
        pergunta('Depois da prévia, um pedido perdeu a elegibilidade. O que deve acontecer na expedição real?',
          ['Usar o resultado da prévia como autorização permanente.', 'Esconder o pedido na tela e enviar o lote antigo.', 'Revalidar a elegibilidade antes de efetivar a expedição.'], 2,
          ['O resultado da prévia descreve um momento, e os dados podem mudar.', 'A alteração visual não protege a operação no backend.', 'A confirmação precisa checar o estado atual dos pedidos.'])
      ],
      refs: [
        {label: 'RFC 9110 · Resposta HTTP 200', url: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok'},
        {label: 'RFC 9110 · Resposta HTTP 400', url: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-400-bad-request'}
      ]
    }
  ];
})();
