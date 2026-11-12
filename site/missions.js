window.coreMissions = [
  {
    id: 'WEB-101', category: 'HTTP e DevTools', title: 'O filtro que mente',
    description: 'Descubra por que o portal mostra todos os pedidos mesmo quando o suporte filtra por status.',
    minutes: 15, icon: 'filter', theme: 'violet', skills: ['DevTools', 'HTTP', 'Jira'],
    story: {
      person: 'Ana', role: 'Suporte', message: 'Quando seleciono Pendentes, a lista continua trazendo pedidos enviados. Acontece toda vez. Alguém consegue olhar?',
      criteria: ['Pendentes lista apenas pedidos pendentes.', 'Todos recupera a lista sem filtro.', 'Um filtro válido sem registros mostra o estado vazio.'],
      evidence: { label: 'DevTools · Network', code: 'Seleção na tela: Pendentes\nGET /api/pedidos → 200 OK\n\nResposta JSON\n[{"id":104,"status":"pendente"},\n {"id":105,"status":"enviado"}]' },
      question: {
        prompt: 'Ao reproduzir o bug, qual evidência aponta para a primeira correção?',
        choices: ['A resposta 200 confirma que o filtro funcionou.', 'A requisição saiu sem o parâmetro status.', 'A tabela deveria ocultar os enviados depois de carregar todos os pedidos.'],
        answer: 1,
        feedback: ['O 200 confirma o sucesso da requisição. Confira também qual URL foi solicitada e quais registros voltaram.', 'A seleção mudou na tela, mas a URL continuou igual. Envie o status para que a API possa filtrar.', 'Filtrar só na tabela pode gerar resultados incorretos com paginação. A API já prevê o filtro por status.']
      }
    },
    lab: {
      goal: 'Edite montarUrl(status). Para Todos ou valor ausente, devolva /api/pedidos. Para outros valores, inclua status na URL e codifique o valor.',
      functionName: 'montarUrl',
      starter: 'function montarUrl(status) {\n  const rota = "/api/pedidos";\n  // A tela seleciona o status, mas a URL ignora o valor.\n  return rota;\n}',
      answer: 'function montarUrl(status) {\n  const rota = "/api/pedidos";\n  if (!status || status === "todos") return rota;\n  return `${rota}?status=${encodeURIComponent(status)}`;\n}',
      hints: ['Separe primeiro o caso sem filtro: status ausente ou igual a "todos".', 'Use encodeURIComponent(status) para codificar o valor que vem depois de ?status=.'],
      tests: [
        {label:'Pendentes envia o filtro', args:['pendente'], expected:'/api/pedidos?status=pendente'},
        {label:'Todos omite o filtro', args:['todos'], expected:'/api/pedidos'},
        {label:'Seleção ausente omite o filtro', args:[], expected:'/api/pedidos'},
        {label:'O valor é codificado na URL', args:['em revisão'], expected:'/api/pedidos?status=em%20revis%C3%A3o'},
        {label:'Cancelados envia o filtro', args:['cancelado'], expected:'/api/pedidos?status=cancelado'}
      ]
    },
    delivery: {
      prompt: 'Os testes passaram. Como você fecha o ciclo com suporte e revisão?',
      choices: ['Respondo “resolvido” em um canal novo e movo o ticket direto para Concluído.', 'Atualizo a conversa original com causa e testes, vinculo a alteração ao Jira e movo para Em revisão.', 'Envio o código em uma DM e deixo o ticket Em andamento.'],
      answer: 1,
      feedback: ['O fluxo ainda pede revisão. A conversa original mantém o relato e a resposta juntos.', 'O suporte recebe contexto e o revisor encontra a alteração e as evidências no ticket.', 'A DM dificulta que o restante do time encontre a resolução e o status do trabalho.'],
      artifact: {label:'Resposta na thread · #suporte-produto',text:'WEB-101 reproduzido. A tela selecionava o status, mas a URL saía sem o filtro. Corrigi o envio e validei Pendentes, Todos e o estado vazio. O ticket está Em revisão.'}
    },
    bridge: {title:'Do Grid do FoxPro à tabela web', text:'Em uma aplicação desktop com SQL pass-through, SQLEXEC() pode devolver um cursor que alimenta o Grid via RecordSource. Na web, a tabela consome JSON. A API valida o status permitido, consulta o SQL Server com @status vinculado como parâmetro e devolve os registros. Use o Network para descobrir se o filtro chegou à fronteira HTTP.', code:'-- Na API, para uma requisição com filtro válido\nSELECT Id, Status\nFROM dbo.Pedidos\nWHERE Status = @status;'},
    recall: [
      {prompt:'Filtrar por Enviados ainda mostra todos e a resposta é 200. Onde você olha primeiro?',choices:['URL e parâmetros na aba Network','Estilos CSS da tabela','Mensagem do último commit'],answer:0,feedback:['Compare a seleção com o parâmetro enviado e a resposta recebida.','O estilo dificilmente explica registros indevidos no JSON.','O histórico ajuda depois de identificar a fronteira onde o valor some.']},
      {prompt:'O status Cancelado é válido, mas nenhum pedido corresponde. Qual resposta combina com a lista?',choices:['404 com mensagem de erro','200 com [] e estado vazio na interface','200 com todos os pedidos'],answer:1,feedback:['A coleção existe e a consulta é válida.','A resposta representa uma consulta bem-sucedida com zero registros.','Mostrar todos ocultaria o significado do filtro escolhido.']},
      {prompt:'A API recebe um status do navegador. Como ele entra no SELECT do SQL Server?',choices:['Como concatenação do texto recebido','Como valor interpolado entre aspas','Como parâmetro vinculado, após validação'],answer:2,feedback:['Use um parâmetro para separar dado da instrução SQL.','Aspas por si só deixam o SQL vulnerável a entradas maliciosas.','A validação define os valores de negócio e o parâmetro mantém o valor separado da instrução.']}
    ],
    refs: [
      {label:'Chrome DevTools · Network',url:'https://developer.chrome.com/docs/devtools/network/'},
      {label:'Microsoft Learn · Parâmetros',url:'https://learn.microsoft.com/en-us/sql/connect/ado-net/configure-parameters'},
      {label:'Visual FoxPro 9 · SQLEXEC',url:'https://www.vfphelp.com/vfp9/html/8dd6491b-da44-401f-b972-0d51f12f1a07.htm'}
    ]
  },
  {
    id: 'WEB-102', category: 'Interface e API', title: 'A resposta atrasada',
    description: 'Corrija a tabela quando duas requisições voltam fora de ordem. Trate erro, vazio e sucesso.',
    minutes: 20, icon: 'layers', theme: 'mint', skills: ['JavaScript', 'Estado da UI', 'API'],
    story: {
      person:'João', role:'QA', message:'Se troco de Pendentes para Enviados rapidamente, o filtro fica em Enviados e aparecem pedidos pendentes. Reproduzi limitando a rede.',
      criteria:['Apenas a resposta da requisição ativa atualiza a tabela.', 'Lista vazia tem estado próprio.', 'Falha na requisição ativa apresenta estado de erro.'],
      evidence:{label:'DevTools · Timing',code:'00 ms   → #21 GET /api/pedidos?status=pendente\n45 ms   → #22 GET /api/pedidos?status=enviado\n90 ms   ← #22 200 OK [pedido enviado]\n540 ms  ← #21 200 OK [pedido pendente]'},
      question:{prompt:'A tabela já mostrou Enviados. O que fazer quando #21 chegar?',choices:['Aplicar a resposta mais recente a chegar.','Ignorar #21 porque #22 é a requisição ativa.','Ordenar os pedidos por ID.'],answer:1,feedback:['A ordem de chegada varia com a rede. Identifique a seleção ativa.','O identificador protege a seleção atual de respostas antigas.','A ordenação muda a posição dos itens. O problema é a origem do conjunto.']}
    },
    lab:{
      goal:'Implemente aplicarResposta(estado, resposta). Se os IDs diferirem, devolva o estado recebido. Para a resposta ativa, devolva o mesmo id com fase erro, vazio ou sucesso e os itens correspondentes.', functionName:'aplicarResposta',
      starter:'function aplicarResposta(estado, resposta) {\n  return {\n    id: estado.id,\n    fase: "sucesso",\n    itens: resposta.itens\n  };\n}',
      answer:'function aplicarResposta(estado, resposta) {\n  if (resposta.id !== estado.id) return estado;\n  if (!resposta.ok) return { id: estado.id, fase: "erro", itens: [] };\n  const itens = resposta.itens;\n  return { id: estado.id, fase: itens.length ? "sucesso" : "vazio", itens };\n}',
      hints:['estado.id identifica a seleção que ainda pode atualizar a tela. Compare com resposta.id antes de ler ok ou itens.', 'Se resposta.ok for false, use fase "erro" e itens []. Em caso de sucesso, a quantidade de itens distingue "vazio" de "sucesso".'],
      tests:[
        {label:'Ativa com dados mostra sucesso',args:[{id:22,fase:'carregando',itens:[]},{id:22,ok:true,itens:[105]}],expected:{id:22,fase:'sucesso',itens:[105]}},
        {label:'Resposta atrasada preserva a tela',args:[{id:22,fase:'sucesso',itens:[105]},{id:21,ok:true,itens:[104]}],expected:{id:22,fase:'sucesso',itens:[105]}},
        {label:'Ativa sem itens mostra vazio',args:[{id:23,fase:'carregando',itens:[]},{id:23,ok:true,itens:[]}],expected:{id:23,fase:'vazio',itens:[]}},
        {label:'Falha ativa mostra erro',args:[{id:24,fase:'carregando',itens:[]},{id:24,ok:false}],expected:{id:24,fase:'erro',itens:[]}},
        {label:'Falha antiga preserva a seleção',args:[{id:24,fase:'carregando',itens:[]},{id:23,ok:false}],expected:{id:24,fase:'carregando',itens:[]}}
      ]
    },
    delivery:{prompt:'Que evidência ajuda QA a reproduzir e validar a correção?',choices:['Apenas uma captura com a lista correta.','Roteiro com trocas rápidas em rede lenta e checagens de erro e vazio.','A confirmação de que funcionou com duas abas separadas.'],answer:1,feedback:['Uma captura mostra um resultado, mas não expõe a ordem das respostas.','O roteiro exercita a condição de corrida e os estados do componente.','O bug depende de duas requisições competindo na mesma tela.'],artifact:{label:'Comentário de QA · WEB-102',text:'Limite a rede no DevTools e troque de Pendentes para Enviados rapidamente. Mesmo com Pendentes terminando por último, a tabela deve permanecer em Enviados. Valide também Cancelados sem registros e o estado de erro da requisição ativa.'}},
    recall:[
      {prompt:'Um erro atrasado chegou enquanto uma busca nova carrega. O que a interface faz?',choices:['Mostra erro imediatamente','Ignora o erro da busca anterior','Mostra os resultados anteriores como atuais'],answer:1,feedback:['A busca que falhou já perdeu o direito de atualizar a tela.','A fase atual segue pertencendo à busca mais recente.','A seleção nova ainda está carregando.']},
      {prompt:'A busca ativa respondeu com sucesso e zero itens. Qual estado se aplica?',choices:['Erro','Carregando','Vazio'],answer:2,feedback:['A requisição terminou com sucesso.','A requisição já encerrou.','A ausência de itens é um resultado válido e ganha mensagem própria.']},
      {prompt:'Como você tenta reproduzir respostas fora de ordem?',choices:['Varia a latência e troca o filtro rapidamente','Faz uma requisição e espera terminar','Atualiza a página depois de cada filtro'],answer:0,feedback:['Duas requisições concorrentes podem voltar na ordem inversa.','Aguarde menos para que as requisições se sobreponham.','A atualização interrompe a sequência que o teste precisa reproduzir.']}
    ],
    refs:[{label:'Chrome DevTools · Simular rede lenta',url:'https://developer.chrome.com/docs/devtools/network/'},{label:'WHATWG · Fetch',url:'https://fetch.spec.whatwg.org/'}]
  },
  {
    id:'WEB-103', category:'Dados e SQL Server', title:'Pedidos que se repetem',
    description:'Estabilize a paginação quando vários pedidos têm o mesmo horário de criação.',
    minutes:20, icon:'database', theme:'blue', skills:['SQL Server','Paginação','Testes'],
    story:{
      person:'Bruna',role:'Operações',message:'Ao trocar de página, o pedido 108 aparece de novo. Os pedidos de importação foram criados no mesmo segundo.',
      criteria:['Pedidos mais recentes vêm primeiro.', 'Para datas iguais, ID maior vem primeiro.', 'Em uma lista estável, páginas consecutivas têm itens distintos.'],
      evidence:{label:'Consulta atual · SQL Server',code:'SELECT Id, CriadoEm\nFROM dbo.Pedidos\nORDER BY CriadoEm DESC\nOFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY;'},
      question:{prompt:'Qual mudança define uma ordem total para esses pedidos?',choices:['ORDER BY CriadoEm DESC, Id DESC','Remover ORDER BY e confiar no armazenamento','Aumentar o tamanho de página'],answer:0,feedback:['O ID é único e desempata linhas com a mesma data.','Sem ORDER BY, o SQL Server pode devolver os dados em ordens diferentes.','Aumentar a página reduz trocas, mas mantém a ordem dos empates indefinida.']}
    },
    lab:{
      goal:'Implemente paginarPedidos(pedidos, offset, limite). Ordene por criadoEm decrescente, desempatando por id decrescente. Retorne somente os IDs da página. As datas usam o mesmo formato ISO e fuso.', functionName:'paginarPedidos',
      starter:'function paginarPedidos(pedidos, offset, limite) {\n  const ordenados = [...pedidos].sort(\n    (a, b) => b.criadoEm.localeCompare(a.criadoEm)\n  );\n  return ordenados.slice(offset, offset + limite).map(p => p.id);\n}',
      answer:'function paginarPedidos(pedidos, offset, limite) {\n  const ordenados = [...pedidos].sort((a, b) => {\n    const porData = b.criadoEm.localeCompare(a.criadoEm);\n    return porData || b.id - a.id;\n  });\n  return ordenados.slice(offset, offset + limite).map(p => p.id);\n}',
      hints:['Se a comparação por data for diferente de zero, ela já define a ordem.', 'Quando a comparação por data der zero, use b.id - a.id como desempate decrescente.'],
      note:'O laboratório executa o equivalente em JavaScript sobre uma lista fixa. A consulta T-SQL está na comparação da missão.',
      tests:[
        {label:'Datas distintas mantêm as mais novas primeiro',args:[[{id:7,criadoEm:'2026-11-10'},{id:2,criadoEm:'2026-11-11'}],0,2],expected:[2,7]},
        {label:'IDs maiores vencem o empate',args:[[{id:4,criadoEm:'2026-11-11'},{id:9,criadoEm:'2026-11-11'},{id:8,criadoEm:'2026-11-11'}],0,2],expected:[9,8]},
        {label:'A segunda página respeita o deslocamento',args:[[{id:4,criadoEm:'2026-11-11'},{id:9,criadoEm:'2026-11-11'},{id:8,criadoEm:'2026-11-11'}],2,2],expected:[4]},
        {label:'Uma página além do fim fica vazia',args:[[{id:4,criadoEm:'2026-11-11'}],5,2],expected:[]}
      ]
    },
    delivery:{prompt:'Como você explica o alcance da correção no PR?',choices:['A nova ordenação resolve qualquer repetição mesmo durante gravações concorrentes.','Agora há uma ordem única para um conjunto estável. Inserções entre consultas ainda podem deslocar páginas.','O teste com IDs iguais confirma que o desempate funciona.'],answer:1,feedback:['Inserções e remoções podem mover linhas através dos offsets.','A descrição separa os empates corrigidos das mudanças no conjunto entre consultas.','O cenário relevante usa datas iguais e IDs diferentes.'],artifact:{label:'Descrição de PR · WEB-103',text:'Adiciona Id DESC ao ORDER BY para desempatar pedidos criados no mesmo horário. Validei duas páginas consecutivas sobre dados fixos com datas iguais. Inserções entre consultas ainda podem deslocar itens com OFFSET.'}},
    bridge:{title:'A correção no SQL Server',text:'A consulta usa a data como critério principal e o ID único como desempate. Se a lista mudar entre leituras, OFFSET ainda pode deslocar itens. Em uma lista que recebe muitas inserções, avalie paginar a partir da última chave (CriadoEm, Id).',code:'SELECT Id, CriadoEm\nFROM dbo.Pedidos\nORDER BY CriadoEm DESC, Id DESC\nOFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY;'},
    recall:[
      {prompt:'Várias linhas têm a mesma data. Qual campo serve como último critério de desempate?',choices:['Um ID único','O mesmo campo de data repetido','Um status que se repete'],answer:0,feedback:['Uma chave única determina a ordem mesmo quando as datas empatam.','Repetir a data deixa os empates intactos.','O status também pode empatar.']},
      {prompt:'O primeiro pedido foi inserido entre a leitura da página 1 e da 2. Qual é o efeito possível com OFFSET?',choices:['A página 2 ganha automaticamente uma visão congelada','Um item pode se deslocar de uma página para outra','Todos os IDs deixam de ser únicos'],answer:1,feedback:['Cada leitura pode enxergar um conjunto diferente.','O OFFSET conta posições no conjunto que existe no momento da consulta.','O deslocamento ocorre mesmo com IDs únicos.']},
      {prompt:'Com ORDER BY CriadoEm DESC, Id DESC, qual pedido vem primeiro quando as datas empatam?',choices:['O que foi recebido primeiro pela interface','O de menor ID','O de maior ID'],answer:2,feedback:['A ordem vem dos campos do ORDER BY.','DESC coloca o valor mais alto primeiro.','O ID é o segundo critério e está em ordem decrescente.']}
    ],
    refs:[{label:'Microsoft Learn · ORDER BY e OFFSET/FETCH',url:'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-order-by-clause-transact-sql'}]
  }
];
