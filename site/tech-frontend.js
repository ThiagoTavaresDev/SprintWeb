window.techFrontend = [
  {
    id:'NG-401',
    title:'O filtro que ficou na tela',
    description:'Use TypeScript e HttpParams para levar o status do componente à query da API sem perder a paginação.',
    level:'essencial',
    minutes:18,
    technologies:['typescript','angular'],
    prerequisites:[
      'Leia um objeto JSON e reconheça os campos obrigatórios de um DTO.',
      'Identifique caminho e parâmetros de consulta em uma URL HTTP.',
      'Entenda que tipos e uniões TypeScript são verificados na compilação.'
    ],
    theory:[
      {label:'Angular · URL parameters',url:'https://angular.dev/guide/http/making-requests#setting-url-parameters',description:'Veja como passar params ao HttpClient e por que set() de HttpParams devolve outra instância.'},
      {label:'TypeScript Handbook · Object types',url:'https://www.typescriptlang.org/docs/handbook/2/objects.html',description:'Revise como declarar a forma de um DTO e reaproveitar o contrato em funções.'}
    ],
    file:'angular/src/app/exercises.ts',
    goal:'Implemente parametrosLista(status, pagina, limite). Preserve os parâmetros pagina e limite. Se status for vazio, omita o parâmetro. O serviço PedidosApi já passa esse resultado a get<PaginaPedidos>().',
    criteria:[
      'Selecionar pendente envia status=pendente na URL.',
      'Selecionar Todos mantém pagina e limite e omite status.',
      'A tela usa items e total da resposta tipada.'
    ],
    example:{language:'typescript',code:`interface PaginaPedidos {
  items: PedidoDto[];
  pagina: number;
  limite: number;
  total: number;
}

const params = new HttpParams().set('pagina', 1).set('limite', 5);
this.http.get<PaginaPedidos>('/api/pedidos', { params });`},
    verify:'Na pasta angular, rode npm run verificar e procure por NG-401. Com a API de referência no ar, abra Network, selecione pendente e depois Todos. Confira os parâmetros das duas requisições.',
    question:{
      prompt:'Você chamou params.set("status", status), mas a requisição saiu sem esse filtro. O que verificar?',
      choices:['Se a nova instância devolvida por set() foi usada no HttpClient.','Se a interface PaginaPedidos declarou status como obrigatório.','Se o status foi acrescentado ao corpo do GET.'],
      answer:0,
      feedback:['HttpParams é imutável. Passe ao HttpClient a instância resultante.','O tipo da resposta não modifica os parâmetros enviados.','O filtro faz parte da query neste contrato.']
    },
    httpLesson:'listar'
  },
  {
    id:'NG-402',
    title:'Vazio e falha pedem telas diferentes',
    description:'Modele o retorno do HttpClient como uma união de estados e deixe o template Angular responder a cada cenário.',
    level:'intermediario',
    minutes:22,
    technologies:['typescript','angular'],
    prerequisites:[
      'Diferencie uma resposta 200 com items vazio de uma falha de rede ou HTTP.',
      'Leia uma união discriminada em TypeScript, como { kind: "loading" }.',
      'Reconheça signals e blocos @switch e @for em templates Angular.'
    ],
    theory:[
      {label:'Angular · Control flow',url:'https://angular.dev/guide/templates/control-flow',description:'Compare @switch para escolher um estado e @for com track para renderizar as linhas.'},
      {label:'Angular · Handling request failure',url:'https://angular.dev/guide/http/making-requests#handling-request-failure',description:'Veja como HttpClient representa erros do servidor e falhas de rede.'}
    ],
    file:'angular/src/app/exercises.ts',
    goal:'Ajuste listaCarregada() para devolver empty quando items estiver vazio e ready quando existirem pedidos. Em listaFalhou(), devolva error com uma mensagem de recuperação e preserve o status HTTP quando houver. Examine o template angular/src/app/pedidos.component.html para acompanhar como cada estado é usado.',
    criteria:[
      'Carregamento, lista com pedidos, lista vazia e falha têm estados distintos.',
      'Resultados mantêm página, limite e total recebidos da API.',
      'Quando a API falha, a tela oferece Tentar novamente.'
    ],
    example:{language:'html',code:`@if (lista(); as estado) {
  @switch (estado.kind) {
    @case ('loading') { <p role="status">Carregando pedidos…</p> }
    @case ('error') { <p role="alert">{{ estado.message }}</p> }
  }
}`},
    verify:'Rode npm run verificar e procure por NG-402. Depois de concluir NG-401, escolha cancelado com a base inicial para ver a lista vazia. Pare a API e altere o filtro para testar o estado de erro.',
    question:{
      prompt:'O endpoint respondeu 200 com items: []. Qual estado deve orientar a interface?',
      choices:['error, porque a tabela não tem linhas.','empty, porque a consulta foi concluída e não encontrou pedidos.','loading, até que algum pedido seja criado.'],
      answer:1,
      feedback:['O HTTP 200 indica sucesso da consulta. Não houve falha.','A pessoa pode mudar o filtro sabendo que a consulta foi concluída.','O carregamento termina quando chega a resposta.']
    },
    httpLesson:'listar'
  },
  {
    id:'NG-403',
    title:'O erro precisa chegar ao campo certo',
    description:'Conecte o formulário reativo tipado aos erros de validação 422 devolvidos pelo ASP.NET Core.',
    level:'intermediario',
    minutes:25,
    technologies:['typescript','angular'],
    prerequisites:[
      'Leia FormGroup e FormControl e reconheça os controles cliente, cep e valorCentavos.',
      'Diferencie validação do formulário da validação realizada pela API.',
      'Leia um Problem Details 422 com um objeto errors de listas de mensagens.'
    ],
    theory:[
      {label:'Angular · Strictly typed reactive forms',url:'https://angular.dev/guide/forms/typed-forms',description:'Revise tipos de controles, valores que podem ser nulos e a leitura com getRawValue().'},
      {label:'Angular · Handling request failure',url:'https://angular.dev/guide/http/making-requests#handling-request-failure',description:'Veja onde encontrar status e corpo quando HttpClient entrega um HttpErrorResponse.'}
    ],
    file:'angular/src/app/exercises.ts',
    goal:'Implemente errosDeCriacao(error). Leia errors apenas de HttpErrorResponse com status 422. Devolva listas de mensagens de cliente, cep e valorCentavos. Ignore campos desconhecidos e valores que não sejam listas válidas. O componente já liga o resultado aos controles do FormGroup.',
    criteria:[
      'Um 422 para cep exibe a mensagem ao lado de CEP e mantém os dados digitados.',
      'Erros de outros status recebem feedback geral.',
      'Corrigir o CEP e reenviar cria o pedido e atualiza a listagem.'
    ],
    example:{language:'typescript',code:`const form = new FormGroup({
  cliente: new FormControl('', { nonNullable: true }),
  cep: new FormControl('', { nonNullable: true }),
  valorCentavos: new FormControl<number | null>(null),
});

const draft = form.getRawValue();
// O CEP segue como string e pode começar com zero. `},
    verify:'Rode npm run verificar e procure por NG-403. No portal, envie Ana, CEP 123 e 12500 centavos. Confira o 422 e a mensagem no campo. Corrija para 01001000 e confirme a criação.',
    question:{
      prompt:'Como tratar um retorno 422 com errors.cep no formulário?',
      choices:['Apagar os dados para que a pessoa preencha tudo novamente.','Exibir o JSON completo em um alerta sem relação com os campos.','Manter o rascunho e associar a mensagem ao controle cep.'],
      answer:2,
      feedback:['Preserve os campos válidos. A pessoa precisa corrigir apenas a entrada rejeitada.','A mensagem é mais acionável quando aparece no campo correspondente.','A resposta da API indica exatamente qual campo precisa de correção.']
    },
    httpLesson:'validar'
  },
  {
    id:'NG-404',
    title:'O pedido mudou em outra aba',
    description:'Preserve o ETag recebido do servidor e trate uma escrita rejeitada sem sobrescrever o trabalho de outra pessoa.',
    level:'avancado',
    minutes:25,
    technologies:['typescript','angular'],
    prerequisites:[
      'Leia um HttpResponse completo e encontre o ETag nos cabeçalhos.',
      'Diferencie GET de detalhe e PATCH de status.',
      'Entenda a relação entre uma versão lida, If-Match e HTTP 412.'
    ],
    theory:[
      {label:'Angular · Interacting with the server response',url:'https://angular.dev/guide/http/making-requests#interacting-with-the-server-response-events',description:'Encontre observe: "response" para ler cabeçalhos junto com o corpo da resposta.'},
      {label:'IETF · If-Match',url:'https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match',description:'Leia quando o servidor testa a precondição e evita sobrescrever uma versão mais recente.'}
    ],
    file:'angular/src/app/exercises.ts',
    goal:'Implemente cabecalhosDeAlteracao(etag) para devolver um HttpHeaders com If-Match, preservando aspas e o valor original. Em alteracaoFalhou(), devolva kind: "conflict" quando o HTTP for 412 e peça que a pessoa recarregue o pedido. O componente mantém o status escolhido enquanto relê a versão atual.',
    criteria:[
      'O PATCH envia If-Match com o ETag retornado pelo GET de detalhe.',
      'Um ETag desatualizado gera feedback de conflito e bloqueia nova gravação até recarregar.',
      'Após recarregar, o usuário pode revisar e reenviar a alteração.'
    ],
    example:{language:'typescript',code:`this.http.get<PedidoDto>('/api/pedidos/101', {
  observe: 'response',
}).subscribe(response => {
  const etag = response.headers.get('ETag');
  console.log(etag);
});`},
    verify:'Rode npm run verificar e procure por NG-404. Abra o mesmo pedido em duas abas. Altere o status na primeira e tente salvar na segunda. Confira o 412 no Network, recarregue a versão pelo botão e tente novamente.',
    question:{
      prompt:'O PATCH devolveu 412. Qual é a próxima ação segura no frontend?',
      choices:['Refazer o PATCH automaticamente sem If-Match.','Pedir que a pessoa recarregue a versão atual e revise a alteração.','Repetir a requisição com o ETag antigo até funcionar.'],
      answer:1,
      feedback:['Remover a precondição elimina a proteção contra sobrescrita.','Depois de recarregar, a pessoa pode decidir se ainda quer aplicar a alteração.','O ETag antigo continua incompatível com a versão atual.']
    },
    httpLesson:'conflito'
  }
];
