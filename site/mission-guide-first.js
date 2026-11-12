window.missionGuideFirst = {
  'WEB-101': {
    level:'essencial',
    prerequisites:['Ler uma URL e reconhecer caminho e parâmetros de consulta.', 'Montar uma string em JavaScript a partir do valor de um filtro.'],
    theory:[
      {label:'Chrome DevTools · Painel Network',url:'https://developer.chrome.com/docs/devtools/network/',description:'Veja como inspecionar a URL da requisição e comparar o que o navegador enviou com a resposta.'},
      {label:'MDN · encodeURIComponent()',url:'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent',description:'Confira como codificar somente o valor de um parâmetro que pode conter espaços e caracteres reservados.'}
    ]
  },
  'WEB-102': {
    level:'avancado',
    prerequisites:['Ler o resultado de uma requisição assíncrona e identificar erros.', 'Modelar os estados de carregamento, sucesso, vazio e erro da interface.', 'Entender que requisições simultâneas podem terminar fora da ordem de envio.'],
    theory:[
      {label:'React · Buscas assíncronas e condições de corrida',url:'https://react.dev/reference/react/useEffect#fetching-data-with-effects',description:'Observe como o exemplo ignora respostas antigas. O princípio de aceitar só a resposta ativa também vale fora do React.'},
      {label:'Chrome DevTools · Simulação de rede lenta',url:'https://developer.chrome.com/docs/devtools/network/',description:'Abra a seção de simulação de rede lenta para reproduzir mudanças de filtro que ocorrem antes da resposta.'}
    ]
  },
  'WEB-103': {
    level:'intermediario',
    prerequisites:['Ordenar objetos por data e comparar IDs em caso de empate.', 'Ler ORDER BY e entender como OFFSET/FETCH recorta uma página.', 'Reconhecer por que uma ordem sem desempate único pode repetir registros.'],
    theory:[{label:'Microsoft Learn · ORDER BY e paginação',url:'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-order-by-clause-transact-sql',description:'Leia a seção de OFFSET/FETCH e as condições de estabilidade de uma consulta paginada, incluindo ordem única e dados consistentes.'}]
  },
  'WEB-104': {
    level:'intermediario',
    prerequisites:['Filtrar objetos e somar valores inteiros em centavos com JavaScript.', 'Ler um teste de regressão comparando o valor esperado com o recebido.', 'Reconhecer o diff e os checks de um pull request.'],
    theory:[
      {label:'GitHub Actions · Integração contínua',url:'https://docs.github.com/en/actions/get-started/continuous-integration',description:'Entenda como a execução automatizada de testes ajuda a detectar regressões antes da integração.'},
      {label:'GitHub · Revisão de mudanças',url:'https://docs.github.com/en/get-started/start-your-journey/reviewing-your-proposed-changes',description:'Veja como comparar mudanças, solicitar revisão e registrar contexto no pull request.'}
    ]
  },
  'WEB-105': {
    level:'avancado',
    prerequisites:['Distinguir autenticação da autorização para acessar um pedido específico.', 'Comparar papéis e vínculos de empresa e filial usando dados da sessão no servidor.', 'Montar casos de teste em que só o ID do pedido ou a permissão muda.'],
    theory:[{label:'OWASP · Autorização por objeto em APIs',url:'https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/',description:'Leia os cenários em que alterar o ID acessa dados de outra pessoa e veja onde a API precisa verificar a permissão.'}]
  },
  'WEB-106': {
    level:'avancado',
    prerequisites:['Ler logs e reconhecer códigos HTTP da faixa 500–599.', 'Filtrar eventos de uma mesma requisição pelo identificador compartilhado.', 'Relatar impacto, evidências e próximos passos de um incidente.'],
    theory:[
      {label:'OpenTelemetry · Propagação de contexto',url:'https://opentelemetry.io/docs/concepts/context-propagation/',description:'Entenda como identificadores compartilhados permitem correlacionar sinais de uma operação entre serviços.'},
      {label:'RFC 9110 · Erros HTTP 5xx',url:'https://www.rfc-editor.org/rfc/rfc9110.html#name-server-error-5xx',description:'Compare falha interna, gateway inválido, serviço indisponível e tempo limite de gateway.'}
    ]
  },
  'WEB-107': {
    level:'essencial',
    prerequisites:['Ler os campos de um objeto JSON recebido pela API.', 'Validar tipo, intervalo de um inteiro e formato de uma string em JavaScript.', 'Distinguir uma criação bem-sucedida de um erro de conteúdo HTTP.'],
    theory:[{label:'MDN · HTTP 422 Unprocessable Content',url:'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/422',description:'Veja quando devolver 422 para um corpo bem formado que viola regras da API.'}]
  },
  'WEB-108': {
    level:'avancado',
    prerequisites:['Entender o que pode acontecer ao repetir um POST depois de um timeout.', 'Localizar um registro usando conta e chave como critérios conjuntos.', 'Comparar os parâmetros de duas operações antes de reaproveitar o resultado.'],
    theory:[{label:'Stripe · Requisições idempotentes',url:'https://docs.stripe.com/api/idempotent_requests',description:'Leia como uma chave reconhece uma tentativa repetida e por que mudar os parâmetros com a mesma chave gera erro.'}]
  },
  'WEB-109': {
    level:'intermediario',
    prerequisites:['Interpretar datas ISO 8601 com UTC e deslocamento de fuso.', 'Comparar instantes convertidos em milissegundos com Date.parse().', 'Aplicar intervalo com início incluído e fim excluído.'],
    theory:[
      {label:'MDN · Date.parse()',url:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse',description:'Compare os exemplos com Z e com deslocamento explícito para entender o instante representado.'},
      {label:'Microsoft Learn · AT TIME ZONE',url:'https://learn.microsoft.com/en-us/sql/t-sql/queries/at-time-zone-transact-sql?view=sql-server-ver17',description:'Veja como o SQL Server converte datas de um fuso para outro e trata mudanças de horário.'}
    ]
  },
  'WEB-110': {
    level:'avancado',
    prerequisites:['Ordenar IDs únicos e recortar uma lista pelo limite da página.', 'Entender a diferença entre posição por offset e continuação por chave.', 'Identificar o efeito de inserções e exclusões entre duas leituras.'],
    theory:[{label:'Microsoft Learn · Paginação por chave',url:'https://learn.microsoft.com/en-us/ef/core/querying/pagination#keyset-pagination',description:'Compare paginação por offset e por chave e observe o filtro exclusivo que retoma a partir da última linha vista.'}]
  },
  'WEB-111': {
    level:'avancado',
    prerequisites:['Reconhecer uma atualização perdida quando duas pessoas editam a mesma versão.', 'Ler ETag e If-Match em cabeçalhos HTTP.', 'Atualizar um campo e preservar as demais propriedades do pedido em JavaScript.'],
    theory:[
      {label:'RFC 9110 · If-Match',url:'https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1',description:'Veja como a precondição evita sobrescrever uma representação que já mudou.'},
      {label:'RFC 6585 · HTTP 428',url:'https://www.rfc-editor.org/rfc/rfc6585.html#section-3',description:'Confira o uso de 428 quando a API exige que a requisição inclua uma precondição.'}
    ]
  },
  'WEB-112': {
    level:'avancado',
    prerequisites:['Ler operações de atualização de estoque e inserção de uma reserva.', 'Distinguir COMMIT e ROLLBACK em uma transação SQL.', 'Preservar o estado original em JavaScript se uma das operações falhar.'],
    theory:[
      {label:'Microsoft Learn · BEGIN TRANSACTION',url:'https://learn.microsoft.com/en-us/sql/t-sql/language-elements/begin-transaction-transact-sql?view=sql-server-ver17',description:'Compare os exemplos de confirmar e desfazer alterações feitas dentro de uma transação.'},
      {label:'Microsoft Learn · SET XACT_ABORT',url:'https://learn.microsoft.com/en-us/sql/t-sql/statements/set-xact-abort-transact-sql?view=sql-server-ver17',description:'Veja como essa configuração afeta a transação diante de erros em tempo de execução.'}
    ]
  },
  'WEB-113': {
    level:'intermediario',
    prerequisites:['Ler um JOIN entre pedidos e itens e reconhecer a relação de um para muitos.', 'Identificar qual chave representa a unidade que deve ser somada.', 'Somar valores inteiros uma vez por pedido, mesmo com linhas repetidas.'],
    theory:[
      {label:'Microsoft Learn · Junções no SQL Server',url:'https://learn.microsoft.com/en-us/sql/relational-databases/performance/joins?view=sql-server-ver17',description:'Veja como a condição de junção combina linhas relacionadas e por que um pedido com vários itens aparece em várias linhas.'},
      {label:'Microsoft Learn · GROUP BY',url:'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql?view=sql-server-ver17',description:'Leia como uma consulta agrupa linhas pela chave antes de retornar agregados.'}
    ]
  },
  'WEB-114': {
    level:'intermediario',
    prerequisites:['Validar comprimento e conjunto de caracteres de uma string.', 'Reconhecer o tipo e o tamanho de uma coluna VARCHAR no SQL Server.', 'Distinguir o texto de uma consulta do valor enviado como parâmetro.'],
    theory:[{label:'Microsoft Learn · Parâmetros no SqlClient',url:'https://learn.microsoft.com/en-us/sql/connect/ado-net/configure-parameters?view=sql-server-ver17',description:'Veja como associar valores à consulta e especificar tipo e tamanho do parâmetro.'}]
  },
  'WEB-115': {
    level:'intermediario',
    prerequisites:['Reconhecer a marca de exclusão lógica nos registros exportados do DBF.', 'Limpar espaços nas bordas de strings sem alterar espaços internos.', 'Tratar identificadores como texto para preservar zeros à esquerda.'],
    theory:[
      {label:'Ajuda do Visual FoxPro 9 · DELETED()',url:'https://www.vfphelp.com/vfp9/_5WN12PQAP.htm',description:'Confira como consultar se um registro está marcado para exclusão.'},
      {label:'Ajuda do Visual FoxPro 9 · ALLTRIM()',url:'https://www.vfphelp.com/vfp9/_5WN12PPFD.htm',description:'Compare a remoção de caracteres nas bordas do Visual FoxPro com a limpeza aplicada durante a importação.'}
    ]
  },
  'WEB-116': {
    level:'intermediario',
    prerequisites:['Distinguir uma propriedade ausente de null e do número zero em JavaScript.', 'Montar a resposta JSON apenas com os campos do contrato.', 'Reconhecer quando renomear ou remover campos quebra clientes antigos.'],
    theory:[{label:'Google AIP-180 · Compatibilidade de APIs',url:'https://google.aip.dev/180',description:'Leia as regras para adicionar, remover ou renomear campos e preservar a compatibilidade com clientes existentes.'}]
  },
  'WEB-117': {
    level:'essencial',
    prerequisites:['Ler uma lista de erros de validação recebida da API.', 'Identificar quais nomes de campo correspondem aos controles do formulário.', 'Separar mensagens por campo dos avisos gerais.'],
    theory:[{label:'W3C WAI · Notificações em formulários',url:'https://www.w3.org/WAI/tutorials/forms/notifications/',description:'Compare o aviso geral com a indicação de erro junto ao campo e veja como orientar a correção.'}]
  },
  'WEB-118': {
    level:'intermediario',
    prerequisites:['Separar parâmetros da URL usando URLSearchParams.', 'Validar um número de página e aplicar valores padrão.', 'Entender como o histórico do navegador restaura a visualização anterior.'],
    theory:[
      {label:'MDN · URLSearchParams',url:'https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams',description:'Veja como ler a consulta de uma URL e tratar parâmetros que não foram informados.'},
      {label:'MDN · History API',url:'https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API',description:'Observe como pushState, replaceState e popstate ajudam a restaurar o estado de navegação.'}
    ]
  },
  'WEB-119': {
    level:'essencial',
    prerequisites:['Converter centavos inteiros em reais para exibição.', 'Distinguir valor nulo de zero em JavaScript.', 'Reconhecer localidade e moeda como opções de formatação.'],
    theory:[{label:'MDN · Intl.NumberFormat',url:'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat',description:'Consulte os exemplos de formatação de moeda e compare localidade, opção currency e unidade recebida.'}]
  },
  'WEB-120': {
    level:'intermediario',
    prerequisites:['Relacionar um campo HTML aos IDs de suas mensagens de ajuda e erro.', 'Distinguir o nome de um campo da descrição complementar.', 'Representar se um valor está inválido com um atributo ARIA.'],
    theory:[{label:'W3C WAI · aria-invalid e descrição do erro',url:'https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21',description:'Observe como aria-invalid indica o problema e como aria-describedby liga o campo à mensagem de correção.'}]
  },
  'WEB-121': {
    level:'intermediario',
    prerequisites:['Identificar o controle que abriu o diálogo e os controles ainda presentes na página.', 'Entender como Tab e Escape afetam o foco de um diálogo modal.', 'Escolher um próximo destino de foco quando o controle original deixa de existir.'],
    theory:[{label:'W3C APG · Padrão de diálogo modal',url:'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',description:'Leia a seção sobre teclado, incluindo o retorno ao acionador ou a um elemento coerente com o fluxo.'}]
  },
  'WEB-122': {
    level:'essencial',
    prerequisites:['Reconhecer mensagens de sucesso e avisos que exigem atenção imediata.', 'Entender como uma região viva anuncia atualizações sem mover o foco.'],
    theory:[{label:'W3C WAI · Mensagens de status',url:'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',description:'Compare as técnicas de anúncio para confirmações de rotina e para erros que pedem atenção.'}]
  },
  'WEB-123': {
    level:'intermediario',
    prerequisites:['Escrever um comparador numérico para sort() e trabalhar sobre uma cópia da lista.', 'Preservar a ordem dos registros empatados.', 'Expressar a direção de ordenação da coluna com aria-sort.'],
    theory:[
      {label:'MDN · Array.prototype.sort()',url:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort',description:'Veja por que a ordenação padrão compara texto, como fornecer um comparador e o que significa ordem estável.'},
      {label:'W3C APG · Tabela com ordenação',url:'https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/',description:'Observe como indicar a coluna e a direção selecionadas com aria-sort no cabeçalho.'}
    ]
  }
};
