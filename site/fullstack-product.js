(() => {
  const quiz = (prompt, options, answer) => ({
    prompt,
    choices: options.map(([choice]) => choice),
    answer,
    feedback: options.map(([, feedback]) => feedback)
  });
  const test = (label, args, expected) => ({label, args, expected});
  const ref = (label, url) => ({label, url});
  const response = (status, body) => ({status, body});
  const view = (state, message, items) => items ? {state, message, items} : {state, message};
  const scenario = (label, method, path, args, expectedResponse, expectedView) => ({
    label, method, path, args, response: expectedResponse, view: expectedView
  });
  const backendTests = scenarios => scenarios.map(({label, args, response}) => test(label, args, response));
  const frontendTests = scenarios => scenarios.map(({label, response, view}) => test(label, [response], view));

  const pedidoCriado = response(201, {id: 981});
  const erroPedido = (...erros) => response(422, {erros});
  const erroQuantidade = {id: 'quantidade', label: 'Quantidade', detail: 'Informe um inteiro de 1 a 99.'};
  const erroCep = {id: 'cep', label: 'CEP', detail: 'Informe oito dígitos.'};
  const revisarPedido = (...items) => view('error', 'Revise os campos indicados.', items);
  const cadastro = [
    scenario('Pedido válido', 'POST', '/api/pedidos', [{quantidade: 1, cep: '01234000'}],
      pedidoCriado, view('success', 'Pedido criado.', [{id: 'pedido', label: 'Pedido', detail: '#981'}])),
    scenario('Dois campos inválidos', 'POST', '/api/pedidos', [{quantidade: 0, cep: '123'}],
      erroPedido('quantidade', 'cep'), revisarPedido(erroQuantidade, erroCep)),
    scenario('CEP enviado como número', 'POST', '/api/pedidos', [{quantidade: 99, cep: 12345678}],
      erroPedido('cep'), revisarPedido(erroCep))
  ];

  const carrinho = {
    totalCentavos: 10599,
    agora: 500,
    cupom: {codigo: 'BEMVINDO', percentual: 10, expiraEm: 600, restantes: 3}
  };
  const codigoPromocional = {codigo: 'BEMVINDO'};
  const erroCupom = codigo => response(422, {codigo});
  const cupom = [
    scenario('Cupom disponível', 'POST', '/api/carrinho/previa-cupom', [codigoPromocional, carrinho],
      response(200, {descontoCentavos: 1059, totalCentavos: 9540}),
      view('success', 'Cupom aplicado à prévia.', [
        {id: 'desconto', label: 'Desconto', detail: 'R$ 10,59'},
        {id: 'total', label: 'Total', detail: 'R$ 95,40'}
      ])),
    scenario('Cupom vencido', 'POST', '/api/carrinho/previa-cupom', [codigoPromocional, {...carrinho, agora: 600}],
      erroCupom('CUPOM_EXPIRADO'), view('error', 'Este cupom expirou.')),
    scenario('Cota de uso esgotada', 'POST', '/api/carrinho/previa-cupom',
      [codigoPromocional, {...carrinho, cupom: {...carrinho.cupom, restantes: 0}}],
      erroCupom('LIMITE_ATINGIDO'), view('error', 'O limite de uso deste cupom foi atingido.'))
  ];

  const agenda = {
    pedido: {id: 481, status: 'preparando'},
    janelas: [
      {id: '17-19', rotulo: '17h–19h', vagas: 2},
      {id: '19-21', rotulo: '19h–21h', vagas: 0}
    ]
  };
  const rotaEntrega = '/api/pedidos/481/janela';
  const reagendamento = [
    scenario('Horário disponível', 'PATCH', rotaEntrega, [{janela: '17-19'}, agenda],
      response(200, {id: 481, janela: '17-19', rotulo: '17h–19h'}),
      view('success', 'Entrega reagendada.', [{id: 'janela', label: 'Novo horário', detail: '17h–19h'}])),
    scenario('Horário ficou lotado', 'PATCH', rotaEntrega, [{janela: '19-21'}, agenda],
      response(409, {codigo: 'SEM_VAGAS'}), view('conflict', 'Horário indisponível. Escolha outra janela.')),
    scenario('Pedido saiu para entrega', 'PATCH', rotaEntrega,
      [{janela: '17-19'}, {...agenda, pedido: {...agenda.pedido, status: 'em_rota'}}],
      response(409, {codigo: 'PEDIDO_EM_ROTA'}), view('conflict', 'O pedido já está em rota.'))
  ];

  window.fullstackProduct = [
    {
      id: 'FS-204',
      sourceId: 'WEB-107',
      title: 'O formulário que ensina a corrigir',
      category: 'Pedidos e validação',
      description: 'Proteja a criação no servidor e leve os erros de quantidade e CEP para os campos certos da interface.',
      minutes: 30,
      icon: 'terminal',
      theme: 'violet',
      skills: ['Validação no servidor', 'Formulários', 'HTTP 422', 'Jira e Slack'],
      story: {
        person: 'Cris',
        role: 'QA',
        message: 'No WEB-107 encontramos pedidos com quantidade zero. Agora preciso que o formulário mostre tudo que a pessoa deve corrigir na mesma tentativa, inclusive quando o CEP veio errado.',
        criteria: [
          'Pedido válido recebe 201 e a tela mostra o ID criado.',
          'Quantidade inteira de 1 a 99 e CEP com oito dígitos são validados no servidor.',
          'Um 422 exibe orientação junto de cada campo inválido, com os dois erros quando aplicável.'
        ],
        evidence: {
          label: 'Reprodução em homologação',
          code: 'POST /api/pedidos\n{"quantidade":0,"cep":"123"}\n\nResultado atual: confirmação de pedido\nResultado esperado: 422 com quantidade e cep'
        },
        question: quiz('Que divisão de trabalho resolve o chamado de ponta a ponta?', [
          ['Validar no backend e mapear os erros por campo no frontend.', 'A API protege todos os clientes e a interface diz exatamente o que ajustar.'],
          ['Colocar a regra somente no campo de CEP do frontend.', 'Chamadas diretas à API ainda poderiam registrar um pedido inválido.'],
          ['Devolver um erro genérico do banco e exibir um alerta.', 'O alerta deixa a pessoa sem saber quais campos corrigir.']
        ], 0)
      },
      backend: {
        goal: 'Em responder(pedido), aceite quantidade inteira de 1 a 99 e CEP em texto com oito dígitos. Para um pedido válido, retorne {status: 201, body: {id: 981}}. Para dados inválidos, retorne {status: 422, body: {erros}}, com os nomes "quantidade" e "cep" na ordem em que aparecem aqui.',
        functionName: 'responder',
        starter: `function responder(pedido) {
  return {status: 201, body: {id: 981}};
}`,
        answer: `function responder(pedido) {
  const {quantidade, cep} = pedido;
  const erros = [];
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
    erros.push('quantidade');
  }
  if (typeof cep !== 'string' || !/^[0-9]{8}$/.test(cep)) {
    erros.push('cep');
  }
  if (erros.length) return {status: 422, body: {erros}};
  return {status: 201, body: {id: 981}};
}`,
        hints: [
          'Number.isInteger diferencia o número 2 do texto "2".',
          'Verifique o tipo do CEP antes de testar /^[0-9]{8}$/ para preservar zeros à esquerda.',
          'Acumule os dois erros antes de decidir entre 201 e 422.'
        ],
        tests: [
          ...backendTests(cadastro),
          test('Quantidade enviada como texto', [{quantidade: '2', cep: '01234000'}], erroPedido('quantidade'))
        ],
        note: 'O laboratório simula a resposta com ID fixo 981. No produto, a API valida o JSON já interpretado e usa o ID gerado pela gravação.'
      },
      frontend: {
        goal: 'Em renderizar({status, body}), use state "success", message "Pedido criado." e items [{id: "pedido", label: "Pedido", detail: "#" + body.id}] para 201. Em 422, use state "error", message "Revise os campos indicados." e um item por campo na ordem de body.erros. Para "quantidade", use id "quantidade", label "Quantidade" e detail "Informe um inteiro de 1 a 99.". Para "cep", use id "cep", label "CEP" e detail "Informe oito dígitos.". Em outros status, devolva state "error" e message "Não foi possível criar o pedido.".',
        functionName: 'renderizar',
        starter: `function renderizar({status, body}) {
  if (status === 201) {
    return {
      state: 'success',
      message: 'Pedido criado.',
      items: [{id: 'pedido', label: 'Pedido', detail: '#' + body.id}]
    };
  }
  return {state: 'error', message: 'Não foi possível criar o pedido.'};
}`,
        answer: `function renderizar({status, body}) {
  if (status === 201) {
    return {
      state: 'success',
      message: 'Pedido criado.',
      items: [{id: 'pedido', label: 'Pedido', detail: '#' + body.id}]
    };
  }
  if (status === 422) {
    const campos = {
      quantidade: {label: 'Quantidade', detail: 'Informe um inteiro de 1 a 99.'},
      cep: {label: 'CEP', detail: 'Informe oito dígitos.'}
    };
    return {
      state: 'error',
      message: 'Revise os campos indicados.',
      items: body.erros.map(id => ({id, ...campos[id]}))
    };
  }
  return {state: 'error', message: 'Não foi possível criar o pedido.'};
}`,
        hints: [
          'Parta de body.erros e use um mapa de texto por campo.',
          'Devolva o id do campo junto com o rótulo e a instrução para a tela poder ligar cada mensagem ao input correspondente.'
        ],
        tests: [
          ...frontendTests(cadastro),
          test('Erro inesperado tem mensagem própria', [response(503, {})], view('error', 'Não foi possível criar o pedido.'))
        ],
        note: 'Aqui você monta o estado que alimenta a prévia. No formulário real, associe o texto ao input e preserve o que a pessoa digitou para facilitar a correção.'
      },
      integration: cadastro,
      handoff: {
        channel: '#qualidade',
        slack: 'Cris, o FS-204 está pronto para teste. Em homologação, tente quantidade 0 com CEP 123. O POST deve devolver 422 e o formulário deve apontar os dois campos. Depois use quantidade 1 e CEP 01234000 e confira a confirmação com o ID.',
        pr: 'Valida quantidade e CEP no endpoint de criação e traduz os erros 422 em orientações por campo no formulário. Cobri o pedido válido com CEP começando em zero, o envio com dois campos inválidos e o CEP enviado como número.'
      },
      recall: [
        quiz('O CEP "01234000" virou 1234000 antes de sair da tela. Onde corrigir primeiro?', [
          ['No formato enviado pelo frontend, preservando o CEP como texto.', 'A API precisa receber os oito caracteres, inclusive o zero.'],
          ['No código de status da API.', 'O status relata a validação, mas não restaura o zero perdido.'],
          ['Na mensagem de sucesso.', 'O problema acontece no payload antes do envio.']
        ], 0),
        quiz('A API devolveu 422 para dois campos. Como reduzir a próxima rodada de tentativa e erro?', [
          ['Exibir a mensagem de quantidade e aguardar novo envio para mostrar o CEP.', 'Isso obriga a pessoa a descobrir os problemas em tentativas separadas.'],
          ['Exibir cada orientação junto ao seu campo e preservar os valores digitados.', 'A pessoa sabe o que corrigir e mantém o restante do formulário.'],
          ['Limpar todos os campos e pedir que a pessoa tente de novo.', 'Os dados já preenchidos teriam de ser refeitos.']
        ], 1),
        quiz('Qual evidência do teste de integração interessa ao QA?', [
          ['Uma captura mostrando que o botão Enviar está visível.', 'A captura não mostra o resultado da operação.'],
          ['Apenas o total de linhas editadas no PR.', 'Linhas alteradas não demonstram a interação entre API e interface.'],
          ['O 422 da API e as duas orientações exibidas na tela para a mesma tentativa.', 'Os dois lados ficam ligados pelo mesmo caso reproduzível.']
        ], 2)
      ],
      refs: [
        ref('RFC 9110 · Respostas 422', 'https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.21'),
        ref('W3C · Identificação de erros em formulários', 'https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html')
      ]
    },
    {
      id: 'FS-205',
      title: 'O cupom que precisa fechar a conta',
      category: 'Carrinho e promoções',
      description: 'Calcule a prévia no backend e mostre desconto, total ou orientação de correção na interface.',
      minutes: 35,
      icon: 'layers',
      theme: 'mint',
      skills: ['Regras de preço', 'Valores em centavos', 'Contrato de API', 'Revisão de PR'],
      story: {
        person: 'Bia',
        role: 'Produto',
        message: 'Na campanha de boas-vindas, a tela calcula 10% na hora. Recebemos print de um desconto prometido depois que a campanha expirou. Quero que a prévia venha do servidor.',
        criteria: [
          'A API calcula a prévia com o total do carrinho que o servidor já conhece.',
          'Código inválido, data de expiração e cota esgotada retornam motivos distintos.',
          'A tela mostra os valores da resposta em reais ou a mensagem do motivo recebido.'
        ],
        evidence: {
          label: 'Chamado da campanha',
          code: 'Carrinho no servidor: 10599 centavos\nCupom BEMVINDO: 10%\nHorário da tentativa: igual ao vencimento\nTela atual: desconto aplicado'
        },
        question: quiz('Onde o cálculo da prévia deve acontecer?', [
          ['Na tela, com o percentual que a campanha anunciou.', 'A tela ainda pode usar uma regra desatualizada ou desconhecer a cota.'],
          ['Na API, com os dados do carrinho e da campanha que estão no servidor.', 'A interface pode apresentar o preço e o motivo devolvidos pela mesma regra de negócio.'],
          ['Em um comentário no Jira antes de cada compra.', 'O Jira registra critérios e resultados de teste. A API atende a requisição da compra.']
        ], 1)
      },
      backend: {
        goal: 'Em responder({codigo}, {totalCentavos, agora, cupom}), confira, nesta ordem, código igual a cupom.codigo, agora menor que cupom.expiraEm e cupom.restantes maior que zero. Em falha devolva 422 com body {codigo: "CUPOM_INVALIDO"}, {codigo: "CUPOM_EXPIRADO"} ou {codigo: "LIMITE_ATINGIDO"}, conforme a regra que falhou. Em sucesso, devolva 200 com body {descontoCentavos, totalCentavos}, onde o desconto arredonda para baixo e o total já vem com o desconto aplicado.',
        functionName: 'responder',
        starter: `function responder({codigo}, {totalCentavos, agora, cupom}) {
  const descontoCentavos = Math.floor(totalCentavos * cupom.percentual / 100);
  return {
    status: 200,
    body: {descontoCentavos, totalCentavos: totalCentavos - descontoCentavos}
  };
}`,
        answer: `function responder({codigo}, {totalCentavos, agora, cupom}) {
  if (codigo !== cupom.codigo) {
    return {status: 422, body: {codigo: 'CUPOM_INVALIDO'}};
  }
  if (agora >= cupom.expiraEm) {
    return {status: 422, body: {codigo: 'CUPOM_EXPIRADO'}};
  }
  if (cupom.restantes <= 0) {
    return {status: 422, body: {codigo: 'LIMITE_ATINGIDO'}};
  }
  const descontoCentavos = Math.floor(totalCentavos * cupom.percentual / 100);
  return {
    status: 200,
    body: {descontoCentavos, totalCentavos: totalCentavos - descontoCentavos}
  };
}`,
        hints: [
          'Compare o horário da tentativa com o vencimento. Na igualdade, o cupom já expirou.',
          'Use o total do segundo argumento para calcular o desconto e use Math.floor para a política de arredondamento deste produto.'
        ],
        tests: [
          ...backendTests(cupom),
          test('Código desconhecido', [{codigo: 'OUTRO'}, carrinho], erroCupom('CUPOM_INVALIDO'))
        ],
        note: 'Esta operação calcula uma prévia com dados simulados. No checkout, o servidor confirma de novo a elegibilidade e registra o uso do cupom junto com a operação de compra.'
      },
      frontend: {
        goal: 'Em renderizar({status, body}), mantenha a resposta 200 do código inicial. Ela retorna state "success", message "Cupom aplicado à prévia." e os items "desconto" e "total" com valores formatados. Para 422, retorne state "error" e message "Código de cupom inválido." para CUPOM_INVALIDO, "Este cupom expirou." para CUPOM_EXPIRADO e "O limite de uso deste cupom foi atingido." para LIMITE_ATINGIDO. Em outros casos, use state "error" e message "Não foi possível calcular o desconto.".',
        functionName: 'renderizar',
        starter: `function renderizar({status, body}) {
  if (status === 200) {
    const reais = centavos => 'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');
    return {
      state: 'success',
      message: 'Cupom aplicado à prévia.',
      items: [
        {id: 'desconto', label: 'Desconto', detail: reais(body.descontoCentavos)},
        {id: 'total', label: 'Total', detail: reais(body.totalCentavos)}
      ]
    };
  }
  return {state: 'error', message: 'Não foi possível calcular o desconto.'};
}`,
        answer: `function renderizar({status, body}) {
  if (status === 200) {
    const reais = centavos => 'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');
    return {
      state: 'success',
      message: 'Cupom aplicado à prévia.',
      items: [
        {id: 'desconto', label: 'Desconto', detail: reais(body.descontoCentavos)},
        {id: 'total', label: 'Total', detail: reais(body.totalCentavos)}
      ]
    };
  }
  const generica = 'Não foi possível calcular o desconto.';
  const mensagens = new Map([
    ['CUPOM_INVALIDO', 'Código de cupom inválido.'],
    ['CUPOM_EXPIRADO', 'Este cupom expirou.'],
    ['LIMITE_ATINGIDO', 'O limite de uso deste cupom foi atingido.']
  ]);
  return {state: 'error', message: status === 422 ? mensagens.get(body.codigo) ?? generica : generica};
}`,
        hints: [
          'Use body.codigo para escolher o texto quando status for 422.',
          'Use a mensagem genérica quando o motivo recebido for desconhecido.'
        ],
        tests: [
          ...frontendTests(cupom),
          test('Código desconhecido recebe instrução específica', [erroCupom('CUPOM_INVALIDO')], view('error', 'Código de cupom inválido.')),
          test('Falha de serviço recebe aviso genérico', [response(503, {})], view('error', 'Não foi possível calcular o desconto.'))
        ],
        note: 'O modelo da tela formata os centavos devolvidos pela API. O arredondamento de negócio já aconteceu no servidor.'
      },
      integration: cupom,
      handoff: {
        channel: '#produto',
        slack: 'Bia, a prévia do FS-205 já pode ser validada. Com BEMVINDO e carrinho de R$ 105,99, confira R$ 10,59 de desconto e total de R$ 95,40. Teste também o vencimento exato e a cota zero, cada um com seu aviso.',
        pr: 'Calcula no servidor a prévia do cupom com o carrinho atual e devolve valores em centavos. A interface usa o total da resposta e traduz motivos conhecidos. Validei cupom disponível, expirado, cota esgotada e código desconhecido.'
      },
      recall: [
        quiz('A API devolveu totalCentavos 9540. O que a tela faz?', [
          ['Aplica os 10% mais uma vez.', 'O valor da resposta já inclui o desconto.'],
          ['Formata 9540 centavos para exibição como R$ 95,40.', 'A interface apresenta a decisão de preço que já veio do servidor.'],
          ['Mostra 9540 reais como o total.', 'A unidade do contrato é centavos.']
        ], 1),
        quiz('A prévia aceitou o cupom. Minutos depois a pessoa confirmou a compra. O que o servidor verifica?', [
          ['Disponibilidade atual do cupom e registro do uso junto da compra.', 'A elegibilidade pode mudar entre a prévia e a confirmação.'],
          ['Apenas se o botão de pagamento estava visível.', 'Visibilidade do botão não confirma cota ou vencimento.'],
          ['A mensagem que apareceu no Slack.', 'A atualização da equipe não participa da transação de compra.']
        ], 0),
        quiz('O backend adicionou um motivo de falha que a versão atual da tela ainda não conhece. Qual resultado é melhor?', [
          ['Exibir a confirmação de desconto.', 'A confirmação indicaria um desconto que não foi concedido.'],
          ['Deixar a área vazia.', 'A pessoa ficaria sem retorno sobre a tentativa.'],
          ['Exibir a mensagem genérica de falha e registrar o motivo no diagnóstico.', 'A tela dá retorno útil e a equipe pode incluir o novo motivo no contrato.']
        ], 2)
      ],
      refs: [
        ref('Stripe · Cupons e códigos promocionais', 'https://docs.stripe.com/payments/checkout/discounts'),
        ref('Stripe · Valores em unidades monetárias mínimas', 'https://docs.stripe.com/currencies#minor-units')
      ]
    },
    {
      id: 'FS-206',
      title: 'A janela de entrega acabou de fechar',
      category: 'Logística e concorrência',
      description: 'Confirme vaga no servidor e faça a tela orientar o cliente quando o agendamento mudou.',
      minutes: 35,
      icon: 'activity',
      theme: 'orange',
      skills: ['PATCH', 'HTTP 409', 'Estado de interface', 'QA de integração'],
      story: {
        person: 'Mauro',
        role: 'Operações',
        message: 'A tela mostrou duas vagas para 17h, mas uma pessoa levou tempo para confirmar. Quando voltou, o pedido já tinha saído para entrega. Mesmo assim o portal mostrou o novo horário.',
        criteria: [
          'A API confirma que o pedido ainda está em preparação e a janela tem vaga.',
          'Janela lotada e pedido em rota retornam 409 com códigos distintos.',
          'A tela só mostra o novo horário depois do 200 e explica como reagir a cada conflito.'
        ],
        evidence: {
          label: 'Registro do pedido 481',
          code: '15:05 · formulário carrega janela 17–19\n15:07 · logística coloca pedido em rota\n15:10 · cliente confirma a janela\n15:10 · portal exibe reagendamento'
        },
        question: quiz('Que verificação precisa acontecer depois do clique em confirmar?', [
          ['Verificar a cor do botão que foi clicado.', 'A cor do botão não representa o estado atual do pedido.'],
          ['Ler apenas a lista de horários salva na tela.', 'A lista pode ficar desatualizada enquanto o cliente decide.'],
          ['Revalidar vaga e situação do pedido na API e tratar a resposta na tela.', 'A resposta decide se o horário foi confirmado ou se a pessoa precisa reagir a um conflito.']
        ], 2)
      },
      backend: {
        goal: 'Em responder({janela}, {pedido, janelas}), o status do pedido pode ser "preparando" ou "em_rota". Para "em_rota", devolva 409 com body {codigo: "PEDIDO_EM_ROTA"}. Em preparação, busque a janela pelo id. Use 422 com {codigo: "JANELA_INVALIDA"} quando ela não existir e 409 com {codigo: "SEM_VAGAS"} quando as vagas forem zero. Em sucesso, retorne 200 com body {id: pedido.id, janela: slot.id, rotulo: slot.rotulo}.',
        functionName: 'responder',
        starter: `function responder({janela}, {pedido, janelas}) {
  const slot = janelas.find(item => item.id === janela);
  if (!slot) return {status: 422, body: {codigo: 'JANELA_INVALIDA'}};
  return {status: 200, body: {id: pedido.id, janela: slot.id, rotulo: slot.rotulo}};
}`,
        answer: `function responder({janela}, {pedido, janelas}) {
  if (pedido.status === 'em_rota') {
    return {status: 409, body: {codigo: 'PEDIDO_EM_ROTA'}};
  }
  const slot = janelas.find(item => item.id === janela);
  if (!slot) return {status: 422, body: {codigo: 'JANELA_INVALIDA'}};
  if (slot.vagas <= 0) return {status: 409, body: {codigo: 'SEM_VAGAS'}};
  return {status: 200, body: {id: pedido.id, janela: slot.id, rotulo: slot.rotulo}};
}`,
        hints: [
          'Resolva primeiro o conflito de estado do pedido.',
          'Array.find localiza a janela solicitada. Confira a existência e a capacidade antes do retorno 200.'
        ],
        tests: [
          ...backendTests(reagendamento),
          test('Janela desconhecida', [{janela: '21-23'}, agenda], response(422, {codigo: 'JANELA_INVALIDA'}))
        ],
        note: 'O laboratório usa um retrato do pedido e da agenda. No produto, reserve a vaga e atualize o pedido de forma atômica, com a checagem de disponibilidade protegida contra concorrência.'
      },
      frontend: {
        goal: 'Em renderizar({status, body}), mantenha a resposta 200 do código inicial. Em 409, devolva state "conflict" e message "Horário indisponível. Escolha outra janela." para SEM_VAGAS, ou "O pedido já está em rota." para PEDIDO_EM_ROTA. Em 422 com JANELA_INVALIDA, devolva state "error" e message "Selecione um horário da lista.". Nos demais casos, use state "error" e message "Não foi possível reagendar.".',
        functionName: 'renderizar',
        starter: `function renderizar({status, body}) {
  if (status === 200) {
    return {
      state: 'success',
      message: 'Entrega reagendada.',
      items: [{id: 'janela', label: 'Novo horário', detail: body.rotulo}]
    };
  }
  return {state: 'error', message: 'Não foi possível reagendar.'};
}`,
        answer: `function renderizar({status, body}) {
  if (status === 200) {
    return {
      state: 'success',
      message: 'Entrega reagendada.',
      items: [{id: 'janela', label: 'Novo horário', detail: body.rotulo}]
    };
  }
  if (status === 409 && body.codigo === 'SEM_VAGAS') {
    return {state: 'conflict', message: 'Horário indisponível. Escolha outra janela.'};
  }
  if (status === 409 && body.codigo === 'PEDIDO_EM_ROTA') {
    return {state: 'conflict', message: 'O pedido já está em rota.'};
  }
  if (status === 422 && body.codigo === 'JANELA_INVALIDA') {
    return {state: 'error', message: 'Selecione um horário da lista.'};
  }
  return {state: 'error', message: 'Não foi possível reagendar.'};
}`,
        hints: [
          'Há dois conflitos com o mesmo HTTP 409. Diferencie o próximo passo pela propriedade body.codigo.',
          'O rótulo confirmado vem da resposta 200. Se houver conflito, mostre a mensagem correspondente.'
        ],
        tests: [
          ...frontendTests(reagendamento),
          test('Janela desconhecida pede seleção', [response(422, {codigo: 'JANELA_INVALIDA'})],
            view('error', 'Selecione um horário da lista.'))
        ],
        note: 'Na interface real, um conflito por falta de vaga também pode atualizar a lista de janelas disponíveis.'
      },
      integration: reagendamento,
      handoff: {
        channel: '#operacoes',
        slack: 'Mauro, a correção do FS-206 está pronta para revisão. Rodei três cenários no pedido 481. A vaga disponível confirma 17h–19h, a vaga esgotada pede outro horário e o pedido em rota mantém o agendamento atual.',
        pr: 'Revalida disponibilidade e estado do pedido no PATCH de reagendamento. A tela só confirma o horário após 200 e mostra instruções diferentes para os dois conflitos 409. Incluí os três cenários no teste integrado.'
      },
      recall: [
        quiz('Duas pessoas tentam reservar a última vaga ao mesmo tempo. O que protege a operação?', [
          ['Uma atualização atômica da capacidade com a gravação do novo horário.', 'A mesma vaga precisa ser confirmada uma única vez, inclusive com requisições concorrentes.'],
          ['Conferir a capacidade no frontend antes de cada clique.', 'As duas telas podem ter visto a mesma vaga livre.'],
          ['Um texto maior no botão de confirmação.', 'O texto não altera a disponibilidade registrada no servidor.']
        ], 0),
        quiz('A API respondeu 409 com SEM_VAGAS. O que a interface deve fazer?', [
          ['Confirmar o horário, pois a janela existia quando a tela abriu.', 'O conflito informa que a vaga mudou desde a consulta inicial.'],
          ['Orientar a escolha de outra janela e atualizar a disponibilidade.', 'O cliente recebe uma ação coerente com a capacidade atual.'],
          ['Mostrar a mesma instrução que usaria para um pedido já em rota.', 'Um pedido em rota e uma janela lotada exigem próximos passos distintos.']
        ], 1),
        quiz('Como QA reproduz a diferença entre disponibilidade antiga e atual?', [
          ['Clicar duas vezes no botão e observar o layout.', 'O teste precisa controlar a mudança de estado que gera o conflito.'],
          ['Consultar o cronograma da sprint.', 'O cronograma do time não altera os dados de disponibilidade.'],
          ['Abrir o formulário com vaga, ocupar a vaga em outro fluxo e só então confirmar.', 'A sequência reproduz a janela desatualizada antes da confirmação.']
        ], 2)
      ],
      refs: [
        ref('RFC 5789 · Tratamento de erro em PATCH', 'https://www.rfc-editor.org/rfc/rfc5789.html#section-2.2'),
        ref('RFC 9110 · Respostas 409', 'https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.10'),
        ref('Microsoft Learn · Transações no SQL Server', 'https://learn.microsoft.com/en-us/sql/t-sql/language-elements/transactions-transact-sql')
      ]
    }
  ];
})();
