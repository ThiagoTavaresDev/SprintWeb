window.deliveryMissions = (() => {
  const pergunta = (prompt, choices, answer, feedback) => ({prompt, choices, answer, feedback});
  const caso = (label, args, expected) => ({label, args, expected});

  return [
    {
      id: 'WEB-127', category: 'GitHub Actions', title: 'O CI que testa o caminho certo',
      description: 'Direcione as suítes pelos arquivos alterados e mantenha um check obrigatório em cada PR.',
      minutes: 11, icon: 'git', theme: 'orange', skills: ['GitHub Actions', 'Monorepo', 'Checks'],
      story: {
        person: 'Lia', role: 'Revisora de código',
        message: 'A pipeline executa três suítes até quando alteramos só a documentação. Tentamos limitar o workflow inteiro aos diretórios de código e o PR de documentação ficou esperando pelo check obrigatório.',
        criteria: ['Todo PR publica o check básico.', 'Cada pasta dispara a suíte da sua área.', 'Alterações em package-lock.json disparam todas as suítes.'],
        evidence: {label: 'GitHub · PR de documentação', code: 'diff: docs/manual.md\nworkflow: ci\nrequired check: Waiting for status to be reported'},
        question: pergunta('Qual desenho mantém o check obrigatório e reduz o tempo de execução?',
          ['Retirar a exigência do check em todos os PRs.', 'Manter o workflow em todo PR e usar os caminhos para selecionar suítes dentro dele.', 'Filtrar o workflow inteiro pelos três diretórios.'], 1,
          ['O check ainda é útil como evidência do PR.', 'O workflow publica a verificação básica e roda as suítes relevantes.', 'O PR de documentação ainda ficaria sem o check exigido.'])
      },
      lab: {
        goal: 'Implemente selecionarChecks(arquivos). Retorne sempre ["basico"] e acrescente, nesta ordem e no máximo uma vez, "interface" se houver web/, "api" se houver api/ e "sql" se houver db/. Se package-lock.json na raiz mudou, acrescente as três.',
        functionName: 'selecionarChecks',
        starter: `function selecionarChecks(arquivos) {
  return ['basico', 'interface', 'api', 'sql'];
}`,
        answer: `function selecionarChecks(arquivos) {
  const checks = ['basico'];
  const mudouLock = arquivos.includes('package-lock.json');
  for (const [pasta, check] of [['web/', 'interface'], ['api/', 'api'], ['db/', 'sql']]) {
    if (mudouLock || arquivos.some(arquivo => arquivo.startsWith(pasta))) {
      checks.push(check);
    }
  }
  return checks;
}`,
        hints: ['Comece pelo check básico.', 'Use some para conferir se algum arquivo tem o prefixo do diretório.'],
        tests: [
          caso('Lockfile muda as três suítes', [['package-lock.json']], ['basico', 'interface', 'api', 'sql']),
          caso('Documentação mantém apenas o básico', [['docs/manual.md']], ['basico']),
          caso('Duas áreas sem repetir checks', [['db/001.sql', 'web/home.js', 'web/busca.js']], ['basico', 'interface', 'sql']),
          caso('Nome de pasta semelhante mantém apenas o básico', [['api-backup/x.js']], ['basico']),
          caso('Mudança em pedido roda a suíte de API', [['api/pedidos.js']], ['basico', 'api']),
          caso('Lockfile aninhado não aciona as três suítes', [['web/package-lock.json']], ['basico', 'interface'])
        ]
      },
      delivery: {
        ...pergunta('Qual validação registra no PR?', ['Só um print do tempo menor.', 'Só uma confirmação para mudança em SQL.', 'PR de documentação com check básico, PR de API com sua suíte e lockfile com as três.'], 2,
          ['O tempo não demonstra que a regra de proteção continua funcionando.', 'O cenário de documentação é a origem do bloqueio.', 'Os três exemplos validam o check, a seleção e a alteração compartilhada.']),
        artifact: {label: 'Comentário no PR', text: 'WEB-127 · O workflow roda em todo PR e a decisão de suítes usa os arquivos do diff. Validei documentação com check básico, mudança em API com a suíte de API e lockfile com as três suítes. Conferir o nome do check exigido na regra da branch.'}
      },
      recall: [
        pergunta('Duas telas e uma migração mudaram. Quais verificações saem?', ['Básico, interface e SQL.', 'Interface duas vezes e SQL.', 'Apenas API.'], 0, ['Cada área aparece uma vez e o básico sempre roda.', 'Arquivos da mesma área compartilham uma suíte.', 'Nenhum caminho está na área da API.']),
        pergunta('O PR só corrige um erro de digitação no manual. Qual check precisa chegar à branch?', ['Nenhum.', 'O check básico.', 'As três suítes de código.'], 1, ['A proteção espera pelo check básico.', 'A regra continua satisfeita com verificação básica.', 'A mudança de documentação não pede suítes de código.']),
        pergunta('Por que uma mudança no lockfile da raiz amplia a seleção?', ['Todo arquivo JSON muda o schema SQL.', 'A extensão obriga as suítes.', 'Dependências compartilhadas podem afetar as três áreas.'], 2, ['A regra se aplica ao lockfile da raiz.', 'A extensão por si só não demonstra impacto.', 'As suítes cobrem a mudança transversal.'])
      ],
      refs: [{label: 'GitHub · Checks obrigatórios e filtros', url: 'https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks'}]
    },
    {
      id: 'WEB-128', category: 'Testes', title: 'O teste que falha à meia-noite',
      description: 'Torne a validade de um link de confirmação reproduzível usando um relógio controlado.',
      minutes: 10, icon: 'terminal', theme: 'violet', skills: ['Testes determinísticos', 'Date', 'Valores de fronteira'],
      story: {
        person: 'Rafa', role: 'Engenheiro de qualidade',
        message: 'O teste do link de confirmação depende da hora da máquina. O resultado muda entre execuções e descobrimos outro detalhe: no instante exato de expiração o link ainda abre.',
        criteria: ['A regra recebe o instante atual como argumento.', 'O link é válido somente antes do prazo.', 'Teste antes, no instante do prazo e depois.'],
        evidence: {label: 'Trecho do teste original', code: 'const expiracao = Date.parse("2026-11-30T00:00:00Z");\nassert.equal(linkValido(expiracao, Date.now()), true);\n// Expectativa fixa com um relógio que avança.'},
        question: pergunta('Qual abordagem deixa o teste previsível e cobre a regra de negócio?',
          ['Mudar o prazo para um ano distante.', 'Reexecutar o CI se falhar perto do prazo.', 'Passar instantes fixos e verificar os dois lados do limite e a igualdade.'], 2,
          ['A expectativa continuaria presa ao relógio real.', 'Uma nova execução ainda usa um relógio fora do controle do teste.', 'Entradas fixas reproduzem o mesmo cenário, inclusive o limite.'])
      },
      lab: {
        goal: 'Corrija linkValido(expiraEm, agora). Os dois valores são timestamps em milissegundos. Retorne true somente quando agora for estritamente anterior a expiraEm.',
        functionName: 'linkValido',
        starter: `function linkValido(expiraEm, agora) {
  return agora <= expiraEm;
}`,
        answer: `function linkValido(expiraEm, agora) {
  return agora < expiraEm;
}`,
        note: 'O código que chama a regra em produção pode passar Date.now(). No teste, o instante é um argumento fixo.',
        hints: ['O teste de igualdade diferencia as duas regras.', 'O operador < exige que agora seja anterior.'],
        tests: [
          caso('Um milissegundo antes ainda vale', [1795996800000, 1795996799999], true),
          caso('No instante do prazo já expirou', [1795996800000, 1795996800000], false),
          caso('Um milissegundo depois já expirou', [1795996800000, 1795996800001], false)
        ]
      },
      delivery: {
        ...pergunta('O que vale registrar na descrição da mudança?', ['A regra recebe agora, expira na igualdade e tem testes nos três pontos do limite.', 'O teste passou na minha máquina de manhã.', 'O link foi configurado para sempre abrir no CI.'], 0,
          ['O revisor entende a regra e como o teste a reproduz.', 'O horário local não constitui um teste reproduzível.', 'O CI precisa validar a regra real.']),
        artifact: {label: 'Descrição do PR de teste', text: 'WEB-128 · A validade do link usa o instante recebido. No prazo exato, o link já expirou. Validei um milissegundo antes, no prazo e um milissegundo depois com timestamps fixos.'}
      },
      recall: [
        pergunta('O teste de vencimento passou ontem e falhou hoje com a mesma versão. Qual dado verificar primeiro?', ['A cor do botão.', 'O uso de Date.now() durante a asserção.', 'O nome da branch.'], 1, ['O estilo não muda a entrada temporal.', 'O relógio do ambiente pode ter mudado o cenário.', 'O teste recebe um horário variável independentemente do nome.']),
        pergunta('Prazo 1000 e relógio 1000. Qual retorno vale para esta regra?', ['false.', 'true.', 'Depende do fuso.'], 0, ['A validade termina no próprio instante 1000.', 'A comparação é estritamente anterior.', 'Os timestamps já representam instantes.']),
        pergunta('Como testar um link um instante após expirar?', ['Esperar até o horário real.', 'Aumentar a tolerância do CI.', 'Passar ao teste agora igual ao prazo mais 1 ms.'], 2, ['A espera real deixa o teste lento e variável.', 'O limite faz parte do contrato do produto.', 'O caso cobre o lado expirado sem esperar.'])
      ],
      refs: [{label: 'Node.js · Controle de Date em testes', url: 'https://nodejs.org/api/test.html#dates'}]
    },
    {
      id: 'WEB-129', category: 'Testes', title: 'O mock de frete que escondeu o erro',
      description: 'Verifique as respostas de exemplo usadas pelo portal contra o contrato de que a tela depende.',
      minutes: 12, icon: 'terminal', theme: 'blue', skills: ['Mock', 'Teste de contrato', 'QA'],
      story: {
        person: 'Bruna', role: 'Engenheira de frontend',
        message: 'O teste de frete estava verde, mas o mock antigo aceitava um preço como string. Em homologação, o portal consumiu um exemplo desatualizado. Quero validar os campos que o checkout realmente lê.',
        criteria: ['HTTP 200 exige tarifa em centavos e prazo em dias, ambos inteiros não negativos.', 'HTTP 422 exige o código CEP_INVALIDO.', 'Campos extras podem existir.'],
        evidence: {label: 'Exemplo de resposta usado pelo mock', code: 'HTTP 200\n{ "tarifaCentavos": "1290", "prazoDias": 2 }\n\nO checkout depende de tarifaCentavos como número.'},
        question: pergunta('O que vale conferir num teste de contrato do consumidor?',
          ['Se o código HTTP e os campos usados pelo checkout respeitam os tipos e os casos esperados.', 'Se toda chave de uma resposta grande aparece sempre na mesma ordem.', 'Se o checkout recebeu algum objeto.'], 0,
          ['São essas partes que sustentam o comportamento observado pelo consumidor.', 'Campos extras e a ordem das chaves podem variar sem quebrar a tela.', 'Um objeto qualquer ainda pode trazer campos incompatíveis.'])
      },
      lab: {
        goal: 'Implemente respostaFreteValida(status, corpo). Em 200 exija tarifaCentavos e prazoDias inteiros não negativos. Em 422 exija codigo igual a "CEP_INVALIDO". Para outros status ou corpo nulo retorne false. Ignore campos extras.',
        functionName: 'respostaFreteValida',
        starter: `function respostaFreteValida(status, corpo) {
  return status === 200 && corpo !== null && 'tarifaCentavos' in corpo;
}`,
        answer: `function respostaFreteValida(status, corpo) {
  if (!corpo || typeof corpo !== 'object') return false;
  if (status === 422) return corpo.codigo === 'CEP_INVALIDO';
  if (status !== 200) return false;
  return Number.isInteger(corpo.tarifaCentavos) && corpo.tarifaCentavos >= 0
    && Number.isInteger(corpo.prazoDias) && corpo.prazoDias >= 0;
}`,
        note: 'Este laboratório valida exemplos localmente. Um teste de contrato completo também verifica as interações contra o provedor.',
        hints: ['Trate os status de sucesso e validação separadamente.', 'Use Number.isInteger para conferir o tipo e o formato do número.'],
        tests: [
          caso('Sucesso com campo adicional', [200, {tarifaCentavos:1290, prazoDias:2, transportadora:'Pássaro'}], true),
          caso('Frete grátis e entrega no mesmo dia', [200, {tarifaCentavos:0, prazoDias:0}], true),
          caso('Preço em string viola o contrato', [200, {tarifaCentavos:'1290', prazoDias:2}], false),
          caso('CEP inválido conhecido', [422, {codigo:'CEP_INVALIDO'}], true),
          caso('Outro erro não cobre CEP inválido', [422, {codigo:'SEM_ESTOQUE'}], false),
          caso('Sucesso sem corpo', [200, null], false)
        ]
      },
      delivery: {
        ...pergunta('Como coordenar a correção com o time do serviço de frete?', ['Alterar apenas o texto do mock.', 'Compartilhar os dois exemplos e pedir verificação contra o serviço provedor.', 'Fixar a ordenação de todas as chaves no backend.'], 1,
          ['A divergência ainda pode existir no serviço real.', 'Os exemplos registram as expectativas do consumidor e guiam a verificação do provedor.', 'O consumidor depende dos valores e tipos definidos.']),
        artifact: {label: 'Mensagem para o time de frete', text: 'WEB-129 · O checkout espera 200 com tarifaCentavos e prazoDias inteiros, e 422 com codigo CEP_INVALIDO. Atualizei os exemplos do mock e acrescentei o caso de preço como string. Favor verificar essas interações no serviço de frete.'}
      },
      recall: [
        pergunta('Uma resposta de frete ganhou o campo transportadora. A tela ainda usa somente tarifaCentavos e prazoDias. Como o teste reage?', ['Aceita se os campos esperados continuam válidos.', 'Falha sempre que houver uma chave a mais.', 'Exige remover o campo novo.'], 0, ['O contrato testado registra as partes de que o checkout depende.', 'Uma chave adicional não afeta esse consumidor.', 'O campo novo pode atender outros consumidores.']),
        pergunta('O provedor retornou 200 sem prazoDias. Como classificar?', ['Compatível porque 200 indica sucesso.', 'Compatível se a tarifa for positiva.', 'Incompatível com o contrato do checkout.'], 2, ['O sucesso HTTP ainda precisa do corpo acordado.', 'O prazo também é obrigatório.', 'A tela precisa do prazo para mostrar a estimativa.']),
        pergunta('O mock cobre o caso de CEP inválido. Qual passo aumenta a confiança antes de integrar?', ['Adicionar um prazo ao exemplo de erro.', 'Verificar a mesma interação contra o provedor.', 'Aceitar todos os status de erro.'], 1, ['O caso de erro depende do código definido.', 'A verificação confere o lado do serviço.', 'Cada erro pode pedir uma ação diferente do consumidor.'])
      ],
      refs: [{label: 'Pact · Interações e verificação do provedor', url: 'https://docs.pact.io/getting_started/how_pact_works'}]
    },
    {
      id: 'WEB-130', category: 'Git', title: 'Duas branches, uma ação no pedido',
      description: 'Resolva o conflito entre rastreamento e retirada preservando o comportamento das duas branches.',
      minutes: 13, icon: 'git', theme: 'orange', skills: ['Git', 'Conflito de merge', 'Revisão'],
      story: {
        person: 'Nina', role: 'Desenvolvedora web',
        message: 'Seu PR de retirada conflitou com a branch principal. A outra mudança colocou o botão de rastreamento nos pedidos enviados. Precisamos conservar os dois fluxos.',
        criteria: ['Pedido enviado mostra rastreamento.', 'Pedido pronto para retirada mostra a ação somente quando habilitada.', 'Demais pedidos não exibem ação.'],
        evidence: {label: 'git diff · ação do pedido', code: '<<<<<<< HEAD\nif (status === "pronto_retirada" && retiradaAtiva) return "retirar";\n=======\nif (status === "enviado") return "rastrear";\n>>>>>>> main\nreturn "ocultar";'},
        question: pergunta('Qual resolução preserva a intenção de cada branch?',
          ['Escolher somente a versão da branch principal.', 'Escolher somente a versão do PR.', 'Combinar as duas regras e conferir os estados em um teste de regressão.'], 2,
          ['O portal perderia a retirada habilitada.', 'O rastreamento de pedidos enviados desapareceria.', 'Cada condição trata um estado distinto do pedido.'])
      },
      lab: {
        goal: 'Implemente acaoPedido(status, retiradaAtiva). Retorne "rastrear" para enviado, "retirar" para pronto_retirada quando retiradaAtiva for true, e "ocultar" nos demais casos.',
        functionName: 'acaoPedido',
        starter: `function acaoPedido(status, retiradaAtiva) {
  if (status === 'pronto_retirada' && retiradaAtiva) return 'retirar';
  return 'ocultar';
}`,
        answer: `function acaoPedido(status, retiradaAtiva) {
  if (status === 'enviado') return 'rastrear';
  if (status === 'pronto_retirada' && retiradaAtiva) return 'retirar';
  return 'ocultar';
}`,
        hints: ['Uma condição vem da main e outra vem do PR.', 'Use o retorno padrão para os estados sem ação.'],
        tests: [
          caso('Pronto com retirada habilitada', ['pronto_retirada', true], 'retirar'),
          caso('Pronto com retirada desabilitada', ['pronto_retirada', false], 'ocultar'),
          caso('Enviado preserva a regra da main', ['enviado', false], 'rastrear'),
          caso('Cancelado não mostra ação', ['cancelado', true], 'ocultar')
        ]
      },
      delivery: {
        ...pergunta('Você resolveu o arquivo localmente. Qual sequência permite revisar a integração?', ['Rodar git status, revisar o diff, testar os dois fluxos, marcar o arquivo resolvido e concluir o merge.', 'Manter os marcadores e pedir para o CI escolher.', 'Enviar um print no Slack e abandonar a branch.'], 0,
          ['A sequência registra uma resolução verificável para revisão.', 'Os marcadores precisam sair do conteúdo final.', 'O print ajuda no contexto. O código resolvido precisa ficar na branch.']),
        artifact: {label: 'Comentário no PR sobre o conflito', text: 'WEB-130 · Resolvi o conflito na ação do pedido preservando o rastreamento da main e a retirada do PR. Validei enviado, cancelado e pronto com a retirada habilitada e desabilitada. O diff está pronto para nova revisão.'}
      },
      recall: [
        pergunta('Um arquivo mostra <<<<<<< durante o merge. Qual o primeiro cuidado?', ['Excluir todo o arquivo.', 'Ler os dois trechos antes de escolher o comportamento final.', 'Sempre manter o trecho acima do separador.'], 1, ['As duas mudanças podem ser necessárias.', 'O conflito sinaliza onde o Git precisa da decisão da equipe.', 'A posição no arquivo não determina a regra de produto.']),
        pergunta('Depois de editar o arquivo, como informar que ele foi resolvido?', ['Executar git add para o arquivo resolvido.', 'Executar git status somente.', 'Abrir um ticket novo.'], 0, ['O Git usa o estágio do arquivo para registrar a resolução.', 'git status mostra o estado do merge.', 'O ticket pode registrar contexto, mas não atualiza o índice.']),
        pergunta('O teste de retirada passou. O que validar também?', ['Somente espaços em branco.', 'A data de criação do PR.', 'O rastreamento de enviado que veio da outra branch.'], 2, ['Confira o fluxo funcional que o merge trouxe.', 'O horário não demonstra que o comportamento foi preservado.', 'O merge precisa manter as duas intenções.'])
      ],
      refs: [{label: 'GitHub · Resolver conflito pelo terminal', url: 'https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/resolving-a-merge-conflict-using-the-command-line'}]
    },
    {
      id: 'WEB-131', category: 'Releases', title: 'O SDK que mudou sem avisar',
      description: 'Classifique alterações em um pacote usado pelo portal e proponha a versão de release adequada.',
      minutes: 11, icon: 'git', theme: 'orange', skills: ['SemVer', 'Revisão de contrato', 'Changelog'],
      story: {
        person: 'Igor', role: 'Mantenedor do SDK',
        message: 'O pacote de integração do portal está na série 2.x. O próximo release remove um método público, corrige um log e acrescenta uma opção. O PR propõe só um patch.',
        criteria: ['Mudança incompatível na API pública pede major.', 'Recurso compatível pede minor.', 'Correção compatível pede patch.'],
        evidence: {label: 'Diff para o próximo release', code: '- cliente.buscarPorCodigo(codigo)  // método público\n+ cliente.buscar({ codigo })\n+ opção de timeout em cliente.buscar\n~ correção de erro no log'},
        question: pergunta('Qual alteração define a versão desse pacote estável?', ['A correção no log, por ser a menor.', 'A retirada do método público, por quebrar os consumidores atuais.', 'A opção de timeout, por ter sido implementada por último.'], 1,
          ['A menor alteração não define o risco da combinação.', 'Consumidores que chamam o método removido precisam se adaptar.', 'A ordem de implementação não muda a compatibilidade do pacote.'])
      },
      lab: {
        goal: 'Implemente tipoRelease(alteracoes). Os tipos possíveis são "incompativel", "recurso" e "correcao". A lista vazia retorna "sem-release". Dê prioridade a "major", depois "minor", depois "patch".',
        functionName: 'tipoRelease',
        starter: `function tipoRelease(alteracoes) {
  if (alteracoes.includes('correcao')) return 'patch';
  if (alteracoes.includes('recurso')) return 'minor';
  if (alteracoes.includes('incompativel')) return 'major';
  return 'sem-release';
}`,
        answer: `function tipoRelease(alteracoes) {
  if (alteracoes.includes('incompativel')) return 'major';
  if (alteracoes.includes('recurso')) return 'minor';
  if (alteracoes.includes('correcao')) return 'patch';
  return 'sem-release';
}`,
        hints: ['A combinação deve adotar o maior impacto.', 'Teste a presença de uma quebra antes de aceitar um patch.'],
        tests: [
          caso('Somente correções', [['correcao', 'correcao']], 'patch'),
          caso('Recurso com correção', [['recurso', 'correcao']], 'minor'),
          caso('A quebra vence as outras categorias', [['correcao', 'recurso', 'incompativel']], 'major'),
          caso('Lista vazia sem release', [[]], 'sem-release')
        ]
      },
      delivery: {
        ...pergunta('O que a equipe do portal precisa na comunicação da versão?', ['Só a lista de commits.', 'O novo número, sem descrição do impacto.', 'O método removido, o substituto e um exemplo de migração.'], 2,
          ['Commits brutos exigem que o consumidor descubra a quebra por conta própria.', 'O número sinaliza a quebra e o changelog mostra como migrar.', 'A nota liga a mudança incompatível à ação que o consumidor precisa tomar.']),
        artifact: {label: 'Rascunho do changelog', text: 'WEB-131 · SDK 3.0.0. O método público buscarPorCodigo(codigo) foi removido. Migração: use buscar({ codigo }) no consumidor. O release também inclui timeout opcional e correção do log. Revise a integração do Portal de Pedidos antes de atualizar.'}
      },
      recall: [
        pergunta('Um método novo foi adicionado sem alterar chamadas existentes. Qual incremento em uma API estável?', ['Minor.', 'Major.', 'Sempre patch.'], 0, ['O recurso é aditivo e compatível.', 'Major cobre incompatibilidade pública.', 'Patch cobre correções compatíveis.']),
        pergunta('Uma correção altera só uma mensagem interna, sem mudar o contrato. Qual incremento?', ['Major.', 'Patch.', 'Minor.'], 1, ['A interface pública continua compatível.', 'A correção é retrocompatível.', 'Não há novo recurso público.']),
        pergunta('A versão combina uma remoção pública e dois recursos aditivos. Qual tem prioridade?', ['O número de recursos aditivos.', 'O último commit da lista.', 'A mudança incompatível.'], 2, ['Um único rompimento já afeta consumidores.', 'Classifique o efeito do conjunto inteiro.', 'A remoção pública exige major mesmo com outras adições.'])
      ],
      refs: [{label: 'SemVer · Especificação em português', url: 'https://semver.org/lang/pt-BR/'}]
    },
    {
      id: 'WEB-132', category: 'Jira', title: 'O épico que virou uma entrega',
      description: 'Recorte a exportação em uma primeira entrega que o suporte já consegue usar.',
      minutes: 11, icon: 'filter', theme: 'mint', skills: ['Jira', 'Refinamento', 'Critérios de aceite', 'CSV'],
      story: {
        person: 'Cris', role: 'Product owner',
        message: 'O item de exportação pede página atual, todo o histórico e envio agendado. Para a próxima sprint, o suporte só precisa levar ID e status da página que está vendo para uma planilha.',
        criteria: ['O primeiro item exporta somente a página já carregada.', 'As linhas mantêm a ordem da tela e contêm ID e status.', 'Histórico completo e agendamento ficam em itens separados.'],
        evidence: {label: 'Jira · item do backlog', code: '“Exportar pedidos”\n- Página atual\n- Todo o histórico (processamento em segundo plano)\n- Envio semanal por e-mail\n\nO suporte precisa da primeira linha de valor nesta sprint.'},
        question: pergunta('Qual recorte já entrega algo que o suporte consegue usar?',
          ['Uma tarefa para criar o botão, sem gerar o arquivo.', 'Uma entrega de exportação de ID e status da página atual, da tela até o arquivo.', 'Um item único para tudo, com entrega na última sprint.'], 1,
          ['O botão isolado ainda não atende o fluxo.', 'A equipe consegue validar um resultado completo com o menor escopo necessário.', 'O histórico e o agendamento aumentam o tamanho do primeiro passo.'])
      },
      lab: {
        goal: 'Implemente linhasExportacao(pagina). Receba os pedidos da página visível e retorne uma lista de objetos com apenas id e status. Preserve ordem e valores.',
        functionName: 'linhasExportacao',
        starter: `function linhasExportacao(pagina) {
  return pagina;
}`,
        answer: `function linhasExportacao(pagina) {
  return pagina.map(({id, status}) => ({id, status}));
}`,
        note: 'A função prepara as linhas. A serialização CSV, incluindo escape de valores e proteção ao abrir em planilhas, é uma etapa separada da aplicação.',
        hints: ['map permite criar uma linha por pedido sem mudar a ordem.', 'Copie as duas propriedades previstas no critério de aceite.'],
        tests: [
          caso('Sem pedidos, sem linhas', [[]], []),
          caso('Só leva os campos do escopo', [[{id:22, status:'pago', email:'interno@example.invalid'}]], [{id:22, status:'pago'}]),
          caso('A ordem é a mesma da página', [[{id:45, status:'enviado', total:200}, {id:12, status:'pago', total:50}]], [{id:45, status:'enviado'}, {id:12, status:'pago'}]),
          caso('Aceita linha que já tem os dois campos', [[{id:4, status:'cancelado'}]], [{id:4, status:'cancelado'}])
        ]
      },
      delivery: {
        ...pergunta('Qual atualização no Jira deixa o escopo verificável?', ['“Fazer exportação” em um item sem critérios.', '“Adicionar CSV” sem definir quais registros saem.', 'Um item com página atual, duas colunas e ordem da tela, com histórico e envio registrados no backlog.'], 2,
          ['O revisor e o QA ainda precisariam adivinhar o resultado esperado.', 'A ambiguidade entre página e histórico reaparece.', 'O texto permite executar o teste e mantém os itens futuros visíveis.']),
        artifact: {label: 'Descrição do item no Jira', text: 'WEB-132 · Exportar a página atual de pedidos. Critérios: o CSV contém apenas ID e status, respeita a ordem exibida e não inclui registros de outras páginas. Separei exportação de histórico e envio agendado em itens de backlog vinculados.'}
      },
      recall: [
        pergunta('O QA quer saber se deve encontrar pedidos da segunda página. Onde deixar esse limite?', ['Nos critérios de aceite do item do Jira.', 'Somente em mensagem direta.', 'No nome do arquivo JS.'], 0, ['O critério acompanha o trabalho até a verificação.', 'Uma conversa individual pode se perder para quem valida.', 'O nome do arquivo não define comportamento para o QA.']),
        pergunta('A página mostra os IDs 34 e 18 nessa ordem. Qual ordem deve sair neste item?', ['18, 34.', '34, 18.', 'Qualquer ordem.'], 1, ['Ordenar por ID mudaria o comportamento combinado.', 'A exportação replica a ordem visível.', 'A ordem faz parte do critério.']),
        pergunta('O envio semanal precisa de uma fila e de confirmação do destinatário. Onde registrar?', ['No botão da página atual.', 'Como texto oculto no PR.', 'Em outro item de backlog, ligado à exportação.'], 2, ['É outro fluxo com critérios próprios.', 'O backlog torna a dependência visível para a equipe.', 'O vínculo preserva o contexto sem alongar a primeira entrega.'])
      ],
      refs: [{label: 'Atlassian · Dividir itens no Jira', url: 'https://support.atlassian.com/jira-software-cloud/docs/create-a-work-item-and-a-subtask/'}]
    },
    {
      id: 'WEB-133', category: 'Slack', title: 'Da thread ao chamado de suporte',
      description: 'Classifique relatos recebidos no Slack e repasse o problema com contexto suficiente para agir.',
      minutes: 12, icon: 'activity', theme: 'mint', skills: ['Slack', 'Triagem', 'Jira', 'Comunicação'],
      story: {
        person: 'Júlia', role: 'Analista de suporte',
        message: 'Recebemos quatro relatos de checkout bloqueado na mesma thread. Dois têm poucos detalhes. A regra da equipe pede que acione o plantão quando pelo menos três clientes estão bloqueados.',
        criteria: ['Checkout bloqueado para três clientes ou mais aciona plantão de imediato.', 'Outros relatos sem passos pedem reprodução.', 'Com passos suficientes, o suporte cria um ticket rastreável.'],
        evidence: {label: 'Slack · #suporte-portal', code: 'Thread: checkout para em “Confirmar pedido”\nClientes afetados: 4\nConseguem finalizar por outra rota? Não\nPassos completos: ainda coletando'},
        question: pergunta('O que Júlia faz agora neste fluxo?',
          ['Aciona o plantão com o impacto e continua coletando os passos na thread.', 'Aguarda todos os detalhes para falar com o plantão.', 'Abre um novo canal para cada relato.'], 0,
          ['O impacto conhecido atende ao gatilho de escalonamento da equipe.', 'O bloqueio pode aumentar enquanto a equipe coleta detalhes.', 'A thread já reúne o contexto compartilhado.'])
      },
      lab: {
        goal: 'Implemente destinoRelato(relato). Se bloqueiaCheckout for true e clientesAfetados for pelo menos 3, retorne "acionar-plantao". Nos demais casos, se temPassos for false, retorne "pedir-reproducao". Senão, retorne "criar-ticket".',
        functionName: 'destinoRelato',
        starter: `function destinoRelato(relato) {
  return relato.temPassos ? 'criar-ticket' : 'pedir-reproducao';
}`,
        answer: `function destinoRelato(relato) {
  if (relato.bloqueiaCheckout && relato.clientesAfetados >= 3) return 'acionar-plantao';
  return relato.temPassos ? 'criar-ticket' : 'pedir-reproducao';
}`,
        note: 'O código simula a política fictícia desta equipe. A pessoa ainda revisa e envia a mensagem na ferramenta.',
        hints: ['Avalie impacto antes de olhar os passos.', 'O limiar inclui exatamente três clientes.'],
        tests: [
          caso('Bloqueio crítico mesmo sem passos', [{bloqueiaCheckout:true, clientesAfetados:4, temPassos:false}], 'acionar-plantao'),
          caso('Exatamente três é o limiar', [{bloqueiaCheckout:true, clientesAfetados:3, temPassos:true}], 'acionar-plantao'),
          caso('Dois clientes, passos registrados', [{bloqueiaCheckout:true, clientesAfetados:2, temPassos:true}], 'criar-ticket'),
          caso('Outros sintomas sem passos', [{bloqueiaCheckout:false, clientesAfetados:8, temPassos:false}], 'pedir-reproducao')
        ]
      },
      delivery: {
        ...pergunta('Qual repasse é mais acionável no Slack?', ['“Checkout com problemas, deem uma olhada.”', '“4 clientes não finalizam em Confirmar pedido. Plantão acionado. Evidências nesta thread. Repasso uma atualização quando reproduzir.”', '“Erro resolvido” assim que o plantão for chamado.'], 1,
          ['Inclua o impacto, o ponto de falha e o contexto.', 'A mensagem registra impacto, local de falha, responsável pelo próximo passo e contexto.', 'Chamar o plantão inicia o tratamento. A resolução ainda depende de verificação.']),
        artifact: {label: 'Repasse na thread do Slack', text: 'WEB-133 · Impacto confirmado: quatro clientes bloqueados em Confirmar pedido. Acionei o plantão pelo fluxo de suporte. Estou coletando passos sem dados pessoais nesta thread e atualizo o ticket com a próxima evidência.'},
        jiraStatus: 'Em andamento'
      },
      recall: [
        pergunta('Cinco pessoas relataram uma cor incorreta, sem bloqueio do checkout e sem passos. Qual próximo passo pela regra da missão?', ['Pedir passos para reprodução.', 'Acionar plantão imediatamente.', 'Fechar o relato.'], 0, ['O relato ainda não tem evidência reproduzível e não atende ao gatilho de plantão.', 'O volume sozinho não indica bloqueio de checkout.', 'A coleta de detalhes é o próximo passo.']),
        pergunta('Um cliente relatou erro reproduzível com passos completos. Qual encaminhamento?', ['Pedir de novo os passos.', 'Criar um ticket e referenciar a conversa.', 'Esperar outros relatos para documentar.'], 1, ['A evidência já permite abrir o ticket.', 'O link conecta o relato original ao trabalho rastreável.', 'O ticket já pode reunir os passos e ajudar a investigar.']),
        pergunta('Três clientes não finalizam pedidos, e a causa ainda é desconhecida. Qual frase cabe na atualização?', ['“A causa é certamente o banco.”', '“O problema acabou.”', '“Três clientes bloqueados no checkout, causa em investigação e plantão acionado.”'], 2, ['O impacto não comprova uma causa.', 'A resolução ainda precisa de evidência.', 'A mensagem diferencia o observado da investigação em curso.'])
      ],
      refs: [{label: 'Slack · Discussões em thread', url: 'https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions'}, {label: 'Slack · Copiar link da mensagem', url: 'https://slack.com/help/articles/203274767-Forward-messages-in-Slack'}]
    },
    {
      id: 'WEB-134', category: 'Observabilidade', title: 'O log que levou informação demais',
      description: 'Conserve identificadores de diagnóstico e bloqueie a cópia do corpo inteiro da requisição para logs.',
      minutes: 12, icon: 'shield', theme: 'rose', skills: ['Logs estruturados', 'Campos permitidos', 'Proteção de dados'],
      story: {
        person: 'Beto', role: 'Engenheiro de plataforma',
        message: 'Ao debugar um 500, vimos que o log replicava a requisição inteira. O diagnóstico precisa do código do evento, identificador da requisição, duração e status. O resto pode trazer dados que não deveriam sair da aplicação.',
        criteria: ['O log contém apenas os quatro campos de diagnóstico previstos.', 'Campos ausentes permanecem ausentes.', 'Os valores numéricos zero e os identificadores presentes são preservados.'],
        evidence: {label: 'Log fictício · API de pedidos', code: 'ANTES {"codigo":"falha","requestId":"req-417","duracaoMs":32,"status":500,"token":"token-ficticio","body":{"email":"cliente@example.invalid"}}\nALVO  {"codigo":"falha","requestId":"req-417","duracaoMs":32,"status":500}'},
        question: pergunta('Qual estratégia reduz o risco de um campo novo aparecer no log por acidente?',
          ['Remover apenas a chave token.', 'Registrar toda a requisição com um nome de arquivo diferente.', 'Montar o evento só com os campos de diagnóstico permitidos.'], 2,
          ['Credenciais e dados pessoais podem chegar por outras chaves.', 'O conteúdo continuaria no log.', 'Uma lista explícita reduz o que entra por padrão.'])
      },
      lab: {
        goal: 'Implemente eventoDeLog(dados). Retorne um novo objeto copiando somente as propriedades próprias presentes codigo, requestId, duracaoMs e status. Preserve seus valores, inclusive zero.',
        functionName: 'eventoDeLog',
        starter: `function eventoDeLog(dados) {
  return {...dados};
}`,
        answer: `function eventoDeLog(dados) {
  const evento = {};
  for (const campo of ['codigo', 'requestId', 'duracaoMs', 'status']) {
    if (Object.hasOwn(dados, campo)) evento[campo] = dados[campo];
  }
  return evento;
}`,
        note: 'O exercício recebe campos de diagnóstico já tipados pela aplicação. Em produção, confira os tipos e higienize entradas externas conforme o sistema de logs.',
        hints: ['Itere a lista de campos permitidos.', 'Teste a presença da chave, pois zero é um valor válido.'],
        tests: [
          caso('Evento já reduzido conserva os campos', [{codigo:'pedido_lido', requestId:'req-7', duracaoMs:0, status:200}], {codigo:'pedido_lido', requestId:'req-7', duracaoMs:0, status:200}),
          caso('Remove token e corpo', [{codigo:'falha', requestId:'req-417', status:500, token:'exemplo', body:{email:'a@example.invalid'}}], {codigo:'falha', requestId:'req-417', status:500}),
          caso('Campo extra novo fica de fora', [{status:503, campoFuturo:'exemplo'}], {status:503}),
          caso('Sem campos úteis, produz objeto vazio', [{headers:{authorization:'ficticio'}}], {})
        ]
      },
      delivery: {
        ...pergunta('Como enviar evidência para revisão da correção?', ['Anexar logs completos de produção ao PR.', 'Mostrar um evento fictício antes e depois e indicar como a equipe avalia os registros anteriores em canal restrito.', 'Compartilhar a credencial no Slack para demonstrar que ela sumiu.'], 1,
          ['Anexar o conteúdo amplia a exposição.', 'O exemplo comprova a regra e mantém a investigação histórica no canal adequado.', 'Use valores fictícios para reproduzir o comportamento.']),
        artifact: {label: 'Nota de revisão para plataforma', text: 'WEB-134 · O evento novo inclui apenas codigo, requestId, duracaoMs e status. Validei token, cabeçalhos e corpo com dados fictícios. Encaminhei a avaliação de registros históricos à equipe responsável no canal restrito.'}
      },
      recall: [
        pergunta('Uma integração passa a mandar uma chave sessionSecret. O que acontece com ela por padrão?', ['Fica fora do evento.', 'Entra porque o nome é novo.', 'Entra se não houver token.'], 0, ['O evento copia somente a lista explícita.', 'Chaves novas ficam de fora até revisão.', 'A presença de outro campo não muda a lista permitida.']),
        pergunta('duracaoMs é 0. Deve aparecer?', ['Só se vier junto com status 500.', 'Sim, porque o campo está presente.', 'Não, porque zero equivale a campo ausente.'], 1, ['A regra inclui duração em qualquer status recebido.', 'Presença e valor booleano são conceitos diferentes.', 'Zero é uma duração válida.']),
        pergunta('Qual identificador ajuda a cruzar eventos sem copiar um token de autenticação?', ['O corpo integral da requisição.', 'O cabeçalho Authorization.', 'O requestId previsto para diagnóstico.'], 2, ['O corpo pode trazer dados desnecessários.', 'O cabeçalho contém uma credencial.', 'O identificador de requisição permite correlacionar logs.'])
      ],
      refs: [{label: 'OWASP · Dados que devem ficar fora dos logs', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#data-to-exclude'}]
    },
    {
      id: 'WEB-135', category: 'Deploy', title: 'Saúde sem reiniciar o portal',
      description: 'Separe o sinal de processo vivo da decisão de aceitar tráfego enquanto o SQL Server oscila.',
      minutes: 13, icon: 'activity', theme: 'blue', skills: ['Health checks', 'Kubernetes', 'SQL Server'],
      story: {
        person: 'Leo', role: 'Operador de infraestrutura',
        message: 'Quando o banco fica indisponível, a mesma sonda tira a instância do tráfego e reinicia o processo saudável. O portal demora mais para voltar porque os reinícios se repetem.',
        criteria: ['Liveness responde à saúde do processo.', 'Readiness exige processo saudável e SQL Server acessível.', 'Falha de analytics opcional não impede pedidos.'],
        evidence: {label: 'Painel de sondas · homologação', code: 'processo: saudável\nSQL Server: timeout temporário\nanalytics: ok\nANTES /live=503, /ready=503 → reinício\nALVO  /live=200, /ready=503 → tráfego suspenso'},
        question: pergunta('Com o processo saudável e o SQL Server temporariamente fora, quais sinais saem?',
          ['Liveness 503 e readiness 200.', 'Liveness 200 e readiness 503.', 'As duas respondem 503.'], 1,
          ['A API depende do SQL para servir pedidos. O processo em si segue vivo.', 'A instância sai do tráfego enquanto preserva o processo saudável.', 'Uma liveness reprovada pode disparar reinícios desnecessários.'])
      },
      lab: {
        goal: 'Implemente sondasPortal({processoOk, sqlOk, analyticsOk}). Retorne {liveness, readiness} com status 200 ou 503. Liveness depende só de processoOk. Readiness exige processoOk e sqlOk. Analytics é opcional.',
        functionName: 'sondasPortal',
        starter: `function sondasPortal({processoOk, sqlOk, analyticsOk}) {
  const status = processoOk && sqlOk && analyticsOk ? 200 : 503;
  return {liveness: status, readiness: status};
}`,
        answer: `function sondasPortal({processoOk, sqlOk}) {
  return {
    liveness: processoOk ? 200 : 503,
    readiness: processoOk && sqlOk ? 200 : 503
  };
}`,
        note: 'O laboratório modela a resposta a sinais já medidos. Em Kubernetes, a configuração de cada sonda define limiares e o comportamento após falhas.',
        hints: ['Calcule as duas respostas separadamente.', 'O SQL entra só na prontidão.'],
        tests: [
          caso('Tudo saudável', [{processoOk:true, sqlOk:true, analyticsOk:true}], {liveness:200, readiness:200}),
          caso('SQL caiu e o processo segue vivo', [{processoOk:true, sqlOk:false, analyticsOk:true}], {liveness:200, readiness:503}),
          caso('Analytics fora e o portal pode atender', [{processoOk:true, sqlOk:true, analyticsOk:false}], {liveness:200, readiness:200}),
          caso('Processo travado afeta as duas sondas', [{processoOk:false, sqlOk:true, analyticsOk:true}], {liveness:503, readiness:503})
        ]
      },
      delivery: {
        ...pergunta('Qual validação pede em homologação?', ['Derrubar analytics e esperar que o processo reinicie.', 'Olhar apenas o HTTP 200 de liveness.', 'Simular queda temporária do SQL, verificar retirada do tráfego e confirmar retorno após recuperação.'], 2,
          ['Analytics é opcional nesse produto.', 'Confira também quando a instância volta a receber pedidos.', 'A validação cobre a indisponibilidade e a volta ao tráfego.']),
        artifact: {label: 'Plano de validação em homologação', text: 'WEB-135 · Separação de /live e /ready. Com processo saudável e SQL fora, espero 200 e 503, respectivamente. Validar retirada de tráfego sem reinício da instância e retorno após o SQL recuperar. Analytics fora deve manter as duas sondas verdes.'}
      },
      recall: [
        pergunta('Qual sonda define se uma instância recebe tráfego normal?', ['Readiness.', 'Liveness.', 'Somente o log.'], 0, ['A prontidão indica se a instância pode atender.', 'Liveness informa saúde do processo.', 'Logs ajudam o diagnóstico e sondas orientam o orquestrador.']),
        pergunta('O processo travou, mesmo com o banco acessível. Qual resultado?', ['Readiness 200.', 'As duas sondas retornam 503.', 'Liveness 200.'], 1, ['O processo precisa conseguir servir o pedido.', 'A falha do processo afeta saúde e prontidão.', 'A saúde do banco não recupera um processo travado.']),
        pergunta('Só analytics falhou. Que comportamento a regra do portal pede?', ['Reiniciar a instância.', 'Tirar a instância do tráfego de pedidos.', 'Manter liveness e readiness saudáveis.'], 2, ['O processo está apto a atender.', 'A dependência é opcional nesse produto.', 'O caminho crítico de pedidos segue disponível.'])
      ],
      refs: [{label: 'Kubernetes · Liveness e readiness', url: 'https://kubernetes.io/docs/concepts/workloads/pods/probes/'}]
    },
    {
      id: 'WEB-136', category: 'Deploy', title: 'O canário ainda não pode avançar',
      description: 'Use volume e erros observados para decidir se a nova versão deve aguardar, avançar ou ser revertida.',
      minutes: 13, icon: 'activity', theme: 'orange', skills: ['Canary deploy', 'Métricas', 'Rollback'],
      story: {
        person: 'Duda', role: 'Responsável pela release',
        message: 'A nova versão recebe uma fatia do tráfego. O painel marcou zero erros com apenas cinco requisições. A nossa regra pede 100 requisições e no máximo 2% de erros antes de promover.',
        criteria: ['Amostras ausentes ou com menos de 100 requisições pausam a promoção.', 'Com 100 ou mais requisições, taxa acima de 2% pede reversão.', 'Taxa de até 2% com amostra suficiente permite avançar.'],
        evidence: {label: 'Painel de canário · primeira leitura', code: 'tráfego na versão nova: 5%\nrequisições no intervalo: 5\nerros 5xx: 0\nRegra do time: n >= 100 e taxa <= 2%'},
        question: pergunta('Qual decisão faz sentido agora?', ['Promover para todo o tráfego porque não houve erros.', 'Reverter porque a porcentagem ainda é zero.', 'Pausar a promoção e esperar a amostra mínima.'], 2,
          ['Cinco requisições ficam abaixo do volume exigido.', 'A falta de volume ainda não caracteriza uma piora.', 'A regra pede volume antes de interpretar a taxa para promoção.'])
      },
      lab: {
        goal: 'Implemente decidirCanario(amostra). Se amostra for null ou requisicoes for menor que 100, retorne "pausar". Com amostra suficiente, retorne "reverter" quando erros / requisicoes ultrapassar 2% e "promover" nos demais casos. Os contadores são inteiros não negativos.',
        functionName: 'decidirCanario',
        starter: `function decidirCanario(amostra) {
  if (!amostra) return 'pausar';
  return amostra.erros / amostra.requisicoes > 0.02 ? 'reverter' : 'promover';
}`,
        answer: `function decidirCanario(amostra) {
  if (!amostra || amostra.requisicoes < 100) return 'pausar';
  const acimaDoLimite = amostra.erros * 100 > amostra.requisicoes * 2;
  return acimaDoLimite ? 'reverter' : 'promover';
}`,
        note: 'Os limites são a política fictícia da missão. Um rollout real pode combinar várias métricas, janelas e guardas de segurança.',
        hints: ['Confira o volume antes de avaliar a taxa.', 'Dois erros a cada cem estão no limite permitido.'],
        tests: [
          caso('Sem telemetria', [null], 'pausar'),
          caso('Cinco requisições com zero erros', [{requisicoes:5, erros:0}], 'pausar'),
          caso('Zero requisições não gera decisão por taxa', [{requisicoes:0, erros:0}], 'pausar'),
          caso('Exatamente 2% promove', [{requisicoes:150, erros:3}], 'promover'),
          caso('Taxa acima de 2% reverte', [{requisicoes:200, erros:5}], 'reverter')
        ]
      },
      delivery: {
        ...pergunta('O canário atingiu 200 requisições e 5 erros. O que comunicar?', ['A taxa foi 2,5%, acima do limite. Reverter, conferir a recuperação e registrar no canal de release.', 'A amostra está acima de 100, portanto podemos promover.', 'Esperar para anunciar a reversão depois que a próxima versão sair.'], 0,
          ['A decisão decorre da taxa e vem acompanhada de verificação pós-ação.', 'A amostra mínima permite avaliar a taxa, que também precisa respeitar o limite.', 'A equipe precisa saber a ação e acompanhar a recuperação agora.']),
        artifact: {label: 'Atualização no canal de release', text: 'WEB-136 · Canário com 200 requisições e 5 erros (2,5%), acima do limite de 2%. Interrompi a promoção e iniciei a reversão. Próximo passo: verificar a taxa de erros após a volta à versão estável e registrar o resultado no ticket.'},
        jiraStatus: 'Em andamento'
      },
      recall: [
        pergunta('Com 99 requisições e zero erros, qual é a decisão pela regra do laboratório?', ['Promover.', 'Pausar.', 'Reverter.'], 1, ['O volume está abaixo do mínimo.', 'Aguarde o centésimo evento antes de avaliar para promover.', 'A amostra insuficiente pede espera neste cenário.']),
        pergunta('Com 100 requisições e 2 erros, o que fazer?', ['Promover.', 'Reverter.', 'Pausar por volume insuficiente.'], 0, ['A amostra atingiu o mínimo e 2% está no limite permitido.', 'Reverta quando a taxa superar 2%.', 'Cem já é volume suficiente para a regra proposta.']),
        pergunta('Depois da reversão, o que fecha o ciclo?', ['Apagar o histórico do deploy.', 'Presumir que tudo voltou ao normal.', 'Observar a recuperação das métricas e atualizar o ticket.'], 2, ['O histórico ajuda a rastrear a ação.', 'A reversão foi executada. A recuperação precisa ser medida.', 'A equipe recebe evidência do efeito da ação.'])
      ],
      refs: [{label: 'Argo Rollouts · Análise de canários', url: 'https://argo-rollouts.readthedocs.io/en/stable/features/analysis/'}]
    }
  ];
})();
