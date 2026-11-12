(() => {
  const pergunta = (prompt, answer, ...alternativas) => ({
    prompt,
    answer,
    choices: alternativas.map(([opcao]) => opcao),
    feedback: alternativas.map(([, explicacao]) => explicacao)
  });
  const teste = (label, args, expected) => ({ label, args, expected });
  const fonte = (label, url) => ({ label, url });
  const exemplo = (label, text) => ({ label, text });
  const formularios = fonte('W3C WAI · Avisos em formulários', 'https://www.w3.org/WAI/tutorials/forms/notifications/');

  window.frontendMissions = [
    {
      id: 'WEB-117', category: 'Formulários', title: 'Cadê o erro do CEP?',
      description: 'Transforme a resposta da API em erros por campo e preserve os dados preenchidos.',
      minutes: 14, icon: 'layers', theme: 'violet', skills: ['Formulários', 'Validação', 'API'],
      story: {
        person: 'Bia', role: 'Suporte',
        message: 'O formulário do endereço dá um aviso genérico quando o CEP é inválido. A API já informa o campo e o motivo. Quem usa a tela acaba tentando preencher tudo de novo.',
        criteria: ['Mostrar erros conhecidos no campo correspondente.', 'Exibir erros desconhecidos em um aviso geral.', 'Preservar os valores já preenchidos durante a correção.'],
        evidence: { label: 'DevTools · Resposta do cadastro', code: 'HTTP 422\n{"erros":[{"campo":"cep","mensagem":"Informe 8 dígitos."}]}\n\nNa interface: “Falha ao salvar.”' },
        question: pergunta('O que resolve a dúvida de quem está preenchendo o formulário?', 1,
          ['Recarregar a página após qualquer 422.', 'Recarregar pode apagar dados e não aponta o campo incorreto.'],
          ['Mostrar a orientação junto do CEP e manter o restante do formulário.', 'A pessoa sabe o que corrigir e aproveita o que já preencheu.'],
          ['Trocar a mensagem por “Erro 422”.', 'O status ajuda a diagnosticar a API. Na interface, explique como corrigir o dado.'])
      },
      lab: {
        goal: 'Edite mapearErros(erros). Retorne { campos, gerais }. Guarde a primeira mensagem de cada campo conhecido (cep ou numero). Mensagens de outros campos entram em gerais na ordem recebida.',
        functionName: 'mapearErros',
        starter: `function mapearErros(erros) {
  return { campos: {}, gerais: erros.map(erro => erro.mensagem) };
}`,
        answer: `function mapearErros(erros) {
  const campos = {};
  const gerais = [];
  for (const { campo, mensagem } of erros) {
    if (campo === 'cep' || campo === 'numero') {
      if (!Object.hasOwn(campos, campo)) campos[campo] = mensagem;
    } else {
      gerais.push(mensagem);
    }
  }
  return { campos, gerais };
}`,
        hints: ['Comece com campos como objeto vazio e gerais como lista vazia.', 'Separe campos conhecidos dos demais. Verifique se o campo já tem mensagem antes de gravar.'],
        tests: [
          teste('Sem erros', [[]], { campos: {}, gerais: [] }),
          teste('Erro ao lado do CEP', [[{ campo: 'cep', mensagem: 'Informe 8 dígitos.' }]], { campos: { cep: 'Informe 8 dígitos.' }, gerais: [] }),
          teste('Erro geral e campo conhecido', [[{ campo: 'entrega', mensagem: 'Área sem cobertura.' }, { campo: 'numero', mensagem: 'Informe o número.' }]], { campos: { numero: 'Informe o número.' }, gerais: ['Área sem cobertura.'] }),
          teste('Conserva a primeira mensagem do campo', [[{ campo: 'cep', mensagem: 'CEP obrigatório.' }, { campo: 'cep', mensagem: 'CEP inválido.' }]], { campos: { cep: 'CEP obrigatório.' }, gerais: [] })
        ],
        note: 'O laboratório prepara as mensagens. No componente, renderize-as como texto e associe o erro ao campo correspondente.'
      },
      delivery: {
        ...pergunta('Qual evidência você inclui no PR?', 0,
          ['Mostro a resposta 422, o erro ao lado do CEP e os demais dados preservados.', 'A evidência conecta resposta, interface e experiência de correção.'],
          ['Mostro apenas que um endereço válido foi salvo.', 'Esse caso pode continuar verde mesmo quando os erros da API são mal apresentados.'],
          ['Mostro que todas as respostas têm aviso genérico.', 'O teste precisa verificar o direcionamento do erro por campo.']),
        artifact: exemplo('Comentário no Jira', 'WEB-117 · O erro da API agora aparece junto ao campo conhecido. Conferi CEP inválido, mensagens repetidas e aviso geral. Em revisão, vale conferir também se os dados preenchidos permanecem na tela.')
      },
      recall: [
        pergunta('A API devolveu campo entrega, que a tela não renderiza. Onde aparece a mensagem?', 2,
          ['Junto ao CEP.', 'Associar uma mensagem ao campo errado induz a uma correção incorreta.'],
          ['Em nenhum lugar.', 'O usuário perderia uma informação relevante.'],
          ['Na área de avisos gerais.', 'A mensagem continua disponível mesmo sem um campo correspondente.']),
        pergunta('Depois do 422, qual teste manual detecta perda de estado?', 1,
          ['Enviar um formulário vazio e sair da página.', 'O teste precisa de dados válidos e inválidos ao mesmo tempo.'],
          ['Preencher vários campos, errar só o CEP e conferir se os outros valores continuam na tela.', 'Isso cobre a tentativa de corrigir o formulário sem refazer o trabalho.'],
          ['Verificar apenas o status no Network.', 'O Network mostra a resposta. Os valores preservados são comportamento da interface.']),
        pergunta('A API enviou duas mensagens para o mesmo campo. Qual contrato o portal usa?', 0,
          ['Exibe a primeira mensagem daquele campo.', 'Assim o campo apresenta uma orientação por vez, na prioridade enviada.'],
          ['Sobrescreve sempre com a última.', 'Isso perde a prioridade definida neste ticket.'],
          ['Coloca a segunda em outro campo.', 'O campo de destino deve corresponder à mensagem.'])
      ],
      refs: [formularios]
    },
    {
      id: 'WEB-118', category: 'Navegação web', title: 'O link que abre outra tela',
      description: 'Faça um link compartilhado restaurar a apresentação e a página escolhidas.',
      minutes: 13, icon: 'layers', theme: 'blue', skills: ['URLSearchParams', 'History API', 'Links'],
      story: {
        person: 'Gabi', role: 'Operações',
        message: 'Compartilhei a página 4 em modo grade com um colega. O link abriu página 1 em lista. Voltar no navegador também não restaura minha visão.',
        criteria: ['Ler a apresentação e a página da query string.', 'Usar lista e página 1 como padrões para valores inválidos.', 'Usar a URL atual ao abrir um link ou voltar na navegação.'],
        evidence: { label: 'Reprodução · Link compartilhado', code: '/pedidos?modo=grade&pagina=4\nEsperado: grade, página 4\nRecebido: lista, página 1' },
        question: pergunta('Qual é a fonte de estado da apresentação ao abrir um link compartilhado?', 2,
          ['O cache da máquina que gerou o link.', 'O destinatário pode abrir em outro navegador ou dispositivo.'],
          ['O valor inicial fixo do componente.', 'Use os padrões apenas quando a URL não trouxer uma seleção válida.'],
          ['Os parâmetros da URL que o destinatário abriu.', 'A URL transporta a mesma seleção para outros navegadores.'])
      },
      lab: {
        goal: 'Implemente lerVisao(query). Aceite modo grade ou lista, com lista como padrão. pagina aceita somente uma sequência de dígitos representando um inteiro de 1 a 100. Valores inválidos viram 1. Retorne { modo, pagina }.',
        functionName: 'lerVisao',
        starter: `function lerVisao(query) {
  return { modo: 'lista', pagina: 1 };
}`,
        answer: `function lerVisao(query) {
  const params = new URLSearchParams(query);
  const modo = params.get('modo') === 'grade' ? 'grade' : 'lista';
  const texto = params.get('pagina') ?? '';
  const numero = /^\\d+$/.test(texto) ? Number(texto) : 0;
  const pagina = numero >= 1 && numero <= 100 ? numero : 1;
  return { modo, pagina };
}`,
        hints: ['Passe a query string para URLSearchParams e leia os campos com get.', 'Confira se o texto da página contém apenas dígitos antes de converter.'],
        tests: [
          teste('Link sem escolhas', [''], { modo: 'lista', pagina: 1 }),
          teste('Link compartilhado da grade', ['?modo=grade&pagina=4'], { modo: 'grade', pagina: 4 }),
          teste('Modo desconhecido preserva página válida', ['?modo=mapa&pagina=100'], { modo: 'lista', pagina: 100 }),
          teste('Página fora da faixa', ['?modo=grade&pagina=101'], { modo: 'grade', pagina: 1 }),
          teste('Página decimal é inválida', ['?pagina=2.5'], { modo: 'lista', pagina: 1 })
        ],
        note: 'O teste roda sem DOM. No portal, leia location.search na abertura e no evento popstate para restaurar a visão ao usar Voltar ou Avançar.'
      },
      delivery: {
        ...pergunta('Que sequência de QA cobre o chamado?', 1,
          ['Clicar duas vezes no modo grade na mesma página.', 'Isso pode funcionar mesmo se a URL e o histórico estiverem desconectados.'],
          ['Abrir o link em outra aba, trocar a visão e usar Voltar para verificar a restauração.', 'Assim se testam a abertura por link e a restauração na navegação.'],
          ['Ver se os controles foram estilizados corretamente.', 'A aparência dos controles não confirma a leitura da URL.']),
        artifact: exemplo('Roteiro para QA', 'WEB-118 · Abra /pedidos?modo=grade&pagina=4 em outra aba. Confira grade e página 4. Troque a visualização e use Voltar para verificar a restauração. Teste também modo desconhecido e página inválida.')
      },
      recall: [
        pergunta('Qual evento ajuda a ler a URL quando a pessoa usa Voltar?', 1,
          ['submit.', 'Esse evento pertence ao envio de um formulário.'],
          ['popstate.', 'O evento sinaliza mudanças relevantes na entrada ativa do histórico.'],
          ['mousemove.', 'Movimento do mouse não informa navegação no histórico.']),
        pergunta('Um link traz ?modo=grade&pagina=-4. O que o portal deve abrir?', 2,
          ['Lista, página 1.', 'O modo válido é independente da página inválida.'],
          ['Grade, página -4.', 'A faixa de páginas começa em 1.'],
          ['Grade, página 1.', 'Preservamos o modo válido e aplicamos o padrão à página inválida.']),
        pergunta('Por que testar o link em outra aba?', 0,
          ['Isso confirma que a URL basta para restaurar a visão.', 'O cenário cobre o acesso sem depender do estado da aba original.'],
          ['Isso substitui o teste de Voltar.', 'Abrir o link e restaurar uma entrada do histórico são dois fluxos diferentes.'],
          ['Isso limpa o banco de pedidos.', 'Abrir outra aba não altera os dados do servidor.'])
      ],
      refs: [
        fonte('WHATWG · URLSearchParams', 'https://url.spec.whatwg.org/#interface-urlsearchparams'),
        fonte('WHATWG · History', 'https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-history-interface')
      ]
    },
    {
      id: 'WEB-119', category: 'Internacionalização', title: 'O preço saiu cem vezes maior',
      description: 'Formate valores em centavos sem alterar os dados usados para cálculo.',
      minutes: 11, icon: 'layers', theme: 'mint', skills: ['Intl.NumberFormat', 'Moeda', 'Formatação'],
      story: {
        person: 'Clara', role: 'Financeiro',
        message: 'Depois da troca do componente, o resumo mostrou R$ 125.099,00 para um pedido de R$ 1.250,99. Os totais no banco continuam certos.',
        criteria: ['Interpretar o inteiro recebido como centavos.', 'Mostrar moeda BRL no formato pt-BR.', 'Diferenciar zero de valor indisponível.'],
        evidence: { label: 'DevTools · Dados e apresentação', code: 'API: {"valorCentavos":125099}\nEsperado: R$ 1.250,99\nRenderizado: R$ 125.099,00' },
        question: pergunta('Em que camada você ajusta esse dado para corrigir a tela?', 0,
          ['No formatador da apresentação, mantendo o contrato em centavos.', 'A tela converte o valor para reais e o exibe em pt-BR.'],
          ['No armazenamento de todos os pedidos.', 'Os dados persistidos estão certos e o contrato da API usa centavos.'],
          ['Na soma dos subtotais, dividindo a cada operação.', 'O sintoma está na apresentação. Conservar centavos inteiros facilita cálculos consistentes.'])
      },
      lab: {
        goal: 'Edite formatarReais(centavos). Receba um inteiro ou null. Divida por 100 e use Intl.NumberFormat com pt-BR e moeda BRL. Retorne “—” para null. Para o teste, troque espaços não separáveis do formato por espaço comum.',
        functionName: 'formatarReais',
        starter: `function formatarReais(centavos) {
  const reais = (centavos / 100).toFixed(2).replace('.', ',');
  return 'R$ ' + reais;
}`,
        answer: `function formatarReais(centavos) {
  if (centavos === null) return '—';
  const formato = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  return formato.format(centavos / 100).replace(/\\s+/g, ' ');
}`,
        hints: ['Retorne cedo para null, para evitar que a divisão o converta em zero.', 'Intl.NumberFormat recebe o locale e as opções style e currency.'],
        tests: [
          teste('Pedido simples', [2990], 'R$ 29,90'),
          teste('Mostra o agrupamento de milhares', [125099], 'R$ 1.250,99'),
          teste('Crédito com sinal', [-2500], '-R$ 25,00'),
          teste('Pedido de valor zero', [0], 'R$ 0,00'),
          teste('Valor indisponível', [null], '—')
        ]
      },
      delivery: {
        ...pergunta('Qual exemplo demonstra o impacto financeiro com precisão?', 2,
          ['“Ajustei números que pareciam grandes.”', 'Inclua a unidade de entrada e a apresentação esperada.'],
          ['“Os dados foram convertidos no banco.”', 'A correção está no componente de apresentação.'],
          ['“125099 centavos agora aparece como R$ 1.250,99. Zero e valor ausente têm exibições diferentes.”', 'A mensagem registra a unidade, o formato e dois casos que podem ser confundidos.']),
        artifact: exemplo('Resumo da correção para Financeiro', 'WEB-119 · O resumo continua recebendo valores em centavos e converte somente na exibição. Conferi R$ 1.250,99, R$ 0,00, crédito negativo e valor indisponível.')
      },
      recall: [
        pergunta('Qual inteiro a API envia para um pedido de R$ 10,05?', 1,
          ['10.', 'O valor perderia os cinco centavos.'],
          ['1005.', 'Dez reais equivalem a mil centavos, mais cinco.'],
          ['10050.', 'Esse valor representa R$ 100,50.']),
        pergunta('O valor ausente deve aparecer como zero?', 0,
          ['Use o símbolo de indisponível definido no produto.', 'Zero é um valor conhecido e tem apresentação própria.'],
          ['Use R$ 0,00 em ambos os casos.', 'Isso comunica que existe um valor numérico quando o dado está ausente.'],
          ['Exiba a palavra undefined.', 'Um marcador de produto comunica melhor a ausência.']),
        pergunta('Qual valor você passa ao formatador para a API que enviou 499 centavos?', 2,
          ['49900.', 'Isso multiplica a diferença entre as unidades.'],
          ['499.', 'O formatador espera o valor em reais.'],
          ['4,99 em valor numérico.', 'A conversão é centavos dividido por 100.'])
      ],
      refs: [fonte('ECMA-402 · Intl.NumberFormat', 'https://tc39.es/ecma402/#numberformat-objects')]
    },
    {
      id: 'WEB-120', category: 'Acessibilidade', title: 'O leitor de tela pulou o erro',
      description: 'Associe a orientação e a mensagem de erro ao campo usando seus IDs.',
      minutes: 13, icon: 'layers', theme: 'rose', skills: ['aria-describedby', 'aria-invalid', 'Acessibilidade'],
      story: {
        person: 'Ícaro', role: 'QA de acessibilidade',
        message: 'Com leitor de tela, ouvi a instrução de formato do CEP. Depois do envio inválido, ao voltar ao campo, a mensagem de erro não foi lida.',
        criteria: ['Conservar a descrição de ajuda existente.', 'Associar o erro quando ele aparece.', 'Retirar a referência ao erro quando ele é corrigido.'],
        evidence: { label: 'Inspector · Campo inválido', code: 'input#cep [aria-describedby="cep-ajuda"]\np#cep-ajuda: Informe somente os números.\np#cep-erro: Informe 8 dígitos.' },
        question: pergunta('Como a interface mantém a ajuda e associa o erro ao campo?', 2,
          ['Mostrar a borda vermelha mais forte.', 'A cor não fornece a descrição ao leitor de tela.'],
          ['Apagar a instrução para abrir espaço.', 'A orientação de formato continua útil durante a correção.'],
          ['Incluir o ID da ajuda e o ID do erro em aria-describedby.', 'O atributo aceita IDs separados por espaços que referenciam descrições do controle.'])
      },
      lab: {
        goal: 'Implemente atributosCampo(ajudaId, erroId). Os IDs são strings ou null. Devolva { descricoes, invalido } com os IDs existentes, primeiro ajuda e depois erro, separados por espaço. invalido é booleano e reflete a presença do erro.',
        functionName: 'atributosCampo',
        starter: `function atributosCampo(ajudaId, erroId) {
  return { descricoes: ajudaId || '', invalido: false };
}`,
        answer: `function atributosCampo(ajudaId, erroId) {
  const descricoes = [ajudaId, erroId].filter(Boolean).join(' ');
  return { descricoes, invalido: Boolean(erroId) };
}`,
        hints: ['Filtre os IDs ausentes antes de juntá-los com um espaço.', 'Converta a existência de erroId para um booleano.'],
        tests: [
          teste('Somente ajuda', ['cep-ajuda', null], { descricoes: 'cep-ajuda', invalido: false }),
          teste('Ajuda e erro juntos', ['cep-ajuda', 'cep-erro'], { descricoes: 'cep-ajuda cep-erro', invalido: true }),
          teste('Erro sem ajuda', [null, 'numero-erro'], { descricoes: 'numero-erro', invalido: true }),
          teste('Nenhuma descrição', [null, null], { descricoes: '', invalido: false })
        ],
        note: 'No componente, use os IDs de elementos presentes no documento. Aplique aria-invalid quando houver erro e confira a leitura no navegador com tecnologia assistiva.'
      },
      delivery: {
        ...pergunta('Como você valida o resultado além do teste da função?', 1,
          ['Conferindo só a cor da borda.', 'A cor não demonstra a associação que será exposta à tecnologia assistiva.'],
          ['Inspeciono os IDs, envio um valor inválido e volto ao campo com teclado e leitor de tela.', 'Isso verifica a associação e a experiência de correção.'],
          ['Fecho o ticket ao ver o parágrafo no HTML.', 'O parágrafo existir não confirma que ele descreve o controle.']),
        artifact: exemplo('Checklist de revisão', 'WEB-120 · Associei ajuda e erro ao CEP no modelo do campo. Testes do laboratório cobrem ajuda, erro, ambos e nenhum. Em QA manual, voltar ao campo após envio inválido e conferir leitura com teclado e leitor de tela.')
      },
      recall: [
        pergunta('Como separar dois IDs em aria-describedby?', 0,
          ['Com espaço.', 'O atributo é uma lista de referências por ID separada por espaços.'],
          ['Com vírgula.', 'A vírgula faria parte do identificador e pode impedir a associação.'],
          ['Em dois atributos de mesmo nome.', 'Use um atributo com a lista de IDs.']),
        pergunta('Depois que o CEP é corrigido, o que fica?', 1,
          ['O ID de erro referenciando um elemento removido.', 'A referência deve acompanhar os elementos presentes.'],
          ['A ajuda e o estado válido.', 'A orientação continua disponível, e o erro antigo sai da descrição.'],
          ['A descrição do erro até a próxima visita.', 'Um erro resolvido deve deixar de ser apresentado.']),
        pergunta('A função passou em todos os testes. O que ainda precisa ser verificado na integração?', 2,
          ['Somente o tamanho da fonte.', 'O ticket trata a associação e a leitura das descrições.'],
          ['A quantidade de mensagens no console.', 'Mensagens de console não descrevem o campo para a pessoa.'],
          ['Os IDs renderizados e a leitura ao retornar ao campo.', 'O modelo da função precisa ser aplicado corretamente aos elementos reais.'])
      ],
      refs: [formularios, fonte('W3C WAI · Identificação de campo inválido', 'https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA21')]
    },
    {
      id: 'WEB-121', category: 'Acessibilidade', title: 'Depois do modal, onde eu estava?',
      description: 'Devolva o foco ao ponto certo quando uma confirmação for fechada.',
      minutes: 12, icon: 'layers', theme: 'violet', skills: ['Foco', 'Teclado', 'Diálogo modal'],
      story: {
        person: 'Nina', role: 'QA de acessibilidade',
        message: 'Fechei o diálogo de remoção usando Escape e tive de começar a navegar do topo. Quando confirmo, o botão que abriu o diálogo desaparece junto com o pedido.',
        criteria: ['Retornar ao acionador se ele ainda estiver disponível.', 'Escolher um destino lógico quando o pedido for removido.', 'Escolher um alvo disponível em uma lista de alternativas da tela.'],
        evidence: { label: 'Registro de QA · Fluxo por teclado', code: 'Cancelar remoção: foco → início da página\nConfirmar remoção: botão #remover-42 foi removido do DOM\nAlvos do fluxo: #pedido-43, #titulo-lista' },
        question: pergunta('A remoção foi confirmada e o acionador sumiu. Para onde vai o foco?', 1,
          ['Para o botão removido, mesmo ausente.', 'Um elemento ausente não pode receber foco.'],
          ['Para o próximo alvo lógico disponível, como o próximo pedido.', 'A pessoa pode continuar a partir do ponto em que estava trabalhando.'],
          ['Para a barra de endereço.', 'Isso quebra a continuidade do fluxo dentro do portal.'])
      },
      lab: {
        goal: 'Edite destinoDoFoco(acionador, disponiveis, alternativas). Retorne acionador se ele estiver em disponiveis. Senão, retorne a primeira alternativa também presente em disponiveis. Se nenhuma servir, retorne null.',
        functionName: 'destinoDoFoco',
        starter: `function destinoDoFoco(acionador, disponiveis, alternativas) {
  return acionador;
}`,
        answer: `function destinoDoFoco(acionador, disponiveis, alternativas) {
  if (disponiveis.includes(acionador)) return acionador;
  return alternativas.find(id => disponiveis.includes(id)) ?? null;
}`,
        hints: ['A disponibilidade do acionador tem prioridade.', 'Use find na lista de alternativas para respeitar a ordem de preferência.'],
        tests: [
          teste('Cancelamento preserva o acionador', ['remover-42', ['remover-42', 'pedido-43'], ['pedido-43']], 'remover-42'),
          teste('Acionador removido', ['remover-42', ['titulo-lista', 'pedido-43'], ['pedido-43', 'titulo-lista']], 'pedido-43'),
          teste('Cai para a segunda alternativa', ['remover-42', ['titulo-lista'], ['pedido-43', 'titulo-lista']], 'titulo-lista'),
          teste('Nenhum alvo disponível', ['remover-42', [], ['pedido-43']], null)
        ],
        note: 'A função escolhe um ID. Na integração, confira quais elementos ainda podem receber foco e aplique focus() após o fechamento e a atualização da lista.'
      },
      delivery: {
        ...pergunta('Que verificação manual cobre a regressão inteira?', 2,
          ['Abrir o diálogo com o mouse e tirar uma captura.', 'A captura não demonstra a posição do foco após o fechamento.'],
          ['Usar Escape uma vez e validar somente que o diálogo sumiu.', 'É preciso verificar o destino do foco e cobrir também a confirmação.'],
          ['Abrir por teclado, fechar com Escape e repetir confirmando a remoção para inspecionar ambos os destinos.', 'Assim se verificam acionador preservado e acionador removido.']),
        artifact: exemplo('Comentário de QA no ticket', 'WEB-121 · Confira por teclado: Escape volta ao botão de origem, confirmar remoção leva ao próximo pedido disponível e o título serve de alternativa quando a lista fica vazia.')
      },
      recall: [
        pergunta('Fechou com Escape e o botão original continua utilizável. Para onde retorna?', 2,
          ['Ao topo da página.', 'O topo exige que a pessoa procure novamente o ponto anterior.'],
          ['Ao próximo pedido.', 'A alternativa é útil quando o acionador deixou de existir.'],
          ['Ao acionador original.', 'O usuário retoma a interação no ponto de partida.']),
        pergunta('O título deve receber foco programático quando nenhum pedido sobra. O que conferir?', 0,
          ['Se o elemento existe e foi preparado para aceitar foco.', 'Um alvo lógico precisa estar disponível para focus() no navegador.'],
          ['Se o título está em negrito.', 'O estilo não define a possibilidade de mover foco.'],
          ['Se o título vira um botão de remoção.', 'A função do elemento continua sendo apresentar a lista.']),
        pergunta('Por que o teste passa disponiveis como entrada?', 1,
          ['Para ordenar pedidos por data.', 'O exercício decide foco, sem ordenar dados.'],
          ['Para separar a escolha da verificação real do DOM.', 'O componente coleta os destinos possíveis e a função decide a prioridade.'],
          ['Para guardar a sequência no navegador.', 'A lista representa o estado atual da interface.'])
      ],
      refs: [fonte('W3C APG · Diálogo modal e retorno de foco', 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/')]
    },
    {
      id: 'WEB-122', category: 'Acessibilidade', title: 'O aviso que interrompe tudo',
      description: 'Dê prioridade às mensagens certas e mantenha o foco onde a pessoa está.',
      minutes: 12, icon: 'activity', theme: 'rose', skills: ['Regiões vivas', 'role=status', 'role=alert'],
      story: {
        person: 'Ícaro', role: 'QA de acessibilidade',
        message: 'O leitor de tela é interrompido a cada salvamento de rascunho. Quando o acesso expira, ninguém ouve o aviso importante. Os dois eventos usam a mesma região.',
        criteria: ['Confirmações de rotina usam role=status.', 'Expiração de sessão usa role=alert.', 'Eventos internos não anunciam mensagens.'],
        evidence: { label: 'Inspector · Avisos no portal', code: 'rascunho salvo → alert (interrompe a leitura)\nsessão expirada → mensagem somente visual\ntelemetria enviada → mensagem exibida ao usuário' },
        question: pergunta('Como você anuncia “Rascunho salvo” sem exigir ação imediata?', 0,
          ['Atualize a região status e mantenha o foco atual.', 'É uma confirmação de rotina, apropriada para anúncio não intrusivo.'],
          ['Leve o foco para o aviso.', 'Mover o foco quebra a atividade em andamento e não é necessário para uma mensagem de status.'],
          ['Use alert para todas as mensagens.', 'Isso pode interromper a leitura com eventos de rotina.'])
      },
      lab: {
        goal: 'Edite prepararAviso(tipo, texto). Para salvo e exportado, retorne { papel: "status", texto }. Para sessao-expirada, retorne { papel: "alert", texto }. Para demais tipos, retorne null.',
        functionName: 'prepararAviso',
        starter: `function prepararAviso(tipo, texto) {
  return { papel: 'alert', texto };
}`,
        answer: `function prepararAviso(tipo, texto) {
  if (tipo === 'sessao-expirada') return { papel: 'alert', texto };
  if (tipo === 'salvo' || tipo === 'exportado') return { papel: 'status', texto };
  return null;
}`,
        hints: ['Separe o evento urgente das confirmações de rotina.', 'A regra de produto só anuncia os três tipos listados.'],
        tests: [
          teste('Aviso urgente de expiração', ['sessao-expirada', 'Entre novamente.'], { papel: 'alert', texto: 'Entre novamente.' }),
          teste('Confirmação de rascunho', ['salvo', 'Rascunho salvo.'], { papel: 'status', texto: 'Rascunho salvo.' }),
          teste('Exportação pronta', ['exportado', 'O relatório está pronto.'], { papel: 'status', texto: 'O relatório está pronto.' }),
          teste('Evento interno não gera aviso', ['telemetria', 'Métrica enviada.'], null)
        ],
        note: 'O teste classifica mensagens. Na tela, atualize o conteúdo da região adequada e confira a experiência com leitor de tela. Neste fluxo, o alerta só informa a expiração.'
      },
      delivery: {
        ...pergunta('Que verificação diferencia as duas classes de aviso?', 2,
          ['Contar quantos avisos aparecem no DOM.', 'A contagem não mostra prioridade nem o que acontece com o foco.'],
          ['Validar só que o texto de expiração existe.', 'A existência do texto não mostra se a região o anuncia.'],
          ['Usar leitor de tela durante um salvamento e uma expiração e conferir se o foco permanece no controle.', 'O cenário cobre prioridade e continuidade da interação.']),
        artifact: exemplo('Plano de teste de acessibilidade', 'WEB-122 · Rascunho e exportação vão para status. Expiração vai para alert. Conferir com leitor de tela se os anúncios são distintos e se a atualização não desloca o foco.')
      },
      recall: [
        pergunta('A exportação terminou sem exigir que você abandone a tela. Qual papel serve?', 1,
          ['alertdialog.', 'Um diálogo toma o foco e exige resposta.'],
          ['status.', 'O resultado é uma atualização de rotina da operação.'],
          ['button.', 'O aviso informa um resultado. A ação de baixar pode ter um botão separado.']),
        pergunta('Uma métrica interna chegou ao coletor. Que aviso mostrar?', 2,
          ['“Coletor operacional”.', 'Essa mensagem adiciona ruído a quem está usando o portal.'],
          ['Um alerta com prioridade máxima.', 'O evento não exige ação da pessoa.'],
          ['Nenhum aviso.', 'Reserve anúncios para informações úteis à tarefa.']),
        pergunta('Ao atualizar um aviso de sucesso, o campo atual perde o foco. O que corrigir?', 0,
          ['Atualizar o conteúdo mantendo o foco no campo.', 'A região de status anuncia a mudança sem tirar o usuário da tarefa.'],
          ['Mover o foco para o topo em todos os avisos.', 'Isso interromperia cada operação de rotina.'],
          ['Desligar o leitor de tela durante o aviso.', 'O comportamento deve funcionar com a tecnologia assistiva ativa.'])
      ],
      refs: [
        fonte('WCAG 2.2 · Mensagens de status', 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html'),
        fonte('W3C APG · Padrão de alertas', 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/')
      ]
    },
    {
      id: 'WEB-123', category: 'Interface e dados', title: 'A tabela ordena 100 antes de 20',
      description: 'Ordene os valores brutos da coluna e mantenha o indicador de direção correto.',
      minutes: 14, icon: 'layers', theme: 'blue', skills: ['Ordenação', 'Tabelas', 'aria-sort'],
      story: {
        person: 'Davi', role: 'Operações',
        message: 'Ao ordenar pelo total, R$ 100,00 vem antes de R$ 20,00 em ordem crescente. No segundo clique o indicador continua dizendo que a ordem é crescente.',
        criteria: ['Ordenar numericamente por valorCentavos.', 'Preservar a ordem de entrada de valores iguais.', 'Entregar a direção que a interface deve aplicar em aria-sort.'],
        evidence: { label: 'QA · Ordem da coluna Total', code: 'Entradas: [10000, 2000, 3000] em centavos\nObtido crescente: [10000, 2000, 3000]\nEsperado crescente: [2000, 3000, 10000]' },
        question: pergunta('Quais valores são adequados para a comparação da coluna Total?', 2,
          ['Os textos já formatados em reais.', 'Comparação textual não equivale à comparação numérica dos totais.'],
          ['Os números dos pedidos.', 'O ID identifica o pedido, mas não determina seu total.'],
          ['Os valores numéricos em centavos.', 'Eles permitem comparar totais independentemente da formatação visual.'])
      },
      lab: {
        goal: 'Implemente ordenarTotais(pedidos, direcao). direcao é asc ou desc. Ordene uma cópia pelos centavos, mantendo a ordem original de empates. Retorne { ids, ariaSort }, com ids na ordem final e ariaSort igual a ascending ou descending.',
        functionName: 'ordenarTotais',
        starter: `function ordenarTotais(pedidos, direcao) {
  const itens = [...pedidos].sort((a, b) =>
    String(a.valorCentavos).localeCompare(String(b.valorCentavos))
  );
  return { ids: itens.map(pedido => pedido.id), ariaSort: 'ascending' };
}`,
        answer: `function ordenarTotais(pedidos, direcao) {
  const fator = direcao === 'asc' ? 1 : -1;
  const itens = [...pedidos].sort((a, b) =>
    (a.valorCentavos - b.valorCentavos) * fator
  );
  const ariaSort = direcao === 'asc' ? 'ascending' : 'descending';
  return { ids: itens.map(pedido => pedido.id), ariaSort };
}`,
        hints: ['Use a diferença entre os valores como comparador numérico.', 'Inverta o sinal para a direção desc. Empates retornam zero, mantendo a ordem com sort.'],
        tests: [
          teste('Crescente com valores de mesmo comprimento', [[{ id: 1, valorCentavos: 3000 }, { id: 2, valorCentavos: 2000 }], 'asc'], { ids: [2, 1], ariaSort: 'ascending' }),
          teste('Crescente com comprimentos diferentes', [[{ id: 1, valorCentavos: 10000 }, { id: 2, valorCentavos: 2000 }], 'asc'], { ids: [2, 1], ariaSort: 'ascending' }),
          teste('Decrescente conserva a ordem dos empates', [[{ id: 1, valorCentavos: 100 }, { id: 2, valorCentavos: 300 }, { id: 3, valorCentavos: 300 }], 'desc'], { ids: [2, 3, 1], ariaSort: 'descending' }),
          teste('Lista vazia ainda informa direção', [[], 'desc'], { ids: [], ariaSort: 'descending' })
        ],
        note: 'No componente, aplique aria-sort ao cabeçalho da coluna que está ordenada e use o botão do cabeçalho para alternar a direção.'
      },
      delivery: {
        ...pergunta('Qual cenário deixa a regressão visível para revisão?', 0,
          ['Comparo R$ 20,00 com R$ 100,00 nas duas direções e confiro aria-sort no cabeçalho.', 'Ele exercita a diferença entre ordenação textual e numérica e o indicador de estado.'],
          ['Ordeno uma tabela com um único pedido.', 'A posição de uma única linha não distingue as duas ordenações.'],
          ['Mostro que a coluna foi renomeada para Valor.', 'O nome da coluna não confirma nem a ordem nem a direção.']),
        artifact: exemplo('Checklist do pull request', 'WEB-123 · Comparei centavos brutos para ordenar Total. Testes cobrem 20 x 100, empates e lista vazia. No navegador, alternar pelo botão do cabeçalho e verificar a ordem das linhas e aria-sort.')
      },
      recall: [
        pergunta('O comparador retorna zero para dois pedidos. Qual é a ordem esperada neste ticket?', 2,
          ['Inverte a cada clique.', 'Empates devem permanecer estáveis nas duas direções.'],
          ['Ordena automaticamente pelo ID.', 'A solução não acrescenta um desempate por ID.'],
          ['Mantém a ordem em que chegaram.', 'A ordenação estável preserva a posição relativa de itens que empatam.']),
        pergunta('Em qual elemento fica aria-sort?', 1,
          ['Em cada célula de valor.', 'As células contêm valores. O cabeçalho expõe a direção da coluna.'],
          ['No cabeçalho da coluna ordenada.', 'A propriedade descreve qual cabeçalho está controlando a ordenação.'],
          ['No body da página.', 'O estado pertence à coluna e deve aparecer no elemento correspondente.']),
        pergunta('Onde ocorre a formatação em reais?', 0,
          ['Na apresentação, depois de ordenar pelos dados numéricos.', 'Isso mantém a regra independente de símbolo e separadores de moeda.'],
          ['Antes de comparar os valores como textos.', 'Foi justamente essa comparação que colocou 100 antes de 20.'],
          ['Convertendo todos os IDs em reais.', 'IDs e valores são informações diferentes.'])
      ],
      refs: [
        fonte('W3C APG · Tabela com ordenação', 'https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/'),
        fonte('ECMA-262 · Array.prototype.sort', 'https://tc39.es/ecma262/#sec-array.prototype.sort')
      ]
    },
    {
      id: 'WEB-124', category: 'Rede no navegador', title: 'O portal insiste na hora errada',
      description: 'Decida quando a interface pode tentar novamente uma leitura que falhou.',
      minutes: 15, icon: 'activity', theme: 'orange', skills: ['HTTP', 'Retry-After', 'Retentativas'],
      story: {
        person: 'Mila', role: 'Engenharia de plataforma',
        message: 'Durante a manutenção, a página ficou repetindo consultas ao receber 503. O mesmo código também tentou reenviar a criação de um pedido.',
        criteria: ['Repetir automaticamente apenas GET com 429 ou 503.', 'Limitar a duas retentativas.', 'Usar a espera do servidor quando fornecida, com espera local de 2 s e 4 s como alternativa.'],
        evidence: { label: 'DevTools · Tentativas automáticas', code: 'GET /pedidos → 429 Retry-After: 8\nGET /pedidos → tentativa imediata\nPOST /pedidos → 503 → segundo POST automático' },
        question: pergunta('Que política segue os critérios do chamado?', 1,
          ['Repetir tudo que falhar até receber 200.', 'O portal pode sobrecarregar a API ou repetir efeitos de uma gravação.'],
          ['Limitar as retentativas de GET e aguardar o tempo indicado pelo servidor.', 'A política é previsível e respeita o sinal de indisponibilidade ou limite.'],
          ['Ignorar o cabeçalho e reexecutar a cada segundo.', 'A espera solicitada pelo servidor ajuda a evitar pressão adicional durante a falha.'])
      },
      lab: {
        goal: 'Implemente atrasoDaRetentativa(metodo, status, feitas, esperaServidor). feitas conta retentativas já feitas, a partir de zero. Só GET com 429 ou 503 e menos de duas retentativas pode continuar. Retorne esperaServidor em segundos se ela for um inteiro >= 0. Senão use 2 s para a primeira e 4 s para a segunda. Retorne null quando não deve repetir.',
        functionName: 'atrasoDaRetentativa',
        starter: `function atrasoDaRetentativa(metodo, status, feitas, esperaServidor) {
  if (status === 429 || status === 503) return 2;
  return null;
}`,
        answer: `function atrasoDaRetentativa(metodo, status, feitas, esperaServidor) {
  if (metodo !== 'GET' || feitas >= 2) return null;
  if (status !== 429 && status !== 503) return null;
  if (Number.isInteger(esperaServidor) && esperaServidor >= 0) return esperaServidor;
  return feitas === 0 ? 2 : 4;
}`,
        hints: ['Use retornos antecipados para método, status e limite.', 'Uma espera de zero é válida. Confira a entrada com Number.isInteger, sem usar condição de verdadeiro/falso.'],
        tests: [
          teste('Primeira repetição usa espera local', ['GET', 503, 0, null], 2),
          teste('Servidor informa oito segundos', ['GET', 429, 0, 8], 8),
          teste('Segunda repetição aumenta a espera', ['GET', 503, 1, null], 4),
          teste('Terceira repetição é barrada', ['GET', 503, 2, 10], null),
          teste('POST de criação não repete', ['POST', 503, 0, 5], null),
          teste('404 não repete', ['GET', 404, 0, null], null),
          teste('Zero é uma espera explícita', ['GET', 429, 1, 0], 0)
        ],
        note: 'O laboratório recebe Retry-After já convertido em segundos ou null. Em HTTP, o cabeçalho também pode conter uma data. O exercício não espera nem envia requisições reais.'
      },
      delivery: {
        ...pergunta('Qual atualização registra a correção com evidência suficiente?', 0,
          ['Descrevo o limite, a espera de Retry-After e a ausência de reenvio automático no POST.', 'A mensagem cobre tanto a pressão de leitura quanto a repetição de gravação.'],
          ['Digo que o servidor está sempre estável.', 'Uma política de retentativas não muda a disponibilidade do servidor.'],
          ['Mostro só o status 503 no Network.', 'A evidência também deve mostrar quantas tentativas foram feitas e com qual espera.']),
        artifact: exemplo('Atualização para #engenharia', 'WEB-124 · GET repete no máximo duas vezes ao receber 429/503 e usa Retry-After válido quando presente. POST segue sem retentativa automática nesse fluxo. Validei limites e atrasos no laboratório.')
      },
      recall: [
        pergunta('A consulta GET recebeu 429 com espera normalizada de 12 s na primeira falha. Qual atraso?', 2,
          ['2 s.', 'A espera local só é usada quando a entrada do servidor não é válida ou não existe.'],
          ['4 s.', 'A espera válida do servidor tem prioridade.'],
          ['12 s.', 'A política usa a espera informada no caso elegível.']),
        pergunta('Já ocorreram duas retentativas de GET e a API devolveu outro 503. O que fazer?', 0,
          ['Interromper o ciclo automático.', 'O limite impede que a tela continue gerando tráfego indefinidamente.'],
          ['Tentar sempre até o servidor recuperar.', 'Isso ignora o orçamento de tentativas.'],
          ['Trocar GET por POST.', 'O método faz parte do contrato da rota.']),
        pergunta('O POST de criação recebeu 503. Por que o portal não o repete automaticamente?', 1,
          ['Porque POST só pode devolver 200.', 'Um POST pode receber vários códigos de resposta.'],
          ['Porque o portal não tem garantia de que a operação anterior deixou de criar o pedido.', 'A repetição automática pode duplicar efeitos sem uma garantia de idempotência.'],
          ['Porque POST sempre altera a interface local.', 'O problema diz respeito ao efeito da operação no servidor.'])
      ],
      refs: [
        fonte('RFC 9110 · Retry-After', 'https://www.rfc-editor.org/rfc/rfc9110.html#section-10.2.3'),
        fonte('RFC 9110 · Métodos idempotentes', 'https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2'),
        fonte('RFC 6585 · Limite de requisições', 'https://www.rfc-editor.org/rfc/rfc6585.html#section-4')
      ]
    },
    {
      id: 'WEB-125', category: 'Formulários', title: 'O comprovante volta depois de subir',
      description: 'Dê retorno imediato sobre a seleção de um PDF antes de enviar o arquivo.',
      minutes: 13, icon: 'filter', theme: 'mint', skills: ['Upload', 'File API', 'Validação de entrada'],
      story: {
        person: 'Rafa', role: 'Atendimento',
        message: 'A equipe espera o envio inteiro para descobrir que selecionou uma imagem ou um comprovante grande demais. A tela pode indicar isso na hora?',
        criteria: ['Aceitar somente nome com extensão PDF e tipo compatível quando conhecido.', 'Explicar quando o arquivo estiver vazio ou exceder 5 MiB.', 'Manter a verificação do conteúdo no servidor.'],
        evidence: { label: 'Suporte · Relatos de anexos', code: 'comprovante.PNG · image/png · erro só após upload\nrecibo.PDF · tipo não informado pelo navegador\nnf.pdf · 6291456 bytes · erro só após upload' },
        question: pergunta('O que a interface pode concluir antes do envio?', 0,
          ['Pode barrar seleções incompatíveis pela extensão, tamanho e tipo informado.', 'Essa triagem melhora a experiência. O servidor ainda verifica o conteúdo real.'],
          ['Um nome .pdf comprova que o conteúdo é PDF.', 'A extensão pode ser alterada sem transformar o conteúdo.'],
          ['O atributo accept verifica com segurança o conteúdo.', 'accept orienta a seleção. O arquivo ainda precisa ser verificado.'])
      },
      lab: {
        goal: 'Implemente validarComprovante(arquivo). Para null, retorne "sem-arquivo". Depois, nome sem extensão .pdf ignorando caixa ou tipo informado diferente de application/pdf retorna "formato". Tamanho zero retorna "vazio". Acima de 5 MiB (5 × 1024 × 1024 bytes) retorna "grande". Nos demais casos retorne "ok". O tipo ausente vem como string vazia.',
        functionName: 'validarComprovante',
        starter: `function validarComprovante(arquivo) {
  if (!arquivo) return 'sem-arquivo';
  if (arquivo.tipo !== 'application/pdf') return 'formato';
  return 'ok';
}`,
        answer: `function validarComprovante(arquivo) {
  if (!arquivo) return 'sem-arquivo';
  const extensaoPdf = arquivo.nome.toLowerCase().endsWith('.pdf');
  const tipoCompativel = arquivo.tipo === '' || arquivo.tipo === 'application/pdf';
  if (!extensaoPdf || !tipoCompativel) return 'formato';
  if (arquivo.bytes === 0) return 'vazio';
  if (arquivo.bytes > 5 * 1024 * 1024) return 'grande';
  return 'ok';
}`,
        hints: ['Compare a extensão em minúsculas e considere o tipo vazio separadamente.', 'Compare o tamanho em bytes com 5 × 1024 × 1024. O limite exato está permitido.'],
        tests: [
          teste('Nenhuma seleção', [null], 'sem-arquivo'),
          teste('PDF comum', [{ nome: 'nota.pdf', tipo: 'application/pdf', bytes: 34000 }], 'ok'),
          teste('PDF sem tipo e no limite', [{ nome: 'NOTA.PDF', tipo: '', bytes: 5242880 }], 'ok'),
          teste('Imagem com extensão PDF', [{ nome: 'nota.pdf', tipo: 'image/png', bytes: 34000 }], 'formato'),
          teste('Nome não termina em PDF', [{ nome: 'nota.pdf.png', tipo: 'application/pdf', bytes: 34000 }], 'formato'),
          teste('Arquivo vazio', [{ nome: 'nota.pdf', tipo: 'application/pdf', bytes: 0 }], 'vazio'),
          teste('Um byte acima do limite', [{ nome: 'nota.pdf', tipo: 'application/pdf', bytes: 5242881 }], 'grande')
        ],
        note: 'O modelo recebe nome, tipo e bytes, equivalentes a name, type e size do File. Esses metadados permitem feedback cedo. A segurança do upload depende das verificações do servidor.'
      },
      delivery: {
        ...pergunta('Qual descrição apresenta bem o alcance da correção?', 2,
          ['“Agora o navegador confirma que todo PDF é seguro.”', 'Os metadados do cliente não provam a integridade do arquivo.'],
          ['“Removi a validação da API para deixar o envio rápido.”', 'O servidor deve continuar validando os arquivos recebidos.'],
          ['“A seleção dá retorno imediato e a API continua validando o conteúdo recebido.”', 'A nota distingue o retorno de interface da validação que protege o servidor.']),
        artifact: exemplo('Atualização no Jira', 'WEB-125 · A interface orienta a escolha antes do upload: PDF válido na triagem, formato incompatível, vazio ou acima de 5 MiB. A API continua responsável pela validação do arquivo enviado.')
      },
      recall: [
        pergunta('Um .PDF tem tipo vazio e 5 MiB exatos. Qual resultado na triagem?', 1,
          ['grande.', 'O tamanho exato do limite está permitido.'],
          ['ok.', 'A extensão está correta e tipo ausente não é um conflito nesta triagem.'],
          ['formato.', 'Extensão PDF em maiúsculas é permitida.']),
        pergunta('Para que serve accept no campo de arquivo?', 0,
          ['Para orientar os tipos mostrados no seletor.', 'É uma indicação de entrada. As verificações de conteúdo são separadas.'],
          ['Para tornar a verificação do servidor desnecessária.', 'O seletor não controla todas as formas de enviar uma requisição.'],
          ['Para converter qualquer imagem em PDF.', 'O atributo não transforma o arquivo.']),
        pergunta('Qual teste cobre exatamente a fronteira de tamanho?', 2,
          ['Apenas um arquivo de 1 MiB.', 'Ele está longe do limite e não detecta um erro de comparação.'],
          ['Dois nomes que terminam em .PDF.', 'Isso exercita extensão, não tamanho.'],
          ['5.242.880 bytes e 5.242.881 bytes.', 'O primeiro é aceito e o segundo deve ser rejeitado.'])
      ],
      refs: [
        fonte('WHATWG · Atributo accept', 'https://html.spec.whatwg.org/multipage/input.html#attr-input-accept'),
        fonte('W3C · File API', 'https://www.w3.org/TR/FileAPI/')
      ]
    },
    {
      id: 'WEB-126', category: 'Interface e entrega', title: 'A tela beta apareceu para todo mundo',
      description: 'Use a variante estável quando a feature flag não tiver um valor confiável.',
      minutes: 12, icon: 'layers', theme: 'violet', skills: ['Feature flags', 'Fallback', 'Rollout'],
      story: {
        person: 'Cris', role: 'Produto',
        message: 'A nova ficha de pedido deveria aparecer só na coorte piloto. Uma resposta inesperada do provedor fez a tela beta abrir em contas fora do piloto.',
        criteria: ['Renderizar beta apenas quando a avaliação sem falha devolver true booleano.', 'Manter a tela estável quando houver erro, flag ausente ou tipo inválido.', 'Registrar a variante nos cenários de teste do rollout.'],
        evidence: { label: 'Log da avaliação', code: 'conta=piloto resultado=true erro=false → beta\nconta=fora resultado="false" erro=false → beta (incorreto)\nconta=fora resultado=null erro=true → estável' },
        question: pergunta('O que o componente faz com a string "false" recebida do provedor?', 1,
          ['Trata como habilitada por ser uma string não vazia.', 'Essa coerção é a causa do rollout fora da regra.'],
          ['Usa a variante estável porque o valor não é booleano.', 'A tela beta requer confirmação explícita da flag.'],
          ['Converte qualquer string em true para tolerar respostas.', 'Essa conversão perde o significado do tipo e ativa a tela indevidamente.'])
      },
      lab: {
        goal: 'Edite varianteDoPedido(valor, houveErro). Retorne "beta" somente quando valor for o booleano true e houveErro for false. Nos demais casos retorne "estavel".',
        functionName: 'varianteDoPedido',
        starter: `function varianteDoPedido(valor, houveErro) {
  return valor ? 'beta' : 'estavel';
}`,
        answer: `function varianteDoPedido(valor, houveErro) {
  return valor === true && houveErro === false ? 'beta' : 'estavel';
}`,
        hints: ['Compare valor usando igualdade estrita com true.', 'Mesmo um valor verdadeiro perde validade quando a avaliação informa erro.'],
        tests: [
          teste('Flag habilitada sem erro', [true, false], 'beta'),
          teste('Flag desabilitada', [false, false], 'estavel'),
          teste('String false é inválida', ['false', false], 'estavel'),
          teste('Sem valor definido', [null, false], 'estavel'),
          teste('Falha da avaliação invalida o valor', [true, true], 'estavel')
        ],
        note: 'O Worker recebe um valor simulado. Em produção, use o valor padrão tipado do SDK e trate falhas de avaliação. Uma flag de apresentação não autoriza operações protegidas na API.'
      },
      delivery: {
        ...pergunta('O que você deixa registrado para o time que acompanha o lançamento?', 2,
          ['“Funcionou para a minha conta piloto.”', 'A conta piloto cobre só o caminho de ativação.'],
          ['“A flag é uma garantia de acesso seguro.”', 'A autorização continua a cargo da API.'],
          ['“Conferi piloto, fora da coorte e provedor com erro. Fora do piloto ou sem valor confiável, a tela estável é usada.”', 'O registro descreve a ativação, o fallback e a cobertura do teste.']),
        artifact: exemplo('Checklist de rollout', 'WEB-126 · Beta exige true booleano sem erro. Validei conta piloto, conta fora da coorte, flag ausente, string inválida e erro de avaliação. O fallback é a tela estável.')
      },
      recall: [
        pergunta('O provedor retorna true, mas também reporta erro. Qual variante renderizar?', 0,
          ['A estável.', 'A falha torna a avaliação inadequada para habilitar a beta neste fluxo.'],
          ['A beta.', 'A ativação exige valor verdadeiro e ausência de erro.'],
          ['Nenhuma variante até reiniciar a sessão.', 'O portal tem um fallback estável para continuar a tarefa.']),
        pergunta('Quem deve decidir se a operação de cancelar pedido está autorizada?', 2,
          ['A flag que alterna a interface.', 'Uma flag de apresentação não controla acesso à operação.'],
          ['O botão de cancelamento exibido no navegador.', 'Uma requisição pode ser feita sem usar o botão.'],
          ['O servidor, ao processar a requisição.', 'A autorização precisa ser verificada onde a operação protegida acontece.']),
        pergunta('Qual entrada pega o bug de tratar valores pela conversão para booleano?', 1,
          ['Booleano false.', 'A versão com coerção já trata esse valor como falso.'],
          ['A string "false".', 'Como texto não vazio ela é verdadeira em uma condição, mas o contrato exige um booleano.'],
          ['Booleano true sem erro.', 'As duas versões ativam a variante corretamente nesse caso.'])
      ],
      refs: [fonte('OpenFeature · Avaliação de flags', 'https://openfeature.dev/specification/sections/flag-evaluation/')]
    }
  ];
})();
