(() => {
  const quiz = (prompt, options, answer) => ({
    prompt,
    choices: options.map(([choice]) => choice),
    answer,
    feedback: options.map(([, feedback]) => feedback)
  });
  const test = (label, args, expected) => ({label, args, expected});
  const ref = (label, url) => ({label, url});
  const dateOrders = [
    {id: 81, criadoEm: '2026-10-19T02:59:59.999Z'},
    {id: 82, criadoEm: '2026-10-18T22:00:00-05:00'},
    {id: 83, criadoEm: '2026-10-20T02:59:59.999Z'},
    {id: 84, criadoEm: '2026-10-20T03:00:00.000Z'}
  ];
  const inicioDia = '2026-10-19T03:00:00.000Z';
  const fimDia = '2026-10-20T03:00:00.000Z';
  const pedidoAtual = {id: 44, versao: 8, observacao: 'Recolher após as 14h', status: 'pendente'};
  const envioSalvo = [{contaId: 3, chave: 'exp-52', pedidoId: 52, servico: 'expresso', etiquetaId: 870}];
  const estoqueOk = {estoque: 10, gravacaoOk: true, reservas: []};
  const estoqueComFalha = {...estoqueOk, gravacaoOk: false};
  const codigoLongo = 'A12345678901';
  const parametroEsperado = valor => ({
    sql: 'SELECT Id FROM dbo.Produtos WHERE Codigo = @codigo;',
    parametro: {nome: '@codigo', tipo: 'VarChar', tamanho: 12, valor}
  });

  window.apiMissions = [
    {
      id: 'WEB-107', category: 'Validação de API', title: 'O cadastro que aceita tudo',
      description: 'Faça a API apontar o que precisa ser corrigido em cada campo do pedido.',
      minutes: 12, icon: 'terminal', theme: 'violet', skills: ['HTTP', 'Validação', 'Contrato de API'],
      story: {
        person: 'Cris', role: 'QA', message: 'Consegui criar um pedido com quantidade zero e CEP 123. O portal mostrou “Pedido criado” e a separação recebeu um registro inválido.',
        criteria: ['Aceitar quantidade inteira de 1 a 99 e CEP em texto com oito dígitos.', 'Retornar os campos inválidos juntos.', 'Usar 422 para dados inválidos em JSON que já foi interpretado.'],
        evidence: {label: 'Request de homologação', code: 'POST /api/pedidos\n{"quantidade":0,"cep":"123"}\n\nHTTP 201 Created\n{"id":981}'},
        question: quiz('Qual mudança dá feedback útil e protege outros clientes da API?', [
          ['Validar apenas no formulário', 'Outros clientes conseguem enviar pedidos diretamente para a API.'],
          ['Validar os dados no servidor e retornar 422 com os campos inválidos', 'Cada cliente pode exibir o erro no campo certo e a operação inválida fica bloqueada.'],
          ['Deixar o banco rejeitar e devolver 500', 'Os valores violam regras conhecidas do produto. Um erro por campo orienta como corrigir o pedido.']
        ], 1)
      },
      lab: {
        goal: 'Edite validarPedido(payload). Retorne {status, erros}. Use 201 e erros [] se for válido. Use 422 e os nomes dos campos inválidos em erros, na ordem quantidade, cep. Quantidade deve ser inteiro de 1 a 99 e CEP deve ser texto de oito dígitos.',
        functionName: 'validarPedido',
        starter: `function validarPedido(payload) {
  return {status: 201, erros: []};
}`,
        answer: `function validarPedido(payload) {
  const {quantidade, cep} = payload ?? {};
  const erros = [];
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
    erros.push('quantidade');
  }
  if (typeof cep !== 'string' || !/^[0-9]{8}$/.test(cep)) erros.push('cep');
  return {status: erros.length ? 422 : 201, erros};
}`,
        hints: ['Number.isInteger distingue 2 do texto "2".', 'A expressão /^[0-9]{8}$/ exige oito dígitos. Confira o tipo antes para preservar zeros à esquerda.'],
        note: 'O laboratório recebe o objeto já interpretado pelo servidor. A camada HTTP lida com JSON malformado antes da validação. O resultado do exercício representa a decisão antes de salvar o pedido.',
        tests: [
          test('CEP com zero à esquerda é aceito', [{quantidade: 1, cep: '01234000'}], {status: 201, erros: []}),
          test('Quantidade e CEP inválidos aparecem juntos', [{quantidade: 0, cep: '123'}], {status: 422, erros: ['quantidade', 'cep']}),
          test('Quantidade em texto é rejeitada', [{quantidade: '2', cep: '01234000'}], {status: 422, erros: ['quantidade']}),
          test('CEP em número é rejeitado', [{quantidade: 99, cep: 12345678}], {status: 422, erros: ['cep']})
        ]
      },
      delivery: {
        ...quiz('O que vale registrar no Jira para QA testar a correção?', [
          ['O formato da resposta, os casos de campo inválido e a garantia de que eles não criam pedido', 'QA pode reproduzir o erro na API e verificar também a ausência de efeito colateral.'],
          ['Apenas uma captura do formulário com uma mensagem vermelha', 'A captura não confirma o contrato nem se houve gravação.'],
          ['Somente “Backend ajustado”', 'Inclua entradas e resultados esperados para tornar a verificação reproduzível.']
        ], 0),
        artifact: {label: 'Comentário no Jira · WEB-107', text: 'POST /api/pedidos retorna 422 e erros por campo para quantidade ou CEP inválidos, sem criar pedido. Testar quantidade 0, CEP curto e dois erros juntos. Quantidade 1 com CEP 01234000 retorna 201.'}
      },
      recall: [
        quiz('O formulário tem validação de quantidade. Por que repetir a regra no servidor?', [
          ['Para evitar desenhar mensagens na interface', 'O formulário ainda pode usar as mensagens para orientar o usuário.'],
          ['Porque outros clientes podem chamar a API diretamente', 'A API é a fronteira comum que aplica a regra de negócio para todos os clientes.'],
          ['Porque o navegador só aceita números positivos', 'O navegador consegue enviar valores fora do intervalo.']
        ], 1),
        quiz('O corpo {"quantidade": foi cortado na transmissão. Em que ponto ele falha?', [
          ['Depois de criar o pedido', 'Um corpo malformado deve ser rejeitado antes de qualquer gravação.'],
          ['Na regra de CEP do laboratório', 'Primeiro o servidor precisa conseguir interpretar o JSON.'],
          ['Na interpretação do JSON, antes das regras de campo', 'A sintaxe inválida impede a camada HTTP de entregar um objeto para validação.']
        ], 2),
        quiz('O cliente precisa manter zeros à esquerda no CEP. Qual tipo o contrato usa?', [
          ['Texto com oito dígitos', 'Texto preserva a representação completa do identificador.'],
          ['Número inteiro', 'Um número não mantém zeros à esquerda.'],
          ['Booleano acompanhado de um rótulo', 'O CEP é um identificador de oito dígitos.']
        ], 0)
      ],
      refs: [ref('RFC 9110 · HTTP 422', 'https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21'), ref('RFC 9457 · Detalhes de erros HTTP', 'https://www.rfc-editor.org/rfc/rfc9457.html')]
    },
    {
      id: 'WEB-108', category: 'Resiliência de API', title: 'A etiqueta saiu em dobro',
      description: 'Reconheça uma tentativa repetida de emitir uma etiqueta após uma falha de conexão.',
      minutes: 15, icon: 'layers', theme: 'orange', skills: ['Idempotência', 'POST', 'Integrações'],
      story: {
        person: 'Paulo', role: 'Logística', message: 'A emissão demorou e apareceu erro de rede. Tentei de novo e a transportadora cobrou duas etiquetas para o mesmo pacote.',
        criteria: ['Uma tentativa repetida na mesma conta recupera a etiqueta original.', 'Reutilizar a chave com outro conteúdo retorna conflito.', 'Uma nova chave pode identificar uma nova operação.'],
        evidence: {label: 'Histórico da emissão', code: '09:11 POST /etiquetas | Idempotency-Key: exp-52 → etiqueta 870\n09:11 conexão fechada antes da resposta chegar ao portal\n09:12 POST /etiquetas | Idempotency-Key: exp-52 → etiqueta 871'},
        question: quiz('Como o servidor distingue uma repetição de uma nova intenção?', [
          ['Pelo intervalo de tempo entre os cliques', 'Uma repetição pode ocorrer minutos depois e operações distintas podem ser quase simultâneas.'],
          ['Pelo ID do pedido, sempre', 'O mesmo pedido pode exigir etiquetas distintas. A chave identifica uma tentativa lógica de emissão.'],
          ['Por uma chave de idempotência por operação, combinada com a conta e verificação do conteúdo', 'Isso permite repetir a chamada após um timeout e distinguir o uso incorreto da chave.']
        ], 2)
      },
      lab: {
        goal: 'Edite decidirEmissao(historico, pedido). Procure pelo par contaId e chave neste endpoint. Se ausente, retorne {acao: "criar"}. Se pedidoId e servico coincidirem, retorne {acao: "reutilizar", etiquetaId}. Se algum deles mudou, retorne {acao: "conflito"}.',
        functionName: 'decidirEmissao',
        starter: `function decidirEmissao(historico, pedido) {
  return {acao: 'criar'};
}`,
        answer: `function decidirEmissao(historico, pedido) {
  const anterior = historico.find(item =>
    item.contaId === pedido.contaId && item.chave === pedido.chave
  );
  if (!anterior) return {acao: 'criar'};
  if (anterior.pedidoId !== pedido.pedidoId || anterior.servico !== pedido.servico) {
    return {acao: 'conflito'};
  }
  return {acao: 'reutilizar', etiquetaId: anterior.etiquetaId};
}`,
        hints: ['O histórico guarda a conta e a chave. Use as duas na busca.', 'Após encontrar a operação, compare os campos do pedido antes de devolver a etiqueta.'],
        note: 'O laboratório simula a decisão com operações concluídas. Em produção, reserve a chave de forma atômica e trate operações simultâneas e em andamento. Se o provedor oferecer idempotência, use uma chave estável também nessa chamada.',
        tests: [
          test('Chave nova cria emissão', [envioSalvo, {contaId: 3, chave: 'exp-53', pedidoId: 52, servico: 'expresso'}], {acao: 'criar'}),
          test('Mesmo pedido, conta e chave reutilizam a etiqueta', [envioSalvo, {contaId: 3, chave: 'exp-52', pedidoId: 52, servico: 'expresso'}], {acao: 'reutilizar', etiquetaId: 870}),
          test('Mudança de serviço para a mesma chave dá conflito', [envioSalvo, {contaId: 3, chave: 'exp-52', pedidoId: 52, servico: 'economico'}], {acao: 'conflito'}),
          test('A mesma chave em outra conta é independente', [envioSalvo, {contaId: 8, chave: 'exp-52', pedidoId: 52, servico: 'expresso'}], {acao: 'criar'})
        ]
      },
      delivery: {
        ...quiz('Qual teste de integração dá confiança para liberar a correção?', [
          ['Usar sempre chaves novas e medir o tempo de resposta', 'Chaves sempre novas não exercitam a repetição.'],
          ['Interromper a primeira resposta após a emissão, repetir com a mesma chave e conferir a contagem de etiquetas', 'A primeira resposta pode se perder depois de a etiqueta existir. Esse roteiro testa o efeito real da repetição.'],
          ['Abrir duas abas para ver se o botão é clicável', 'O estado do botão não comprova quantas emissões a transportadora recebeu.']
        ], 1),
        artifact: {label: 'Atualização no Slack · #logistica', text: 'WEB-108: após perder a resposta de emissão, repetir com a mesma chave recupera a etiqueta 870. O conteúdo alterado gera conflito. Próximo teste em homologação: duas chamadas simultâneas com a mesma chave e uma única emissão no provedor.'}
      },
      recall: [
        quiz('O POST expirou antes de o portal ler a resposta. Qual chave usar na repetição da mesma operação?', [
          ['A mesma chave da tentativa original', 'A chave permite localizar uma emissão que já pode ter sido processada.'],
          ['Uma chave gerada de novo em cada tentativa', 'Uma chave nova pode representar uma operação independente para o servidor.'],
          ['O horário atual como chave', 'O horário muda entre tentativas e impede a correlação.']
        ], 0),
        quiz('O cliente enviou a mesma chave para uma etiqueta, mas trocou de econômico para expresso. O que o portal deve fazer?', [
          ['Trocar o serviço da etiqueta já emitida', 'A primeira etiqueta pertence à intenção original e pode já ter sido usada.'],
          ['Emitir as duas automaticamente', 'A reutilização da chave deixou a intenção ambígua.'],
          ['Informar conflito e pedir nova chave para a nova operação', 'Isso mantém as intenções separadas e evita usar um resultado incompatível.']
        ], 2),
        quiz('Duas requisições chegam juntas e ambas ainda não enxergam registro para a chave. O que falta?', [
          ['Um pequeno atraso no JavaScript do navegador', 'Clientes diferentes ainda podem enviar em paralelo.'],
          ['Uma reserva atômica da chave no servidor', 'Uma restrição de unicidade com tratamento de conflito pode impedir duas reservas da mesma operação.'],
          ['Um rótulo mais claro no botão', 'O rótulo melhora a interface, mas a corrida acontece no servidor.']
        ], 1)
      ],
      refs: [ref('Stripe · Requisições idempotentes', 'https://docs.stripe.com/api/idempotent_requests')]
    },
    {
      id: 'WEB-109', category: 'Datas e relatórios', title: 'O pedido depois da meia-noite',
      description: 'Filtre um dia de vendas respeitando o fuso da operação e as fronteiras do intervalo.',
      minutes: 15, icon: 'filter', theme: 'blue', skills: ['UTC', 'Intervalos', 'SQL Server'],
      story: {
        person: 'Nina', role: 'Financeiro', message: 'O relatório do dia 19 deixou de fora um pedido de 23h59 em São Paulo. O banco diz que ele foi criado no dia 20.',
        criteria: ['O dia do relatório é definido no fuso da operação.', 'O início do intervalo entra, o início do dia seguinte fica de fora.', 'Horários equivalentes com offsets diferentes representam o mesmo instante.'],
        evidence: {label: 'Conciliação · dia 19/10/2026', code: 'Horário da operação: 19/10/2026 23:59:59.999 (UTC−03)\nBanco: 2026-10-20T02:59:59.999Z\nFiltro atual: CAST(CriadoEmUtc AS date) = @dia'},
        question: quiz('Qual filtro representa o dia local de 19/10 sem depender da precisão das frações de segundo?', [
          ['Converta as duas meias-noites para UTC. Use início inclusivo e fim exclusivo.', 'O pedido entra pela janela da operação, e um pedido na fronteira pertence a um só dia.'],
          ['Use apenas a parte da data armazenada em UTC.', 'A data UTC pode mudar enquanto a operação ainda está no dia anterior.'],
          ['Encerre o intervalo às 23h59m59s inclusive.', 'Essa janela perde valores com frações de segundo antes da meia-noite.']
        ], 0)
      },
      lab: {
        goal: 'Edite filtrarDia(pedidos, inicioUtc, fimUtc). Os limites e criadoEm são instantes ISO com offset explícito. Compare instantes com Date.parse, inclua o início e exclua o fim. Retorne os IDs selecionados na ordem de entrada.',
        functionName: 'filtrarDia',
        starter: `function filtrarDia(pedidos, inicioUtc, fimUtc) {
  const inicio = Date.parse(inicioUtc);
  const fim = Date.parse(fimUtc);
  return pedidos
    .filter(pedido => {
      const instante = Date.parse(pedido.criadoEm);
      return instante >= inicio && instante <= fim;
    })
    .map(pedido => pedido.id);
}`,
        answer: `function filtrarDia(pedidos, inicioUtc, fimUtc) {
  const inicio = Date.parse(inicioUtc);
  const fim = Date.parse(fimUtc);
  return pedidos
    .filter(pedido => {
      const instante = Date.parse(pedido.criadoEm);
      return instante >= inicio && instante < fim;
    })
    .map(pedido => pedido.id);
}`,
        hints: ['Cada Date.parse produz um instante em milissegundos.', 'Um registro exatamente no fim pertence à próxima janela.'],
        note: 'O exercício modela em JavaScript o predicado usado no SQL Server. Os dois limites já foram calculados em UTC a partir das meias-noites no fuso de negócio.',
        tests: [
          test('Antes do início fica fora', [[dateOrders[0]], inicioDia, fimDia], []),
          test('Offset diferente no início ainda entra', [[dateOrders[1]], inicioDia, fimDia], [82]),
          test('Meia-noite seguinte fica fora', [[dateOrders[3]], inicioDia, fimDia], []),
          test('Somente os IDs do dia, em ordem de entrada', [dateOrders, inicioDia, fimDia], [82, 83])
        ]
      },
      delivery: {
        ...quiz('Qual evidência ajuda o financeiro a conferir a mudança?', [
          ['Uma foto com o total, sem o fuso', 'O total isolado não mostra como o dia foi definido.'],
          ['Apenas o horário de execução do relatório', 'Inclua as fronteiras de seleção e exemplos de pedidos nelas.'],
          ['A data local, os limites UTC usados e os IDs de teste que entram e ficam fora', 'O time consegue conciliar o relatório com os dados e validar pedidos de fronteira.']
        ], 2),
        artifact: {label: 'Nota de homologação · WEB-109', text: 'Para 19/10 em São Paulo, a janela é de 19/10 03:00Z inclusive até 20/10 03:00Z exclusivo. Validei o pedido no início, o de 23h59 local e a exclusão do pedido à meia-noite seguinte.'}
      },
      bridge: {title: 'Intervalo de datas no SQL Server', text: 'Calcule as duas meias-noites no fuso do negócio e converta cada limite separadamente. Use os instantes UTC como parâmetros de um predicado sobre a coluna indexável.', code: 'SELECT Id\nFROM dbo.Pedidos\nWHERE CriadoEmUtc >= @inicioUtc AND CriadoEmUtc < @fimUtc;'},
      recall: [
        quiz('Um pedido cai exatamente às 03:00Z, o início da próxima janela. Qual janela o inclui?', [
          ['A janela que acabou', 'O limite final é exclusivo.'],
          ['A janela que começa nesse instante', 'A meia-noite local entra no novo dia e fica de fora do anterior.'],
          ['As duas janelas', 'Duplicar o pedido faria a conciliação somar o mesmo registro duas vezes.']
        ], 1),
        quiz('Uma filial usa fuso que muda durante o ano. Como obter os limites para determinado dia?', [
          ['Converter cada meia-noite local com as regras do fuso naquela data', 'Um dia civil pode ter duração diferente de 24 horas em uma transição de offset.'],
          ['Somar sempre 24 horas ao início UTC', 'Pode sobrar ou faltar uma hora se o fuso mudar no intervalo.'],
          ['Aplicar o offset atual em qualquer data', 'O offset atual pode diferir do offset da data consultada.']
        ], 0),
        quiz('Duas strings ISO têm horários diferentes, mas uma traz Z e outra −03:00. O que você compara?', [
          ['O texto de cada string', 'A comparação textual não resolve offsets distintos.'],
          ['Somente a hora de cada string', 'Horas locais diferentes podem representar o mesmo instante.'],
          ['Os instantes após interpretar os offsets', 'Os dois valores ficam comparáveis na mesma linha do tempo.']
        ], 2)
      ],
      refs: [ref('Microsoft Learn · AT TIME ZONE', 'https://learn.microsoft.com/en-us/sql/t-sql/queries/at-time-zone-transact-sql?view=sql-server-ver17')]
    },
    {
      id: 'WEB-110', category: 'Paginação por cursor', title: 'A fila mudou entre páginas',
      description: 'Continue a leitura de uma fila de pedidos mesmo quando novas entradas chegam no topo.',
      minutes: 18, icon: 'database', theme: 'mint', skills: ['API', 'Paginação por cursor', 'SQL Server'],
      story: {
        person: 'Bruna', role: 'Operações', message: 'Na fila, a primeira página mostrou 108 e 107. Um novo pedido entrou no topo. Ao avançar, 107 apareceu de novo.',
        criteria: ['A fila exibe IDs numéricos únicos em ordem decrescente.', 'A página seguinte começa abaixo do último ID visto.', 'A resposta sinaliza se há mais resultados.'],
        evidence: {label: 'Sequência de páginas', code: 'Página 1: [108, 107]\nNovo pedido: 109\nFila atual: [109, 108, 107, 106, 105]\nPágina 2 com offset 2: [107, 106]'},
        question: quiz('Qual condição produz a próxima página depois de 107?', [
          ['WHERE Id > 107 com a mesma ordem', 'Esses IDs ficam acima da posição já visitada.'],
          ['WHERE Id < 107 com ORDER BY Id DESC', 'O último ID visto define o ponto de retomada e exclui o próprio 107.'],
          ['WHERE Id <= 107 com ORDER BY Id DESC', 'Incluir o ID do cursor devolve a última linha da página anterior de novo.']
        ], 1)
      },
      lab: {
        goal: 'Edite paginaPorCursor(pedidos, aposId, limite). IDs são numéricos, únicos e podem chegar fora de ordem. Quando aposId é null, comece pelo maior ID. Caso contrário, selecione IDs menores. Retorne {ids, cursor}. O cursor é o último ID devolvido só quando sobra pelo menos um resultado. Senão, é null.',
        functionName: 'paginaPorCursor',
        starter: `function paginaPorCursor(pedidos, aposId, limite) {
  const elegiveis = pedidos.map(pedido => pedido.id).sort((a, b) => b - a);
  const ids = elegiveis.slice(0, limite);
  return {ids, cursor: elegiveis.length > limite ? ids.at(-1) : null};
}`,
        answer: `function paginaPorCursor(pedidos, aposId, limite) {
  const elegiveis = pedidos
    .map(pedido => pedido.id)
    .filter(id => aposId === null || id < aposId)
    .sort((a, b) => b - a);
  const ids = elegiveis.slice(0, limite);
  return {ids, cursor: elegiveis.length > limite ? ids.at(-1) : null};
}`,
        hints: ['Filtre os IDs antes de recortar a página.', 'Use < para excluir o ID de retomada. O limite é um inteiro positivo e uma linha a mais indica continuação.'],
        note: 'O exercício modela em JavaScript uma consulta SQL Server. O ID sozinho atende esta fila porque é a ordenação definida e é único. Em ordenação por data, use também um desempate único no cursor.',
        tests: [
          test('Primeira página tem ordem decrescente e cursor', [[{id: 106}, {id: 108}, {id: 107}], null, 2], {ids: [108, 107], cursor: 107}),
          test('Novo registro no topo não altera a posição de retomada', [[{id: 109}, {id: 107}, {id: 106}, {id: 105}], 107, 2], {ids: [106, 105], cursor: null}),
          test('Cursor continua funcionando se a linha anterior sumiu', [[{id: 104}, {id: 106}, {id: 105}], 107, 2], {ids: [106, 105], cursor: 105}),
          test('Fim da fila fica vazio', [[{id: 106}, {id: 105}], 105, 2], {ids: [], cursor: null})
        ]
      },
      delivery: {
        ...quiz('O que precisa aparecer no PR para a equipe revisar a paginação?', [
          ['O contrato do cursor e o caso que insere um pedido entre a primeira e a segunda página', 'O revisor consegue verificar o limite exclusivo e a reprodução original.'],
          ['A promessa de que o cursor congela a fila', 'Novas consultas podem ver outros dados. O cursor define onde retomar.'],
          ['O número da página em vez da chave de ordenação', 'Um número de página não preserva a posição da última linha quando a fila muda.']
        ], 0),
        artifact: {label: 'Descrição de PR · WEB-110', text: 'O próximo lote começa abaixo do último ID retornado. Validei a entrada de um pedido no topo entre as consultas e o desaparecimento do item do cursor. No fim da fila, cursor é null.'}
      },
      bridge: {title: 'Retomada com SQL Server', text: 'Para a página seguinte, retorne até limite mais uma linha. Se houver a linha extra, corte-a da resposta e emita o cursor da última linha exibida. A primeira página usa a mesma ordenação sem filtro de retomada.', code: 'SELECT TOP (@limiteMaisUm) Id\nFROM dbo.Pedidos\nWHERE Id < @aposId\nORDER BY Id DESC;'},
      recall: [
        quiz('Com IDs em ordem decrescente, você terminou em 850. Qual ID pode abrir a próxima página?', [
          ['850', 'O ID do cursor já foi exibido.'],
          ['851', 'Esse ID fica antes do cursor na ordem decrescente.'],
          ['849', 'Ele fica abaixo do cursor e pode ser o próximo item disponível.']
        ], 2),
        quiz('A linha usada para formar o cursor foi removida. O que o predicado Id < @aposId precisa para funcionar?', [
          ['Recriar a linha removida', 'O cursor guarda o valor de comparação mesmo quando a linha deixou de existir.'],
          ['O valor do ID já armazenado no cursor', 'O banco usa esse valor como limite e pode continuar nas linhas que restam.'],
          ['Um offset calculado antes da remoção', 'Esse offset voltaria a depender da posição atual das linhas.']
        ], 1),
        quiz('O produto muda a ordem para data desc, ID desc. O que o cursor precisa guardar?', [
          ['Data e ID', 'O par descreve a posição e permite continuar entre pedidos com a mesma data.'],
          ['Apenas a data', 'Uma data pode corresponder a vários pedidos.'],
          ['Apenas o tamanho da página', 'O tamanho controla a quantidade e não determina a posição.']
        ], 0)
      ],
      refs: [ref('Microsoft Learn · Paginação por chave', 'https://learn.microsoft.com/en-us/ef/core/querying/pagination#keyset-pagination')]
    },
    {
      id: 'WEB-111', category: 'Concorrência de API', title: 'A observação sobrescrita',
      description: 'Proteja a edição do pedido quando duas pessoas salvam a partir da mesma versão.',
      minutes: 16, icon: 'git', theme: 'rose', skills: ['ETag', 'If-Match', 'Concorrência'],
      story: {
        person: 'Dani', role: 'Atendimento', message: 'Eu e a Ana editamos o pedido ao mesmo tempo. A minha instrução de coleta sumiu quando ela salvou a versão que tinha aberto antes.',
        criteria: ['A edição exige o ETag recebido ao abrir o pedido.', 'Uma versão obsoleta recebe 412 e preserva o registro atual.', 'Uma atualização válida altera a observação e aumenta a versão.'],
        evidence: {label: 'Duas edições concorrentes', code: '09:02 GET /pedidos/44 → ETag: "7" (Dani e Ana)\n09:05 PATCH Dani → versão 8\n09:07 PATCH Ana com a versão 7 → sobrescreveu a versão 8'},
        question: quiz('O que a API deve fazer com If-Match: "7" quando a versão atual é "8"?', [
          ['Salvar e gerar a versão 9', 'Isso ainda substitui um conteúdo que a pessoa não viu.'],
          ['Atualizar o ETag antes de salvar', 'Atualizar o token sem rever os dados ignora o conflito.'],
          ['Responder 412 e preservar o pedido', 'O ETag representa a versão editada. A interface pode recarregar e mostrar as mudanças.']
        ], 2)
      },
      lab: {
        goal: 'Edite salvarSeVersao(atual, observacao, ifMatch). Retorne {status, pedido}. Se o If-Match for ausente ou vazio, use 428 e o pedido atual. Se não for exatamente a versão atual entre aspas, use 412 e o pedido atual. Se coincidir, use 200, atualize observacao e some 1 a versao, preservando os outros campos.',
        functionName: 'salvarSeVersao',
        starter: `function salvarSeVersao(atual, observacao, ifMatch) {
  return {
    status: 200,
    pedido: {...atual, observacao, versao: atual.versao + 1}
  };
}`,
        answer: `function salvarSeVersao(atual, observacao, ifMatch) {
  if (!ifMatch) return {status: 428, pedido: atual};
  const etag = '"' + atual.versao + '"';
  if (ifMatch !== etag) return {status: 412, pedido: atual};
  return {
    status: 200,
    pedido: {...atual, observacao, versao: atual.versao + 1}
  };
}`,
        hints: ['Cheque a presença do cabeçalho primeiro. Depois, compare com a versão atual entre aspas.', 'Copie os campos do pedido antes de sobrescrever a observação e a versão.'],
        note: 'Este endpoint de treino aceita um único ETag forte. Em uma API com suporte à sintaxe completa de If-Match, listas e o valor especial * exigem tratamento próprio. No banco, a versão precisa ser checada na mesma operação de gravação.',
        tests: [
          test('ETag atual altera apenas os campos previstos', [pedidoAtual, 'Entregar no portão 2', '"8"'], {status: 200, pedido: {...pedidoAtual, observacao: 'Entregar no portão 2', versao: 9}}),
          test('ETag antigo preserva o pedido', [pedidoAtual, 'Deixar na recepção', '"7"'], {status: 412, pedido: pedidoAtual}),
          test('Cabeçalho ausente exige precondição', [pedidoAtual, 'Deixar na recepção'], {status: 428, pedido: pedidoAtual}),
          test('ETag fraco não serve para esta edição', [pedidoAtual, 'Entregar amanhã', 'W/"8"'], {status: 412, pedido: pedidoAtual})
        ]
      },
      delivery: {
        ...quiz('Como QA pode reproduzir o conflito de edição?', [
          ['Abra o pedido em duas sessões, salve a primeira e verifique 412 ao salvar a segunda com a versão anterior', 'O teste passa por dois clientes e comprova que a primeira edição sobreviveu.'],
          ['Salve duas vezes recarregando entre elas', 'O recarregamento obtém a versão nova e deixa de testar o conflito.'],
          ['Altere o estilo do campo observação', 'O estilo não interfere na proteção de concorrência do servidor.']
        ], 0),
        artifact: {label: 'Roteiro de QA · WEB-111', text: 'Abrir o pedido em duas sessões. Na primeira, editar e salvar. Na segunda, enviar a observação com o ETag antigo e verificar 412, sem sobrescrever o conteúdo salvo. Recarregar e comparar antes de tentar de novo.'}
      },
      recall: [
        quiz('A API exige If-Match, mas o cliente não o enviou. Qual resposta foi definida?', [
          ['201', 'Nenhum recurso foi criado.'],
          ['428', 'A edição precisa de uma precondição que permita proteger a versão.'],
          ['412', 'Use 412 quando a precondição foi enviada e falhou.']
        ], 1),
        quiz('O servidor compara a versão em um SELECT e atualiza depois sem condição. Qual problema sobra?', [
          ['O SELECT torna o corpo JSON inválido', 'A separação diz respeito à concorrência, não à sintaxe do corpo.'],
          ['O cliente deixa de receber ETag', 'O cabeçalho ainda pode ser enviado mesmo com essa implementação.'],
          ['Outro processo pode gravar entre a leitura e a atualização', 'Inclua a versão no predicado da gravação e confira a quantidade de linhas atualizadas.']
        ], 2),
        quiz('Após receber 412, o que a interface deve oferecer?', [
          ['Recarregar o registro e comparar as duas versões antes de reenviar', 'Isso permite aplicar conscientemente a intenção sobre os dados mais novos.'],
          ['Repetir automaticamente com qualquer ETag mais novo', 'Trocar o token sem comparar os dados volta a permitir sobrescrita silenciosa.'],
          ['Descartar a observação sem aviso', 'A pessoa perde o trabalho e não entende por que o salvamento falhou.']
        ], 0)
      ],
      refs: [ref('RFC 9110 · If-Match', 'https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1'), ref('RFC 6585 · HTTP 428', 'https://www.rfc-editor.org/rfc/rfc6585.html#section-3')]
    },
    {
      id: 'WEB-112', category: 'Transações no SQL Server', title: 'O estoque sumiu sem reserva',
      description: 'Evite a baixa de estoque quando a gravação da reserva falha no meio da operação.',
      minutes: 17, icon: 'database', theme: 'blue', skills: ['Transação', 'Rollback', 'SQL Server'],
      story: {
        person: 'Gabi', role: 'Separação', message: 'Reservei três peças para o pedido 301. A tela mostrou erro e não há reserva, mas o estoque caiu de dez para sete.',
        criteria: ['Em caso de sucesso, baixar estoque e criar reserva juntos.', 'Em caso de falha, preservar estoque e reservas anteriores.', 'Se não houver estoque, retornar um erro de negócio.'],
        evidence: {label: 'Operações no banco', code: 'UPDATE Estoque ... → 1 linha confirmada\nINSERT Reserva ... → falha de gravação\nEstoque: 7 | Reservas para o pedido: 0'},
        question: quiz('Qual mudança protege os dois registros?', [
          ['Salvar a reserva em outro endpoint e esperar o cliente chamar de novo', 'A sequência ainda pode falhar entre as chamadas.'],
          ['Fazer as duas gravações em uma transação e desfazer a alteração quando uma falha', 'O banco pode publicar o estado completo no commit ou preservar o anterior no rollback.'],
          ['Descontar o estoque antes de iniciar a transação', 'A primeira gravação permaneceria mesmo se a reserva falhasse.']
        ], 1)
      },
      lab: {
        goal: 'Edite reservar(estado, pedidoId, quantidade), com quantidade inteira positiva. Se estoque < quantidade, retorne {erro: "SEM_ESTOQUE", estado}. Se a gravação estiver indisponível (gravacaoOk === false), retorne {erro: "FALHA_GRAVACAO", estado} com estado original. Em sucesso, retorne {erro: null, estado} com estoque reduzido e a reserva {pedidoId, quantidade} acrescentada. Preserve os demais campos.',
        functionName: 'reservar',
        starter: `function reservar(estado, pedidoId, quantidade) {
  if (estado.estoque < quantidade) return {erro: 'SEM_ESTOQUE', estado};
  const alterado = {...estado, estoque: estado.estoque - quantidade};
  if (!estado.gravacaoOk) return {erro: 'FALHA_GRAVACAO', estado: alterado};
  return {
    erro: null,
    estado: {...alterado, reservas: [...estado.reservas, {pedidoId, quantidade}]}
  };
}`,
        answer: `function reservar(estado, pedidoId, quantidade) {
  if (estado.estoque < quantidade) return {erro: 'SEM_ESTOQUE', estado};
  if (!estado.gravacaoOk) return {erro: 'FALHA_GRAVACAO', estado};
  return {
    erro: null,
    estado: {
      ...estado,
      estoque: estado.estoque - quantidade,
      reservas: [...estado.reservas, {pedidoId, quantidade}]
    }
  };
}`,
        hints: ['No caminho de falha, confira qual objeto está voltando.', 'A versão com o estoque reduzido deve aparecer somente no sucesso, junto da nova reserva.'],
        note: 'O exercício modela atomicidade em memória. No SQL Server, execute as duas gravações na mesma transação e aplique a condição de disponibilidade no UPDATE para proteger o estoque sob concorrência.',
        tests: [
          test('Sucesso atualiza estoque e cria a reserva', [estoqueOk, 301, 3], {erro: null, estado: {...estoqueOk, estoque: 7, reservas: [{pedidoId: 301, quantidade: 3}]}}),
          test('Falta de estoque não publica alterações', [estoqueOk, 301, 11], {erro: 'SEM_ESTOQUE', estado: estoqueOk}),
          test('Falha na gravação preserva o estado inicial', [estoqueComFalha, 301, 3], {erro: 'FALHA_GRAVACAO', estado: estoqueComFalha}),
          test('Sucesso mantém as reservas anteriores', [{...estoqueOk, reservas: [{pedidoId: 300, quantidade: 2}]}, 301, 10], {
            erro: null, estado: {...estoqueOk, estoque: 0, reservas: [{pedidoId: 300, quantidade: 2}, {pedidoId: 301, quantidade: 10}]}
          })
        ]
      },
      delivery: {
        ...quiz('Que verificação comprova o rollback?', [
          ['Conferir apenas a mensagem de erro na tela', 'A mensagem pode aparecer mesmo depois de uma baixa parcial.'],
          ['Verificar somente que o estoque muda no sucesso', 'Isso não exercita o caminho em que a reserva falha.'],
          ['Provocar falha na segunda gravação e conferir estoque e reservas depois do erro', 'Os dois registros devem permanecer como estavam antes da transação.']
        ], 2),
        artifact: {label: 'Evidência de rollback · WEB-112', text: 'Em homologação, simular falha na gravação da reserva do pedido 301. Conferir estoque 10 e nenhuma nova reserva após o erro. Repetir sem falha e conferir estoque 7 e reserva de 3 peças.'}
      },
      bridge: {title: 'Transação no SQL Server', text: 'BEGIN TRAN abre a unidade de trabalho. Após as duas gravações, COMMIT confirma o conjunto. Trate as falhas e faça ROLLBACK quando a transação estiver aberta. Teste também dois pedidos concorrentes disputando a última unidade.'},
      recall: [
        quiz('A segunda gravação falhou após a primeira alterar o estoque. Qual resultado se espera após rollback?', [
          ['Estoque e reservas como estavam antes da operação', 'As duas gravações pertencem à mesma unidade de trabalho.'],
          ['Estoque reduzido e reserva vazia', 'Esse estado é justamente a baixa parcial que a transação evita.'],
          ['Estoque original com uma nova reserva', 'A reserva deve acompanhar a baixa correspondente.']
        ], 0),
        quiz('Dois pedidos tentam comprar a última unidade. Qual condição deve acompanhar a baixa?', [
          ['O total disponível exibido em cache no navegador', 'Esse valor pode estar atrasado e não protege o banco.'],
          ['O título do pedido no log', 'Identificar o pedido ajuda na investigação, mas a disponibilidade precisa ser checada na gravação.'],
          ['Estoque >= quantidade no UPDATE, com conferência de linhas afetadas', 'A disponibilidade é avaliada na mesma gravação e o serviço detecta quando nada pôde ser reservado.']
        ], 2),
        quiz('O portal enviou um e-mail antes do rollback. A transação SQL desfaz esse envio?', [
          ['Sim, o ROLLBACK desfaz qualquer efeito do código', 'O e-mail é um efeito de um sistema externo ao banco.'],
          ['O envio precisa de tratamento próprio', 'Em um fluxo com e-mail, planeje o envio após a confirmação ou grave um evento na mesma transação para processamento posterior.'],
          ['Sim, desde que usemos duas chamadas de ROLLBACK', 'O número de chamadas não inclui o provedor de e-mail na transação.']
        ], 1)
      ],
      refs: [ref('Microsoft Learn · SET XACT_ABORT', 'https://learn.microsoft.com/en-us/sql/t-sql/statements/set-xact-abort-transact-sql?view=sql-server-ver17')]
    },
    {
      id: 'WEB-113', category: 'Relatórios SQL', title: 'O faturamento multiplicado',
      description: 'Corrija a soma de um relatório quando um pedido aparece em várias linhas do JOIN.',
      minutes: 15, icon: 'database', theme: 'mint', skills: ['JOIN', 'Agregação', 'SQL Server'],
      story: {
        person: 'Nina', role: 'Financeiro', message: 'O relatório por item mostra R$ 150,00 para dois pedidos de R$ 50,00. Um deles tem dois itens e o outro tem um.',
        criteria: ['Cada pedido contribui com seu total uma vez.', 'Pedidos distintos com o mesmo valor contam separadamente.', 'Sem linhas, o total em centavos é zero.'],
        evidence: {label: 'Linhas após o JOIN', code: 'pedidoId | item | totalCentavos\n72       | A    | 5000\n72       | B    | 5000\n73       | C    | 5000'},
        question: quiz('O que explica o total dobrado do pedido 72?', [
          ['O JOIN produz uma linha por item e repete o total do pedido', 'A soma está agregando no nível de item, mas totalCentavos pertence ao nível de pedido.'],
          ['O SQL Server arredondou os centavos para cima', 'Os dados mostram o mesmo valor inteiro em duas linhas do pedido.'],
          ['Os pedidos 72 e 73 têm o mesmo valor e representam o mesmo pedido', 'Identidade e valor são campos diferentes. Dois pedidos reais podem ter o mesmo total.']
        ], 0)
      },
      lab: {
        goal: 'Edite totalizarPedidos(linhas). Cada linha tem pedidoId e totalCentavos. Todas as linhas do mesmo pedido têm total idêntico. Some uma vez por pedidoId e retorne o total em centavos. Sem linhas, retorne zero.',
        functionName: 'totalizarPedidos',
        starter: `function totalizarPedidos(linhas) {
  return linhas.reduce((total, linha) => total + linha.totalCentavos, 0);
}`,
        answer: `function totalizarPedidos(linhas) {
  const porPedido = new Map();
  for (const {pedidoId, totalCentavos} of linhas) {
    porPedido.set(pedidoId, totalCentavos);
  }
  return [...porPedido.values()].reduce((total, valor) => total + valor, 0);
}`,
        hints: ['Use um Map com pedidoId como chave e totalCentavos como valor.', 'Some os valores depois de agrupar os registros por pedidoId.'],
        note: 'O laboratório modela em JavaScript o agrupamento da consulta. Use o valor total de cada pedido selecionado, mesmo quando o critério de seleção corresponde a apenas alguns de seus itens.',
        tests: [
          test('Sem linhas resulta em zero', [[]], 0),
          test('O pedido com dois itens conta uma vez', [[{pedidoId: 72, totalCentavos: 5000}, {pedidoId: 72, totalCentavos: 5000}, {pedidoId: 73, totalCentavos: 2000}]], 7000),
          test('Pedidos distintos com o mesmo total contam separadamente', [[{pedidoId: 72, totalCentavos: 5000}, {pedidoId: 72, totalCentavos: 5000}, {pedidoId: 73, totalCentavos: 5000}]], 10000),
          test('Sem repetição, mantém a soma normal', [[{pedidoId: 72, totalCentavos: 5000}, {pedidoId: 73, totalCentavos: 2000}]], 7000)
        ]
      },
      delivery: {
        ...quiz('Qual exemplo você inclui no PR para evitar uma correção com SUM(DISTINCT totalCentavos)?', [
          ['Uma lista com um pedido e um item', 'Esse exemplo passa mesmo com as abordagens incorretas.'],
          ['Dois pedidos diferentes de mesmo valor, um deles com dois itens', 'O teste diferencia o agrupamento por pedido da soma de valores distintos e da soma por item.'],
          ['Dois pedidos com totais diferentes', 'Totais diferentes não denunciam a perda causada por DISTINCT aplicado ao valor.']
        ], 1),
        artifact: {label: 'Resumo para revisão · WEB-113', text: 'O JOIN repetia o total do pedido por item. Agrupei por ID antes de somar. Na amostra 72/A, 72/B e 73/C, com dois pedidos de R$ 50,00, o resultado esperado é R$ 100,00.'}
      },
      bridge: {title: 'Agregue no nível de pedido', text: 'Se o relatório precisa do JOIN para filtrar itens, reduza o resultado a uma linha por pedido antes de somar. MAX funciona dentro desse grupo porque o total vem da mesma linha da tabela de pedidos.', code: 'WITH Selecionados AS (\n  SELECT p.Id, MAX(p.TotalCentavos) AS TotalCentavos\n  FROM dbo.Pedidos p JOIN dbo.Itens i ON i.PedidoId = p.Id\n  GROUP BY p.Id\n)\nSELECT COALESCE(SUM(CONVERT(bigint, TotalCentavos)), 0)\nFROM Selecionados;'},
      recall: [
        quiz('Há três linhas do pedido 1 (3000 cada) e uma do pedido 2 (1000). Qual é o total por pedido?', [
          ['10000', 'Esse total soma 3000 três vezes, uma para cada item.'],
          ['3000', 'Ainda é preciso somar o pedido 2.'],
          ['4000', 'Cada pedido contribui com seu total uma vez.']
        ], 2),
        quiz('O relatório precisa agora da quantidade de itens. Que nível faz sentido para essa contagem?', [
          ['As linhas de item da consulta, desde que outros JOINs não dupliquem itens', 'A métrica mudou de pedidos para itens. Confira o nível da junção antes de contar.'],
          ['Um registro por pedido', 'Esse nível responde quantos pedidos há.'],
          ['Valores distintos de total', 'Os valores de venda não representam a identidade dos itens.']
        ], 0),
        quiz('Por que somar valores distintos pode ocultar vendas?', [
          ['Porque valores em centavos sempre se repetem', 'A repetição pode ocorrer, mas não é uma propriedade de todo conjunto.'],
          ['Porque pedidos distintos podem ter o mesmo total', 'Agrupe por uma chave que represente a entidade da métrica.'],
          ['Porque DISTINCT altera o sinal das vendas', 'O operador reduz repetições de um valor e não muda seu sinal.']
        ], 1)
      ],
      refs: [ref('Microsoft Learn · GROUP BY', 'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql?view=sql-server-ver17')]
    },
    {
      id: 'WEB-114', category: 'Parâmetros SQL', title: 'Cada código, um parâmetro',
      description: 'Faça o parâmetro de busca refletir o tipo e o tamanho fixados pelo esquema.',
      minutes: 14, icon: 'database', theme: 'violet', skills: ['SqlClient', 'Parâmetros', 'SQL Server'],
      story: {
        person: 'André', role: 'DBA', message: 'A busca por código agora usa parâmetros, mas os metadados mudam para cada valor. A coluna Produtos.Codigo é varchar(12). Quero fixar o contrato no driver.',
        criteria: ['Usar um parâmetro nomeado no texto SQL.', 'Usar VarChar de tamanho 12 para qualquer código válido.', 'Preservar zeros à esquerda e rejeitar texto fora do contrato de produto.'],
        evidence: {label: 'Esquema e parâmetro atual', code: "dbo.Produtos.Codigo varchar(12)\nBusca '0005' → @codigo varchar(4)\nBusca 'L-001' → @codigo varchar(5)"},
        question: quiz('De onde deve vir o tamanho declarado do parâmetro?', [
          ['Do comprimento de cada entrada', 'Isso faz variar a definição do parâmetro a cada forma de código.'],
          ['Do tamanho do maior código visto hoje', 'A amostra pode não refletir o esquema e variar com o tempo.'],
          ['Da definição da coluna, varchar(12)', 'O contrato permanece estável entre buscas e corresponde ao tipo de destino.']
        ], 2)
      },
      lab: {
        goal: 'Edite prepararBusca(codigo). Só aceite textos de 1 a 12 caracteres A–Z, 0–9 e hífen. Para entradas inválidas, retorne null. Para válidas, retorne o mesmo objeto do código inicial, com parametro.tipo "VarChar", tamanho 12 e valor igual ao código recebido.',
        functionName: 'prepararBusca',
        starter: `function prepararBusca(codigo) {
  if (typeof codigo !== 'string' || !/^[A-Z0-9-]{1,12}$/.test(codigo)) return null;
  return {
    sql: 'SELECT Id FROM dbo.Produtos WHERE Codigo = @codigo;',
    parametro: {nome: '@codigo', tipo: 'VarChar', tamanho: codigo.length, valor: codigo}
  };
}`,
        answer: `function prepararBusca(codigo) {
  if (typeof codigo !== 'string' || !/^[A-Z0-9-]{1,12}$/.test(codigo)) return null;
  return {
    sql: 'SELECT Id FROM dbo.Produtos WHERE Codigo = @codigo;',
    parametro: {nome: '@codigo', tipo: 'VarChar', tamanho: 12, valor: codigo}
  };
}`,
        hints: ['A validação do valor já está no código inicial. Compare tamanho com a definição de Produtos.Codigo.', 'O código é um identificador textual. Mantenha valor exatamente como recebido.'],
        note: 'O navegador valida uma representação JavaScript do comando e dos metadados. No servidor, vincule o valor usando os métodos do driver.',
        tests: [
          test('Código de 12 caracteres combina com o esquema', [codigoLongo], parametroEsperado(codigoLongo)),
          test('Código curto ainda declara tamanho 12', ['0005'], parametroEsperado('0005')),
          test('Código com hífen permanece como texto', ['L-001'], parametroEsperado('L-001')),
          test('Código fora do formato não gera consulta', ["A'1"], null)
        ]
      },
      delivery: {
        ...quiz('Que evidência você envia ao DBA depois de alinhar o parâmetro?', [
          ['As definições de dois parâmetros com valores de tamanhos diferentes e o plano observado', 'Assim, o DBA pode comparar o vínculo e medir o efeito na consulta sem depender de suposições.'],
          ['Uma garantia de que toda busca agora usa índice', 'O plano também depende do esquema, índices, estatísticas e consulta.'],
          ['Uma lista dos códigos reais dos clientes', 'Use valores fictícios e a evidência de metadados e plano.']
        ], 0),
        artifact: {label: 'Nota no Jira para DBA · WEB-114', text: 'A consulta usa @codigo VarChar(12) tanto para 0005 quanto para L-001. Validei que os zeros foram preservados. Em homologação, vamos comparar o plano e as leituras lógicas com a versão anterior.'}
      },
      bridge: {title: 'Vínculo no Microsoft.Data.SqlClient', text: 'O texto SQL usa o nome do parâmetro. O tipo e o tamanho do vínculo seguem a coluna, e o valor fica separado da instrução.', code: 'command.Parameters.Add("@codigo", SqlDbType.VarChar, 12).Value = codigo;'},
      recall: [
        quiz('Produtos.Codigo muda para nvarchar(20). O que precisa ser revisto?', [
          ['Só o nome do parâmetro', 'O nome não descreve o tipo nem o tamanho.'],
          ['O vínculo para NVarChar(20) e a validação do valor conforme o contrato', 'O vínculo deve acompanhar a coluna. As regras de produto determinam quais valores e tamanhos o serviço aceita.'],
          ['A remoção do parâmetro', 'Continue separando os valores do texto da consulta.']
        ], 1),
        quiz('Uma nova tela quer escolher a coluna do ORDER BY. Um parâmetro nomeado serve para a coluna?', [
          ['Sim, um parâmetro é substituído por qualquer trecho de SQL', 'Parâmetros representam valores, e nomes de coluna fazem parte da instrução.'],
          ['Sim, desde que a coluna venha entre aspas', 'Um valor textual não se transforma em um identificador de coluna.'],
          ['Escolha uma coluna conhecida por meio de uma lista permitida', 'Mapeie a opção recebida para identificadores fixos e continue usando parâmetros para dados.']
        ], 2),
        quiz('O código válido 0005 vira 5 antes de chegar ao driver. Onde investigar?', [
          ['Na conversão do valor para número', 'Transformar um identificador textual em número perde os zeros e muda o valor buscado.'],
          ['Na quantidade de parâmetros do comando', 'O comando usa um único valor de busca. A mudança ocorreu na representação desse valor.'],
          ['Na capitalização do comando SELECT', 'A grafia do comando não altera os caracteres do valor vinculado.']
        ], 0)
      ],
      refs: [ref('Microsoft Learn · Configurar parâmetros com SqlClient', 'https://learn.microsoft.com/en-us/sql/connect/ado-net/configure-parameters?view=sql-server-ver17')]
    },
    {
      id: 'WEB-115', category: 'Migração de legado', title: 'Os clientes que voltaram do DBF',
      description: 'Limpe uma amostra exportada do FoxPro sem reativar registros excluídos ou perder códigos.',
      minutes: 14, icon: 'database', theme: 'orange', skills: ['Visual FoxPro', 'DBF', 'Importação'],
      story: {
        person: 'Val', role: 'Migração de dados', message: 'O primeiro lote de clientes trouxe registros marcados para exclusão. Além disso, o código 00042 virou 42 no Portal.',
        criteria: ['Ignorar registros marcados para exclusão.', 'Remover espaços nas extremidades dos campos de texto.', 'Manter o código como texto, os espaços internos do nome e o nome vazio como null.'],
        evidence: {label: 'Amostra já extraída do DBF', code: 'CODIGO  | NOME             | excluido\n"00042 " | " Maria  Lima " | false\n"00043 " | " Carlos Dias " | true'},
        question: quiz('Que informação diferencia um cliente marcado para exclusão de um registro ativo no exportador?', [
          ['Se o nome está em branco', 'Um nome vazio é um problema de dados separado do estado de exclusão.'],
          ['O marcador de exclusão que o exportador pode ler com DELETED()', 'Esse marcador pode existir mesmo quando o registro ainda está fisicamente no arquivo.'],
          ['Se o código começa com zero', 'Zeros à esquerda fazem parte do identificador de alguns clientes ativos.']
        ], 1)
      },
      lab: {
        goal: 'Edite converterClientes(registros). Cada registro exportado contém CODIGO e NOME como strings e excluido como booleano. Ignore excluido === true. Retorne objetos {codigo, nome} na ordem original. Use trim nas extremidades e devolva null para nome vazio. Preserve zeros no código e espaços internos no nome.',
        functionName: 'converterClientes',
        starter: `function converterClientes(registros) {
  return registros.map(registro => ({
    codigo: registro.CODIGO.trim(),
    nome: registro.NOME.trim() || null
  }));
}`,
        answer: `function converterClientes(registros) {
  return registros
    .filter(registro => !registro.excluido)
    .map(registro => ({
      codigo: registro.CODIGO.trim(),
      nome: registro.NOME.trim() || null
    }));
}`,
        hints: ['O marcador de exclusão já chega como booleano. Filtre antes de converter o formato.', 'trim mantém os zeros do código e os espaços que estão no meio do nome.'],
        note: 'O laboratório recebe registros já extraídos e decodificados. Ele pratica a transformação em JavaScript antes de enviar os dados para a etapa de importação.',
        tests: [
          test('Remove espaços das bordas sem perder zeros', [[{CODIGO: ' 00042 ', NOME: ' Maria  Lima ', excluido: false}]], [{codigo: '00042', nome: 'Maria  Lima'}]),
          test('Excluído fica fora do lote', [[{CODIGO: '0043 ', NOME: 'Carlos ', excluido: true}]], []),
          test('Nome composto só de espaços vira null', [[{CODIGO: '005 ', NOME: '   ', excluido: false}]], [{codigo: '005', nome: null}]),
          test('Mantém a ordem dos clientes ativos', [[
            {CODIGO: '0009 ', NOME: ' João ', excluido: false},
            {CODIGO: '0003 ', NOME: ' Iara ', excluido: true},
            {CODIGO: '0004 ', NOME: 'Luísa ', excluido: false}
          ]], [{codigo: '0009', nome: 'João'}, {codigo: '0004', nome: 'Luísa'}])
        ]
      },
      delivery: {
        ...quiz('Qual informação torna o lote fácil de reconciliar antes de importar de verdade?', [
          ['Só um “pronto” no canal do projeto', 'A confirmação não explica quais registros foram filtrados nem como os códigos foram tratados.'],
          ['O arquivo inteiro de clientes postado no Slack', 'A equipe pode conferir uma amostra fictícia e as contagens sem compartilhar dados pessoais no canal.'],
          ['Contagem lida, contagem excluída e uma amostra sem dados pessoais que preserve zeros', 'Isso permite comparar a regra do exportador com a regra de importação e localizar diferenças.']
        ], 2),
        artifact: {label: 'Nota de migração · WEB-115', text: 'O lote piloto ignora registros marcados como excluídos e mantém códigos como 00042 em texto. Vou reconciliar as contagens lida, excluída e importada antes da carga real, com amostras fictícias no ticket.'}
      },
      bridge: {title: 'Antes da carga web', text: 'No Visual FoxPro, DELETED() informa se o registro corrente foi marcado. O comando SET DELETED afeta quais registros comandos com escopo processam. ALLTRIM() remove espaços das bordas do campo. Confira essas regras ao gerar a extração, depois aplique o mapeamento da API.'},
      recall: [
        quiz('Um registro marcado para exclusão ainda está no DBF. O que o lote de ativos deve fazer?', [
          ['Descartar esse registro no filtro', 'A marca é a regra de exclusão do lote mesmo quando o registro ainda existe no arquivo.'],
          ['Importar e criar um novo identificador para ele', 'A troca de código reintroduz um registro que o lote deve excluir.'],
          ['Limpar seu nome e importar', 'A remoção do nome não trata a exclusão.']
        ], 0),
        quiz('O sistema web usa o código para vincular pedidos. Qual transformação preserva 00042?', [
          ['Converter para número e formatar com duas casas', 'Casas decimais não preservam o identificador de origem.'],
          ['Manter texto e remover apenas espaços nas extremidades', 'Assim, os caracteres do identificador continuam iguais aos exportados.'],
          ['Remover todos os zeros para simplificar a busca', 'A alteração pode quebrar chaves e vínculos com pedidos anteriores.']
        ], 1),
        quiz('Nomes acentuados chegaram corrompidos na extração. Qual etapa investigar primeiro?', [
          ['O trim de espaços', 'O trim atua nas bordas e não corrige a interpretação dos bytes.'],
          ['O status de exclusão', 'O marcador não determina a forma de interpretar os caracteres.'],
          ['A codificação usada para ler e exportar o DBF', 'O mapeamento web deve receber texto decodificado com a página de código correta.']
        ], 2)
      ],
      refs: [
        ref('Visual FoxPro 9 · DELETED()', 'https://www.vfphelp.com/vfp9/_5WN12PQAP.htm'),
        ref('Visual FoxPro 9 · SET DELETED', 'https://www.vfphelp.com/vfp9/_5WN12PF1R.htm'),
        ref('Visual FoxPro 9 · ALLTRIM()', 'https://www.vfphelp.com/vfp9/_5WN12PPFD.htm')
      ]
    },
    {
      id: 'WEB-116', category: 'Evolução de contratos', title: 'O campo que sumiu no deploy',
      description: 'Adicione o valor do frete à resposta sem quebrar a integração que já lê o total.',
      minutes: 13, icon: 'layers', theme: 'rose', skills: ['Compatibilidade', 'JSON', 'Testes de contrato'],
      story: {
        person: 'Maya', role: 'Integrações', message: 'Depois que o frete começou a aparecer na API, a integração da separação parou de ler o total. O cliente antigo ainda usa totalCentavos.',
        criteria: ['Preservar id e totalCentavos com o mesmo significado e tipo.', 'Adicionar valorEntregaCentavos somente quando calculado.', 'Zero é frete grátis e deve ser devolvido.'],
        evidence: {label: 'Diff de resposta v1', code: 'Antes: {"id":72,"totalCentavos":5500}\nDepois: {"id":72,"valorEntregaCentavos":500}\nCliente antigo: totalCentavos ausente'},
        question: quiz('Que resposta atende a mesma versão do contrato e o cliente novo?', [
          ['Retirar totalCentavos e orientar o cliente antigo a atualizar', 'Clientes já implantados ainda dependem desse campo na versão atual.'],
          ['Reaproveitar totalCentavos para informar só o frete', 'Manter o nome e mudar o significado também quebra o contrato.'],
          ['Preservar totalCentavos e acrescentar valorEntregaCentavos como campo opcional', 'Clientes tolerantes a campos novos continuam lendo o total. Teste também consumidores conhecidos que validam a resposta inteira.']
        ], 2)
      },
      lab: {
        goal: 'Edite serializarPedido(pedido). A resposta sempre tem id e totalCentavos. Adicione valorEntregaCentavos quando o campo recebido tiver um valor, inclusive zero. Para null ou ausente, omita o campo. Exponha somente esses campos do objeto recebido.',
        functionName: 'serializarPedido',
        starter: `function serializarPedido(pedido) {
  if (pedido.valorEntregaCentavos == null) {
    return {id: pedido.id, totalCentavos: pedido.totalCentavos};
  }
  return {id: pedido.id, valorEntregaCentavos: pedido.valorEntregaCentavos};
}`,
        answer: `function serializarPedido(pedido) {
  const resposta = {id: pedido.id, totalCentavos: pedido.totalCentavos};
  if (pedido.valorEntregaCentavos != null) {
    resposta.valorEntregaCentavos = pedido.valorEntregaCentavos;
  }
  return resposta;
}`,
        hints: ['Comece pelos campos que os consumidores já conhecem.', 'A comparação != null descarta null e undefined, mas preserva 0.'],
        note: 'O contrato deste portal permite campos opcionais novos. Alguns clientes podem validar a resposta de forma estrita. Confira os consumidores antes de liberar a alteração.',
        tests: [
          test('Pedido sem frete preserva o formato anterior', [{id: 72, totalCentavos: 5500}], {id: 72, totalCentavos: 5500}),
          test('Frete preenchido convive com o total antigo', [{id: 72, totalCentavos: 5500, valorEntregaCentavos: 500}], {id: 72, totalCentavos: 5500, valorEntregaCentavos: 500}),
          test('Frete grátis é enviado e campos internos ficam fora', [{id: 73, totalCentavos: 4000, valorEntregaCentavos: 0, custoInternoCentavos: 2700}], {id: 73, totalCentavos: 4000, valorEntregaCentavos: 0}),
          test('Frete null permanece ausente na resposta', [{id: 74, totalCentavos: 4100, valorEntregaCentavos: null}], {id: 74, totalCentavos: 4100})
        ]
      },
      delivery: {
        ...quiz('Que testes ajudam a decidir se a evolução pode ir para homologação?', [
          ['Um teste do cliente antigo lendo o total e casos do cliente novo para frete zero, informado e ausente', 'Isso protege consumidores atuais e verifica as distinções importantes do novo campo.'],
          ['Somente um teste com valorEntregaCentavos > 0', 'O caso não cobre frete grátis, ausência e compatibilidade anterior.'],
          ['Uma captura do novo desenho da tela', 'O risco está no contrato que os consumidores recebem e interpretam.']
        ], 0),
        artifact: {label: 'Nota de versão · WEB-116', text: 'A resposta v1 preserva id e totalCentavos. valorEntregaCentavos aparece quando o frete foi calculado, inclusive 0. Testamos a leitura do total pelo cliente antigo e três casos de frete no cliente novo.'}
      },
      recall: [
        quiz('Um integrador antigo depende de totalCentavos ser inteiro. O novo cliente prefere texto formatado. Qual mudança conserva o contrato?', [
          ['Trocar totalCentavos para "R$ 55,00"', 'A mudança de tipo quebra o cliente que espera um inteiro.'],
          ['Preservar o inteiro e formatar no cliente que precisa exibir moeda', 'O cliente pode adaptar a apresentação sem mudar o valor usado por outros consumidores.'],
          ['Mudar totalCentavos para número decimal em reais', 'Esse campo representa centavos. Mudar a unidade muda o significado para integrações antigas.']
        ], 1),
        quiz('Qual teste detecta que frete grátis foi confundido com frete ausente?', [
          ['Um pedido com frete de 500 centavos', 'O valor positivo passa mesmo em uma implementação que trata zero incorretamente.'],
          ['Um pedido sem campo de frete', 'Esse caso cobre ausência, mas não comprova que zero é preservado.'],
          ['Um pedido com valorEntregaCentavos igual a 0 que precisa devolver o campo', 'Esse cenário identifica código que usa apenas a verdade lógica do valor.']
        ], 2),
        quiz('Um consumidor rejeita propriedades JSON que não estão no esquema antigo. Qual é a próxima verificação?', [
          ['Testar esse consumidor com a resposta nova antes de liberar', 'Clientes estritos podem quebrar mesmo quando o campo adicional é opcional no servidor.'],
          ['Assumir que todos os clientes ignoram campos extras', 'A compatibilidade depende do comportamento real dos consumidores.'],
          ['Remover também o identificador antigo para simplificar', 'Remover outro campo usado ampliaria a quebra.']
        ], 0)
      ],
      refs: [ref('Google AIP-180 · Compatibilidade de APIs', 'https://google.aip.dev/180')]
    }
  ];
})();
