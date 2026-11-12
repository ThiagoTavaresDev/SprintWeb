window.missionGuideSecond = {
  'WEB-124': {
    level: 'intermediario',
    prerequisites: ['Distinguir GET de métodos que alteram dados.', 'Interpretar HTTP 429, 503 e o cabeçalho Retry-After.', 'Contar tentativas e calcular intervalos em segundos.'],
    theory: [
      {label:'IETF · Retry-After',url:'https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3',description:'Leia como o servidor indica quanto esperar e quais formatos o cabeçalho aceita.'},
      {label:'IETF · Métodos idempotentes',url:'https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2',description:'Veja por que repetir automaticamente uma operação exige conhecer o efeito do método.'}
    ]
  },
  'WEB-125': {
    level: 'essencial',
    prerequisites: ['Ler nome, tamanho em bytes e tipo MIME de um objeto File.', 'Comparar extensões sem diferenciar maiúsculas de minúsculas.', 'Ordenar regras de validação antes do upload.'],
    theory: [
      {label:'W3C · Interface File',url:'https://www.w3.org/TR/FileAPI/#file-section',description:'Confira de onde vêm o nome e os metadados do arquivo selecionado.'},
      {label:'WHATWG · Atributo accept',url:'https://html.spec.whatwg.org/multipage/input.html#attr-input-accept',description:'Veja como sugerir tipos ao seletor de arquivos. A validação do upload continua sendo responsabilidade da aplicação.'}
    ]
  },
  'WEB-126': {
    level: 'essencial',
    prerequisites: ['Usar comparação estrita de booleanos em JavaScript.', 'Entender a escolha entre uma variante estável e uma beta.'],
    theory: [
      {label:'OpenFeature · Avaliação de feature flags',url:'https://openfeature.dev/specification/sections/flag-evaluation/',description:'Veja como avaliar uma flag booleana com valor padrão em caso de erro.'}
    ]
  },
  'WEB-127': {
    level: 'intermediario',
    prerequisites: ['Identificar os arquivos alterados em um PR.', 'Relacionar diretórios do projeto aos checks de CI.', 'Entender por que mudanças no lockfile afetam mais de uma camada.'],
    theory: [
      {label:'GitHub · Checks obrigatórios e filtros de workflow',url:'https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks',description:'Leia como filtros por caminho podem impedir um check obrigatório de concluir e bloquear o merge.'}
    ]
  },
  'WEB-128': {
    level: 'essencial',
    prerequisites: ['Comparar timestamps em milissegundos.', 'Testar um caso imediatamente antes e outro no instante exato da expiração.'],
    theory: [
      {label:'Node.js · Simular Date em testes',url:'https://nodejs.org/api/test.html#dates',description:'Veja como controlar o relógio de um teste para reproduzir a expiração sem depender da hora real.'}
    ]
  },
  'WEB-129': {
    level: 'intermediario',
    prerequisites: ['Ler status e corpo de uma resposta HTTP.', 'Distinguir mock local de teste de contrato.', 'Validar campos, tipos e códigos de erro de uma integração.'],
    theory: [
      {label:'Pact · Como funciona um teste de contrato',url:'https://docs.pact.io/getting_started/how_pact_works',description:'Acompanhe como a expectativa do consumidor vira uma interação verificada contra o provedor.'}
    ]
  },
  'WEB-130': {
    level: 'intermediario',
    prerequisites: ['Ler as alterações de duas branches no diff.', 'Reconhecer os marcadores de conflito do Git.', 'Combinar regras das duas mudanças e testar os casos afetados.'],
    theory: [
      {label:'GitHub · Resolver conflitos pelo terminal',url:'https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line',description:'Veja como interpretar os lados do conflito, editar o resultado e registrar a resolução.'}
    ]
  },
  'WEB-131': {
    level: 'essencial',
    prerequisites: ['Identificar o que faz parte da API pública de um SDK.', 'Distinguir correção, recurso compatível e mudança incompatível.'],
    theory: [
      {label:'SemVer · Especificação em português',url:'https://semver.org/lang/pt-BR/',description:'Leia quando incrementar MAJOR, MINOR ou PATCH conforme a compatibilidade das mudanças.'}
    ]
  },
  'WEB-132': {
    level: 'essencial',
    prerequisites: ['Distinguir épico, item de trabalho e subtarefa no Jira.', 'Traduzir um pedido amplo em critérios de aceite verificáveis.', 'Extrair somente os campos exigidos de uma lista de objetos.'],
    theory: [
      {label:'Atlassian · Criar itens e subtarefas no Jira',url:'https://support.atlassian.com/jira-software-cloud/docs/create-a-work-item-and-a-subtask/',description:'Confira como dividir o trabalho em partes menores ligadas ao item principal.'}
    ]
  },
  'WEB-133': {
    level: 'intermediario',
    prerequisites: ['Responder em uma thread e recuperar o link de uma mensagem.', 'Separar relato, passos de reprodução e impacto no cliente.', 'Priorizar um bloqueio de checkout segundo um critério de escalonamento.'],
    theory: [
      {label:'Slack · Organizar discussões em threads',url:'https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions',description:'Veja como responder na conversa original e manter o contexto útil para quem assume o atendimento.'}
    ]
  },
  'WEB-134': {
    level: 'avancado',
    prerequisites: ['Distinguir campos úteis ao diagnóstico de credenciais e dados pessoais.', 'Selecionar propriedades próprias permitidas de um objeto.', 'Preservar valores válidos como zero ao montar um log estruturado.'],
    theory: [
      {label:'OWASP · Dados a excluir de logs',url:'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#data-to-exclude',description:'Identifique o que pode ser registrado para investigação e o que deve ser excluído ou mascarado.'}
    ]
  },
  'WEB-135': {
    level: 'avancado',
    prerequisites: ['Distinguir processo em execução de processo apto a receber tráfego.', 'Identificar dependências essenciais e opcionais.', 'Interpretar 200 e 503 em endpoints de saúde.'],
    theory: [
      {label:'Kubernetes · Sondas de liveness e readiness',url:'https://kubernetes.io/docs/concepts/workloads/pods/probes/',description:'Compare quando uma falha reinicia o contêiner e quando apenas retira a instância do tráfego.'}
    ]
  },
  'WEB-136': {
    level: 'avancado',
    prerequisites: ['Entender como uma versão canário recebe parte do tráfego.', 'Calcular taxa de erro e reconhecer amostras pequenas.', 'Distinguir pausar, promover e reverter uma publicação.'],
    theory: [
      {label:'Argo Rollouts · Análise de versões canário',url:'https://argo-rollouts.readthedocs.io/en/stable/features/analysis/',description:'Veja como métricas e resultados de análise orientam o avanço ou a interrupção de uma publicação.'}
    ]
  },
  'WEB-137': {
    level: 'avancado',
    prerequisites: ['Entender a diferença entre verificar a assinatura e verificar a idade de um webhook.', 'Comparar timestamps Unix em segundos com uma tolerância.', 'Distinguir replay de uma nova tentativa legítima do provedor.'],
    theory: [
      {label:'Stripe · Proteção contra replay de webhooks',url:'https://docs.stripe.com/webhooks#preventing-replay-attacks',description:'Leia como a assinatura protege o timestamp e como a tolerância limita a reutilização de mensagens antigas.'}
    ]
  },
  'WEB-138': {
    level: 'intermediario',
    prerequisites: ['Entender uma cota por janela fixa e o momento em que ela reinicia.', 'Calcular o tempo restante em segundos.', 'Distinguir uma resposta aceita de HTTP 429.'],
    theory: [
      {label:'IETF · HTTP 429 Too Many Requests',url:'https://www.rfc-editor.org/rfc/rfc6585.html#section-4',description:'Veja como comunicar uma cota excedida e informar quando tentar novamente.'}
    ]
  },
  'WEB-139': {
    level: 'avancado',
    prerequisites: ['Identificar uma origem pelo esquema, host e porta.', 'Ler o cabeçalho Origin de uma requisição.', 'Entender como o navegador usa Access-Control-Allow-Origin.'],
    theory: [
      {label:'WHATWG · Protocolo CORS',url:'https://fetch.spec.whatwg.org/#http-cors-protocol',description:'Leia como o navegador avalia o cabeçalho da resposta e quando uma origem precisa ser explícita.'}
    ]
  },
  'WEB-140': {
    level: 'avancado',
    prerequisites: ['Ler origin, username e password com o construtor URL.', 'Distinguir origem completa de uma simples ocorrência do nome do domínio.', 'Definir o que fazer quando uma URL é inválida.'],
    theory: [
      {label:'WHATWG · Interface URL',url:'https://url.spec.whatwg.org/#url-class',description:'Confira como o navegador analisa uma URL e expõe sua origem e credenciais.'},
      {label:'OWASP · Prevenção de XSS',url:'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',description:'Consulte os cuidados com URLs não confiáveis usadas em links da interface.'}
    ]
  },
  'WEB-141': {
    level: 'avancado',
    prerequisites: ['Entender como o navegador envia cookies de sessão em requisições.', 'Distinguir operações de leitura de operações que alteram estado.', 'Conhecer o propósito de um token CSRF e da checagem de origem.'],
    theory: [
      {label:'OWASP · Prevenção de CSRF',url:'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',description:'Compare a proteção por token com a verificação de origem em ações autenticadas.'}
    ]
  },
  'WEB-142': {
    level: 'avancado',
    prerequisites: ['Distinguir conteúdo público versionado de conteúdo privado.', 'Entender cache no navegador e cache compartilhado.', 'Interpretar no-store, public, max-age e immutable.'],
    theory: [
      {label:'IETF · Diretivas Cache-Control na resposta',url:'https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2',description:'Leia o que no-store impede e como public e max-age afetam o armazenamento e a validade.'},
      {label:'IETF · Respostas HTTP imutáveis',url:'https://datatracker.ietf.org/doc/html/rfc8246',description:'Veja por que immutable é adequado para arquivos cujo endereço muda a cada versão.'}
    ]
  },
  'WEB-143': {
    level: 'essencial',
    prerequisites: ['Mapear códigos de uma API externa para estados internos.', 'Comparar códigos textuais exatamente.', 'Definir um estado seguro para valores desconhecidos.'],
    theory: [
      {label:'Shopify · Estados de um evento de entrega',url:'https://shopify.dev/docs/api/admin-graphql/latest/enums/FulfillmentEventStatus',description:'Leia um exemplo real de estados publicados por uma integração de expedição.'}
    ]
  },
  'WEB-144': {
    level: 'avancado',
    prerequisites: ['Montar objetos de resposta com campos explicitamente escolhidos.', 'Tratar objetos aninhados ausentes sem quebrar o contrato JSON.', 'Distinguir acesso ao pedido de acesso a cada uma de suas propriedades.'],
    theory: [
      {label:'OWASP · Autorização no nível das propriedades',url:'https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/',description:'Leia por que uma resposta deve expor apenas os campos necessários e autorizados.'}
    ]
  },
  'WEB-145': {
    level: 'intermediario',
    prerequisites: ['Distinguir delimitador, campo e quebra de linha em CSV.', 'Escapar aspas em textos e preservar quebras de linha no valor.', 'Transformar uma lista de campos em uma linha de saída.'],
    theory: [
      {label:'IETF · Formato de arquivos CSV',url:'https://www.rfc-editor.org/rfc/rfc4180.html#section-2',description:'Leia as regras para campos com vírgulas, aspas e quebras de linha.'},
      {label:'OWASP · Injeção em CSV',url:'https://owasp.org/www-community/attacks/CSV_Injection',description:'Entenda o risco adicional de dados do usuário interpretados como fórmulas em planilhas.'}
    ]
  },
  'WEB-146': {
    level: 'avancado',
    prerequisites: ['Calcular taxa de falha a partir de eventos e volume.', 'Reconhecer quando pouco tráfego distorce uma porcentagem.', 'Entender o papel de limites e janelas ao acionar o plantão.'],
    theory: [
      {label:'Google SRE · Alertas orientados a SLOs',url:'https://sre.google/workbook/alerting-on-slos/',description:'Leia como equilibrar sensibilidade e ruído de alertas, inclusive em serviços com pouco tráfego.'}
    ]
  },
  'FS-201': {
    level: 'intermediario',
    prerequisites: ['Ler parâmetros de query e distinguir HTTP 200 de 400.', 'Filtrar listas em JavaScript e entender parâmetros em consultas SQL.', 'Representar na interface resultados, estado vazio e erro.'],
    theory: [
      {label:'Microsoft Learn · Parâmetros em consultas SQL Server',url:'https://learn.microsoft.com/en-us/sql/connect/ado-net/configure-parameters',description:'Veja como separar a consulta do valor recebido no filtro.'},
      {label:'IETF · Códigos de resposta HTTP',url:'https://www.rfc-editor.org/rfc/rfc9110.html#name-status-codes',description:'Compare 200 e 400 antes de decidir qual estado a tela deve mostrar.'}
    ]
  },
  'FS-202': {
    level: 'avancado',
    prerequisites: ['Validar um número de página vindo da URL.', 'Ordenar por data e ID para desempatar antes de recortar.', 'Interpretar metadados de paginação e sinalizar a última página ou uma página vazia.'],
    theory: [
      {label:'Microsoft Learn · ORDER BY com OFFSET e FETCH',url:'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-order-by-clause-transact-sql',description:'Leia as condições para obter páginas estáveis e o papel de uma ordenação única.'},
      {label:'GitHub · Paginação em uma API REST',url:'https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api',description:'Veja um exemplo real de como a API indica se existe uma próxima página para o cliente.'}
    ]
  },
  'FS-203': {
    level: 'avancado',
    prerequisites: ['Distinguir sessão autenticada de autorização para consultar um pedido.', 'Raciocinar sobre empresa, filial e papel sem confiar no ID enviado.', 'Tratar respostas 401 e 404 sem expor dados do pedido.'],
    theory: [
      {label:'OWASP · Autorização por objeto em APIs',url:'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/',description:'Entenda por que o servidor precisa conferir o acesso para cada ID solicitado.'},
      {label:'IETF · Respostas de erro do cliente',url:'https://www.rfc-editor.org/rfc/rfc9110.html#name-client-error-4xx',description:'Compare o significado de 401 e 404, inclusive o uso de 404 para ocultar a existência de um recurso.'}
    ]
  },
  'FS-204': {
    level: 'intermediario',
    prerequisites: ['Validar limites numéricos e o formato textual do CEP no backend.', 'Distinguir 201 de 422 e ler o corpo da resposta.', 'Relacionar os erros devolvidos aos campos correspondentes do formulário.'],
    theory: [
      {label:'IETF · HTTP 422 Unprocessable Content',url:'https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21',description:'Leia quando o servidor entende o conteúdo mas não consegue processar a instrução.'},
      {label:'W3C · Identificação de erros no formulário',url:'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html',description:'Veja como identificar o campo com problema e descrever em texto o que precisa de correção.'}
    ]
  },
  'FS-205': {
    level: 'intermediario',
    prerequisites: ['Trabalhar com valores inteiros em centavos e aplicar arredondamento.', 'Validar vigência e saldo de uso de um cupom no servidor.', 'Interpretar códigos de erro e mostrar uma orientação para cada caso na tela.'],
    theory: [
      {label:'Stripe · Limites de uso de cupons',url:'https://docs.stripe.com/billing/subscriptions/coupons#redemption-limits',description:'Veja como a expiração e o número de utilizações afetam cupons e códigos promocionais.'},
      {label:'Stripe · Valores em unidades monetárias mínimas',url:'https://docs.stripe.com/currencies#minor-units',description:'Confira como APIs de pagamento representam valores inteiros sem depender de números fracionários.'}
    ]
  },
  'FS-206': {
    level: 'avancado',
    prerequisites: ['Interpretar uma atualização parcial e distinguir HTTP 409 de 422.', 'Validar o estado do pedido e a disponibilidade no momento da alteração.', 'Traduzir conflitos em próximos passos claros para a interface.'],
    theory: [
      {label:'IETF · Erros em requisições PATCH',url:'https://www.rfc-editor.org/rfc/rfc5789.html#section-2.2',description:'Compare conflitos com o estado atual do recurso e entradas que não podem ser processadas.'},
      {label:'Microsoft Learn · Transações no SQL Server',url:'https://learn.microsoft.com/en-us/sql/t-sql/language-elements/transactions-transact-sql',description:'Entenda a fronteira da transação que protege a alteração quando vários usuários concorrem pela mesma vaga.'}
    ]
  },
  'FS-207': {
    level: 'intermediario',
    prerequisites: ['Distinguir o status HTTP do estado interno de um processamento assíncrono.', 'Consultar um recurso de acompanhamento pelo ID da exportação.', 'Mostrar espera, falha ou disponibilidade do arquivo conforme a resposta.'],
    theory: [
      {label:'Microsoft Learn · Requisição e resposta assíncronas',url:'https://learn.microsoft.com/en-us/azure/architecture/patterns/asynchronous-request-reply',description:'Veja como a interface consulta o estado de uma tarefa sem manter aberta a requisição original.'},
      {label:'IETF · HTTP 404 Not Found',url:'https://www.rfc-editor.org/rfc/rfc9110.html#name-404-not-found',description:'Distinga uma exportação ausente de uma exportação existente que ainda está em processamento.'}
    ]
  },
  'FS-208': {
    level: 'intermediario',
    prerequisites: ['Remover IDs duplicados mantendo a ordem de entrada.', 'Separar resultados válidos de bloqueios com motivo por pedido.', 'Representar na tela lotes prontos, mistos ou sem itens elegíveis.'],
    theory: [
      {label:'MDN · Set em JavaScript',url:'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Set',description:'Leia como Set preserva a ordem de inserção e guarda cada valor uma única vez.'},
      {label:'IETF · Semântica da resposta HTTP 200',url:'https://www.rfc-editor.org/rfc/rfc9110.html#name-200-ok',description:'Separe o sucesso da consulta de prévia da elegibilidade de cada pedido no corpo da resposta.'}
    ]
  }
};
