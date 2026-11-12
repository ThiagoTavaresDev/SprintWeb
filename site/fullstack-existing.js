window.fullstackExisting = (() => {
  const test = (label, args, expected) => ({label, args, expected});
  const quiz = (prompt, answer, ...options) => ({
    prompt, answer, choices:options.map(([choice]) => choice), feedback:options.map(([,feedback]) => feedback)
  });
  const request = (label, path, args, response, view) => ({label, method:'GET', path, args, response, view});
  const reference = (label, url) => ({label, url});

  const pedidosFiltro = [{id:104,status:'pendente'},{id:105,status:'enviado'},{id:106,status:'pendente'}];
  const filtroPendente = {status:200,body:{pedidos:[{id:104,status:'pendente'},{id:106,status:'pendente'}]}};
  const filtroVazio = {status:200,body:{pedidos:[]}};
  const filtroInvalido = {status:400,body:{erro:'status_invalido'}};
  const listaPendente = {state:'ready',message:'Pedidos encontrados.',items:[
    {id:104,label:'Pedido #104',detail:'Pendente'},
    {id:106,label:'Pedido #106',detail:'Pendente'}
  ]};
  const listaVazia = {state:'empty',message:'Nenhum pedido neste filtro.'};
  const erroFiltro = {state:'error',message:'Selecione um status válido.'};

  const pedidosPagina = [
    {id:107,criadoEm:'2026-10-21T09:00:00Z'},
    {id:108,criadoEm:'2026-10-21T09:00:00Z'},
    {id:109,criadoEm:'2026-10-21T09:00:00Z'}
  ];
  const primeiraPagina = {status:200,body:{pagina:1,temProxima:true,pedidos:[pedidosPagina[2],pedidosPagina[1]]}};
  const ultimaPagina = {status:200,body:{pagina:2,temProxima:false,pedidos:[pedidosPagina[0]]}};
  const paginaVazia = {status:200,body:{pagina:3,temProxima:false,pedidos:[]}};
  const paginaInvalida = {status:400,body:{erro:'pagina_invalida'}};
  const primeiraTela = {state:'ready',message:'Página 1. Há mais pedidos.',items:[{id:109,label:'Pedido #109'},{id:108,label:'Pedido #108'}]};
  const ultimaTela = {state:'ready',message:'Página 2. Última página.',items:[{id:107,label:'Pedido #107'}]};
  const telaVazia = {state:'empty',message:'Esta página está vazia.'};
  const erroPagina = {state:'error',message:'Número de página inválido.'};

  const pedidosFilial = [
    {id:418,empresa:'A',filial:'Norte',status:'pendente',notaInterna:'Lote 10'},
    {id:419,empresa:'A',filial:'Sul',status:'enviado',notaInterna:'Lote 20'},
    {id:420,empresa:'B',filial:'Norte',status:'cancelado',notaInterna:'Lote 30'}
  ];
  const operadorNorte = {empresa:'A',filial:'Norte',papel:'operador'};
  const suporteA = {empresa:'A',papel:'suporte'};
  const pedidoProprio = {status:200,body:{id:418,status:'pendente'}};
  const pedidoMesmoCliente = {status:200,body:{id:419,status:'enviado'}};
  const pedidoIndisponivel = {status:404,body:{erro:'pedido_indisponivel'}};
  const sessaoAusente = {status:401,body:{erro:'sessao_ausente'}};
  const detalhePedido = {state:'ready',message:'Pedido carregado.',items:[{id:418,label:'Pedido #418',detail:'pendente'}]};
  const detalheIndisponivel = {state:'empty',message:'Pedido indisponível.'};
  const detalheSemSessao = {state:'denied',message:'Entre para ver o pedido.'};

  return [
    {
      id:'FS-201', sourceId:'WEB-101', title:'Filtro de pedidos de ponta a ponta', category:'HTTP e interface',
      description:'A requisição já envia o filtro. Faça a API respeitá-lo e dê à tela respostas claras para lista, vazio e erro.',
      minutes:25, icon:'filter', theme:'violet', skills:['Contrato HTTP','SQL Server','Estados de tela','Jira','Slack'],
      story:{
        person:'Ana',role:'Suporte',
        message:'O filtro Pendentes aparece na URL agora, mas a API ainda retorna um pedido enviado. Cancelados também precisa mostrar um estado vazio quando a consulta der zero resultados.',
        criteria:[
          'A API aplica um status válido e retorna 200 com uma lista, inclusive quando ela está vazia.',
          'A API devolve 400 para status desconhecido. A tela orienta a pessoa a corrigir o filtro.',
          'Em revisão, o chamado registra os três comportamentos testados de ponta a ponta.'
        ],
        evidence:{
          label:'Network · resposta capturada',
          code:'GET /api/pedidos?status=pendente → 200\n{"pedidos":[{"id":104,"status":"pendente"},{"id":105,"status":"enviado"}]}'
        },
        question:quiz('Que divisão de trabalho corrige o filtro e mantém o contrato previsível?',0,
          ['A API valida e filtra. A tela apresenta o resultado, o vazio e o erro.','Essa divisão permite que outros consumidores também recebam a lista certa.'],
          ['A API sempre retorna tudo. Cada tela filtra os dados que recebeu.','Essa opção quebra quando o filtro precisa ser aplicado antes da paginação.'],
          ['A tela troca o código 200 por 400 se a lista estiver vazia.','Uma consulta válida com zero linhas ainda é uma resposta de sucesso.'])
      },
      backend:{
        functionName:'responder',
        goal:'Edite responder(requisicao, pedidos). Leia requisicao.query?.status. Ausente ou "todos" devolve todos. "pendente", "enviado" ou "cancelado" filtra por igualdade. Sucesso devolve {status:200, body:{pedidos:[...]}}. Outro valor devolve {status:400, body:{erro:"status_invalido"}}.',
        starter:`function responder(requisicao, pedidos) {
  // A rota recebe a seleção, mas o repositório ainda devolve tudo.
  return {status: 200, body: {pedidos}};
}`,
        answer:`function responder(requisicao, pedidos) {
  const status = requisicao.query?.status;
  if (status === undefined || status === "todos") {
    return {status: 200, body: {pedidos}};
  }
  if (!["pendente", "enviado", "cancelado"].includes(status)) {
    return {status: 400, body: {erro: "status_invalido"}};
  }
  const filtrados = pedidos.filter(pedido => pedido.status === status);
  return {status: 200, body: {pedidos: filtrados}};
}`,
        hints:['Separe primeiro a ausência de filtro, o valor inválido e o valor válido.', 'Depois de validar, use filter para preservar somente as linhas que correspondem ao status.'],
        note:'O array simula a consulta do repositório. Em SQL Server, vincule o valor como parâmetro @status no WHERE. No Visual FoxPro, SQLEXEC pode devolver um cursor; aqui a API publica JSON para a interface web.',
        tests:[
          test('Sem filtro, recupera todos',[{},pedidosFiltro],{status:200,body:{pedidos:pedidosFiltro}}),
          test('Todos é uma seleção válida',[{query:{status:'todos'}},pedidosFiltro],{status:200,body:{pedidos:pedidosFiltro}}),
          test('Pendentes filtra antes de responder',[{query:{status:'pendente'}},pedidosFiltro],filtroPendente),
          test('Cancelados retorna uma coleção vazia',[{query:{status:'cancelado'}},pedidosFiltro],filtroVazio),
          test('Status desconhecido é rejeitado',[{query:{status:'aberto'}},pedidosFiltro],filtroInvalido)
        ]
      },
      frontend:{
        functionName:'renderizar',
        goal:'Edite renderizar(resposta). Para 200 com pedidos, devolva state "ready", message "Pedidos encontrados." e items com id, label "Pedido #<id>" e detail "Pendente", "Enviado" ou "Cancelado". Para 200 sem pedidos, devolva state "empty" e message "Nenhum pedido neste filtro.". Para 400, devolva state "error" e message "Selecione um status válido.". Vazio e erro omitem items.',
        starter:`function renderizar(resposta) {
  const nomes = {pendente: "Pendente", enviado: "Enviado", cancelado: "Cancelado"};
  const pedidos = resposta.body.pedidos || [];
  return {
    state: "ready",
    message: "Pedidos encontrados.",
    items: pedidos.map(pedido => ({
      id: pedido.id,
      label: "Pedido #" + pedido.id,
      detail: nomes[pedido.status]
    }))
  };
}`,
        answer:`function renderizar(resposta) {
  if (resposta.status === 400) {
    return {state: "error", message: "Selecione um status válido."};
  }
  const pedidos = resposta.body.pedidos;
  if (!pedidos.length) {
    return {state: "empty", message: "Nenhum pedido neste filtro."};
  }
  const nomes = {pendente: "Pendente", enviado: "Enviado", cancelado: "Cancelado"};
  return {
    state: "ready",
    message: "Pedidos encontrados.",
    items: pedidos.map(pedido => ({
      id: pedido.id,
      label: "Pedido #" + pedido.id,
      detail: nomes[pedido.status]
    }))
  };
}`,
        hints:['Confira o código HTTP antes de tentar ler a lista.', 'Uma coleção vazia no 200 tem um estado visual diferente de um erro de validação.'],
        tests:[
          test('Renderiza os pedidos pendentes',[filtroPendente],listaPendente),
          test('Mostra o estado vazio sem lista',[filtroVazio],listaVazia),
          test('Orienta como corrigir um status inválido',[filtroInvalido],erroFiltro)
        ]
      },
      integration:[
        request('Pendentes com resultado','/api/pedidos?status=pendente',[{query:{status:'pendente'}},pedidosFiltro],filtroPendente,listaPendente),
        request('Cancelados sem registros','/api/pedidos?status=cancelado',[{query:{status:'cancelado'}},pedidosFiltro],filtroVazio,listaVazia),
        request('Status fora do contrato','/api/pedidos?status=aberto',[{query:{status:'aberto'}},pedidosFiltro],filtroInvalido,erroFiltro)
      ],
      handoff:{
        channel:'#suporte-produto',
        slack:'FS-201 · A API agora aplica o filtro por status. Validei Pendentes com registros, Cancelados sem resultado e a mensagem para filtro inválido. O Jira está pronto para revisão.',
        pr:'FS-201 · Validação de status na API e estados de lista, vazio e erro na tela. Para revisar, confira /api/pedidos com pendente, cancelado e aberto e compare o JSON com o que o portal mostra.'
      },
      recall:[
        quiz('O status é válido e o repositório retornou zero pedidos. O que a pessoa deve ver?',1,
          ['Uma mensagem de falha do servidor.','A consulta foi bem-sucedida.'],
          ['Um estado vazio para o filtro aplicado.','A API retorna 200 com a coleção vazia e a tela explica o resultado.'],
          ['Todos os pedidos como alternativa.','Trocar o filtro sem avisar produz uma lista enganosa.']),
        quiz('O parâmetro chega certo e a resposta contém pedidos de outros status. Por onde investigar?',2,
          ['Pela cor do seletor.','O erro já aparece no JSON, antes da renderização.'],
          ['Pelo idioma do navegador.','O valor da requisição já está correto.'],
          ['Pela validação da API e pela consulta do repositório.','A fronteira HTTP mostra que o filtro se perde depois de chegar ao servidor.']),
        quiz('Ao trocar o array por SQL Server, como usar o status na consulta?',0,
          ['Validar e enviar como valor de um parâmetro.','O parâmetro mantém separado o valor recebido e o texto da consulta.'],
          ['Concatenar o valor no WHERE.','A concatenação mistura entrada com o comando.'],
          ['Enviar o texto da consulta para a interface.','A interface consome a resposta JSON.'])
      ],
      refs:[
        reference('Microsoft Learn · Parâmetros no SQL Server','https://learn.microsoft.com/en-us/sql/connect/ado-net/configure-parameters'),
        reference('Visual FoxPro · SQLEXEC','https://www.vfphelp.com/vfp9/html/8dd6491b-da44-401f-b972-0d51f12f1a07.htm'),
        reference('IETF · Semântica HTTP','https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes')
      ]
    },
    {
      id:'FS-202', sourceId:'WEB-103', title:'Paginação sem pedidos repetidos', category:'SQL Server e interface',
      description:'Estabilize a ordem na API e use o contrato da página para informar quando ainda há pedidos.',
      minutes:27, icon:'database', theme:'blue', skills:['SQL Server','Paginação','Contratos','Testes de integração'],
      story:{
        person:'Bruna',role:'Operações',
        message:'Vários pedidos vieram da mesma importação e têm a mesma data de criação. Preciso ir da primeira página até a última sem ver duplicatas. Também preciso saber quando acabou.',
        criteria:[
          'O backend ordena por data decrescente e desempata por ID decrescente.',
          'O backend informa se existe outra página. A interface apresenta essa informação, inclusive quando uma página cheia for a última.',
          'O cenário vazio e a segunda página são reproduzíveis com uma coleção estável.'
        ],
        evidence:{
          label:'API · paginação antes do ajuste',
          code:'GET /api/pedidos?pagina=1 → [107, 108]\nGET /api/pedidos?pagina=2 → [108]\nSQL atual: ORDER BY CriadoEm DESC'
        },
        question:quiz('Qual contrato resolve a ordem e ajuda a tela a informar a última página?',1,
          ['A tela reordena os itens depois de receber cada página.','Isso muda a ordem local, mas não decide quais linhas entram em cada página.'],
          ['A API ordena por data e ID antes do recorte e devolve temProxima.','O servidor conhece a sequência completa. A tela consegue usar os metadados retornados.'],
          ['A tela decide que sempre há outra página se receber dois pedidos.','Uma última página também pode ter exatamente dois pedidos.'])
      },
      backend:{
        functionName:'responder',
        goal:'Edite responder(requisicao, pedidos). requisicao.query?.pagina é uma string decimal de 1 a 1000, sem zeros iniciais; ausente significa página 1. Valor inválido retorna {status:400, body:{erro:"pagina_invalida"}}. Ordene uma cópia por criadoEm decrescente e, em empate, por id decrescente. Recorte 2 itens por página e retorne {status:200, body:{pagina:<número>, temProxima:<booleano>, pedidos:[...]}}.',
        starter:`function responder(requisicao, pedidos) {
  const valor = requisicao.query?.pagina ?? "1";
  if (!/^[1-9][0-9]{0,3}$/.test(valor) || Number(valor) > 1000) {
    return {status: 400, body: {erro: "pagina_invalida"}};
  }
  const pagina = Number(valor);
  const inicio = (pagina - 1) * 2;
  const ordenados = [...pedidos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  return {
    status: 200,
    body: {pagina, temProxima: inicio + 2 < ordenados.length, pedidos: ordenados.slice(inicio, inicio + 2)}
  };
}`,
        answer:`function responder(requisicao, pedidos) {
  const valor = requisicao.query?.pagina;
  const texto = valor === undefined ? "1" : valor;
  if (typeof texto !== "string" || !/^[1-9][0-9]{0,3}$/.test(texto) || Number(texto) > 1000) {
    return {status: 400, body: {erro: "pagina_invalida"}};
  }
  const pagina = Number(texto);
  const inicio = (pagina - 1) * 2;
  const ordenados = [...pedidos].sort(
    (a, b) => b.criadoEm.localeCompare(a.criadoEm) || b.id - a.id
  );
  return {
    status: 200,
    body: {pagina, temProxima: inicio + 2 < ordenados.length, pedidos: ordenados.slice(inicio, inicio + 2)}
  };
}`,
        hints:['As datas do exercício usam ISO 8601 em UTC com a mesma precisão. Compare o texto e use o ID quando a comparação resultar em zero.', 'O próximo recorte começa em inicio + 2. Ele só existe se essa posição ainda estiver dentro da coleção.'],
        note:'A coleção fixa representa uma consulta SQL. Em SQL Server, use ORDER BY CriadoEm DESC, Id DESC com OFFSET/FETCH. A ordem única resolve empates; inserções entre requisições ainda podem mover itens com paginação por offset.',
        tests:[
          test('Página padrão desempata pelo maior ID',[{},pedidosPagina],primeiraPagina),
          test('Segunda página traz o item restante',[{query:{pagina:'2'}},pedidosPagina],ultimaPagina),
          test('Página além do fim retorna uma coleção vazia',[{query:{pagina:'3'}},pedidosPagina],paginaVazia),
          test('Página zero é inválida',[{query:{pagina:'0'}},pedidosPagina],paginaInvalida),
          test('Página cheia pode ser a última',[{query:{pagina:'1'}},[pedidosPagina[2],pedidosPagina[1]]],{
            status:200,body:{pagina:1,temProxima:false,pedidos:[pedidosPagina[2],pedidosPagina[1]]}
          })
        ]
      },
      frontend:{
        functionName:'renderizar',
        goal:'Edite renderizar(resposta). Para 200 com itens, retorne state "ready", items com id e label "Pedido #<id>" na ordem recebida e message "Página <n>. Há mais pedidos." se temProxima, ou "Página <n>. Última página." caso contrário. Para 200 sem itens, retorne state "empty" e message "Esta página está vazia.". Para 400, retorne state "error" e message "Número de página inválido.". Vazio e erro omitem items.',
        starter:`function renderizar(resposta) {
  const {pagina, pedidos = []} = resposta.body;
  const mensagem = pedidos.length === 2 ? "Há mais pedidos." : "Última página.";
  return {
    state: "ready",
    message: "Página " + pagina + ". " + mensagem,
    items: pedidos.map(pedido => ({id: pedido.id, label: "Pedido #" + pedido.id}))
  };
}`,
        answer:`function renderizar(resposta) {
  if (resposta.status === 400) {
    return {state: "error", message: "Número de página inválido."};
  }
  const {pagina, temProxima, pedidos} = resposta.body;
  if (!pedidos.length) {
    return {state: "empty", message: "Esta página está vazia."};
  }
  const mensagem = temProxima ? "Há mais pedidos." : "Última página.";
  return {
    state: "ready",
    message: "Página " + pagina + ". " + mensagem,
    items: pedidos.map(pedido => ({id: pedido.id, label: "Pedido #" + pedido.id}))
  };
}`,
        hints:['A API já informa se há uma página seguinte em temProxima.', 'Trate erro e lista vazia antes de montar o texto da página.'],
        tests:[
          test('Primeira página segue a ordem retornada',[primeiraPagina],primeiraTela),
          test('Última página cheia usa temProxima false',[
            {status:200,body:{pagina:1,temProxima:false,pedidos:[pedidosPagina[2],pedidosPagina[1]]}}
          ],{state:'ready',message:'Página 1. Última página.',items:primeiraTela.items}),
          test('Página vazia ganha uma orientação própria',[paginaVazia],telaVazia),
          test('Erro de página inválida',[paginaInvalida],erroPagina)
        ]
      },
      integration:[
        request('Primeira página com empate de datas','/api/pedidos?pagina=1',[{query:{pagina:'1'}},pedidosPagina],primeiraPagina,primeiraTela),
        request('Segunda e última página','/api/pedidos?pagina=2',[{query:{pagina:'2'}},pedidosPagina],ultimaPagina,ultimaTela),
        request('Página além da última','/api/pedidos?pagina=3',[{query:{pagina:'3'}},pedidosPagina],paginaVazia,telaVazia)
      ],
      handoff:{
        channel:'#operacoes-pedidos',
        slack:'FS-202 · Validei com três pedidos de mesmo horário. A primeira página mostra 109 e 108, a segunda mostra 107 e a terceira indica vazio. A tela usa o indicador de próxima página que veio da API.',
        pr:'FS-202 · Ordenação estável por data e ID antes do recorte. A tela usa temProxima e trata a página vazia. Testar páginas 1, 2 e 3 com a coleção de homologação e conferir uma última página cheia.'
      },
      recall:[
        quiz('A página veio cheia, mas temProxima é false. O que a tela deve dizer?',0,
          ['Que esta é a última página.','O servidor sabe se há registros além do recorte.'],
          ['Que é possível avançar.','O tamanho da página sozinho não prova que existam mais registros.'],
          ['Que ocorreu um erro de rede.','O resultado continua válido.']),
        quiz('Os itens têm a mesma data. Em qual etapa o ID deve desempatar?',2,
          ['Na tela, depois de aplicar a paginação.','A tela só conhece a página que recebeu.'],
          ['No Slack, ao registrar o chamado.','O registro comunica o comportamento, sem alterar a consulta.'],
          ['Na ordenação do backend, antes do recorte.','Assim os limites das páginas usam uma ordem única.']),
        quiz('Um novo pedido entrou no início entre duas chamadas. Que risco sobra com OFFSET?',1,
          ['O ID deixa de ser único.','Inserir uma linha não muda a unicidade dos IDs existentes.'],
          ['A posição dos itens pode mudar entre chamadas.','A ordem é determinística por consulta, mas a coleção mudou.'],
          ['A ordem da data fica aleatória.','Os dados ainda seguem a ordenação definida.'])
      ],
      refs:[
        reference('Microsoft Learn · ORDER BY e OFFSET/FETCH','https://learn.microsoft.com/en-us/sql/t-sql/queries/select-order-by-clause-transact-sql')
      ]
    },
    {
      id:'FS-203', sourceId:'WEB-105', title:'Detalhe de pedido com acesso seguro', category:'Autorização e interface',
      description:'Proteja a rota contra troca de ID e deixe a tela tratar sessão ausente e pedido indisponível.',
      minutes:26, icon:'shield', theme:'rose', skills:['Autorização por objeto','Sessão','HTTP','Estados de tela'],
      story:{
        person:'Rafael',role:'QA',
        message:'Um operador da filial Norte conseguiu abrir um pedido do Sul pelo link direto. Precisamos testar o endpoint e a tela com a mesma sessão. A mensagem de indisponibilidade deve servir para pedido inexistente e fora da permissão.',
        criteria:[
          'Operador lê pedidos da própria empresa e filial. Suporte lê qualquer filial da própria empresa.',
          'Pedido inexistente ou fora da permissão retorna 404 genérico sem dados do objeto. Ausência de sessão retorna 401.',
          'A interface renderiza somente o resumo permitido ou uma orientação compatível com a resposta.'
        ],
        evidence:{
          label:'Homologação · sessão A/Norte com perfil operador',
          code:'GET /api/pedidos/418 → 200 · empresa A/Norte\nGET /api/pedidos/419 → 200 · empresa A/Sul\nEsperado para 419: 404 sem os dados do pedido.'
        },
        question:quiz('Em qual camada deve ser aplicada a regra de acesso ao pedido?',2,
          ['Só no link da lista.','A pessoa pode chegar ao endpoint pelo link direto.'],
          ['Só no componente de detalhes.','Os dados já estariam no JSON da resposta.'],
          ['Na API, usando a sessão validada e o pedido encontrado.','A API impede que um pedido sem autorização seja enviado ao navegador.'])
      },
      backend:{
        functionName:'responder',
        goal:'Edite responder(requisicao, pedidos). requisicao.sessao é a sessão validada e requisicao.params.id é um número já convertido. Sem sessão, devolva {status:401,body:{erro:"sessao_ausente"}}. Pedido inexistente, empresa diferente ou papel sem permissão devolve {status:404,body:{erro:"pedido_indisponivel"}}. Na mesma empresa, permita suporte ou operador da mesma filial. Devolva apenas {status:200,body:{id,status}}.',
        starter:`function responder(requisicao, pedidos) {
  if (!requisicao.sessao) {
    return {status: 401, body: {erro: "sessao_ausente"}};
  }
  const pedido = pedidos.find(item => item.id === requisicao.params.id);
  if (!pedido) {
    return {status: 404, body: {erro: "pedido_indisponivel"}};
  }
  // A busca encontra o objeto, mas ainda falta verificar quem pode lê-lo.
  return {status: 200, body: {id: pedido.id, status: pedido.status}};
}`,
        answer:`function responder(requisicao, pedidos) {
  const sessao = requisicao.sessao;
  if (!sessao) {
    return {status: 401, body: {erro: "sessao_ausente"}};
  }
  const pedido = pedidos.find(item => item.id === requisicao.params.id);
  const mesmaEmpresa = pedido && sessao.empresa && pedido.empresa === sessao.empresa;
  const papelPermitido = sessao.papel === "suporte" ||
    (sessao.papel === "operador" && sessao.filial && pedido?.filial === sessao.filial);
  if (!mesmaEmpresa || !papelPermitido) {
    return {status: 404, body: {erro: "pedido_indisponivel"}};
  }
  return {status: 200, body: {id: pedido.id, status: pedido.status}};
}`,
        hints:['Cheque sessão e empresa antes de devolver qualquer informação do pedido.', 'Operador exige igualdade de filial. Suporte precisa estar na mesma empresa. Um papel desconhecido nunca passa.'],
        note:'A sessão deste teste é um dado de servidor fornecido pelo middleware simulado. Em produção, autentique primeiro e derive os dados de autorização da sessão no servidor. Os pedidos são fictícios.',
        tests:[
          test('Operador lê pedido da própria filial',[{sessao:operadorNorte,params:{id:418}},pedidosFilial],pedidoProprio),
          test('Operador não lê pedido de outra filial',[{sessao:operadorNorte,params:{id:419}},pedidosFilial],pedidoIndisponivel),
          test('Suporte lê pedido de outra filial da empresa',[{sessao:suporteA,params:{id:419}},pedidosFilial],pedidoMesmoCliente),
          test('Suporte não lê pedido de outra empresa',[{sessao:suporteA,params:{id:420}},pedidosFilial],pedidoIndisponivel),
          test('ID inexistente recebe o mesmo 404',[{sessao:operadorNorte,params:{id:999}},pedidosFilial],pedidoIndisponivel),
          test('Sessão ausente pede autenticação',[{sessao:null,params:{id:418}},pedidosFilial],sessaoAusente)
        ]
      },
      frontend:{
        functionName:'renderizar',
        goal:'Edite renderizar(resposta). Para 200, devolva state "ready", message "Pedido carregado." e items com um objeto com id, label "Pedido #<id>" e detail igual ao status recebido. Para 404, devolva state "empty" e message "Pedido indisponível.". Para 401, devolva state "denied" e message "Entre para ver o pedido.". Em 401 e 404, omita items.',
        starter:`function renderizar(resposta) {
  const {id, status} = resposta.body;
  return {
    state: "ready",
    message: "Pedido carregado.",
    items: [{id, label: "Pedido #" + id, detail: status}]
  };
}`,
        answer:`function renderizar(resposta) {
  if (resposta.status === 401) {
    return {state: "denied", message: "Entre para ver o pedido."};
  }
  if (resposta.status === 404) {
    return {state: "empty", message: "Pedido indisponível."};
  }
  const {id, status} = resposta.body;
  return {
    state: "ready",
    message: "Pedido carregado.",
    items: [{id, label: "Pedido #" + id, detail: status}]
  };
}`,
        hints:['Confira status antes de ler campos do corpo de sucesso.', 'Em 404, mostre a mensagem genérica mesmo quando a pessoa chegou por link direto.'],
        tests:[
          test('Mostra somente o resumo recebido',[pedidoProprio],detalhePedido),
          test('404 não apresenta detalhes do pedido',[pedidoIndisponivel],detalheIndisponivel),
          test('401 orienta a entrar',[sessaoAusente],detalheSemSessao)
        ]
      },
      integration:[
        request('Operador abre o próprio pedido','/api/pedidos/418',[{sessao:operadorNorte,params:{id:418}},pedidosFilial],pedidoProprio,detalhePedido),
        request('Operador troca o ID para outra filial','/api/pedidos/419',[{sessao:operadorNorte,params:{id:419}},pedidosFilial],pedidoIndisponivel,detalheIndisponivel),
        request('Acesso ao link com sessão ausente','/api/pedidos/418',[{sessao:null,params:{id:418}},pedidosFilial],sessaoAusente,detalheSemSessao)
      ],
      handoff:{
        channel:'#qa-pedidos',
        slack:'FS-203 · Em homologação, a sessão A/Norte abre 418 e recebe 404 genérico em 419. Sem sessão, recebe 401 e a tela pede login. O ticket tem os passos com dados fictícios.',
        pr:'FS-203 · Autorização por objeto na rota de detalhe e estados de indisponibilidade e autenticação na tela. Valide o acesso direto com operador, suporte, empresa diferente e sessão ausente.'
      },
      recall:[
        quiz('Uma pessoa tenta alterar o ID pelo DevTools. Qual teste verifica a proteção?',2,
          ['Conferir se o botão está oculto.','O endpoint pode ser chamado mesmo sem o botão.'],
          ['Trocar a rota da página sem chamar a API.','O teste precisa exercer a decisão do servidor.'],
          ['Fazer duas requisições com a mesma sessão e comparar um pedido autorizado e outro de fora.','Isso verifica a política por objeto e o conteúdo da resposta.']),
        quiz('De onde vem o perfil usado para decidir acesso?',0,
          ['Da sessão validada pelo servidor.','O servidor determina a identidade e a política aplicável.'],
          ['De um campo empresa que a interface envia.','A requisição pode ser editada.'],
          ['Da filial que aparece no título da página.','A renderização não estabelece a identidade.']),
        quiz('Qual é o papel da tela quando recebe o 404 genérico?',1,
          ['Tentar localizar o pedido consultando todas as filiais.','Isso contorna o fluxo e gera requisições desnecessárias.'],
          ['Mostrar que o pedido está indisponível e omitir os dados do detalhe.','O estado visual preserva a mensagem genérica da API.'],
          ['Exibir as informações antigas que estavam no componente.','Isso pode mostrar conteúdo referente a outro pedido.'])
      ],
      refs:[
        reference('OWASP · Autorização por objeto em APIs','https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/'),
        reference('IETF · Respostas 401 e 404','https://www.rfc-editor.org/rfc/rfc9110.html#name-client-error-4xx')
      ]
    }
  ];
})();
