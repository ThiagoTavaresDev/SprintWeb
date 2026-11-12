window.extraMissions = [
  {
    id: 'WEB-104',
    category: 'Entrega',
    title: 'Um PR que dá para revisar',
    description: 'Leia uma falha de CI, corrija o total de pedidos e prepare um pull request com evidência.',
    minutes: 10,
    icon: 'git',
    theme: 'orange',
    skills: ['GitHub', 'Pull request', 'CI', 'Teste de regressão'],
    story: {
      person: 'Lia',
      role: 'Revisora de código',
      message: 'O PR do resumo de vendas ficou vermelho no CI. Em uma lista com R$ 49,00 de pedidos ativos e R$ 10,00 cancelados, o portal mostra R$ 59,00 faturáveis. Você consegue corrigir e me chamar para revisar o diff?',
      criteria: [
        'Somar apenas pedidos com status diferente de cancelado.',
        'Usar valores em centavos e retornar zero para a lista vazia.',
        'Registrar o teste que cobre a regressão no pull request.'
      ],
      evidence: {
        label: 'GitHub Actions · testes do PR',
        code: '✓ soma pedidos ativos\n✓ retorna zero para lista vazia\n✗ ignora pedidos cancelados\n  esperado 4900 | recebido 5900'
      },
      question: {
        prompt: 'Qual é o próximo passo ao ler esse resultado?',
        choices: [
          'Atualizar o valor esperado para 5900 e executar o CI de novo.',
          'Reproduzir o caso e corrigir a função de totalização.',
          'Reexecutar o workflow até obter um resultado verde.'
        ],
        answer: 1,
        feedback: [
          'O critério de produto exclui cancelados. Um esperado de 5900 aceitaria a regressão.',
          'O teste aponta o cenário exato e o valor esperado. Use ambos para validar a correção.',
          'O mesmo conjunto de entradas tende a falhar de novo. Inspecione a diferença entre esperado e recebido.'
        ]
      }
    },
    lab: {
      goal: 'Implemente totalFaturavel(pedidos). Some valorCentavos apenas para pedidos cujo status seja diferente de cancelado. Mantenha o retorno em centavos.',
      functionName: 'totalFaturavel',
      starter: `function totalFaturavel(pedidos) {
  return pedidos.reduce((total, pedido) => total + pedido.valorCentavos, 0);
}`,
      answer: `function totalFaturavel(pedidos) {
  return pedidos
    .filter(pedido => pedido.status !== 'cancelado')
    .reduce((total, pedido) => total + pedido.valorCentavos, 0);
}`,
      hints: [
        'Escolha os pedidos que entram na soma antes de acumular os valores.',
        'filter aceita um predicado. Compare pedido.status com a string cancelado.'
      ],
      tests: [
        { label: 'Dois pedidos ativos', args: [[{ status: 'pago', valorCentavos: 3200 }, { status: 'pendente', valorCentavos: 1700 }]], expected: 4900 },
        { label: 'Um cancelado entre os ativos', args: [[{ status: 'pago', valorCentavos: 4900 }, { status: 'cancelado', valorCentavos: 1000 }]], expected: 4900 },
        { label: 'Todos cancelados', args: [[{ status: 'cancelado', valorCentavos: 1850 }]], expected: 0 },
        { label: 'Lista vazia', args: [[]], expected: 0 }
      ]
    },
    delivery: {
      prompt: 'Qual descrição ajuda Lia a revisar o PR?',
      choices: [
        'Ajustei totalFaturavel. O CI está verde.',
        'Corrigi a regra e aproveitei para reorganizar vários arquivos do portal.',
        'WEB-104 · Excluí cancelados do total em centavos. Validei pedidos ativos, lista mista, só cancelados e lista vazia.'
      ],
      answer: 2,
      feedback: [
        'Inclua o comportamento alterado e os cenários validados. Isso facilita a leitura do diff.',
        'Um diff com mudanças de vários tipos aumenta o esforço de revisão. Descreva a correção e suas verificações.',
        'A descrição liga o PR ao ticket, resume a regra e mostra como a regressão foi coberta.'
      ],
      artifact: {
        label: 'Descrição do pull request',
        text: 'WEB-104 · Corrige o total faturável\n\nO resumo somava pedidos cancelados. Ajustei totalFaturavel para excluí-los e manter o retorno em centavos.\n\nTestes executados no laboratório: ativos, lista mista, só cancelados e lista vazia.\n\nPonto de revisão: confira se o diff aplica a regra antes da soma.'
      },
      guide: 'No GitHub, confira o diff em Files changed, consulte os checks do PR e solicite uma revisão.'
    },
    recall: [
      {
        prompt: 'Qual caso de regressão diferencia a função corrigida de uma que soma todos os pedidos?',
        choices: ['Uma lista vazia.', 'Um pedido ativo e um cancelado com valor positivo.', 'Dois pedidos ativos de mesmo valor.'],
        answer: 1,
        feedback: ['As duas versões devolvem zero.', 'A versão antiga incluiria o cancelado e produziria um total maior.', 'As duas versões incluem os pedidos ativos.']
      },
      {
        prompt: 'Onde a revisora consegue comparar as linhas alteradas pelo PR?',
        choices: ['Na aba Files changed.', 'Na lista de issues abertas.', 'No histórico de conversas do Slack.'],
        answer: 0,
        feedback: ['A aba Files changed exibe o diff do PR.', 'A lista de issues acompanha tarefas. Abra o PR e veja seu diff.', 'O Slack pode conter o link. O diff fica no PR.']
      },
      {
        prompt: 'Os checks do CI passaram. Qual ação ajuda a preparar a integração da mudança?',
        choices: ['Remover o teste que falhava.', 'Alterar o ticket para cancelado.', 'Pedir revisão com o contexto do ticket e os casos testados.'],
        answer: 2,
        feedback: ['O teste protege a regra contra regressões futuras.', 'A tarefa de correção segue em revisão conforme o fluxo da equipe.', 'A revisão acrescenta a verificação do diff e da regra de produto.']
      }
    ],
    refs: [
      { label: 'GitHub · Revisar mudanças de um PR', url: 'https://docs.github.com/en/get-started/start-your-journey/reviewing-your-proposed-changes' },
      { label: 'GitHub Actions · Integração contínua', url: 'https://docs.github.com/en/actions/get-started/continuous-integration' }
    ]
  },
  {
    id: 'WEB-105',
    category: 'Segurança',
    title: 'O pedido da outra filial',
    description: 'Investigue um acesso indevido e aplique a autorização por pedido na API.',
    minutes: 12,
    icon: 'shield',
    theme: 'rose',
    skills: ['Autorização', 'API', 'Testes de acesso', 'Jira'],
    story: {
      person: 'Rafael',
      role: 'Analista de qualidade',
      message: 'Em homologação, entrei como operador da filial Norte. O portal esconde o pedido da filial Sul na lista, mas ao trocar o ID na URL da API consegui ler o pedido. Testei com dados fictícios e registrei a reprodução no ticket.',
      criteria: [
        'Operador pode acessar somente pedidos da própria filial e empresa.',
        'Suporte pode acessar pedidos de qualquer filial da própria empresa.',
        'Sessões ausentes e papéis desconhecidos têm acesso negado.'
      ],
      evidence: {
        label: 'Homologação · requisições com a mesma sessão',
        code: 'Sessão autenticada: empresa A, filial Norte, operador\nGET /api/pedidos/418  →  200  (empresa A, filial Norte)\nGET /api/pedidos/419  →  200  (empresa A, filial Sul)'
      },
      question: {
        prompt: 'Onde deve entrar a regra que decide se a sessão pode ler o pedido 419?',
        choices: [
          'Na API, antes de devolver o pedido, usando a sessão e os dados do objeto.',
          'No componente da lista, escondendo a linha da filial Sul.',
          'No formato do ID, trocando o número por um identificador difícil de adivinhar.'
        ],
        answer: 0,
        feedback: [
          'A API conhece a sessão e o pedido e consegue validar a política mesmo quando alguém chama a rota diretamente.',
          'A lista já filtra a exibição. Uma requisição direta ainda alcança o endpoint.',
          'IDs difíceis de adivinhar reduzem a enumeração. A API ainda precisa decidir se a sessão pode ler cada pedido.'
        ]
      }
    },
    lab: {
      goal: 'Corrija podeVerPedido(usuario, pedido) para aplicar os critérios da empresa e da filial. Retorne true ou false em todos os cenários.',
      functionName: 'podeVerPedido',
      starter: `function podeVerPedido(usuario, pedido) {
  return Boolean(usuario && pedido);
}`,
      answer: `function podeVerPedido(usuario, pedido) {
  if (!usuario || !pedido || !usuario.empresa || usuario.empresa !== pedido.empresa) {
    return false;
  }

  return usuario.papel === 'suporte' ||
    (usuario.papel === 'operador' && Boolean(usuario.filial) && usuario.filial === pedido.filial);
}`,
      hints: [
        'Valide primeiro a presença da sessão e se as empresas coincidem.',
        'Dentro da mesma empresa, suporte pode passar. Operador precisa da filial correspondente.'
      ],
      tests: [
        { label: 'Operador da mesma filial', args: [{ papel: 'operador', empresa: 'A', filial: 'Norte' }, { empresa: 'A', filial: 'Norte' }], expected: true },
        { label: 'Operador de outra filial', args: [{ papel: 'operador', empresa: 'A', filial: 'Norte' }, { empresa: 'A', filial: 'Sul' }], expected: false },
        { label: 'Suporte em outra filial da mesma empresa', args: [{ papel: 'suporte', empresa: 'A', filial: 'Norte' }, { empresa: 'A', filial: 'Sul' }], expected: true },
        { label: 'Suporte de outra empresa', args: [{ papel: 'suporte', empresa: 'B', filial: 'Norte' }, { empresa: 'A', filial: 'Norte' }], expected: false },
        { label: 'Sessão ausente', args: [null, { empresa: 'A', filial: 'Norte' }], expected: false },
        { label: 'Papel desconhecido', args: [{ papel: 'visitante', empresa: 'A', filial: 'Norte' }, { empresa: 'A', filial: 'Norte' }], expected: false },
        { label: 'Empresa ausente na sessão e no pedido', args: [{ papel: 'suporte' }, { filial: 'Norte' }], expected: false },
        { label: 'Filial ausente na sessão e no pedido', args: [{ papel: 'operador', empresa: 'A' }, { empresa: 'A' }], expected: false }
      ],
      note: 'O laboratório avalia a regra de autorização. No endpoint, obtenha o usuário da sessão validada e carregue o pedido no servidor antes de aplicar essa regra.'
    },
    delivery: {
      prompt: 'O que registrar no ticket para QA conseguir validar a correção?',
      choices: [
        'Pedir ao QA que confirme apenas se a lista do portal abre.',
        'Incluir os passos em homologação, o resultado por perfil e o link do PR no fluxo da equipe.',
        'Marcar como concluído assim que a função passar em um teste local.'
      ],
      answer: 1,
      feedback: [
        'A regressão aparece na chamada direta da API. Peça ao QA para trocar o ID e conferir o acesso.',
        'Passos e resultados esperados tornam a validação reproduzível. O PR permite revisar a regra aplicada.',
        'A equipe ainda precisa validar a chamada real em homologação. Encaminhe o ticket para revisão com as evidências.'
      ],
      artifact: {
        label: 'Comentário de atualização no Jira',
        text: 'WEB-105 · Autorização por pedido\n\nEm homologação, use uma sessão fictícia da filial Norte. Compare GET /api/pedidos/418 com GET /api/pedidos/419. O operador pode ler o pedido da própria filial e deve ter o acesso negado ao da filial Sul.\n\nA regra passou no laboratório para operador, suporte, empresa diferente, sessão ausente e papel desconhecido. Validar também a chamada direta na API durante a revisão.'
      },
      guide: 'Registre a evidência no ticket e mova para o status de revisão usado pela equipe.'
    },
    recall: [
      {
        prompt: 'Um operador troca o ID no endpoint e recebe outro pedido. Qual teste captura esse problema?',
        choices: ['Verificar a cor do botão Ver pedido.', 'Conferir se o ID é numérico.', 'Repetir a chamada direta com um pedido de outra filial.'],
        answer: 2,
        feedback: ['A falha está na decisão da API. Teste o endpoint com a sessão do operador.', 'O formato do identificador é independente da autorização.', 'A troca controlada de ID exercita a regra para aquele objeto.']
      },
      {
        prompt: 'Uma pessoa autenticada pede um objeto de outra empresa. O que a API deve fazer?',
        choices: ['Negar a leitura.', 'Liberar a leitura se a sessão for recente.', 'Liberar a leitura se o pedido tiver ID imprevisível.'],
        answer: 0,
        feedback: ['A autenticação identifica a sessão. A autorização decide se ela pode acessar aquele objeto.', 'O tempo da sessão é independente da permissão sobre o pedido.', 'Um ID imprevisível dificulta a descoberta. A política da empresa continua valendo.']
      },
      {
        prompt: 'Qual é a origem confiável da empresa e do papel do usuário no endpoint?',
        choices: ['Os campos enviados pelo navegador no corpo da requisição.', 'A sessão validada pelo servidor.', 'O nome exibido no menu da interface.'],
        answer: 1,
        feedback: ['Quem chama a API pode editar o corpo da requisição.', 'A sessão validada fornece a identidade que a política usa.', 'A interface apresenta dados. A decisão de acesso pertence ao servidor.']
      }
    ],
    bridge: {
      title: 'Da permissão no desktop para a web',
      text: 'Um formulário desktop pode ocultar comandos conforme o perfil. No portal, a interface também pode fazer isso e o endpoint aplica a permissão a cada pedido solicitado.'
    },
    refs: [
      { label: 'OWASP · Autorização por objeto em APIs', url: 'https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/' },
      { label: 'Atlassian · Status dos itens de trabalho', url: 'https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-statuses-priorities-and-resolutions/' }
    ]
  },
  {
    id: 'WEB-106',
    category: 'Operação',
    title: 'Alerta depois do deploy',
    description: 'Separe ruído de evidência nos logs e escreva uma atualização de incidente para a equipe.',
    minutes: 11,
    icon: 'activity',
    theme: 'blue',
    skills: ['Logs', 'HTTP 5xx', 'Deploy', 'Slack'],
    story: {
      person: 'Camila',
      role: 'Engenheira de plantão',
      message: 'A taxa de erros de consulta de pedidos subiu logo após um deploy. O suporte trouxe o identificador req-730 de uma requisição afetada. Localize as falhas dessa requisição e me ajude a informar o que sabemos na conversa do incidente.',
      criteria: [
        'Filtrar os eventos pelo identificador exato da requisição.',
        'Selecionar respostas HTTP de 500 a 599 e preservar a ordem dos eventos.',
        'Comunicar o impacto observado e a próxima investigação.'
      ],
      evidence: {
        label: 'Logs do portal · amostra do incidente',
        code: '14:02:11  req-730  autenticação      200\n14:02:11  req-731  serviço-pedidos   503\n14:02:12  req-730  serviço-pedidos   504\n14:02:12  req-730  api                502'
      },
      question: {
        prompt: 'Qual evidência ajuda a seguir a falha desta requisição entre serviços?',
        choices: [
          'O erro 503 de req-731, pois também aconteceu depois do deploy.',
          'A ordem de chegada de todas as linhas, sem filtrar pelo identificador.',
          'Os eventos 504 e 502 associados a req-730.'
        ],
        answer: 2,
        feedback: [
          'O 503 pertence a outra requisição. Pode servir para estimar impacto, enquanto req-730 precisa da própria cadeia de eventos.',
          'Logs de várias requisições chegam intercalados. A correlação pelo identificador conecta os eventos certos.',
          'Esses eventos pertencem à requisição afetada e indicam onde concentrar a próxima investigação.'
        ]
      }
    },
    lab: {
      goal: 'Implemente localizarFalhas(eventos, requestId). Retorne os nomes das etapas com status HTTP 5xx para o ID recebido, na ordem em que aparecem nos eventos.',
      functionName: 'localizarFalhas',
      starter: `function localizarFalhas(eventos, requestId) {
  return eventos
    .filter(evento => evento.requestId === requestId)
    .map(evento => evento.etapa);
}`,
      answer: `function localizarFalhas(eventos, requestId) {
  return eventos
    .filter(evento => evento.requestId === requestId && evento.status >= 500 && evento.status <= 599)
    .map(evento => evento.etapa);
}`,
      hints: [
        'O código inicial já compara o identificador. Acrescente a condição sobre o status.',
        'O intervalo inclui 500 e 599. Combine as três comparações com &&.'
      ],
      tests: [
        { label: 'Uma falha em outra requisição', args: [[{ requestId: 'req-731', etapa: 'serviço-pedidos', status: 503 }, { requestId: 'req-730', etapa: 'api', status: 502 }], 'req-730'], expected: ['api'] },
        { label: 'Eventos de sucesso e falha no mesmo ID', args: [[{ requestId: 'req-730', etapa: 'autenticação', status: 200 }, { requestId: 'req-730', etapa: 'serviço-pedidos', status: 504 }, { requestId: 'req-730', etapa: 'api', status: 502 }], 'req-730'], expected: ['serviço-pedidos', 'api'] },
        { label: 'Limites da faixa 5xx', args: [[{ requestId: 'req-730', etapa: 'cliente', status: 499 }, { requestId: 'req-730', etapa: 'api', status: 500 }, { requestId: 'req-730', etapa: 'proxy', status: 599 }, { requestId: 'req-730', etapa: 'outro', status: 600 }], 'req-730'], expected: ['api', 'proxy'] },
        { label: 'ID sem eventos', args: [[{ requestId: 'req-731', etapa: 'api', status: 500 }], 'req-999'], expected: [] }
      ],
      note: 'Os eventos e horários são fictícios. Em um sistema real, use o identificador de correlação registrado pelos serviços para reconstruir a requisição.'
    },
    delivery: {
      prompt: 'Qual mensagem ajuda o plantão a coordenar os próximos passos?',
      choices: [
        'Parte das consultas está retornando 5xx. Na req-730, vimos 504 no serviço de pedidos e 502 na API. Vou conferir a mudança e comparar com requisições saudáveis.',
        'O deploy causou o incidente. Pode avisar que o banco está indisponível.',
        'Os logs têm vários erros. Vou abrir outra conversa para discutir cada um.'
      ],
      answer: 0,
      feedback: [
        'A atualização comunica o impacto observado, a evidência correlacionada e a próxima ação.',
        'A proximidade com o deploy indica uma hipótese. Os eventos disponíveis ainda pedem investigação da causa.',
        'Uma resposta na conversa original mantém as evidências e decisões acessíveis à equipe.'
      ],
      artifact: {
        label: 'Resposta na conversa do incidente',
        text: 'WEB-106 · Parte das consultas de pedidos apresenta 5xx. Na req-730, vimos 504 no serviço de pedidos seguido de 502 na API. Vou comparar requisições afetadas e saudáveis e conferir as mudanças do deploy. Atualizo nesta conversa em 15 minutos.'
      },
      guide: 'Responda na conversa original do incidente para manter a linha do tempo e as próximas atualizações no mesmo lugar.'
    },
    recall: [
      {
        prompt: 'Dois serviços produziram erros no mesmo segundo. Qual campo permite saber se os eventos vieram da mesma requisição?',
        choices: ['O identificador de correlação.', 'A severidade do log.', 'O horário arredondado para o segundo.'],
        answer: 0,
        feedback: ['O identificador propagado conecta os eventos daquela requisição.', 'Eventos de requisições diferentes podem ter a mesma severidade.', 'Serviços atendem várias requisições no mesmo segundo. Procure o identificador de correlação.']
      },
      {
        prompt: 'A taxa de erros subiu logo após uma publicação. Qual é a melhor leitura inicial?',
        choices: ['A causa está confirmada.', 'O deploy é uma hipótese a verificar com dados e mudanças recentes.', 'A hora do deploy basta para encerrar a investigação.'],
        answer: 1,
        feedback: ['A proximidade temporal orienta a investigação. A confirmação pede evidências adicionais.', 'Compare os erros, os horários, as mudanças e requisições saudáveis.', 'O horário ajuda a delimitar a busca. Investigue o comportamento dos serviços.']
      },
      {
        prompt: 'O que incluir em uma atualização durante a investigação?',
        choices: ['Apenas o nome do serviço.', 'Uma previsão de correção sem evidência.', 'Impacto observado, evidência disponível e próxima ação.'],
        answer: 2,
        feedback: ['O nome sozinho deixa a equipe sem contexto sobre impacto e andamento.', 'Informe a próxima verificação e quando haverá nova atualização.', 'A equipe consegue acompanhar o estado do incidente e coordenar a próxima decisão.']
      }
    ],
    refs: [
      { label: 'OpenTelemetry · Conceitos de observabilidade', url: 'https://opentelemetry.io/docs/concepts/' },
      { label: 'RFC 9110 · Respostas HTTP 5xx', url: 'https://www.rfc-editor.org/rfc/rfc9110.html#name-server-error-5xx' },
      { label: 'Slack · Conversas em threads', url: 'https://slack.com/help/articles/115000769927-Use-threads-to-organise-discussions-Use-threads-to-organize-discussions-' }
    ]
  }
];
