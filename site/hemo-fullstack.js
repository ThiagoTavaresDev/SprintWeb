'use strict';

(() => {
  const ministry = 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html';
  const vigilance = 'https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/hemovigilancia/sistema-nacional';
  const privacy = 'https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd/glossario/d';
  const api = 'https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-10.0';
  const angular = 'https://angular.dev/guide/http/making-requests';
  const guide = {};

  function quiz(prompt,answer,...options) {
    return {prompt,answer,choices:options.map(([choice]) => choice),feedback:options.map(([,feedback]) => feedback)};
  }

  function scenario(label,method,path,args,status,body,state,message,items) {
    return {label,method,path,args,response:{status,body},view:{state,message,...(items ? {items} : {})}};
  }

  function mission(data) {
    const {level,prerequisites,theory,backend,frontend,...details} = data;
    guide[data.id] = {level,prerequisites,theory};
    return {
      ...details,technologies:['javascript','http','jira','slack','git'],
      backend:{...backend,functionName:'responder',tests:data.integration.map(item => ({label:item.label,args:item.args,expected:item.response}))},
      frontend:{...frontend,functionName:'renderizar',tests:data.integration.map(item => ({label:item.label,args:[item.response],expected:item.view}))},
      refs:theory.map(({label,url}) => ({label,url}))
    };
  }

  const origens = {
    'BOL-101':{coleta:'COL-101',eventos:['Coleta registrada','Componente processado','Movimentação registrada']},
    'BOL-102':{coleta:null,eventos:['Componente recebido']}
  };
  const casoQualidade = {codigo:'OC-21',revisao:2,estado:'em_analise'};
  const unidades = {
    'BOL-101':{codigo:'BOL-101',unidade:'U-NORTE',status:'disponivel',notaInterna:'Exemplo reservado'},
    'BOL-102':{codigo:'BOL-102',unidade:'U-SUL',status:'quarentena',notaInterna:'Exemplo reservado'}
  };

  window.hemoFullstackMissions = [
    mission({
      id:'HFS-201',area:'transfusao',category:'Solicitações e interface',title:'O rascunho sem referência',
      description:'Valide a referência do atendimento na API e mostre no formulário onde corrigir a solicitação simulada.',
      minutes:25,icon:'layers',theme:'mint',skills:['Contrato HTTP','Validação','Estados de tela'],
      level:'intermediario',prerequisites:['Ler e editar funções JavaScript com objetos.','Reconhecer a diferença entre uma resposta 201 e uma resposta 422.','Entender por que o rascunho operacional usa uma referência fictícia de atendimento.'],
      theory:[
        {label:'Ministério da Saúde · Regulamento de hemoterapia',url:ministry,description:'Consulte a parte sobre registros e identificação. O rascunho do exercício é uma abstração didática.'},
        {label:'Microsoft Learn · Minimal APIs',url:api,description:'Veja como um endpoint recebe o corpo da requisição e devolve resultados HTTP.'},
        {label:'Angular · Requisições HTTP',url:angular,description:'Compare o tratamento de uma resposta válida com o tratamento de falhas no HttpClient.'}
      ],
      story:{
        person:'Lia',role:'Analista de produto',message:'O formulário salvou um rascunho sem referência do atendimento. A equipe encontrou um erro genérico e teve que descobrir qual campo estava vazio.',
        criteria:['A API valida a referência fictícia no formato ATD-NNN.','Um 422 aponta o campo que precisa de correção.','Um 201 confirma somente o rascunho.'],
        evidence:{label:'Chamado no Jira · reprodução',code:'POST /api/hemoterapia/solicitacoes\n{"atendimentoRef":""}\nAtual: 201 · esperado: 422'},
        question:quiz('Qual evidência deve fechar o ticket?',1,
          ['O botão fica cinza quando o campo está vazio.','A API pode ser chamada diretamente. Confirme também a resposta HTTP.'],
          ['A API devolve 422 e o formulário mostra o erro junto ao campo.','As duas camadas demonstram o comportamento que a equipe precisa.'],
          ['A solicitação passa direto ao estado concluído.','O escopo é salvar um rascunho com referência operacional.'])
      },
      backend:{
        goal:'Leia req.atendimentoRef, removendo espaços das pontas. Aceite exatamente ATD- seguido de três dígitos. Válido: {status:201,body:{referencia:<texto>,estado:"rascunho"}}. Inválido: {status:422,body:{campo:"atendimentoRef"}}.',
        starter:'function responder(req) {\n  return {status:201,body:{referencia:req.atendimentoRef,estado:"rascunho"}};\n}',
        answer:'function responder(req) {\n  const referencia = String(req.atendimentoRef ?? "").trim();\n  return /^ATD-\\d{3}$/.test(referencia)\n    ? {status:201,body:{referencia,estado:"rascunho"}}\n    : {status:422,body:{campo:"atendimentoRef"}};\n}',
        hints:['Normalize antes de aplicar o padrão.','A decisão do código se limita ao formato da referência de exemplo.']
      },
      frontend:{
        goal:'Para 201, retorne {state:"success",message:"Rascunho salvo."}. Para 422, retorne {state:"error",message:"Revise a referência do atendimento."}.',
        starter:'function renderizar(resposta) {\n  return {state:"success",message:"Rascunho salvo."};\n}',
        answer:'function renderizar(resposta) {\n  if (resposta.status === 422) return {state:"error",message:"Revise a referência do atendimento."};\n  return {state:"success",message:"Rascunho salvo."};\n}',
        hints:['Leia status antes do estado da tela.','422 representa validação da referência, não falha de rede.']
      },
      integration:[
        scenario('Referência válida','POST','/api/hemoterapia/solicitacoes',[{atendimentoRef:'ATD-012'}],201,{referencia:'ATD-012',estado:'rascunho'},'success','Rascunho salvo.'),
        scenario('Referência ausente','POST','/api/hemoterapia/solicitacoes',[{}],422,{campo:'atendimentoRef'},'error','Revise a referência do atendimento.'),
        scenario('Espaços nas pontas','POST','/api/hemoterapia/solicitacoes',[{atendimentoRef:' ATD-017 '}],201,{referencia:'ATD-017',estado:'rascunho'},'success','Rascunho salvo.')
      ],
      handoff:{channel:'#produto-hemoterapia',slack:'HFS-201 · Validei referência ausente, válida e com espaços. A API retorna 422 por campo e a tela orienta a corrigir o rascunho.',pr:'HFS-201 · A API valida a referência fictícia e a tela diferencia rascunho salvo de erro do campo. Execute os três cenários integrados.'},
      recall:[
        quiz('Uma chamada direta envia referência vazia. Qual camada rejeita?',0,['Backend.','O servidor protege o contrato mesmo fora do formulário.'],['Apenas frontend.','O navegador pode ser contornado.']),
        quiz('Qual resultado indica rascunho criado?',1,['422.','Esse código aponta erro de validação.'],['201.','A API informa a criação do recurso de rascunho.']),
        quiz('Como responder ao suporte?',0,['Dizer o campo, o resultado e os cenários validados.','Essa mensagem permite conferir a mudança.'],['Colar um prontuário real na thread.','Use referências fictícias e evidências mínimas.'])
      ]
    }),
    mission({
      id:'HFS-202',area:'estoque',category:'Rastreabilidade e interface',title:'Cadê a origem da unidade?',
      description:'Consulte a origem de um hemocomponente e diferencie histórico encontrado, vínculo incompleto e código desconhecido.',
      minutes:29,icon:'database',theme:'blue',skills:['Rastreabilidade','HTTP','SQL Server'],
      level:'intermediario',prerequisites:['Ler parâmetros de rota e objetos aninhados.','Entender relacionamentos entre unidade, coleta e eventos.','Tratar resultados 200, 404 e 409 em uma interface.'],
      theory:[
        {label:'Ministério da Saúde · Registros e rastreabilidade',url:ministry,description:'Leia a seção Dos Registros para entender o vínculo entre origem, trajetória e destino.'},
        {label:'Microsoft Learn · Consultas eficientes no EF Core',url:'https://learn.microsoft.com/ef/core/performance/efficient-querying',description:'Veja como projetar apenas as colunas que a consulta de histórico precisa.'}
      ],
      story:{
        person:'Ícaro',role:'Operação',message:'Ao consultar a unidade, a tela mostra “nenhum registro” tanto para código desconhecido quanto para uma unidade cujo vínculo de origem está incompleto.',
        criteria:['Unidade localizada com origem devolve coleta e eventos.','Código inexistente devolve 404.','Unidade existente sem origem devolve 409 com orientação de investigação.'],
        evidence:{label:'Comparação no Cliente HTTP',code:'GET /api/hemoterapia/rastreio/BOL-102\nUnidade: encontrada | vínculo de origem: ausente'},
        question:quiz('O que a interface precisa separar?',0,['Unidade inexistente e unidade existente com vínculo incompleto.','São situações diferentes para a investigação da equipe.'],['Apenas a quantidade de eventos.','A contagem não explica se a origem existe.'],['Apenas a cor da etiqueta.','O problema está no vínculo de dados.'])
      },
      backend:{
        goal:'Consulte mapa[req.codigo]. Sem registro: {status:404,body:{erro:"nao_encontrado"}}. Registro sem coleta: {status:409,body:{erro:"origem_incompleta"}}. Com coleta: {status:200,body:{coleta,eventos}}.',
        starter:'function responder(req,mapa) {\n  const registro = mapa[req.codigo];\n  if (!registro) return {status:404,body:{erro:"nao_encontrado"}};\n  return {status:200,body:registro};\n}',
        answer:'function responder(req,mapa) {\n  const registro = Object.hasOwn(mapa,req.codigo) ? mapa[req.codigo] : null;\n  if (!registro) return {status:404,body:{erro:"nao_encontrado"}};\n  if (!registro.coleta) return {status:409,body:{erro:"origem_incompleta"}};\n  return {status:200,body:registro};\n}',
        hints:['Confira a existência do registro antes de acessar coleta.','O mapa simula uma consulta a relacionamentos de rastreabilidade.']
      },
      frontend:{
        goal:'200: {state:"ready",message:"Origem "+body.coleta,items:body.eventos.map((label,id)=>({id,label}))}. 409: {state:"conflict",message:"Investigue o vínculo de origem."}. 404: {state:"empty",message:"Unidade não localizada."}.',
        starter:'function renderizar(resposta) {\n  return {state:"empty",message:"Unidade não localizada."};\n}',
        answer:'function renderizar(resposta) {\n  if (resposta.status === 404) return {state:"empty",message:"Unidade não localizada."};\n  if (resposta.status === 409) return {state:"conflict",message:"Investigue o vínculo de origem."};\n  const {coleta,eventos} = resposta.body;\n  return {state:"ready",message:"Origem "+coleta,items:eventos.map((label,id)=>({id,label}))};\n}',
        hints:['Separe os estados antes de montar a lista.','Use os eventos na ordem devolvida pelo servidor.']
      },
      integration:[
        scenario('Origem e eventos localizados','GET','/api/hemoterapia/rastreio/BOL-101',[{codigo:'BOL-101'},origens],200,origens['BOL-101'],'ready','Origem COL-101',origens['BOL-101'].eventos.map((label,id)=>({id,label}))),
        scenario('Origem incompleta','GET','/api/hemoterapia/rastreio/BOL-102',[{codigo:'BOL-102'},origens],409,{erro:'origem_incompleta'},'conflict','Investigue o vínculo de origem.'),
        scenario('Unidade desconhecida','GET','/api/hemoterapia/rastreio/BOL-999',[{codigo:'BOL-999'},origens],404,{erro:'nao_encontrado'},'empty','Unidade não localizada.')
      ],
      handoff:{channel:'#operacao-hemoterapia',slack:'HFS-202 · A tela diferencia origem recuperada, vínculo incompleto e código inexistente. Validei BOL-101, BOL-102 e BOL-999 com dados fictícios.',pr:'HFS-202 · Projeta coleta e eventos e apresenta os estados 200, 409 e 404. Confira a evidência de cada cenário em Integração.'},
      recall:[
        quiz('O 409 de origem incompleta pode virar lista vazia?',1,['Sim, porque a tela precisa de poucos estados.','Uma lista vazia esconde a quebra de vínculo.'],['Separe o estado de investigação do vazio.','A unidade foi localizada e precisa de acompanhamento.']),
        quiz('O que o evento de movimentação deve preservar?',0,['O identificador da mesma unidade.','Esse vínculo permite reconstruir sua trajetória.'],['A posição na tabela da interface.','A posição muda com filtros e paginação.']),
        quiz('Como testar uma regressão de rastreio?',0,['Usar casos com vínculo íntegro, incompleto e código inexistente.','Esses casos verificam o contrato das duas camadas.'],['Testar só a unidade mais recente.','Um caso positivo não distingue os estados de erro.'])
      ]
    }),
    mission({
      id:'HFS-203',area:'vigilancia',category:'Hemovigilância e versionamento',title:'A revisão ficou desatualizada',
      description:'Proteja o registro interno de uma revisão concorrente e mostre na tela quando recarregar a ocorrência.',
      minutes:30,icon:'activity',theme:'orange',skills:['Concorrência','Rascunho interno','Hemovigilância'],
      level:'avancado',prerequisites:['Reconhecer gravações concorrentes e versões de um registro.','Ler o status e o corpo de respostas HTTP.','Distinguir o registro interno simulado do processo institucional de hemovigilância.'],
      theory:[
        {label:'Anvisa · Sistema Nacional de Hemovigilância',url:vigilance,description:'Entenda o papel de registro e investigação de eventos adversos no ciclo do sangue.'},
        {label:'Microsoft Learn · Concorrência no EF Core',url:'https://learn.microsoft.com/ef/core/saving/concurrency',description:'Veja como tokens de concorrência detectam quando outra sessão já atualizou o registro.'}
      ],
      story:{
        person:'Rosa',role:'Qualidade',message:'Duas pessoas analisaram o mesmo quase-erro. A segunda aba gravou usando a versão antiga e ocultou o registro da primeira.',
        criteria:['A alteração exige um resumo de revisão.','Uma versão antiga gera 409 sem alterar os dados de exemplo.','A tela orienta a recarregar a ocorrência antes de tentar de novo.'],
        evidence:{label:'Dois salvamentos em homologação',code:'OC-21 · versão atual 2\nAba 2 envia revisão 1\nAtual: sobrescrita · esperado: 409'},
        question:quiz('Como evitar sobrescrever a revisão mais recente?',1,['Sempre usar o último botão clicado.','A ordem dos cliques não indica qual versão a pessoa leu.'],['Comparar a versão recebida com a versão persistida.','Isso permite detectar um rascunho desatualizado.'],['Apagar o registro anterior.','A investigação depende de preservar evidências.'])
      },
      backend:{
        goal:'Se resumo estiver vazio após trim, devolva {status:422,body:{erro:"resumo_obrigatorio"}}. Se req.revisao difere de registro.revisao, devolva {status:409,body:{erro:"revisao_antiga"}}. No sucesso devolva {status:200,body:{codigo:registro.codigo,revisao:registro.revisao+1,estado:"revisao_registrada"}}.',
        starter:'function responder(req,registro) {\n  return {status:200,body:{codigo:registro.codigo,revisao:registro.revisao+1,estado:"revisao_registrada"}};\n}',
        answer:'function responder(req,registro) {\n  if (!String(req.resumo ?? "").trim()) return {status:422,body:{erro:"resumo_obrigatorio"}};\n  if (req.revisao !== registro.revisao) return {status:409,body:{erro:"revisao_antiga"}};\n  return {status:200,body:{codigo:registro.codigo,revisao:registro.revisao+1,estado:"revisao_registrada"}};\n}',
        hints:['Valide primeiro o resumo, depois a versão.','Em produção, a comparação e a gravação precisam ser atômicas.'],
        note:'O exercício modela um registro interno de investigação. Não envia notificações nem define critérios de notificação.'
      },
      frontend:{
        goal:'200: {state:"success",message:"Revisão registrada."}. 409: {state:"conflict",message:"Recarregue a ocorrência antes de salvar."}. 422: {state:"error",message:"Informe o resumo da revisão."}.',
        starter:'function renderizar(resposta) {\n  return {state:"success",message:"Revisão registrada."};\n}',
        answer:'function renderizar(resposta) {\n  if (resposta.status === 409) return {state:"conflict",message:"Recarregue a ocorrência antes de salvar."};\n  if (resposta.status === 422) return {state:"error",message:"Informe o resumo da revisão."};\n  return {state:"success",message:"Revisão registrada."};\n}',
        hints:['Um conflito exige recarregar. Um resumo ausente exige corrigir o formulário.','Use sucesso somente quando a revisão foi registrada.']
      },
      integration:[
        scenario('Revisão atual','PATCH','/api/hemoterapia/qualidade/OC-21',[{revisao:2,resumo:'Revisado em homologação'},casoQualidade],200,{codigo:'OC-21',revisao:3,estado:'revisao_registrada'},'success','Revisão registrada.'),
        scenario('Aba com versão antiga','PATCH','/api/hemoterapia/qualidade/OC-21',[{revisao:1,resumo:'Teste de outra aba'},casoQualidade],409,{erro:'revisao_antiga'},'conflict','Recarregue a ocorrência antes de salvar.'),
        scenario('Resumo ausente','PATCH','/api/hemoterapia/qualidade/OC-21',[{revisao:2,resumo:' '},casoQualidade],422,{erro:'resumo_obrigatorio'},'error','Informe o resumo da revisão.')
      ],
      handoff:{channel:'#qualidade-hemoterapia',slack:'HFS-203 · Duas abas da ocorrência fictícia reproduziram o conflito. A API preserva a versão atual e a tela orienta recarregar. O caso de resumo em branco também foi conferido.',pr:'HFS-203 · Trata concorrência na revisão interna e diferencia validação e conflito na interface. Valide versão atual, desatualizada e resumo vazio.'},
      recall:[
        quiz('Duas gravações usam a mesma versão. O que precisa ser atômico?',0,['Comparar a versão e aplicar a escrita.','Separar essas operações permite que ambas passem pela comparação.'],['Somente redesenhar o formulário.','A integridade pertence à camada persistente.']),
        quiz('Após conflito, qual ação a tela deve sugerir?',1,['Reenviar a mesma versão sem conferir.','O contexto continua desatualizado.'],['Recarregar e revisar o registro atual.','Isso dá à pessoa a versão correta antes de decidir.']),
        quiz('O exercício envia uma notificação oficial?',0,['O cenário registra uma revisão interna fictícia.','O fluxo externo é uma responsabilidade institucional separada.'],['Sim, toda gravação é uma notificação.','Salvar no software e notificar são ações diferentes.'])
      ]
    }),
    mission({
      id:'HFS-204',area:'integracao',category:'Acesso por unidade e privacidade',title:'O detalhe apareceu para a unidade errada',
      description:'Valide o vínculo de unidade no servidor e devolva somente os campos operacionais que a tela precisa.',
      minutes:29,icon:'shield',theme:'rose',skills:['Autorização por recurso','DTO','Privacidade'],
      level:'avancado',prerequisites:['Distinguir sessão autenticada de parâmetros enviados pelo navegador.','Reconhecer autorização por recurso e projeção de um DTO.','Interpretar 401 e 404 na interface.'],
      theory:[
        {label:'Ministério da Saúde · Dados pessoais sensíveis',url:privacy,description:'Veja por que registros de saúde exigem atenção ao acesso e à exposição de dados.'},
        {label:'OWASP · Autorização por objeto em APIs',url:'https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/',description:'Veja por que um identificador válido de recurso ainda precisa de autorização no servidor.'}
      ],
      story:{
        person:'Bia',role:'Segurança',message:'Ao trocar o código na URL, a sessão de uma unidade abriu os dados da outra. A interface também recebeu uma nota que não precisava mostrar.',
        criteria:['Sem sessão, a API responde 401.','Unidade diferente ou código inexistente devolve a mesma resposta 404 da política didática.','O DTO contém somente código, unidade e estado operacional.'],
        evidence:{label:'Caso encontrado pela equipe',code:'GET /api/hemoterapia/unidades/BOL-102\nSessão no servidor: U-NORTE\nRegistro pertence a: U-SUL'},
        question:quiz('Onde aplicar a restrição de unidade?',0,['Na API, com a unidade da sessão validada no servidor.','O cliente não é fonte de autoridade para permissão.'],['Somente escondendo o link na tela.','Uma chamada direta à API ainda poderia obter o recurso.'],['Confiando em uma unidade editável no JSON.','O cliente pode alterar o valor enviado.'])
      },
      backend:{
        goal:'Sem req.sessao, retorne {status:401,body:{erro:"sessao_ausente"}}. Para mapa[req.codigo] inexistente ou com unidade diferente de req.sessao.unidade, retorne {status:404,body:{erro:"indisponivel"}}. Sucesso 200 com body:{codigo,unidade,status} copiados do registro.',
        starter:'function responder(req,mapa) {\n  if (!req.sessao) return {status:401,body:{erro:"sessao_ausente"}};\n  const registro = mapa[req.codigo];\n  return {status:200,body:registro};\n}',
        answer:'function responder(req,mapa) {\n  if (!req.sessao) return {status:401,body:{erro:"sessao_ausente"}};\n  const registro = Object.hasOwn(mapa,req.codigo) ? mapa[req.codigo] : null;\n  if (!registro || registro.unidade !== req.sessao.unidade) return {status:404,body:{erro:"indisponivel"}};\n  const {codigo,unidade,status} = registro;\n  return {status:200,body:{codigo,unidade,status}};\n}',
        hints:['Use a unidade injetada pelo servidor, não outro campo da requisição.','Desestruture só os campos que o frontend pode receber.']
      },
      frontend:{
        goal:'200: {state:"ready",message:"Unidade "+body.unidade,items:[{id:body.codigo,label:body.codigo,detail:body.status}]}. 401: {state:"denied",message:"Entre para consultar."}. 404: {state:"empty",message:"Registro indisponível."}.',
        starter:'function renderizar(resposta) {\n  if (resposta.status === 401) return {state:"denied",message:"Entre para consultar."};\n  return {state:"ready",message:"Registro localizado."};\n}',
        answer:'function renderizar(resposta) {\n  if (resposta.status === 401) return {state:"denied",message:"Entre para consultar."};\n  if (resposta.status === 404) return {state:"empty",message:"Registro indisponível."};\n  const {codigo,unidade,status} = resposta.body;\n  return {state:"ready",message:"Unidade "+unidade,items:[{id:codigo,label:codigo,detail:status}]};\n}',
        hints:['No 404, mantenha a mensagem genérica.','O frontend mostra só o DTO permitido.']
      },
      integration:[
        scenario('Registro da mesma unidade','GET','/api/hemoterapia/unidades/BOL-101',[{codigo:'BOL-101',sessao:{unidade:'U-NORTE'}},unidades],200,{codigo:'BOL-101',unidade:'U-NORTE',status:'disponivel'},'ready','Unidade U-NORTE',[{id:'BOL-101',label:'BOL-101',detail:'disponivel'}]),
        scenario('Código de outra unidade','GET','/api/hemoterapia/unidades/BOL-102',[{codigo:'BOL-102',sessao:{unidade:'U-NORTE'}},unidades],404,{erro:'indisponivel'},'empty','Registro indisponível.'),
        scenario('Consulta sem sessão','GET','/api/hemoterapia/unidades/BOL-101',[{codigo:'BOL-101',sessao:null},unidades],401,{erro:'sessao_ausente'},'denied','Entre para consultar.')
      ],
      handoff:{channel:'#seguranca-produto',slack:'HFS-204 · Em homologação, a sessão U-NORTE só abriu o registro da mesma unidade. O DTO omitiu a nota interna e os testes também cobriram sessão ausente.',pr:'HFS-204 · Aplica autorização por unidade e projeção de campos no backend. A tela trata registro indisponível e falta de sessão com respostas distintas.'},
      recall:[
        quiz('De onde deve vir a unidade usada na decisão?',1,['Do JSON livre da requisição.','O cliente controla esse JSON.'],['Da sessão autenticada e validada.','O servidor conhece o vínculo da sessão.']),
        quiz('Como impedir que a nota interna apareça no Network?',0,['Excluí-la da resposta no servidor.','A informação não chega ao navegador.'],['Ocultar com CSS.','O corpo da resposta continua contendo a nota.']),
        quiz('O que levar ao Jira para revisão?',0,['Casos fictícios de mesma unidade, outra unidade e sessão ausente.','Esse conjunto demonstra a regra e os estados de tela.'],['Print com registro real de produção.','Dados fictícios bastam para reproduzir o comportamento.'])
      ]
    })
  ];
  window.hemoFullstackGuide = guide;
})();
