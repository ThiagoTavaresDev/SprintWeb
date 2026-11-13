(() => {
  const file = 'hemoterapia/angular/src/app/oficina/oficina.ts';
  const http = {
    label:'Angular · Fazendo requisições HTTP',url:'https://angular.dev/guide/http/making-requests',
    description:'Confira como cada inscrição em um Observable do HttpClient dispara uma requisição e como o cancelamento encerra a consulta.'
  };
  const verify = (id, check) => `Com a API em modo referência, rode npm start em hemoterapia/angular e abra a Oficina Angular em http://localhost:4210. ${check} No mesmo diretório, rode node --import @angular/compiler --test --test-name-pattern=${id} tests/oficina.initial.test.mjs.`;

  window.hemoAngularMoreMissions = [
    {
      id:'HNG-404',area:'estoque',title:'O contador acompanha a busca do estoque?',level:'essencial',minutes:20,
      description:'Use Signals para derivar a lista visível e a contagem de componentes a partir do código digitado.',
      technologies:['angular','typescript'],file,
      prerequisites:['Ler uma lista de objetos em TypeScript.','Usar filter e includes em arrays e strings.','Reconhecer signal como uma fonte de estado mutável.'],
      theory:[{label:'Angular · Signals',url:'https://angular.dev/guide/signals',description:'Leia a seção sobre computed e veja como ela registra dependências durante a leitura.'}],
      goal:'Implemente criarVisiveis como um computed que lê itens e termo. Compare o código sem distinguir maiúsculas e minúsculas. Ignore os espaços das pontas do termo.',
      criteria:['Busca vazia mostra todos os componentes carregados.','“ bol-102 ” mostra apenas BOL-102.','Sem correspondência, o contador mostra zero e a lista exibe o estado vazio.'],
      example:{language:'typescript',code:"const normalizar = (texto: string) => texto.trim().toUpperCase();\nconst filtro = computed(() => normalizar(termo()));"},
      verify:verify('HNG-404','Carregue o inventário e teste “ bol-102 ” e “999”.'),
      question:{
        prompt:'Por que derivar a lista visível com computed?',
        choices:['Para reagir aos itens e ao termo sem guardar uma segunda lista mutável.','Para escrever de volta nos itens após cada pesquisa.','Para enviar um GET sempre que um caractere mudar.'],
        answer:0,
        feedback:['O resultado muda com as duas fontes de estado e o estoque original é preservado.','Uma busca local deve manter os itens de origem.','A tarefa usa os itens já carregados e não depende de um novo GET.']
      }
    },
    {
      id:'HNG-405',area:'estoque',title:'A consulta mais lenta sobrescreveu o componente selecionado',level:'intermediario',minutes:30,
      description:'Corrija a condição de corrida quando a equipe alterna rapidamente entre dois códigos de rastreabilidade.',
      technologies:['angular','typescript'],file,
      prerequisites:['Distinguir Observable de uma inscrição ativa.','Ler um pipe de operadores RxJS.','Interpretar o 404 de uma consulta de detalhe.'],
      theory:[{label:'RxJS · switchMap',url:'https://rxjs.dev/api/operators/switchMap',description:'Veja como o operador troca o fluxo interno anterior quando chega uma nova seleção.'},http],
      goal:'Em detalhesRecentes, troque o operador que abre as consultas. Preserve abrirConsulta para emitir o carregamento e tratar o erro dentro de cada seleção.',
      criteria:['Com A em andamento e B selecionado depois, somente B pode preencher o detalhe.','A consulta anterior deixa de estar inscrita quando chega uma nova seleção.','Após BOL-999 devolver 404, selecionar BOL-101 funciona no mesmo fluxo.'],
      example:{language:'typescript',code:"const resultado = selecao$.pipe(\n  switchMap(codigo => consultar(codigo))\n);"},
      verify:verify('HNG-405','Alterne entre BOL-101 e BOL-102. Teste também BOL-999 seguido de BOL-101. A suíte simula a primeira resposta chegando por último.'),
      question:{
        prompt:'Onde tratar o erro HTTP para permitir uma nova seleção?',
        choices:['No fluxo externo inteiro, encerrando as próximas consultas.','No Observable interno da consulta daquele código.','Ignorando o erro e mantendo indefinidamente o estado de carregamento.'],
        answer:1,
        feedback:['O fluxo de seleção precisa continuar ativo mesmo se um código falhar.','O tratamento interno emite um estado de erro para aquela consulta e preserva as seleções futuras.','A pessoa precisa de um estado final e deve poder tentar outro código.']
      },httpLesson:'rastrear'
    },
    {
      id:'HNG-406',area:'estoque',title:'Uma falha transitória deixou o estoque em branco',level:'intermediario',minutes:25,
      description:'Configure uma nova tentativa limitada para o GET do estoque quando a conexão cai ou o servidor responde 503.',
      technologies:['angular','typescript'],file,
      prerequisites:['Distinguir GET de POST.','Inspecionar status em HttpErrorResponse.','Ler defer, pipe e uma função que retorna Observable.'],
      theory:[{label:'RxJS · retry',url:'https://rxjs.dev/api/operators/retry',description:'Veja como configurar o limite e a função que permite ou recusa outra tentativa.'},http],
      goal:'Complete consultarEstoque para repetir o GET uma única vez nos status 0 e 503. Propague a causa original nos demais erros. Preserve defer para criar a consulta a cada tentativa.',
      criteria:['503 seguido de sucesso exibe o inventário com duas tentativas.','Falha de rede também permite uma repetição.','503 persistente falha depois de duas tentativas e 400 ou 404 falha logo na primeira.'],
      example:{language:'typescript',code:"retry({\n  count: 1,\n  delay: (erro: unknown) => transitorio(erro) ? of(null) : throwError(() => erro)\n})"},
      verify:verify('HNG-406','Clique em Simular falha transitória e confira as duas tentativas no resultado.'),
      question:{
        prompt:'O 400 de uma consulta com parâmetros inválidos deve disparar outra tentativa automática?',
        choices:['Sim, até o servidor responder 200.','Sim, repetindo também os envios POST com o mesmo mecanismo.','O 400 deve chegar à interface logo na primeira tentativa.'],
        answer:2,
        feedback:['Repetir o mesmo parâmetro inválido não corrige a requisição.','Uma política de GET não deve ser aplicada automaticamente a gravações.','O código só reconsulta nas condições transitórias definidas pelo chamado.']
      }
    },
    {
      id:'HNG-407',area:'vigilancia',title:'A validação deixou o foco no botão',level:'essencial',minutes:25,
      description:'Ao receber erros de um rascunho interno, mova o foco para o primeiro campo inválido na ordem do formulário.',
      technologies:['angular','typescript'],file,
      prerequisites:['Ler um objeto de erros com chaves opcionais.','Identificar a ordem visual dos controles e a navegação por teclado.','Entender a diferença entre exibir erro e mover o foco.'],
      theory:[{label:'Angular · Acessibilidade',url:'https://angular.dev/best-practices/a11y',description:'Revise semântica, atributos ARIA e gerenciamento do foco.'},{label:'Angular · afterNextRender',url:'https://angular.dev/api/core/afterNextRender',description:'Veja quando o componente pode usar os elementos do formulário após renderizar os erros.'}],
      goal:'Implemente focarPrimeiroErro. Examine codigoComponente e descricao na ordem da tela. Chame focus uma vez no primeiro controle com mensagens. A chamada já é feita depois de renderizar aria-invalid e a descrição associada.',
      criteria:['Se os dois campos têm mensagens, o foco vai para o código mesmo que o servidor liste a descrição primeiro.','Se apenas a descrição tem erro, o foco vai para ela.','Sem mensagens, o foco permanece onde estava e o rascunho não é apagado.'],
      example:{language:'typescript',code:"const ordem = ['codigoComponente', 'descricao'] as const;\nconst primeiro = ordem.find(campo => campos[campo]?.length);"},
      verify:verify('HNG-407','No formulário da oficina, envie BOL-999 com uma descrição fictícia. Use o teclado e confira o foco e aria-invalid no campo Código.'),
      question:{
        prompt:'Qual ordem deve decidir qual controle recebe o foco?',
        choices:['A ordem dos campos no formulário.','A ordem em que as chaves chegaram no JSON.','A ordem alfabética do texto das mensagens.'],
        answer:0,
        feedback:['Assim a correção segue a ordem percebida por quem navega no formulário.','A serialização pode variar sem mudar a ordem visual.','A mensagem pode ser traduzida e não determina a posição do campo.']
      },httpLesson:'validar'
    },
    {
      id:'HNG-408',area:'vigilancia',title:'Dois disparos criaram dois rascunhos',level:'avancado',minutes:35,
      description:'Controle os disparos concorrentes de um POST para que o Angular não crie dois rascunhos durante o mesmo envio.',
      technologies:['angular','typescript'],file,
      prerequisites:['Distinguir concorrência de fila em fluxos RxJS.','Ler uma sequência de carregamento, sucesso e erro em TypeScript.','Inspecionar requisições POST na aba Rede.'],
      theory:[{label:'RxJS · exhaustMap',url:'https://rxjs.dev/api/operators/exhaustMap',description:'Veja como o operador ignora emissões durante um fluxo interno ativo e libera novas emissões após a conclusão.'},http],
      goal:'Em enviarRascunhos, use um operador que descarta disparos enquanto abrirEnvio estiver ativo. Conserve o tratamento de erro dentro do envio. Cada novo disparo depois de concluir deve poder iniciar um POST.',
      criteria:['Dois disparos enquanto o primeiro POST está pendente iniciam somente uma requisição.','Quando o primeiro envio termina, um novo disparo pode ser aceito.','Após receber 422, o texto permanece no formulário e um envio corrigido funciona.'],
      example:{language:'typescript',code:"const envio = disparos$.pipe(\n  exhaustMap(entrada => abrirEnvio(entrada, criar))\n);"},
      verify:verify('HNG-408','Use a rede lenta no DevTools, preencha BOL-101 e dispare o envio duas vezes durante a primeira requisição. Confira a quantidade de POSTs. A suíte garante que os dois eventos ocorram com o primeiro POST pendente.'),
      question:{
        prompt:'O que fazer com o segundo disparo enquanto o POST está em andamento?',
        choices:['Enfileirá-lo para gravar o mesmo rascunho assim que o primeiro terminar.','Ignorá-lo durante o envio atual e aceitar novos disparos depois.','Cancelar a inscrição anterior e assumir que a API desfez a gravação.'],
        answer:1,
        feedback:['A fila apenas adia a duplicação.','Essa regra controla disparos concorrentes nesta sessão do navegador.','Cancelar no cliente não garante que o servidor deixou de gravar.']
      },httpLesson:'ocorrencia'
    }
  ];
})();
