(function () {
  'use strict';

  const portaria = 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html';
  const hemovigilancia = 'https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/hemovigilancia/sistema-nacional';
  const sensiveis = 'https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd/glossario/d';
  const ler = (label, url, description) => ({label, url, description});
  const teste = (label, args, expected) => ({label, args, expected});
  function pergunta(prompt, answer, opcoes) {
    return {
      prompt, answer,
      choices:opcoes.map(([escolha]) => escolha),
      feedback:opcoes.map(([, retorno]) => retorno)
    };
  }
  function entrega(prompt, answer, opcoes, label, text) {
    return {...pergunta(prompt, answer, opcoes), artifact:{label, text}};
  }

  const definicoes = [
    {
      id:'HEM-101', category:'Cadastro de doadores', area:'coleta',
      title:'Os zeros sumiram do cadastro',
      description:'Corrija a busca por código interno fictício sem misturar cadastros com identificadores diferentes.',
      minutes:15, icon:'filter', theme:'violet', skills:['Strings', 'Validação', 'Privacidade'],
      technologies:['javascript','http','jira','privacidade'], evidenceLanguage:'http',
      story:{
        person:'Lia', role:'Recepção do hemocentro',
        message:'A busca recebe D-00042 do cartão de teste, mas o serviço procura D-42. O código impresso tem cinco dígitos e os zeros fazem parte dele.',
        criteria:['Aceitar um código fictício D- seguido de exatamente cinco dígitos.', 'Tolerar espaços nas bordas e letra d minúscula.', 'Devolver null para uma entrada fora do formato.'],
        evidence:{label:'Network · busca de cadastro sintético',code:'GET /api/doadores?codigo=D-00042\nBusca executada no servidor: D-42\nHTTP/1.1 404 Not Found'},
        question:pergunta('Como preservar a identidade do código de cadastro?',0,[
          ['Tratar o código como texto e validar seu formato.', 'O texto preserva o prefixo e os zeros à esquerda.'],
          ['Converter os dígitos com Number antes de consultar.', 'A conversão descarta os zeros que fazem parte do identificador.'],
          ['Buscar por semelhança quando a consulta não encontra registro.', 'A busca aproximada pode aproximar cadastros distintos.']
        ])
      },
      lab:{
        goal:'Implemente normalizarCodigo(entrada). Se for texto, aplique trim e maiúsculas. Devolva o texto apenas quando ele for D- seguido de cinco dígitos ASCII. Caso contrário, devolva null.',
        functionName:'normalizarCodigo',
        starter:`function normalizarCodigo(entrada) {
  if (typeof entrada !== "string") return null;
  const partes = entrada.trim().toUpperCase().split("-");
  return partes[0] === "D" ? "D-" + Number(partes[1]) : null;
}`,
        answer:`function normalizarCodigo(entrada) {
  if (typeof entrada !== "string") return null;
  const codigo = entrada.trim().toUpperCase();
  return /^D-[0-9]{5}$/.test(codigo) ? codigo : null;
}`,
        hints:['Faça a normalização na string inteira.', 'Valide do início ao fim e preserve os zeros que já estão no código.'],
        tests:[
          teste('Mantém os zeros significativos',['D-00042'],'D-00042'),
          teste('Tolera espaços e caixa baixa',[' d-01234 '],'D-01234'),
          teste('Recusa o código encurtado',['D-42'],null),
          teste('Recusa o tipo numérico',[42],null)
        ],
        note:'D-00042 é um código inventado para o laboratório. O exercício não usa CPF nem dados de doadores reais.'
      },
      delivery:entrega('O que você anexa ao Jira para reproduzir o bug?',1,[
        ['Uma exportação completa de doadores.', 'A falha pode ser reproduzida com um único identificador inventado.'],
        ['O identificador sintético, a URL e os retornos antes e depois.', 'QA recebe uma evidência útil para verificar a correção sem acessar dados de saúde.'],
        ['Uma captura cortada que mostra somente “erro”.', 'A captura sozinha não revela que o código foi transformado antes da consulta.']
      ],'Comentário de QA · HEM-101','Reproduzi com D-00042 em homologação. A busca agora preserva os cinco dígitos. Validei caixa baixa, espaços externos e a rejeição de D-42.'),
      recall:[
        pergunta('O operador colou “ d-00009 ”. O que a função deve produzir?',2,[['D-9','Os zeros fazem parte do código.'],['null','As bordas e a caixa são normalizadas no contrato.'],['D-00009','O texto final mantém todos os cinco dígitos.']]),
        pergunta('Um código precisa permanecer textual em qual camada?',0,[['No formulário, no JSON e na persistência.','A identidade deve sobreviver a todo o percurso.'],['Apenas no componente visual.','O servidor pode perder informação se converter para número.'],['Apenas no arquivo de exportação.','A perda já ocorreria antes da exportação.']]),
        pergunta('O bug pode ser reproduzido sem dados pessoais. O que colocar no PR?',1,[['Uma linha do cadastro real.','Um código inventado reproduz a perda de zeros.'],['Uma requisição com identificador sintético.','O teste explica a falha preservando a confidencialidade.'],['Uma lista de CPFs truncados.','Esse dado não é necessário para reproduzir o erro.']])
      ],
      guide:{
        level:'essencial', prerequisites:['Ler um valor de entrada como texto.', 'Reconhecer uma regra simples de formato e uma resposta HTTP.'],
        theory:[
          ler('Ministério da Saúde · Registros hemoterápicos',portaria,'Localize a seção Dos Registros e observe a importância da identificação alfanumérica e da confidencialidade.'),
          ler('MDN · String.trim()', 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/String/trim','Veja como remover espaços das bordas sem alterar os caracteres internos.')
        ]
      }
    },
    {
      id:'HEM-102', category:'Agenda de doação', area:'coleta',
      title:'Dois agendamentos para a mesma visita',
      description:'Impeça que o portal conte como diferentes dois horários que representam o mesmo instante.',
      minutes:22, icon:'calendar', theme:'blue', skills:['Datas', 'API', 'Conflito'],
      technologies:['javascript','http','sqlserver','jira'], evidenceLanguage:'json',
      story:{
        person:'Caio', role:'Suporte de agendamento',
        message:'O calendário criou duas visitas para o mesmo doador. Uma requisição trouxe 11h em UTC e a outra trouxe 08h com o fuso −03:00.',
        criteria:['Comparar o instante dos horários ISO com fuso.', 'Ignorar agendamentos cancelados e registros de outros doadores.', 'Classificar um horário de entrada inválido como data_invalida.'],
        evidence:{label:'JSON · registros duplicados em homologação',code:'[\n  {"doador":"D-00042","horario":"2026-11-12T11:00:00Z","estado":"confirmado"},\n  {"doador":"D-00042","horario":"2026-11-12T08:00:00-03:00","estado":"confirmado"}\n]'},
        question:pergunta('Qual comparação detecta a duplicidade?',2,[
          ['Comparar o texto recebido diretamente.', 'Dois textos com fusos diferentes podem representar o mesmo instante.'],
          ['Comparar apenas o dia da visita.', 'O mesmo doador pode ter horários distintos em um dia, conforme o contrato didático.'],
          ['Converter cada horário com fuso em um instante e comparar o doador.', 'A combinação preserva a identidade do agendamento.']
        ])
      },
      lab:{
        goal:'Implemente classificarHorario(agenda, doador, horario). Exija o formato ISO AAAA-MM-DDTHH:mm:ss, com fuso Z ou ±HH:mm, e Date.parse(horario) finito. Em caso de formato ou data inválida, retorne "data_invalida". Retorne "duplicado" se houver o mesmo doador no mesmo instante em um registro com estado diferente de cancelado. Caso contrário, retorne "livre".',
        functionName:'classificarHorario',
        starter:`function classificarHorario(agenda, doador, horario) {
  return agenda.some(item => item.doador === doador && item.horario === horario)
    ? "duplicado"
    : "livre";
}`,
        answer:`function classificarHorario(agenda, doador, horario) {
  const comFuso = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:Z|[+-][0-9]{2}:[0-9]{2})$/;
  if (!comFuso.test(horario)) return "data_invalida";
  const instante = Date.parse(horario);
  if (!Number.isFinite(instante)) return "data_invalida";
  const duplicado = agenda.some(item =>
    item.doador === doador &&
    item.estado !== "cancelado" &&
    Date.parse(item.horario) === instante
  );
  return duplicado ? "duplicado" : "livre";
}`,
        hints:['Verifique a presença do fuso antes de chamar Date.parse, que também interpreta datas no fuso local.', 'A duplicidade exige três condições no mesmo registro.'],
        tests:[
          teste('Textos com offsets distintos representam o mesmo horário',[[{doador:'D-00042',horario:'2026-11-12T11:00:00Z',estado:'confirmado'}],'D-00042','2026-11-12T08:00:00-03:00'],'duplicado'),
          teste('Visita cancelada não bloqueia',[[{doador:'D-00042',horario:'2026-11-12T11:00:00Z',estado:'cancelado'}],'D-00042','2026-11-12T11:00:00Z'],'livre'),
          teste('Outro doador tem registro independente',[[{doador:'D-00043',horario:'2026-11-12T11:00:00Z',estado:'confirmado'}],'D-00042','2026-11-12T11:00:00Z'],'livre'),
          teste('Horário não interpretável', [[], 'D-00042','qualquer-dia'],'data_invalida'),
          teste('Relógio sem fuso é ambíguo', [[], 'D-00042','2026-11-12T11:00:00'],'data_invalida')
        ],
        note:'Este contrato trata da duplicidade da visita. Capacidade do posto, intervalos e critérios clínicos não são calculados aqui. No servidor real, transações ou restrições de unicidade devem cobrir requisições concorrentes.'
      },
      delivery:entrega('O que ajuda QA a investigar a duplicidade?',0,[
        ['Os dois corpos com seus fusos e o ID de teste em comum.', 'A evidência permite reproduzir o mesmo instante em formatos distintos.'],
        ['Apenas um print da agenda em horário local.', 'O print não mostra a diferença entre os valores que chegaram ao servidor.'],
        ['Apagar um dos registros sem anotar a origem.', 'Isso perde a evidência que explica como as duas gravações ocorreram.']
      ],'Atualização no Jira · HEM-102','A verificação compara o instante UTC para o mesmo código sintético. Reproduzi com 11:00Z e 08:00−03:00. Validei cancelados e outro doador como casos independentes.'),
      recall:[
        pergunta('Dois offsets diferentes sempre representam instantes diferentes?',1,[['Sim, o texto do fuso é diferente.','O offset explica como converter o relógio local.'],['Não. Compare depois de converter os dois valores para o mesmo referencial.','O instante é a informação usada na deduplicação.'],['Depende do idioma do navegador.','No contrato os textos ISO incluem o fuso.']]),
        pergunta('Por que uma visita cancelada deve ser mantida no histórico?',0,[['Para explicar o que ocorreu e permitir auditar o fluxo.','A validação ignora cancelados sem apagar o registro.'],['Para bloquear o novo agendamento.','A regra didática exclui cancelados da verificação.'],['Para redefinir o fuso local.','O histórico e o fuso são assuntos diferentes.']]),
        pergunta('Duas requisições simultâneas podem passar em uma busca antes de gravar. O que falta?',2,[['Aumentar o número de casas da data.','Precisão não evita que duas operações leiam o mesmo estado.'],['Alterar somente o texto do botão.','Os dois pedidos ainda podem chegar ao servidor.'],['Controlar a concorrência na gravação.','A persistência precisa proteger a invariável de unicidade.']])
      ],
      guide:{
        level:'intermediario', prerequisites:['Ler timestamps ISO com offset.', 'Filtrar uma lista por identidade e estado.'],
        theory:[
          ler('MDN · Date.parse()', 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Date/parse','Compare os casos com fuso explícito e o retorno NaN de uma data inválida.'),
          ler('Ministério da Saúde · Etapas do ciclo',portaria,'Localize captação e cadastro entre os procedimentos do serviço. O contrato de agenda foi criado para o exercício.')
        ]
      }
    },
    {
      id:'HEM-103', category:'Recepção e check-in', area:'coleta',
      title:'O check-in foi parar em outro posto',
      description:'Faça a API respeitar o posto onde o atendimento sintético foi agendado.',
      minutes:18, icon:'shield', theme:'mint', skills:['Estados', 'Contrato HTTP', 'Check-in'],
      technologies:['javascript','http','jira'], evidenceLanguage:'http',
      story:{
        person:'Bia', role:'Recepção do posto',
        message:'O leitor aceitou um QR de uma visita do Posto Norte enquanto eu atendia no Posto Sul. Os dois postos enxergam o mesmo catálogo de visitas.',
        criteria:['Procurar o código exato da visita.', 'Responder 404 se o código não existir e 409 se a visita encontrada estiver cancelada ou pertencer a outro posto.', 'Responder 200 com o estado de check-in para uma visita válida do posto atual.'],
        evidence:{label:'Network · QR de teste no posto incorreto',code:'POST /api/visitas/TESTE-77/check-in\nPosto da sessão simulada: SUL\nPosto do agendamento: NORTE\nHTTP/1.1 200 OK'},
        question:pergunta('De onde vem o posto usado na verificação?',1,[
          ['Do texto impresso no QR, usado como prova de identidade do operador.', 'O QR identifica a visita, não o posto da sessão.'],
          ['Do contexto do posto autenticado, comparado ao agendamento.', 'A API resolve o contexto antes de aceitar o check-in.'],
          ['Da última opção vista no navegador do doador.', 'Essa seleção pode ser alterada e não autentica o atendimento.']
        ])
      },
      lab:{
        goal:'Implemente decidirCheckin(visitas, codigo, postoAtual). Use o primeiro registro com codigo igual. Sem registro, retorne {status:404, estado:"nao_encontrado"}. Se posto divergir ou estado for "cancelado", retorne {status:409, estado:"conflito"}. Nos demais casos, retorne {status:200, estado:"checkin"}. postoAtual já foi resolvido pela sessão.',
        functionName:'decidirCheckin',
        starter:`function decidirCheckin(visitas, codigo, postoAtual) {
  const visita = visitas.find(item => item.codigo === codigo);
  return visita
    ? {status:200, estado:"checkin"}
    : {status:404, estado:"nao_encontrado"};
}`,
        answer:`function decidirCheckin(visitas, codigo, postoAtual) {
  const visita = visitas.find(item => item.codigo === codigo);
  if (!visita) return {status:404, estado:"nao_encontrado"};
  if (visita.posto !== postoAtual || visita.estado === "cancelado") {
    return {status:409, estado:"conflito"};
  }
  return {status:200, estado:"checkin"};
}`,
        hints:['Distinga visita inexistente de visita encontrada que não pode prosseguir no fluxo.', 'Use o posto recebido como contexto, não altere o cadastro para fazer a visita coincidir.'],
        tests:[
          teste('Visita agendada no posto atual',[[{codigo:'TESTE-77',posto:'NORTE',estado:'confirmado'}],'TESTE-77','NORTE'],{status:200,estado:'checkin'}),
          teste('Visita de outro posto',[[{codigo:'TESTE-77',posto:'NORTE',estado:'confirmado'}],'TESTE-77','SUL'],{status:409,estado:'conflito'}),
          teste('Visita cancelada no posto atual',[[{codigo:'TESTE-77',posto:'NORTE',estado:'cancelado'}],'TESTE-77','NORTE'],{status:409,estado:'conflito'}),
          teste('Código inexistente',[[],'TESTE-99','NORTE'],{status:404,estado:'nao_encontrado'})
        ],
        note:'O check-in registra a chegada da visita. Ele não representa autorização clínica para doar. Os códigos HTTP são escolhas do produto fictício.'
      },
      delivery:entrega('Que informação é útil para a recepção e a QA?',2,[
        ['Dizer que todo QR válido agora passa.', 'A visita ainda precisa corresponder ao posto da sessão.'],
        ['Compartilhar os dados completos do cadastro no Slack.', 'O código sintético e os dois postos bastam para reproduzir o erro.'],
        ['Anotar o código de teste, o posto da sessão e o 409 observado.', 'A descrição permite repetir o cenário com dados de homologação.']
      ],'Thread de atendimento · HEM-103','No posto SUL, o QR de TESTE-77 do NORTE agora retorna 409. Em uma sessão NORTE, o mesmo agendamento confirmado retorna 200. Validei o cenário cancelado separadamente.'),
      recall:[
        pergunta('O QR existe, mas a visita está cancelada. Qual resposta foi contratada?',0,[['409.','O registro existe e seu estado impede o check-in.'],['200.','A existência não basta para registrar a chegada.'],['404.','A busca encontrou a visita.']]),
        pergunta('Por que o posto deve vir do contexto autenticado?',2,[['Para tornar a URL menor.','O tamanho da URL não confere autoridade.'],['Para ocultar toda a lógica do banco.','O objetivo é verificar de onde vem a autoridade.'],['Porque o navegador pode modificar os campos que envia.','A API deve resolver o contexto em que o operador atua.']]),
        pergunta('O check-in confirmado indica o quê?',1,[['Aptidão à doação.','A chegada é uma etapa administrativa.'],['Chegada registrada no posto.','A avaliação clínica pertence a um fluxo separado.'],['Resultado de exame liberado.','Check-in não processa exames.']])
      ],
      guide:{
        level:'essencial', prerequisites:['Ler um objeto com código e estado.', 'Interpretar uma resposta HTTP com status e corpo.'],
        theory:[
          ler('IETF · HTTP Semantics, status 409', 'https://www.rfc-editor.org/rfc/rfc9110.html#name-409-conflict','Leia a semântica de conflito com o estado atual do recurso.'),
          ler('Ministério da Saúde · Cadastro e triagem',portaria,'Observe que cadastro e triagem clínica são etapas distintas no ciclo.')
        ]
      }
    },
    {
      id:'HEM-104', category:'Painel de chamadas', area:'coleta',
      title:'O painel exibiu um campo interno',
      description:'Monte um DTO público com senha e guichê, mantendo os dados do cadastro no sistema interno.',
      minutes:18, icon:'shield', theme:'rose', skills:['DTO', 'Projeção', 'LGPD'],
      technologies:['javascript','sqlserver','privacidade','git'], evidenceLanguage:'json',
      story:{
        person:'Ivo', role:'Analista de produto',
        message:'O monitor de chamadas da recepção recebeu o objeto interno completo na resposta JSON. A tela só mostra senha e guichê, mas o Network revela outros campos.',
        criteria:['Considerar apenas os registros com estado chamado.', 'Produzir objetos com exatamente senha e guiche, em ordem de entrada.', 'Manter o array original intacto.'],
        evidence:{label:'Payload de homologação · dados fictícios',code:'[\n  {"senha":"A014","guiche":2,"estado":"chamado","doador":"D-00042","notaInterna":"exemplo"}\n]'},
        question:pergunta('Onde reduzir os dados do painel?',2,[
          ['No CSS, ocultando colunas que não aparecem.', 'Campos ocultos pela tela podem continuar no corpo da resposta.'],
          ['Na renderização, depois de baixar o objeto interno.', 'A resposta já entregou os campos ao navegador.'],
          ['Na projeção do servidor, escolhendo explicitamente os campos do DTO.', 'O painel recebe apenas o que precisa para chamar o atendimento.']
        ])
      },
      lab:{
        goal:'Implemente dtoPainel(registros). Selecione registros com estado "chamado", mantenha a ordem e retorne novos objetos com somente senha e guiche.',
        functionName:'dtoPainel',
        starter:`function dtoPainel(registros) {
  return registros.filter(item => item.estado === "chamado");
}`,
        answer:`function dtoPainel(registros) {
  return registros
    .filter(item => item.estado === "chamado")
    .map(item => ({senha:item.senha, guiche:item.guiche}));
}`,
        hints:['Depois do filter, use map para construir o contrato público.', 'Declare os dois campos. Espalhar o objeto com ...item mantém os outros dados.'],
        tests:[
          teste('Remove dados internos de uma chamada',[[{senha:'A014',guiche:2,estado:'chamado',doador:'D-00042'}]],[{senha:'A014',guiche:2}]),
          teste('Ignora pessoas aguardando',[[{senha:'B006',guiche:1,estado:'aguardando'}]],[]),
          teste('Mantém a ordem das chamadas',[[{senha:'B010',guiche:3,estado:'chamado'},{senha:'A009',guiche:2,estado:'chamado'}]],[{senha:'B010',guiche:3},{senha:'A009',guiche:2}]),
          teste('Sem chamadas devolve lista vazia',[[]],[])
        ],
        note:'O produto fictício usa senhas de atendimento no painel de espera. Os registros de saúde ficam no fluxo interno com acesso autorizado.'
      },
      delivery:entrega('Que verificação no PR evidencia que o vazamento acabou?',1,[
        ['Conferir se o texto sumiu visualmente do painel.', 'A resposta ainda pode conter informação não renderizada.'],
        ['Testar o conjunto exato de chaves da resposta com uma entrada sintética.', 'A igualdade do DTO detecta campos extras antes que cheguem à tela.'],
        ['Guardar a resposta com dados reais como anexo.', 'A validação pode usar o registro de teste do chamado.']
      ],'Descrição de PR · HEM-104','Projetei senha e guiche na API do painel. O teste verifica que um registro sintético com campos internos produz exatamente as duas chaves públicas.'),
      recall:[
        pergunta('O backend adicionou uma observação ao objeto interno. O que acontece com o DTO de seleção explícita?',1,[['A observação aparece por padrão.','O DTO escolhe os campos permitidos.'],['A observação fica de fora até uma mudança consciente do contrato.','A lista explícita evita a expansão acidental da resposta.'],['O browser mascara a observação.','A resposta nem precisa transmitir o campo.']]),
        pergunta('Como inspecionar o que realmente chegou ao browser?',0,[['Abrir a resposta da requisição no Network.','O corpo da resposta mostra os dados transmitidos.'],['Abrir só o painel Elements.','A árvore renderizada pode esconder campos do JSON.'],['Verificar só o status 200.','O status não descreve as chaves do objeto.']]),
        pergunta('Qual prática do EF Core aproxima essa solução?',2,[['Carregar toda a entidade para o painel.','A consulta recupera mais dados do que a tela usa.'],['Retirar campos com CSS.','A projeção pertence ao contrato do servidor.'],['Usar Select para criar o DTO com as colunas necessárias.','A projeção define o que a consulta materializa.']])
      ],
      guide:{
        level:'essencial', prerequisites:['Filtrar e transformar uma lista de objetos.', 'Distinguir os dados recebidos dos dados renderizados.'],
        theory:[
          ler('Ministério da Saúde · Dados pessoais sensíveis',sensiveis,'Leia o verbete de dado referente à saúde vinculado a uma pessoa natural.'),
          ler('Microsoft Learn · Consultas eficientes no EF Core','https://learn.microsoft.com/pt-br/ef/core/performance/efficient-querying','Veja a projeção das propriedades necessárias usando Select.')
        ]
      }
    },
    {
      id:'HEM-105', category:'Registro de coleta', area:'coleta',
      title:'A coleta terminou antes de começar',
      description:'Valide a ordem dos carimbos de tempo antes de gravar um registro operacional de coleta.',
      minutes:20, icon:'clock', theme:'orange', skills:['Datas', 'Validação', 'Auditoria'],
      technologies:['javascript','http','sqlserver','jira'], evidenceLanguage:'json',
      story:{
        person:'Nina', role:'QA de coleta',
        message:'O formulário gravou uma coleta com término anterior ao início. O erro veio na reentrada de um registro fictício de outra estação.',
        criteria:['Validar timestamps ISO com fuso explícito.', 'Recusar término anterior ao início e permitir a igualdade na resolução do simulador.', 'Devolver uma duração em segundos para o registro aceito.'],
        evidence:{label:'JSON · intervalo invertido',code:'{"coleta":"COL-042","inicio":"2026-11-12T11:20:00Z","fim":"2026-11-12T11:12:00Z"}'},
        question:pergunta('Qual regra impede a inconsistência mesmo se outro cliente usar a API?',0,[
          ['Validar ordem e formato antes de gravar no servidor.', 'A persistência só recebe carimbos de tempo que passam na verificação.'],
          ['Deixar a validação no campo Angular.', 'Outro cliente pode chamar a mesma API sem passar pelo componente.'],
          ['Aplicar Math.abs à diferença e salvar sempre.', 'Isso converte uma inversão em duração aparentemente válida.']
        ])
      },
      lab:{
        goal:'Implemente intervaloColeta(inicio, fim). Exija timestamps no formato ISO AAAA-MM-DDTHH:mm:ss, com fuso Z ou ±HH:mm. Se o formato falhar ou um Date.parse for não finito, retorne {estado:"data_invalida"}. Se fim preceder inicio, retorne {estado:"ordem_invalida"}. Nos demais casos retorne {estado:"ok", segundos:(fim-inicio)/1000}, usando os milissegundos calculados.',
        functionName:'intervaloColeta',
        starter:`function intervaloColeta(inicio, fim) {
  const segundos = Math.abs(Date.parse(fim) - Date.parse(inicio)) / 1000;
  return {estado:"ok", segundos};
}`,
        answer:`function intervaloColeta(inicio, fim) {
  const comFuso = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:Z|[+-][0-9]{2}:[0-9]{2})$/;
  if (!comFuso.test(inicio) || !comFuso.test(fim)) return {estado:"data_invalida"};
  const primeiro = Date.parse(inicio);
  const ultimo = Date.parse(fim);
  if (!Number.isFinite(primeiro) || !Number.isFinite(ultimo)) {
    return {estado:"data_invalida"};
  }
  if (ultimo < primeiro) return {estado:"ordem_invalida"};
  return {estado:"ok", segundos:(ultimo - primeiro) / 1000};
}`,
        hints:['Confira se os textos incluem fuso e teste se cada timestamp é finito.', 'A diferença com sinal informa quando os horários estão invertidos.'],
        tests:[
          teste('Calcula o intervalo válido',['2026-11-12T11:20:00Z','2026-11-12T11:25:00Z'],{estado:'ok',segundos:300}),
          teste('Detecta horário invertido',['2026-11-12T11:20:00Z','2026-11-12T11:12:00Z'],{estado:'ordem_invalida'}),
          teste('Detecta texto sem data',['inválido','2026-11-12T11:25:00Z'],{estado:'data_invalida'}),
          teste('Offsets equivalentes produzem zero',['2026-11-12T11:20:00Z','2026-11-12T08:20:00-03:00'],{estado:'ok',segundos:0}),
          teste('Recusa relógio local sem fuso',['2026-11-12T11:20:00','2026-11-12T11:25:00Z'],{estado:'data_invalida'})
        ],
        note:'O laboratório valida coerência de registro e não define duração, condições ou limites clínicos de coleta.'
      },
      delivery:entrega('Qual evidência deve ficar no chamado de QA?',2,[
        ['Somente a duração mostrada na interface.', 'A duração sozinha esconde a ordem original dos eventos.'],
        ['A afirmação de que o horário passou pelo datepicker.', 'O datepicker não valida todas as entradas que a API pode receber.'],
        ['Os timestamps sintéticos enviados e o erro que identifica a inversão.', 'A evidência cobre a fronteira de persistência.']
      ],'Evidência para QA · HEM-105','Enviei início 11:20Z e fim 11:12Z para uma coleta fictícia. A API identifica ordem_invalida antes da gravação. Validei também datas malformadas e offsets equivalentes.'),
      recall:[
        pergunta('Por que não usar Math.abs para corrigir a duração?',1,[['O método aceita apenas strings.','Math.abs opera com números.'],['A inversão some do resultado e a inconsistência pode ser salva.','Valide a ordem antes de calcular.'],['Math.abs altera o fuso horário.','A função ignora o sinal de um número.']]),
        pergunta('O frontend impede uma data invertida. Por que a API ainda deve validar?',0,[['Outras integrações podem chamar a API.','A validação na gravação vale para todos os clientes.'],['Para recalcular o calendário do navegador.','O objetivo é preservar a consistência do registro.'],['Para aceitar silenciosamente qualquer horário.','A API deve devolver um erro claro para a entrada inválida.']]),
        pergunta('No simulador, fim e início têm offsets distintos e o mesmo instante. Qual o intervalo?',2,[['Uma hora.','O fuso já foi incorporado ao instante.'],['Incalculável.','Date.parse interpreta ambos os timestamps ISO.'],['Zero.','A regra didática permite igualdade.']])
      ],
      guide:{
        level:'essencial', prerequisites:['Distinguir texto de um instante UTC.', 'Aplicar guardas antes de calcular uma diferença.'],
        theory:[
          ler('Ministério da Saúde · Registros de doação e produção',portaria,'Confira os registros de etapas e de produção. O cálculo de intervalo aqui é uma regra do exercício.'),
          ler('MDN · Date.parse()', 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Date/parse','Veja o retorno em milissegundos e como uma entrada inválida é sinalizada.')
        ]
      }
    },
    {
      id:'HEM-106', category:'Etiquetas de amostras', area:'coleta',
      title:'A etiqueta pertencia a outra coleta',
      description:'Verifique se o leitor está associando uma amostra à mesma coleta do registro aberto.',
      minutes:22, icon:'shield', theme:'rose', skills:['Rastreabilidade', 'Leitor de código', 'Validação'],
      technologies:['javascript','http','slack','jira'], evidenceLanguage:'json',
      story:{
        person:'Ravi', role:'Analista de laboratório',
        message:'Uma amostra sintética com etiqueta de COL-043 apareceu associada a COL-042. A tela aceita qualquer etiqueta com o tipo esperado.',
        criteria:['Comparar o identificador de coleta das duas origens.', 'Distinguir falta de etiqueta e tipo de etiqueta inesperado.', 'Registrar o vínculo apenas no caso em que tipo e coleta coincidirem.'],
        evidence:{label:'Leitura em bancada de teste',code:'{\n  "coletaAberta":"COL-042",\n  "etiqueta":{"tipo":"amostra","coleta":"COL-043","id":"AM-091"}\n}'},
        question:pergunta('O que detecta o engano antes da associação?',1,[
          ['A cor da etiqueta.', 'A cor não distingue coletas diferentes com o mesmo tipo de etiqueta.'],
          ['O tipo e o código de coleta lidos no vínculo.', 'Conferir ambos impede que o mesmo tipo seja aceito de outra coleta.'],
          ['O horário mais recente na estação.', 'O horário não determina a identidade do material.']
        ])
      },
      lab:{
        goal:'Implemente classificarLeitura(coleta, etiqueta). Para etiqueta ausente ou sem id, devolva "sem_leitura". Se tipo não for "amostra", devolva "tipo_invalido". Se o campo coleta divergir da coleta aberta, devolva "coleta_divergente". Caso contrário, devolva "vinculo_confirmado".',
        functionName:'classificarLeitura',
        starter:`function classificarLeitura(coleta, etiqueta) {
  if (!etiqueta || !etiqueta.id) return "sem_leitura";
  return etiqueta.tipo === "amostra" ? "vinculo_confirmado" : "tipo_invalido";
}`,
        answer:`function classificarLeitura(coleta, etiqueta) {
  if (!etiqueta || !etiqueta.id) return "sem_leitura";
  if (etiqueta.tipo !== "amostra") return "tipo_invalido";
  if (etiqueta.coleta !== coleta) return "coleta_divergente";
  return "vinculo_confirmado";
}`,
        hints:['Cheque primeiro se há uma leitura identificável.', 'Uma etiqueta do tipo correto pode apontar para outra coleta.'],
        tests:[
          teste('Etiqueta do tipo e coleta corretos',['COL-042',{id:'AM-091',tipo:'amostra',coleta:'COL-042'}],'vinculo_confirmado'),
          teste('Identifica coleta divergente',['COL-042',{id:'AM-091',tipo:'amostra',coleta:'COL-043'}],'coleta_divergente'),
          teste('Recusa etiqueta de unidade',['COL-042',{id:'U-091',tipo:'unidade',coleta:'COL-042'}],'tipo_invalido'),
          teste('Sem leitura identificável',['COL-042',null],'sem_leitura')
        ],
        note:'Os formatos e os tipos do leitor são fictícios. A missão compara vínculos já registrados e não ensina rotulagem clínica.'
      },
      delivery:entrega('Como encaminhar a ocorrência de homologação?',0,[
        ['Registrar os dois códigos fictícios, o tipo e o vínculo recusado.', 'QA precisa da combinação que reproduz o defeito.'],
        ['Mandar somente uma foto com dados de uma amostra real.', 'O cenário sintético contém a evidência necessária.'],
        ['Alterar a etiqueta até conseguir salvar o vínculo.', 'A alteração esconderia a divergência que a equipe precisa investigar.']
      ],'Thread de QA · HEM-106','Validei AM-091 de COL-043 sobre a coleta COL-042 em homologação. A aplicação agora sinaliza coleta_divergente e preserva os vínculos anteriores.'),
      recall:[
        pergunta('Por que duas etiquetas do mesmo tipo podem divergir?',2,[['Porque o tipo é um número decimal.','O tipo separa categorias; o identificador aponta para a coleta.'],['Porque o tipo é gerado a cada renderização.','A leitura já informa o tipo e a coleta.'],['Porque a coleta vinculada a cada etiqueta pode ser diferente.','O vínculo requer a comparação de identidade.']]),
        pergunta('O leitor devolveu um objeto sem id. Que estado mostrar?',0,[['sem_leitura.','O laboratório exige uma leitura identificável.'],['vinculo_confirmado.','A falta de id impede confirmar o vínculo.'],['coleta_divergente.','Sem id, primeiro é preciso reconhecer que a leitura é incompleta.']]),
        pergunta('Qual ação de produto é adequada diante de uma divergência?',1,[['Reassociar automaticamente à última coleta.', 'A ordem das coletas não é evidência de identidade.'],['Preservar o estado e exibir a divergência para a equipe responsável.', 'A aplicação registra o problema sem alterar a associação.'],['Ocultar a divergência depois de salvar.', 'A inconsistência precisa ser tratada antes do vínculo.']])
      ],
      guide:{
        level:'intermediario', prerequisites:['Comparar dois identificadores sem convertê-los.', 'Distinguir um resultado ausente de um resultado inválido.'],
        theory:[
          ler('Ministério da Saúde · Rastreabilidade e registros',portaria,'Leia Dos Registros para entender por que os exames precisam permanecer vinculados à origem.'),
          ler('Anvisa · Sistema Nacional de Hemovigilância',hemovigilancia,'Observe que a vigilância acompanha eventos em diferentes etapas do ciclo.')
        ]
      }
    },
    {
      id:'HEM-107', category:'Processamento e origem', area:'estoque',
      title:'O componente sem unidade de origem',
      description:'Evite registros órfãos e códigos duplicados na geração de componentes sintéticos.',
      minutes:25, icon:'database', theme:'violet', skills:['Relações', 'Chaves', 'EF Core'],
      technologies:['javascript','sqlserver','git'], evidenceLanguage:'sql',
      story:{
        person:'Cris', role:'Analista de processamento',
        message:'Na tela de produção, um componente apareceu sem conseguir abrir sua unidade de origem. O importador também repetiu um código que já existia.',
        criteria:['Recusar origem que não exista no catálogo.', 'Recusar um código de componente já usado no catálogo didático.', 'Devolver o registro com os códigos do componente e da origem quando ambos forem válidos.'],
        evidence:{label:'SQL · componente sem vínculo',code:"SELECT c.Codigo, c.Origem\nFROM Componentes c\nLEFT JOIN Unidades u ON u.Codigo = c.Origem\nWHERE u.Codigo IS NULL;"},
        question:pergunta('Qual modelagem protege a rastreabilidade no banco?',0,[
          ['Chave estrangeira para a origem e unicidade no código do componente.', 'A persistência protege o vínculo e a identidade mesmo com múltiplos clientes.'],
          ['Usar a descrição da unidade como chave estrangeira.', 'Uma descrição pode ser alterada ou repetida.'],
          ['Remover a coluna de origem e confiar no relatório.', 'O relatório precisa do vínculo preservado no registro.']
        ])
      },
      lab:{
        goal:'Implemente prepararComponente(unidades, componentes, novo). unidades é uma lista de códigos de origem e componentes uma lista de objetos com codigo. Se novo.origem não existir, retorne {estado:"origem_ausente"}. Se novo.codigo já existir, retorne {estado:"codigo_em_uso"}. Nos outros casos retorne {estado:"registrar", codigo:novo.codigo, origem:novo.origem}.',
        functionName:'prepararComponente',
        starter:`function prepararComponente(unidades, componentes, novo) {
  if (!unidades.includes(novo.origem)) return {estado:"origem_ausente"};
  return {estado:"registrar", codigo:novo.codigo, origem:novo.origem};
}`,
        answer:`function prepararComponente(unidades, componentes, novo) {
  if (!unidades.includes(novo.origem)) return {estado:"origem_ausente"};
  if (componentes.some(item => item.codigo === novo.codigo)) {
    return {estado:"codigo_em_uso"};
  }
  return {estado:"registrar", codigo:novo.codigo, origem:novo.origem};
}`,
        hints:['Proteja o relacionamento antes de devolver uma ação de registro.', 'Use some para procurar um código existente no catálogo.'],
        tests:[
          teste('Origem conhecida e código novo',[['U-100'],[],{codigo:'HC-010',origem:'U-100'}],{estado:'registrar',codigo:'HC-010',origem:'U-100'}),
          teste('Origem inexistente',[['U-100'],[],{codigo:'HC-010',origem:'U-999'}],{estado:'origem_ausente'}),
          teste('Código repetido com origem existente',[['U-100'],[{codigo:'HC-010',origem:'U-100'}],{codigo:'HC-010',origem:'U-100'}],{estado:'codigo_em_uso'}),
          teste('Permite outro componente da mesma origem',[['U-100'],[{codigo:'HC-010',origem:'U-100'}],{codigo:'HC-011',origem:'U-100'}],{estado:'registrar',codigo:'HC-011',origem:'U-100'})
        ],
        note:'O código didático de componente é único neste catálogo. Em produção, modele a identidade conforme o padrão de identificação aprovado para o serviço e proteja as gravações concorrentes no banco.'
      },
      delivery:entrega('O que incluir no PR da mudança de dados?',1,[
        ['Somente o print da tela que abre um componente.', 'A validação precisa cobrir os casos de origem ausente e código repetido.'],
        ['Critérios de vínculo, casos de teste e plano de verificar registros órfãos antes de impor a restrição.', 'A equipe entende o impacto sobre a base existente e sobre novas gravações.'],
        ['Uma migração que apaga os registros órfãos automaticamente.', 'Os dados existentes precisam de análise e tratamento rastreável.']
      ],'Descrição de PR · HEM-107','Validei origem existente e identificador único. Na migração, listar divergências da base de homologação para análise antes de ativar a chave estrangeira.'),
      recall:[
        pergunta('Uma unidade gera dois componentes fictícios. O que eles podem compartilhar?',1,[['O mesmo código de componente.','O catálogo didático exige códigos distintos.'],['A chave de origem.','O vínculo é de uma origem para vários componentes.'],['Somente a descrição.','A origem deve ser ligada por identificador.']]),
        pergunta('Por que a guarda da aplicação não basta em gravações concorrentes?',2,[['Ela apaga códigos antigos.','A guarda só observa o estado disponível ao executar.'],['Ela impede qualquer leitura.','A regra não limita a consulta.'],['Duas chamadas podem enxergar o código ainda livre; a unicidade do banco fecha a lacuna.','A restrição protege todas as gravações.']]),
        pergunta('Qual é o primeiro passo ao encontrar origem ausente em registros antigos?',0,[['Identificar os casos e levar a evidência à equipe responsável.','O tratamento preserva a trilha de auditoria.'],['Inventar uma unidade genérica para todos.','Isso altera a identidade sem evidência.'],['Apagar antes de registrar.','A perda de registros prejudica a investigação.']])
      ],
      guide:{
        level:'intermediario', prerequisites:['Reconhecer chaves primária e estrangeira.', 'Ler um relacionamento de uma origem para vários registros.'],
        theory:[
          ler('Microsoft Learn · Relações no EF Core','https://learn.microsoft.com/pt-br/ef/core/modeling/relationships','Veja como o modelo representa uma chave estrangeira e relações um-para-muitos.'),
          ler('Ministério da Saúde · Registros de produção',portaria,'Localize os registros que ligam a unidade coletada ao destino dos componentes produzidos.')
        ]
      }
    },
    {
      id:'HEM-108', category:'Integração com laboratório', area:'integracao',
      title:'A revisão antiga chegou por último',
      description:'Ordene revisões da mensagem de laboratório pelo número de versão e pelo código da amostra.',
      minutes:28, icon:'activity', theme:'orange', skills:['Versionamento', 'Idempotência', 'Integração'],
      technologies:['javascript','http','sqlserver','slack'], evidenceLanguage:'json',
      story:{
        person:'Dani', role:'Engenharia de integração',
        message:'A fila reentregou uma notificação antiga. A revisão 2 chegou depois da revisão 3 para AM-091 e a tela voltou a mostrar o estado anterior de recebimento.',
        criteria:['Vincular o recebimento à amostra certa.', 'Ignorar mensagens com revisão igual ou anterior.', 'Registrar uma revisão nova somente se a validação de integração estiver confirmada.'],
        evidence:{label:'Mensagens sintéticas em ordem de chegada',code:'[\n  {"amostra":"AM-091","revisao":3,"validacaoIntegracao":"confirmada"},\n  {"amostra":"AM-091","revisao":2,"validacaoIntegracao":"confirmada"}\n]'},
        question:pergunta('Qual informação tem precedência para o estado de recebimento?',2,[
          ['A última mensagem recebida, independentemente da revisão.', 'As mensagens podem chegar fora de ordem ou ser repetidas.'],
          ['O tamanho do corpo do evento.', 'O tamanho não informa a versão.'],
          ['A revisão confirmada para a mesma amostra.', 'A versão é parte do contrato de atualização e evita regressão.']
        ])
      },
      lab:{
        goal:'Implemente decidirRecebimento(atual, mensagem). Se amostra divergir, retorne "amostra_divergente". Para mensagem.revisao menor ou igual a atual.revisao, retorne "sem_alteracao". Se validacaoIntegracao não for "confirmada", retorne "pendente_integracao". Caso contrário, retorne "registrar_recebimento". As revisões são inteiros de um protocolo de teste.',
        functionName:'decidirRecebimento',
        starter:`function decidirRecebimento(atual, mensagem) {
  if (atual.amostra !== mensagem.amostra) return "amostra_divergente";
  return "registrar_recebimento";
}`,
        answer:`function decidirRecebimento(atual, mensagem) {
  if (atual.amostra !== mensagem.amostra) return "amostra_divergente";
  if (mensagem.revisao <= atual.revisao) return "sem_alteracao";
  if (mensagem.validacaoIntegracao !== "confirmada") return "pendente_integracao";
  return "registrar_recebimento";
}`,
        hints:['O código da amostra define qual registro pode mudar.', 'Verifique revisões repetidas ou antigas antes de aceitar o novo estado.'],
        tests:[
          teste('Nova revisão confirmada',[{amostra:'AM-091',revisao:2},{amostra:'AM-091',revisao:3,validacaoIntegracao:'confirmada'}],'registrar_recebimento'),
          teste('Mensagem repetida',[{amostra:'AM-091',revisao:3},{amostra:'AM-091',revisao:3,validacaoIntegracao:'confirmada'}],'sem_alteracao'),
          teste('Mensagem atrasada',[{amostra:'AM-091',revisao:3},{amostra:'AM-091',revisao:2,validacaoIntegracao:'confirmada'}],'sem_alteracao'),
          teste('Validação pendente',[{amostra:'AM-091',revisao:2},{amostra:'AM-091',revisao:3,validacaoIntegracao:'pendente'}],'pendente_integracao'),
          teste('Amostra diferente',[{amostra:'AM-091',revisao:2},{amostra:'AM-092',revisao:3,validacaoIntegracao:'confirmada'}],'amostra_divergente')
        ],
        note:'O recebimento é um estado técnico de integração. O exercício não interpreta resultado de exame nem altera liberação de estoque. A aplicação real precisa gravar revisão e estado de modo atômico.'
      },
      delivery:entrega('Que mensagem de incidente permite confirmar a correção?',0,[
        ['AM-091 sintética recebeu revisões 3, 2 e 3; a segunda e a terceira não mudaram o estado.', 'A sequência cobre atraso e duplicação sem expor conteúdo de exame.'],
        ['A fila foi limpa e não há mais eventos.', 'Isso não evidencia o que ocorre quando a reentrega voltar a acontecer.'],
        ['O exame foi aprovado pelo sistema de integração.', 'O fluxo simula confirmação técnica de recebimento, sem decisão clínica.']
      ],'Thread de incidente · HEM-108','Reproduzi chegada 3 → 2 → 3 para AM-091 sintética. O consumidor preserva a revisão 3. Adicionei cobertura de amostra divergente e confirmação técnica pendente.'),
      recall:[
        pergunta('A revisão atual é 5. A mensagem 5 foi reentregue. O que fazer?',1,[['Reaplicar a mudança.','Repetir efeitos pode duplicar registros.'],['Manter o estado.','A revisão igual já foi observada.'],['Trocar a amostra por outra.','A amostra é a identidade do fluxo.']]),
        pergunta('A revisão 6 chegou para uma amostra diferente. Como tratar?',0,[['Rejeitar o vínculo com o registro atual.','A revisão só tem significado dentro da identidade esperada.'],['Aplicar, pois 6 é maior.','A comparação de revisão não supera uma divergência de amostra.'],['Mudar o código atual para coincidir.','Isso alteraria a rastreabilidade sem justificativa.']]),
        pergunta('O recebimento técnico confirmado representa o quê?',2,[['Decisão de liberação clínica.','O consumidor não interpreta o exame.'],['Descarte automático de eventos anteriores do histórico.','Preservar o histórico é útil para investigação.'],['Aceitação do novo registro técnico conforme o protocolo fictício.','A decisão operacional ou clínica pertence à equipe autorizada.']])
      ],
      guide:{
        level:'avancado', prerequisites:['Entender reentrega e mensagens fora de ordem.', 'Raciocinar sobre identidade, versão e persistência atômica.'],
        theory:[
          ler('Ministério da Saúde · Intercâmbio de resultados',portaria,'Localize o capítulo do GSM-NAT para entender o contexto de acompanhamento de amostras e intercâmbio de dados.'),
          ler('Microsoft Learn · Concorrência no EF Core','https://learn.microsoft.com/pt-br/ef/core/saving/concurrency','Veja como tokens ajudam a detectar gravações concorrentes quando uma versão é atualizada.')
        ]
      }
    },
    {
      id:'HEM-109', category:'Estoque e quarentena', area:'estoque',
      title:'A lista exibiu unidades em quarentena',
      description:'Faça o painel respeitar o estado operacional que a equipe já registrou no estoque.',
      minutes:18, icon:'layers', theme:'mint', skills:['Estados', 'DTO', 'Filtros'],
      technologies:['javascript','sqlserver','http','jira'], evidenceLanguage:'json',
      story:{
        person:'Sol', role:'Responsável pelo estoque',
        message:'A aba Disponíveis passou a incluir unidades com estado quarentena. Uma importação antiga também tem linhas sem estado.',
        criteria:['Exibir somente o estado explícito disponivel na aba Disponíveis.', 'Devolver os códigos em ordem de entrada.', 'Excluir estados desconhecidos ou ausentes da lista operacional.'],
        evidence:{label:'Estoque de teste · estados persistidos',code:'[\n  {"codigo":"HC-010","estado":"disponivel"},\n  {"codigo":"HC-011","estado":"quarentena"},\n  {"codigo":"HC-012"}\n]'},
        question:pergunta('Qual filtro representa corretamente o painel?',1,[
          ['Incluir tudo cujo estado seja diferente de descartado.', 'Um filtro negativo pode deixar passar quarentena e valores desconhecidos.'],
          ['Incluir apenas o valor persistido disponivel.', 'O estado explícito é a base da leitura do painel.'],
          ['Deduzir disponibilidade pelo tempo que passou.', 'O painel não infere liberação a partir de datas.']
        ])
      },
      lab:{
        goal:'Implemente codigosDisponiveis(unidades). Retorne os códigos das unidades com estado exatamente "disponivel", na ordem em que aparecem. Qualquer outro estado, inclusive ausente, fica fora.',
        functionName:'codigosDisponiveis',
        starter:`function codigosDisponiveis(unidades) {
  return unidades.filter(item => item.estado !== "descartado").map(item => item.codigo);
}`,
        answer:`function codigosDisponiveis(unidades) {
  return unidades
    .filter(item => item.estado === "disponivel")
    .map(item => item.codigo);
}`,
        hints:['Compare com o valor permitido, em vez de tentar listar todos os estados bloqueados.', 'Depois do filtro, projete apenas os códigos.'],
        tests:[
          teste('Mantém apenas o disponível',[[{codigo:'HC-010',estado:'disponivel'},{codigo:'HC-011',estado:'quarentena'}]],['HC-010']),
          teste('Estado ausente não é disponibilidade',[[{codigo:'HC-012'}]],[]),
          teste('Descartados ficam fora',[[{codigo:'HC-013',estado:'descartado'}]],[]),
          teste('Mantém a ordem para dois disponíveis',[[{codigo:'HC-014',estado:'disponivel'},{codigo:'HC-002',estado:'disponivel'}]],['HC-014','HC-002']),
          teste('Estado novo não entra na aba Disponíveis',[[{codigo:'HC-015',estado:'em_conferencia'}]],[])
        ],
        note:'Disponibilidade é um estado operacional fornecido ao simulador. O filtro não libera unidades e não decide indicação ou compatibilidade.'
      },
      delivery:entrega('Qual caso precisa entrar na cobertura além da quarentena?',2,[
        ['Somente uma lista com todos os itens disponíveis.', 'Isso não testa a reação a dados incompletos.'],
        ['Um screenshot do botão Disponíveis.', 'A lista pode permanecer incorreta mesmo se o botão estiver certo.'],
        ['Uma linha importada sem estado, que deve ficar fora.', 'Esse cenário protege o comportamento seguro com dados incompletos.']
      ],'Critério de regressão no Jira · HEM-109','A consulta de Disponíveis usa estado explícito. QA validou HC-010 incluída e HC-011 em quarentena e HC-012 sem estado excluídas.'),
      recall:[
        pergunta('Por que “diferente de descartado” não atende ao requisito?',0,[['Há outros estados que não pertencem à lista, inclusive quarentena.','A regra deve explicitar o único estado permitido.'],['Porque descartado é sempre um estado ausente.','Descartado e ausência são casos diferentes.'],['Porque qualquer exclusão é feita só na interface.','A API pode projetar o conjunto correto.']]),
        pergunta('Uma unidade passou a ter um estado novo. O que a regra faz?',2,[['Inclui até alguém cadastrar o estado.','Um estado novo não equivale a disponível.'],['Converte o estado em disponivel.','O painel não altera o estoque.'],['Mantém fora da lista Disponíveis.','O filtro positivo só aceita o estado contratado.']]),
        pergunta('O painel deve alterar estado quando a lista fica vazia?',1,[['Sim, para sempre mostrar algum item.','O vazio pode refletir o estado correto do estoque.'],['Não. O estado vazio descreve a ausência de itens dessa consulta.','Visualização e atualização têm responsabilidades distintas.'],['Apenas se não houver erro de rede.','Uma resposta válida ainda pode não ter itens.']])
      ],
      guide:{
        level:'essencial', prerequisites:['Filtrar registros por uma igualdade explícita.', 'Separar estados de estoque de estados da interface.'],
        theory:[
          ler('Ministério da Saúde · Armazenamento e liberação',portaria,'Identifique armazenamento e liberação como atividades registradas do ciclo, com procedimentos do serviço.'),
          ler('MDN · Array.filter()', 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array/filter','Revise como o predicado decide quais elementos permanecem na lista.')
        ]
      }
    },
    {
      id:'HEM-110', category:'Conferência de inventário', area:'estoque',
      title:'O leitor contou a mesma unidade duas vezes',
      description:'Compare a contagem física simulada ao inventário do sistema e liste as divergências para revisão.',
      minutes:24, icon:'database', theme:'blue', skills:['Conjuntos', 'Conciliação', 'Auditoria'],
      technologies:['javascript','sqlserver','git','jira'], evidenceLanguage:'json',
      story:{
        person:'Rô', role:'Qualidade do estoque',
        message:'Na conferência fictícia, o leitor registrou HC-010 duas vezes. O relatório exibiu o total esperado, mas HC-011 estava faltando e HC-990 apareceu sem cadastro nessa posição.',
        criteria:['Comparar códigos únicos, sem contar leituras repetidas como unidades extras.', 'Listar separadamente códigos esperados não lidos e códigos lidos não esperados.', 'Preservar a ordem da primeira ocorrência de cada código.'],
        evidence:{label:'Conferência de bancada · IDs inventados',code:'{"esperados":["HC-010","HC-011","HC-012"],"lidos":["HC-010","HC-010","HC-012","HC-990"]}'},
        question:pergunta('Qual é a primeira evidência a comparar?',1,[
          ['Só os totais dos dois conjuntos.', 'Totais iguais podem esconder uma troca entre identificadores.'],
          ['Os códigos dos conjuntos e as diferenças nos dois sentidos.', 'A conciliação mostra o que faltou e o que foi lido fora do esperado.'],
          ['O código mais recente digitado no sistema.', 'Um único código não descreve as duas listas.']
        ])
      },
      lab:{
        goal:'Implemente conciliarContagem(esperados, lidos). Retorne {faltantes, desconhecidos}. faltantes contém códigos únicos esperados e não lidos; desconhecidos contém códigos únicos lidos e não esperados. Mantenha a ordem da primeira ocorrência em cada lista de origem.',
        functionName:'conciliarContagem',
        starter:`function conciliarContagem(esperados, lidos) {
  return {
    faltantes:esperados.filter(codigo => !lidos.includes(codigo)),
    desconhecidos:lidos.filter(codigo => !esperados.includes(codigo))
  };
}`,
        answer:`function conciliarContagem(esperados, lidos) {
  const previstos = new Set(esperados);
  const observados = new Set(lidos);
  return {
    faltantes:[...previstos].filter(codigo => !observados.has(codigo)),
    desconhecidos:[...observados].filter(codigo => !previstos.has(codigo))
  };
}`,
        hints:['Set preserva a ordem de inserção e elimina repetições.', 'Calcule separadamente a diferença em cada sentido.'],
        tests:[
          teste('Conciliação com falta e leitura desconhecida',[['HC-010','HC-011','HC-012'],['HC-010','HC-010','HC-012','HC-990']],{faltantes:['HC-011'],desconhecidos:['HC-990']}),
          teste('Não repete desconhecidos',[['HC-010'],['HC-990','HC-990']],{faltantes:['HC-010'],desconhecidos:['HC-990']}),
          teste('Não repete faltantes',[['HC-022','HC-010','HC-022'],[]],{faltantes:['HC-022','HC-010'],desconhecidos:[]}),
          teste('Mesmo conjunto, sem divergência',[['HC-010','HC-012'],['HC-012','HC-010']],{faltantes:[],desconhecidos:[]})
        ],
        note:'O relatório da missão aponta divergências. A reconciliação no estoque requer análise da equipe e registro da correção.'
      },
      delivery:entrega('Que saída é adequada para a conferência da qualidade?',0,[
        ['Um relatório de divergências para revisar antes de ajustar o inventário.', 'A equipe pode conferir leituras, posição e identidade antes de qualquer alteração.'],
        ['Uma atualização que troca o inventário pelo que o leitor observou.', 'Uma leitura repetida ou incompleta não deve sobrescrever os registros.'],
        ['Um indicador verde se os totais coincidirem.', 'Uma troca de identificadores pode manter o mesmo total.']
      ],'Descrição de PR · HEM-110','O relatório distingue faltantes e desconhecidos por código e elimina leituras repetidas. QA validou que a conferência não altera o estoque.'),
      recall:[
        pergunta('Os totais físico e digital são iguais. O que ainda precisa ser conferido?',2,[['Somente o horário do último registro.','O horário não mostra se são os mesmos itens.'],['A cor do painel.','O estado visual deve derivar da comparação.'],['A identidade dos códigos nas duas listas.','A troca de uma unidade por outra pode manter o total.']]),
        pergunta('O mesmo código desconhecido foi lido três vezes. Como aparece no relatório?',1,[['Três vezes.','O relatório representa unidades únicas.'],['Uma vez, na posição da primeira leitura.','As repetições do leitor não alteram a identidade do item.'],['Não aparece.','A leitura desconhecida precisa ser apontada.']]),
        pergunta('Por que separar a consulta da alteração de estoque?',0,[['Porque a divergência precisa de revisão e evidência antes de correção.','Essa separação ajuda a preservar o histórico de movimentação.'],['Para evitar mostrar um caso que não concorda.','A divergência deve aparecer explicitamente.'],['Para apagar códigos não lidos no próximo acesso.','A consulta não é autorização para corrigir o cadastro.']])
      ],
      guide:{
        level:'intermediario', prerequisites:['Distinguir contagem de registros e conjunto de identificadores.', 'Comparar conjuntos nos dois sentidos.'],
        theory:[
          ler('MDN · Set', 'https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Set','Leia como Set mantém valores únicos na ordem de inserção.'),
          ler('Ministério da Saúde · Rastreabilidade e registros',portaria,'Veja como os registros de origem e destino apoiam a investigação de divergências.')
        ]
      }
    }
  ];

  window.hemoCycleMissions = definicoes.map(({guide, ...mission}) => ({
    ...mission, refs:guide.theory.map(({label, url}) => ({label, url}))
  }));
  window.hemoCycleGuide = Object.fromEntries(definicoes.map(({id, guide}) => [id, guide]));
})();
