'use strict';

(() => {
  const regulation = 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html';
  const surveillance = 'https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento/hemovigilancia/sistema-nacional';
  const privacy = 'https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes';
  const source = (label, url, description) => ({label, url, description});
  const test = (label, args, expected) => ({label, args, expected});

  function quiz(prompt, answer, ...options) {
    return {
      prompt, answer,
      choices: options.map(([choice]) => choice),
      feedback: options.map(([, feedback]) => feedback)
    };
  }

  function delivery(question, label, text) {
    return {...question, artifact: {label, text}};
  }

  const records = (description) => source('Ministério da Saúde · Portaria GM/MS nº 11.685/2026', regulation, description);
  const trace = records('Consulte a seção de registros do Anexo IV-B para entender a rastreabilidade da obtenção ao destino final.');
  const watch = source('Anvisa · Sistema Nacional de Hemovigilância', surveillance, 'Veja como a vigilância acompanha eventos do ciclo do sangue e consulte o manual e as normas relacionados.');
  const sensitive = source('ANPD · Perguntas frequentes sobre a LGPD', privacy, 'Leia a distinção entre dado pessoal e dado pessoal sensível, com destaque para dados de saúde.');
  const available = {codigo:'HC-17', status:'disponivel', versao:4};
  const reserved = {codigo:'HC-17', status:'reservada', versao:5, pedidoId:'SOL-8'};
  const shipment = {id:'TR-12', codigo:'HC-22', origem:'U-A', destino:'U-B', status:'em_transito'};
  const reading = {remessaId:'TR-12', codigo:'HC-22', destino:'U-B', operadorId:'OP-6'};
  const audit = [{id:'EV-31', tipo:'transferencia', local:'U-A'}];
  const correction = {id:'EV-32', alvoId:'EV-31', novoLocal:'U-B', motivo:'  Conciliação do registro  '};
  const amended = [...audit, {id:'EV-32', alvoId:'EV-31', tipo:'retificacao', novoLocal:'U-B', motivo:'Conciliação do registro'}];
  const returned = {codigo:'HC-27', status:'devolvida'};
  const closed = {codigo:'HC-27', status:'encerrada', destino:'descarte_registrado', motivo:'Registro da equipe'};
  const notice = {origem:'U-A', chave:'EXT-92', tipo:'quase_erro', codigo:'HC-35'};
  const knownNotices = [{...notice, id:'HV-04'}];

  const entries = [
    {
      id:'HEM-111', area:'estoque', category:'Estoque e concorrência', title:'Duas reservas para a mesma unidade',
      description:'Use a versão do estoque para impedir que uma solicitação sobrescreva outra.',
      minutes:25, icon:'database', theme:'blue', skills:['Concorrência otimista','HTTP','EF Core'],
      technologies:['javascript','http','sqlserver','jira'], evidenceLanguage:'http',
      story:{
        person:'Bia', role:'Operação de estoque',
        message:'Duas estações abriram HC-17 na versão 4. A primeira registrou SOL-8. A segunda registrou SOL-9 com a tela antiga e substituiu a reserva.',
        criteria:['A operação compara a versão antes de alterar o registro.', 'Uma unidade já reservada recusa outra reserva.', 'Sucesso vincula a solicitação e incrementa a versão.'],
        evidence:{label:'HTTP · mesma versão em duas estações',code:'PATCH /api/estoque/HC-17/reserva\nIf-Match: "4"\n\n{"pedidoId":"SOL-8"}\n\nPATCH /api/estoque/HC-17/reserva\nIf-Match: "4"\n\n{"pedidoId":"SOL-9"}'},
        question:quiz('A segunda estação ainda possui a versão 4. Qual correção evita a atualização perdida?', 1,
          ['Aguardar um segundo entre os dois cliques.', 'Um atraso no navegador ainda permite duas estações concorrentes.'],
          ['Comparar a versão na gravação e recusar a versão antiga.', 'A persistência garante a precondição entre estações.'],
          ['Salvar sempre a última solicitação recebida.', 'Isso substitui a reserva anterior sem que o operador perceba.'])
      },
      lab:{
        functionName:'reservar',
        goal:'Implemente reservar(unidade, pedidoId, versaoEsperada). Devolva {status, unidade}. Se a versão divergir, responda 412 com a unidade original. Se o status atual for diferente de disponivel, responda 409 com a unidade original. Caso contrário, responda 200 com uma cópia reservada, pedidoId e versao incrementada.',
        starter:`function reservar(unidade, pedidoId, versaoEsperada) {
  if (unidade.status !== "disponivel") return {status: 409, unidade};
  return {status: 200, unidade: {...unidade, status: "reservada", pedidoId, versao: unidade.versao + 1}};
}`,
        answer:`function reservar(unidade, pedidoId, versaoEsperada) {
  if (unidade.versao !== versaoEsperada) return {status: 412, unidade};
  if (unidade.status !== "disponivel") return {status: 409, unidade};
  return {status: 200, unidade: {...unidade, status: "reservada", pedidoId, versao: unidade.versao + 1}};
}`,
        hints:['Compare versaoEsperada com unidade.versao antes de olhar o status.', 'Use spread para devolver uma cópia quando houver alteração.'],
        note:'O Worker simula a decisão de uma operação. Em uma API, vincule a versão à gravação no banco, por exemplo com um token de concorrência do EF Core. A reserva é administrativa.',
        tests:[
          test('Reserva a unidade na versão lida',[available,'SOL-8',4],{status:200,unidade:reserved}),
          test('Recusa versão desatualizada após outra reserva',[reserved,'SOL-9',4],{status:412,unidade:reserved}),
          test('Recusa nova reserva mesmo com a versão atual',[reserved,'SOL-9',5],{status:409,unidade:reserved}),
          test('Verifica versão mesmo para unidade disponível',[available,'SOL-9',3],{status:412,unidade:available})
        ]
      },
      delivery:delivery(quiz('Qual evidência você coloca no Jira?', 2,
        ['Uma captura da interface após uma reserva.', 'A imagem mostra apenas um operador.'],
        ['A lista com IDs de receptores para repetir no ambiente de teste.', 'Use dados fictícios e inclua apenas dados técnicos necessários.'],
        ['O caso de duas versões, o 412 e o estado preservado.', 'O revisor consegue confirmar o conflito e a persistência da primeira reserva.']),
        'Comentário no Jira · HEM-111','Com duas estações na versão 4 de HC-17, SOL-8 grava a versão 5 e SOL-9 recebe 412. A primeira reserva permanece. Validei ainda 409 com a versão atual de uma unidade reservada.'),
      recall:[
        quiz('O que o operador faz ao receber 412?',0,['Recarrega a unidade antes de tentar novamente.','O 412 indica que a versão enviada não corresponde à versão atual.'],['Repete a mesma versão até funcionar.','O conflito persiste enquanto a versão enviada for antiga.'],['Supõe que o banco perdeu o pedido.','A resposta informa uma falha de precondição.']),
        quiz('Em qual ponto a versão precisa ser checada para proteger duas requisições?',2,['Somente no Angular.','A checagem da interface ajuda a orientar, mas as requisições chegam ao servidor separadamente.'],['Somente em um log depois do update.','O log chega após a sobrescrita.'],['Na atualização persistida.','O banco permite tornar a comparação parte da condição da alteração.']),
        quiz('A versão é atual, mas a unidade já foi reservada. Qual é o resultado do laboratório?',1,['200 e sobrescrita.','A condição de negócio ainda precisa ser verificada.'],['409 com a unidade preservada.','O conflito de estado difere da versão antiga, que retorna 412.'],['412 por versão antiga.','A versão enviada coincide com a atual.'])
      ],
      guide:{level:'avancado',prerequisites:['Ler objetos JavaScript e criar cópias com spread.', 'Distinguir 409 de falha de precondição 412.', 'Entender duas gravações concorrentes no mesmo registro.'],theory:[
        source('Microsoft Learn · Concorrência no EF Core','https://learn.microsoft.com/en-us/ef/core/saving/concurrency','Veja como o EF Core usa um token para detectar alteração entre leitura e gravação.'),
        source('IETF · If-Match','https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1','Entenda o vínculo entre a versão da representação e a precondição enviada pelo cliente.'),trace
      ]}
    },
    {
      id:'HEM-112', area:'estoque', category:'Transferência entre unidades', title:'Recebimento no destino errado',
      description:'Confirme os identificadores da remessa antes de registrar o recebimento.',
      minutes:18, icon:'route', theme:'mint', skills:['Validação de entrada','JSON','Jira'],
      technologies:['javascript','http','jira'], evidenceLanguage:'json',
      story:{
        person:'Caio', role:'Logística',
        message:'Uma leitura para TR-12 foi lançada na unidade U-C. A remessa tinha U-B como destino e mesmo assim o software registrou o recebimento.',
        criteria:['Somente remessas em trânsito entram neste fluxo de recebimento.', 'O ID da remessa, código do componente e unidade de destino precisam corresponder.', 'O evento de recebimento registra as unidades de origem e destino.'],
        evidence:{label:'Leitura de recebimento · homologação',code:JSON.stringify({...reading,destino:'U-C'},null,2)},
        question:quiz('Qual campo falta comparar quando o ID da remessa e o componente coincidem?', 0,
          ['A unidade de destino da leitura.', 'O mesmo componente pode ser lido fora do ponto previsto.'],
          ['A cor do botão de recebimento.', 'A cor indica um estado da interface e não comprova o destino.'],
          ['O horário do último deploy.', 'O horário não identifica em qual unidade a leitura ocorreu.'])
      },
      lab:{
        functionName:'receberRemessa',
        goal:'Implemente receberRemessa(remessa, leitura). Se a remessa estiver fora de em_transito, retorne {status: 409}. Se remessa.id, codigo ou destino divergirem dos campos remessaId, codigo e destino da leitura, retorne {status: 422}. Caso válido, retorne {status: 201, evento: {tipo: "recebimento", remessaId, codigo, origem, destino, operadorId}}.',
        starter:`function receberRemessa(remessa, leitura) {
  if (remessa.status !== "em_transito") return {status: 409};
  if (remessa.id !== leitura.remessaId || remessa.codigo !== leitura.codigo) return {status: 422};
  return {status: 201, evento: {tipo: "recebimento", remessaId: remessa.id, codigo: remessa.codigo, origem: remessa.origem, destino: leitura.destino, operadorId: leitura.operadorId}};
}`,
        answer:`function receberRemessa(remessa, leitura) {
  if (remessa.status !== "em_transito") return {status: 409};
  if (remessa.id !== leitura.remessaId || remessa.codigo !== leitura.codigo || remessa.destino !== leitura.destino) {
    return {status: 422};
  }
  return {status: 201, evento: {tipo: "recebimento", remessaId: remessa.id, codigo: remessa.codigo, origem: remessa.origem, destino: remessa.destino, operadorId: leitura.operadorId}};
}`,
        hints:['Valide o estado da remessa antes de conferir os identificadores.', 'A unidade de destino da leitura precisa coincidir com o destino registrado na remessa.'],
        note:'O exercício valida vínculos administrativos. A avaliação das condições do transporte é registrada pela equipe responsável.',
        tests:[
          test('Registra origem e destino previstos',[shipment,reading],{status:201,evento:{tipo:'recebimento',remessaId:'TR-12',codigo:'HC-22',origem:'U-A',destino:'U-B',operadorId:'OP-6'}}),
          test('Bloqueia recebimento em outra unidade',[shipment,{...reading,destino:'U-C'}],{status:422}),
          test('Bloqueia código de outro componente',[shipment,{...reading,codigo:'HC-23'}],{status:422}),
          test('Bloqueia repetição depois do recebimento',[{...shipment,status:'recebida'},reading],{status:409})
        ]
      },
      delivery:delivery(quiz('O que enviar ao QA para reteste?', 1,
        ['Somente uma captura da remessa.', 'O QA também precisa de uma leitura que deve ser recusada.'],
        ['Leituras fictícias em U-B e U-C e os resultados esperados.', 'Os dois cenários mostram se a correção bloqueia o destino errado sem quebrar o esperado.'],
        ['O código da estação de outro usuário.', 'Use uma estação de teste e dados sintéticos.']),
        'Critério de aceite no Jira · HEM-112','Em TR-12, a leitura de HC-22 em U-B grava recebimento com origem U-A. A mesma leitura em U-C retorna 422 e fica sem evento. Remessa recebida retorna 409.'),
      recall:[
        quiz('Qual dado conecta despacho e recebimento?',1,['O nome do botão usado.','Esse nome faz parte da interface.'],['O identificador da remessa.','Os dois eventos podem ser reunidos pela mesma remessa.'],['O idioma da tela.','O idioma não identifica o transporte.']),
        quiz('A unidade está correta, mas o código do componente mudou. O que fazer?',0,['Recusar a leitura e pedir conferência.','O código precisa corresponder ao item vinculado.'],['Trocar automaticamente o item da remessa.','A troca esconderia a divergência.'],['Registrar só a origem.','A origem sozinha não comprova qual item chegou.']),
        quiz('Uma remessa já recebida chega de novo com os mesmos campos. O que esta API faz?',2,['Gera dois recebimentos.','Um segundo recebimento criaria duplicidade.'],['Apaga o primeiro registro.','O histórico deve ser preservado.'],['Recusa a operação pelo estado atual.','A API desta prática responde 409 quando a remessa saiu de em_transito.'])
      ],
      guide:{level:'essencial',prerequisites:['Ler objetos JSON.', 'Comparar campos de dois objetos em JavaScript.', 'Entender eventos de origem e destino.'],theory:[
        records('Consulte o parágrafo do Anexo IV-B sobre o registro de recebimento entre serviços. As validações de ID são regras do cenário.')
      ]}
    },
    {
      id:'HEM-113', area:'vigilancia', category:'Auditoria de rastreabilidade', title:'Corrigir um evento sem apagá-lo',
      description:'Vincule a correção ao evento original e preserve a sequência da unidade.',
      minutes:22, icon:'git', theme:'violet', skills:['Eventos de auditoria','Imutabilidade','API'],
      technologies:['javascript','http','git','jira'], evidenceLanguage:'json',
      story:{
        person:'Eva', role:'Qualidade',
        message:'O local de uma transferência foi corrigido no cadastro. O relatório passou a mostrar só o valor novo. Agora não sabemos qual registro motivou a correção.',
        criteria:['O evento original continua disponível.', 'A retificação aponta para o evento corrigido e possui motivo.', 'Um ID já usado ou alvo inexistente não cria evento.'],
        evidence:{label:'Retificação solicitada · dados sintéticos',code:JSON.stringify(correction,null,2)},
        question:quiz('Qual modelo permite auditar o valor anterior e a correção?', 2,
          ['Substituir o local e salvar apenas o valor atual.', 'O histórico anterior fica indisponível para investigar.'],
          ['Criar evento sem vínculo e listar por horário.', 'A proximidade no tempo não identifica o alvo da correção.'],
          ['Acrescentar retificação com referência, valor e motivo.', 'A referência permite reconstruir e explicar a mudança.'])
      },
      lab:{
        functionName:'retificar',
        goal:'Implemente retificar(eventos, correcao). Se correcao.id já existir, retorne {status:409,eventos}. Se correcao.alvoId não existir, retorne {status:404,eventos}. Se motivo.trim() for vazio, retorne {status:422,eventos}. Caso válido, retorne status 201 e uma nova lista com {id, alvoId, tipo:"retificacao", novoLocal, motivo} no fim. Remova os espaços das pontas do motivo.',
        starter:`function retificar(eventos, correcao) {
  if (eventos.some(evento => evento.id === correcao.id)) return {status: 409, eventos};
  if (!eventos.some(evento => evento.id === correcao.alvoId)) return {status: 404, eventos};
  const motivo = correcao.motivo.trim();
  if (!motivo) return {status: 422, eventos};
  const atualizados = eventos.map(evento =>
    evento.id === correcao.alvoId ? {...evento, local: correcao.novoLocal} : evento
  );
  return {status: 201, eventos: atualizados};
}`,
        answer:`function retificar(eventos, correcao) {
  if (eventos.some(evento => evento.id === correcao.id)) return {status: 409, eventos};
  if (!eventos.some(evento => evento.id === correcao.alvoId)) return {status: 404, eventos};
  const motivo = correcao.motivo.trim();
  if (!motivo) return {status: 422, eventos};
  const {id, alvoId, novoLocal} = correcao;
  return {status: 201, eventos: [...eventos, {id, alvoId, tipo: "retificacao", novoLocal, motivo}]};
}`,
        hints:['Troque a substituição pelo acréscimo ao fim da lista.', 'O novo evento aponta para o original com alvoId.'],
        tests:[
          test('Mantém original e acrescenta retificação',[audit,correction],{status:201,eventos:amended}),
          test('Recusa correção sem alvo',[audit,{...correction,alvoId:'EV-99'}],{status:404,eventos:audit}),
          test('Recusa reaproveitamento de ID',[amended,correction],{status:409,eventos:amended}),
          test('Recusa motivo composto por espaços',[audit,{...correction,motivo:'  '}],{status:422,eventos:audit})
        ]
      },
      delivery:delivery(quiz('Qual revisão de PR demonstra que a trilha ficou íntegra?', 0,
        ['Mostrar a lista antes e depois com o original e a retificação.', 'A comparação verifica o vínculo e a preservação do histórico.'],
        ['Mostrar o local novo sem a lista de eventos.', 'Essa visualização não confirma a integridade da trilha.'],
        ['Fechar o Jira sem teste por ser correção de tela.', 'O comportamento persiste dados e exige validação.']),
        'Descrição do PR · HEM-113','EV-31 permanece com U-A. EV-32 registra U-B, motivo aparado e referência ao original. Cobri ID duplicado, alvo inexistente e motivo vazio.'),
      recall:[
        quiz('Qual campo recupera o evento corrigido?',2,['A cor da ocorrência.','A cor é um detalhe da apresentação.'],['O motivo escrito em linguagem natural.','O motivo explica a mudança, mas não identifica o evento.'],['alvoId.','A referência estrutural permite seguir o histórico.']),
        quiz('O relatório precisa exibir o valor atual. Como mostrar sem perder a trilha?',1,['Editar o evento original para exibir mais rápido.','Isso remove o valor histórico.'],['Derivar o valor atual aplicando as retificações em ordem.','A tela pode projetar o estado sem reescrever os eventos.'],['Omitir todos os registros que foram corrigidos.','O histórico perderia as operações envolvidas.']),
        quiz('Por que o motivo vazio gera 422 no laboratório?',0,['O formato pode ser válido e mesmo assim faltar conteúdo para auditar.','O corpo foi interpretado, mas não satisfaz a regra do ticket.'],['422 indica indisponibilidade da API.','O servidor recebeu e avaliou a requisição.'],['422 confirma gravação com sucesso.','Nenhum evento é criado nesse caso.'])
      ],
      guide:{level:'intermediario',prerequisites:['Usar Array.some e spread.', 'Interpretar referências por ID.', 'Separar histórico e estado exibido.'],theory:[trace,source('GitHub · Revisão de pull requests','https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews','Veja como pedir revisão e apresentar evidência do comportamento no diff.')]}
    },
    {
      id:'HEM-114', area:'estoque', category:'Devolução e destino', title:'Destino registrado com motivo em branco',
      description:'Registre a decisão documentada da equipe sem encerrar o movimento em branco.',
      minutes:16, icon:'layers', theme:'orange', skills:['Validação','Estado','QA'],
      technologies:['javascript','jira'], evidenceLanguage:'json',
      story:{
        person:'Dani', role:'Qualidade',
        message:'Uma devolução foi encerrada sem o motivo que a equipe informou no papel. O histórico só mostra que ela encerrou.',
        criteria:['Somente movimentos devolvidos podem ser encerrados por este formulário.', 'Destino válido e motivo preenchido são obrigatórios.', 'A gravação preserva o código do componente.'],
        evidence:{label:'Corpo aceito no bug',code:JSON.stringify({codigo:'HC-27',destino:'descarte_registrado',motivo:'   '},null,2)},
        question:quiz('Onde deve estar a validação definitiva do motivo?', 1,
          ['Somente no atributo required do formulário.', 'Uma chamada direta ainda pode enviar espaços.'],
          ['Na API que grava o destino, com feedback para a tela.', 'A gravação fica protegida para qualquer cliente.'],
          ['Em uma planilha preenchida depois.', 'O dado se separaria do movimento original.'])
      },
      lab:{
        functionName:'registrarDestino',
        goal:'Implemente registrarDestino(registro, destino, motivo). Se status for diferente de devolvida, retorne {status:409,registro}. Se destino não for descarte_registrado ou retorno_registrado, ou se motivo.trim() for vazio, retorne {status:422,registro}. Caso válido, retorne {status:200,registro} com status encerrada, destino e motivo aparado.',
        starter:`function registrarDestino(registro, destino, motivo) {
  if (registro.status !== "devolvida") return {status: 409, registro};
  if (!["descarte_registrado", "retorno_registrado"].includes(destino)) return {status: 422, registro};
  return {status: 200, registro: {...registro, status: "encerrada", destino, motivo: motivo.trim()}};
}`,
        answer:`function registrarDestino(registro, destino, motivo) {
  if (registro.status !== "devolvida") return {status: 409, registro};
  const texto = motivo.trim();
  if (!["descarte_registrado", "retorno_registrado"].includes(destino) || !texto) {
    return {status: 422, registro};
  }
  return {status: 200, registro: {...registro, status: "encerrada", destino, motivo: texto}};
}`,
        hints:['Tire os espaços das pontas antes de validar o motivo.', 'Em erro, devolva o registro original sem mudar seu estado.'],
        note:'Os destinos deste exercício são rótulos administrativos para uma decisão já registrada pela equipe. O software não decide reaproveitamento nem descarte.',
        tests:[
          test('Encerra com motivo aparado',[returned,'descarte_registrado','  Registro da equipe  '],{status:200,registro:closed}),
          test('Recusa motivo sem conteúdo',[returned,'descarte_registrado','  '],{status:422,registro:returned}),
          test('Recusa valor fora do catálogo',[returned,'automático','Registro da equipe'],{status:422,registro:returned}),
          test('Mantém movimento já encerrado',[closed,'retorno_registrado','Outro motivo'],{status:409,registro:closed})
        ]
      },
      delivery:delivery(quiz('Como explicar ao suporte o resultado esperado?', 2,
        ['A API escreve um motivo padrão e encerra a devolução.', 'Um texto automático não registra o motivo informado pela equipe.'],
        ['A tela deve ocultar os movimentos sem motivo.', 'Ocultar deixa o registro incompleto.'],
        ['O erro indica o campo a corrigir e o movimento permanece aberto.', 'A pessoa pode completar a informação e tentar novamente.']),
        'Mensagem ao suporte · HEM-114','A API retorna 422 para motivo em branco e mantém a devolução aberta. Em homologação, a descrição válida registra destino e motivo junto ao código HC-27.'),
      recall:[
        quiz('O movimento está encerrado e alguém repete a operação. Qual retorno desta prática?',1,['200 com sobrescrita.','O estado já encerrado precisa ser preservado.'],['409, sem alterar o registro.','O conflito é com o estado atual do movimento.'],['404.','O movimento existe.']),
        quiz('Qual entrada tem conteúdo para o motivo?',0,['"Conferência registrada".','A string permanece preenchida após trim().'],['"   ".','A string vira vazia após trim().'],['Uma tabulação isolada.','A tabulação é removida por trim().']),
        quiz('Quem fornece a decisão que o software registra neste cenário?',2,['Um cálculo no navegador.','A interface recebe a informação já documentada.'],['O primeiro campo disponível.','O destino precisa ser informado no fluxo de registro.'],['A equipe responsável pelo procedimento.','O laboratório treina registro da decisão, com validação de dados.'])
      ],
      guide:{level:'essencial',prerequisites:['Usar trim() em strings.', 'Ler status HTTP de validação e conflito.', 'Entender transições de estado simples.'],theory:[
        records('Consulte o art. 242, ` 1º, do Anexo IV-B para contextualizar o registro de destino e motivo da não utilização.')
      ]}
    },
    {
      id:'HEM-115', area:'vigilancia', category:'Integração de ocorrências', title:'O reenvio duplicou a ocorrência',
      description:'Reconheça a repetição de um registro interno após falha de comunicação.',
      minutes:25, icon:'repeat', theme:'rose', skills:['Idempotência','Chave composta','HTTP'],
      technologies:['javascript','http','sqlserver','jira'], evidenceLanguage:'json',
      story:{
        person:'Gui', role:'Integrações',
        message:'A unidade U-A não recebeu a resposta da integração e reenviou EXT-92. Agora o painel interno mostra duas ocorrências para a mesma operação.',
        criteria:['A chave é identificada junto com a unidade de origem.', 'Reenvio com conteúdo equivalente retorna o ID existente.', 'A mesma chave com conteúdo divergente gera conflito.'],
        evidence:{label:'Mensagem da fila · ambiente fictício',code:JSON.stringify(notice,null,2)},
        question:quiz('Qual chave distingue reenvio de uma ocorrência de outra unidade?', 0,
          ['O par origem e chave externa.', 'Duas unidades podem gerar a mesma chave por conta própria.'],
          ['Somente o código do componente.', 'Um componente pode estar vinculado a ocorrências diferentes.'],
          ['Somente o tipo de ocorrência.', 'Tipos se repetem entre unidades e ao longo do tempo.'])
      },
      lab:{
        functionName:'resolverReenvio',
        goal:'Implemente resolverReenvio(historico, entrada). Procure registro com mesma origem e chave. Se nenhum existir, retorne {status:202,id:null}. Se o tipo e o codigo coincidirem, devolva {status:200,id:registro.id}. Se houver divergência de conteúdo, retorne {status:409,id:registro.id}.',
        starter:`function resolverReenvio(historico, entrada) {
  const registro = historico.find(item => item.chave === entrada.chave);
  if (!registro) return {status: 202, id: null};
  if (registro.tipo === entrada.tipo && registro.codigo === entrada.codigo) return {status: 200, id: registro.id};
  return {status: 409, id: registro.id};
}`,
        answer:`function resolverReenvio(historico, entrada) {
  const registro = historico.find(item => item.origem === entrada.origem && item.chave === entrada.chave);
  if (!registro) return {status: 202, id: null};
  if (registro.tipo === entrada.tipo && registro.codigo === entrada.codigo) return {status: 200, id: registro.id};
  return {status: 409, id: registro.id};
}`,
        hints:['O predicado de find precisa comparar dois campos.', 'Uma chave encontrada só é reenvio se os campos do conteúdo coincidirem.'],
        note:'O exercício simula uma fila interna. O status 202 representa entrada inédita encaminhada ao processamento, sem notificação sanitária real.',
        tests:[
          test('Reusa o ID da mesma ocorrência reenviada',[knownNotices,notice],{status:200,id:'HV-04'}),
          test('A mesma chave pode existir em outra origem',[knownNotices,{...notice,origem:'U-B'}],{status:202,id:null}),
          test('Protege o registro contra conteúdo divergente',[knownNotices,{...notice,codigo:'HC-36'}],{status:409,id:'HV-04'}),
          test('Uma chave nova segue para processamento',[knownNotices,{...notice,chave:'EXT-93'}],{status:202,id:null})
        ]
      },
      delivery:delivery(quiz('Qual caso precisa estar no comentário de validação?', 1,
        ['A primeira mensagem de uma unidade isolada.', 'Esse caso não cobre repetição nem escopo da chave.'],
        ['Reenvio igual, reenvio divergente e outra origem com a mesma chave.', 'Esses casos mostram idempotência, conflito e isolamento por origem.'],
        ['A lista completa de ocorrências com dados reais.', 'Use somente registros fictícios no ticket de desenvolvimento.']),
        'Comentário de QA · HEM-115','Em U-A, repetir EXT-92 mantém HV-04. Mudança de código com a mesma chave gera 409. U-B com EXT-92 é uma entrada independente.'),
      recall:[
        quiz('Uma API recebe mensagens iguais ao mesmo tempo. Que reforço protege a unicidade?',1,['Somente um teste manual em uma aba.','Uma aba não reproduz a condição de corrida.'],['Restrição única em origem e chave na persistência.','A restrição mantém a unicidade mesmo entre processos.'],['Aumentar o timeout da fila.','Timeout maior não evita entrega repetida.']),
        quiz('Duas ocorrências têm o mesmo tipo. Isso prova duplicidade?',0,['Não. Compare a origem, a chave e o conteúdo previsto no contrato.','Tipos se repetem em diferentes ocorrências.'],['Sim, porque cada tipo só acontece uma vez.','A classificação pode se repetir em vários eventos.'],['Sim, se o nome da tela for igual.','O nome da tela é irrelevante para a identificação.']),
        quiz('Qual é o resultado para a mesma chave da mesma origem com outro tipo?',2,['Criar um novo ID em silêncio.','A entrada é incompatível com o registro já associado à chave.'],['Editar o tipo do evento anterior.','A alteração deve seguir um fluxo explícito de correção.'],['Retornar conflito e conservar o evento.','A API desta prática usa 409 para proteger o registro anterior.'])
      ],
      guide:{level:'avancado',prerequisites:['Identificar reenvio após timeout.', 'Comparar chaves e conteúdo em objetos.', 'Entender restrição única composta.'],theory:[
        watch,source('Microsoft Learn · Restrições UNIQUE','https://learn.microsoft.com/en-us/sql/relational-databases/tables/create-unique-constraints','Veja como proteger a unicidade de um conjunto de colunas no banco.')
      ]}
    },
    {
      id:'HEM-116', area:'vigilancia', category:'Relatórios e privacidade', title:'Um exportador devolve campos demais',
      description:'Construa uma saída agregada para a qualidade a partir de uma lista explícita de campos.',
      minutes:22, icon:'shield', theme:'rose', skills:['Projeção','Autorização','LGPD'],
      technologies:['javascript','privacidade','jira'], evidenceLanguage:'json',
      story:{
        person:'Lia', role:'Produto',
        message:'O exportador de homologação devolveu cada registro inteiro, inclusive referência ao receptor e relato livre. O painel de qualidade só precisa da contagem por unidade e tipo.',
        criteria:['Somente o papel qualidade recebe o relatório.', 'Agrupe ocorrências por unidade e tipo.', 'Cada linha contém somente unidade, tipo e total.'],
        evidence:{label:'Resposta fictícia atual',code:'[{"unidade":"U-A","tipo":"quase_erro","receptorId":"REC-FICTICIO-1","relato":"Exemplo de texto interno"}]'},
        question:quiz('Qual mudança limita os dados no download?', 2,
          ['Ocultar as colunas na tabela Angular.', 'O arquivo ainda incluiria os campos.'],
          ['Remover apenas o campo que apareceu no chamado.', 'Um novo campo interno pode voltar a ser exportado.'],
          ['Montar objetos novos com os campos permitidos após autorizar a solicitação.', 'A autorização e o formato da saída protegem a fronteira da API.'])
      },
      lab:{
        functionName:'exportarContagens',
        goal:'Implemente exportarContagens(registros, perfil). Para perfil diferente de qualidade, devolva {status:403,linhas:[]}. Para qualidade, devolva {status:200,linhas} com uma linha {unidade,tipo,total} por grupo, na ordem em que os grupos aparecem primeiro.',
        starter:`function exportarContagens(registros, perfil) {
  if (perfil !== "qualidade") return {status: 403, linhas: []};
  return {status: 200, linhas: registros};
}`,
        answer:`function exportarContagens(registros, perfil) {
  if (perfil !== "qualidade") return {status: 403, linhas: []};
  const grupos = new Map();
  for (const {unidade, tipo} of registros) {
    const chave = JSON.stringify([unidade, tipo]);
    if (!grupos.has(chave)) grupos.set(chave, {unidade, tipo, total: 0});
    grupos.get(chave).total += 1;
  }
  return {status: 200, linhas: [...grupos.values()]};
}`,
        hints:['Crie a chave com unidade e tipo para separar os grupos.', 'Crie objetos novos. Usar spread sobre o registro levaria todos os campos para a saída.'],
        note:'O papel vem da sessão no servidor em uma aplicação real. Agregar neste cenário limita os campos enviados, mas, por si só, não garante anonimização.',
        tests:[
          test('Agrupa e descarta referências internas',[[{unidade:'U-A',tipo:'quase_erro',receptorId:'REC-F1'},{unidade:'U-A',tipo:'quase_erro',relato:'fictício'},{unidade:'U-A',tipo:'incidente'}],'qualidade'],{status:200,linhas:[{unidade:'U-A',tipo:'quase_erro',total:2},{unidade:'U-A',tipo:'incidente',total:1}]}),
          test('Separa o mesmo tipo em unidades diferentes',[[{unidade:'U-B',tipo:'incidente'},{unidade:'U-A',tipo:'incidente'}],'qualidade'],{status:200,linhas:[{unidade:'U-B',tipo:'incidente',total:1},{unidade:'U-A',tipo:'incidente',total:1}]}),
          test('Bloqueia papel não permitido',[[{unidade:'U-A',tipo:'incidente'}],'suporte'],{status:403,linhas:[]}),
          test('Permite relatório vazio',[[],'qualidade'],{status:200,linhas:[]})
        ]
      },
      delivery:delivery(quiz('O que colocar no PR para demonstrar a proteção?', 0,
        ['Um teste com campos extras fictícios que compara todas as chaves da saída.', 'O teste verifica que dados internos ficam fora mesmo quando existem na entrada.'],
        ['Um arquivo com registros reais.', 'Os testes devem usar dados inventados.'],
        ['Só um teste da contagem de linhas.', 'O total de linhas não comprova os campos retornados.']),
        'Descrição do PR · HEM-116','O relatório exige perfil qualidade e devolve unidade, tipo e total. Testei agrupamento, saída vazia e 403. Os casos sintéticos incluem campos adicionais para testar que ficam fora.'),
      recall:[
        quiz('Quem deve confirmar o papel para exportação?',1,['O JavaScript da página, lendo a opção do menu.','O cliente pode ser alterado.'],['O servidor, com a sessão autenticada.','A autorização precisa proteger a rota para qualquer cliente.'],['O arquivo exportado.','A verificação acontece antes de gerar a resposta.']),
        quiz('Por que a mesma categoria em U-A e U-B produz duas linhas?',2,['Porque o relatório agrupa por horário.','Horário não integra a chave desta tarefa.'],['Porque o valor do tipo sempre muda.','Os tipos podem ser idênticos.'],['Porque unidade e tipo formam a chave do grupo.','A agregação mantém as contagens separadas por unidade.']),
        quiz('Uma contagem agregada sempre garante anonimização?',0,['Não. A possibilidade de identificar alguém depende dos dados e do contexto.','A projeção reduz a saída, mas a avaliação de anonimização exige análise própria.'],['Sim, a partir da primeira contagem.','Um grupo pequeno pode continuar identificável com informação adicional.'],['Sim, se estiver em JSON.','O formato do arquivo não decide a exposição.'])
      ],
      guide:{level:'intermediario',prerequisites:['Usar Map e criar objetos a partir de uma lista de campos.', 'Distinguir autenticação de autorização.', 'Reconhecer dados de saúde como sensíveis quando associados a pessoas.'],theory:[sensitive,trace]}
    },
    {
      id:'HEM-117', area:'integracao', category:'Suporte e observabilidade', title:'O primeiro erro da mesma requisição',
      description:'Correlacione falhas da integração de transporte para repassar evidência ao plantão.',
      minutes:18, icon:'activity', theme:'orange', skills:['Logs','Slack','Jira'],
      technologies:['javascript','http','slack','jira','privacidade'], evidenceLanguage:'json',
      story:{
        person:'Ren', role:'Suporte',
        message:'O painel de transporte recebeu 502. No minuto anterior houve um 500 de outra operação. Precisamos saber qual serviço falhou primeiro para a requisição do chamado.',
        criteria:['Considere somente o traceId solicitado.', 'Considere erros HTTP de 500 a 599.', 'A evidência contém o serviço e status do evento de menor sequência.'],
        evidence:{label:'Amostra de logs do simulador',code:'[{"traceId":"tr-h12","sequencia":3,"servico":"gateway","status":502},{"traceId":"tr-h11","sequencia":1,"servico":"estoque","status":500},{"traceId":"tr-h12","sequencia":2,"servico":"transporte","status":503}]'},
        question:quiz('Qual evidência leva à investigação mais útil?', 1,
          ['O primeiro erro de qualquer operação naquele minuto.', 'Isso pode apontar para um fluxo sem relação com o chamado.'],
          ['O primeiro 5xx da mesma requisição, pela sequência do evento.', 'O identificador evita misturar operações concorrentes.'],
          ['A cor do banner de erro.', 'A apresentação não identifica o serviço que falhou.'])
      },
      lab:{
        functionName:'primeiraFalha',
        goal:'Implemente primeiraFalha(eventos, traceId). Encontre o evento da mesma requisição com status de 500 a 599 e menor sequencia. Devolva somente {servico,status}, ou null se não encontrar.',
        starter:`function primeiraFalha(eventos, traceId) {
  const falha = eventos.find(evento => evento.traceId === traceId && evento.status >= 500 && evento.status <= 599);
  return falha ? {servico: falha.servico, status: falha.status} : null;
}`,
        answer:`function primeiraFalha(eventos, traceId) {
  const falhas = eventos.filter(evento => evento.traceId === traceId && evento.status >= 500 && evento.status <= 599);
  const primeira = falhas.sort((a, b) => a.sequencia - b.sequencia)[0];
  return primeira ? {servico: primeira.servico, status: primeira.status} : null;
}`,
        hints:['Filtre todos os eventos elegíveis antes de escolher o primeiro.', 'A lista de chegada pode estar fora da ordem das sequências.'],
        tests:[
          test('Escolhe a menor sequência apesar da ordem de chegada',[[{traceId:'tr-h12',sequencia:3,servico:'gateway',status:502},{traceId:'tr-h11',sequencia:1,servico:'estoque',status:500},{traceId:'tr-h12',sequencia:2,servico:'transporte',status:503}],'tr-h12'],{servico:'transporte',status:503}),
          test('Ignora outras requisições',[[{traceId:'tr-h11',sequencia:1,servico:'estoque',status:500}],'tr-h12'],null),
          test('Ignora erro 4xx da mesma requisição',[[{traceId:'tr-h12',sequencia:1,servico:'api',status:422},{traceId:'tr-h12',sequencia:2,servico:'transporte',status:500}],'tr-h12'],{servico:'transporte',status:500}),
          test('Projeta apenas serviço e status',[[{traceId:'tr-h12',sequencia:1,servico:'transporte',status:503,corpo:'exemplo interno'}],'tr-h12'],{servico:'transporte',status:503})
        ]
      },
      delivery:delivery(quiz('Como atualizar a conversa de suporte?', 2,
        ['Anexar todos os corpos de requisição capturados.', 'O plantão precisa de evidência técnica suficiente, com dados mínimos.'],
        ['Escrever apenas “integração quebrou”.', 'Sem escopo e evidência, o próximo turno precisa refazer a triagem.'],
        ['Registrar traceId, primeiro serviço, status e próximo passo.', 'Essa evidência permite continuar a investigação em outro turno.']),
        'Atualização no Slack · #suporte-hemoterapia','Em homologação, tr-h12 recebeu 503 de transporte antes do 502 no gateway. A equipe vai verificar o intervalo de indisponibilidade do serviço e atualizar o Jira com o reteste.'),
      recall:[
        quiz('Dois eventos acontecem no mesmo segundo. Como separá-los por requisição?',0,['Compare o traceId.','O identificador atravessa os serviços da mesma operação.'],['Compare só o segundo.','Eventos simultâneos podem ser de requisições diferentes.'],['Compare o nome do ambiente.','O ambiente pode ser igual para milhares de requisições.']),
        quiz('Um 502 do gateway prova que o gateway é a causa?',2,['Sim, sempre.','O gateway pode estar reportando um erro a montante.'],['Sim, quando aparece por último.','A ordem isolada não determina causalidade.'],['Não. Verifique a trilha da mesma requisição.','O primeiro erro observado ajuda a escolher o que investigar.']),
        quiz('O que retirar antes de colar uma evidência no Slack?',1,['O status HTTP.','O status é útil para investigar.'],['Corpo de requisição e identificadores pessoais desnecessários.','A conversa de suporte precisa somente do contexto técnico mínimo.'],['O nome do serviço.','O nome identifica onde continuar o diagnóstico.'])
      ],
      guide:{level:'intermediario',prerequisites:['Filtrar e ordenar uma lista de objetos.', 'Reconhecer erros HTTP 5xx.', 'Ler o identificador de rastreamento em logs.'],theory:[
        source('OpenTelemetry · Propagação de contexto','https://opentelemetry.io/docs/concepts/context-propagation/','Veja como o contexto ajuda a correlacionar sinais de uma operação entre serviços.'),sensitive
      ]}
    },
    {
      id:'HEM-118', area:'integracao', category:'CI e regressão', title:'O teste obrigatório que sumiu',
      description:'Bloqueie o merge quando um check crítico falhar ou não tiver sido executado.',
      minutes:16, icon:'git', theme:'mint', skills:['Git','CI','Testes de regressão'],
      technologies:['javascript','git','jira'], evidenceLanguage:'json',
      story:{
        person:'Ivo', role:'QA',
        message:'A versão de homologação perdeu o teste que confirma o vínculo entre a unidade e o evento. O fluxo só bloqueava checks com falha e deixou passar quando o check sumiu.',
        criteria:['Avalie os nomes da lista de checks obrigatórios.', 'Somente sucesso libera cada check.', 'A ausência ou execução pendente aparece entre as pendências.'],
        evidence:{label:'Resumo de CI · branch de teste',code:'{"obrigatorios":["rastreabilidade","privacidade"],"checks":{"privacidade":"sucesso","lint":"sucesso"}}'},
        question:quiz('Que resultado deve bloquear a integração da branch?', 0,
          ['Qualquer check obrigatório sem sucesso confirmado.', 'Ausência, pendência e falha exigem resolução antes do merge.'],
          ['A ausência de qualquer check opcional.', 'Verifique a lista dos checks obrigatórios.'],
          ['A aprovação do revisor.', 'A revisão pode coexistir com verificações automatizadas.'])
      },
      lab:{
        functionName:'avaliarChecks',
        goal:'Implemente avaliarChecks(checks, obrigatorios). Devolva {permitir,pendencias}, em que pendencias lista, na ordem de obrigatorios, os nomes ausentes ou diferentes de sucesso. Permitir só é true quando pendencias está vazia.',
        starter:`function avaliarChecks(checks, obrigatorios) {
  const pendencias = obrigatorios.filter(nome => checks[nome] === "falha");
  return {permitir: pendencias.length === 0, pendencias};
}`,
        answer:`function avaliarChecks(checks, obrigatorios) {
  const pendencias = obrigatorios.filter(nome => checks[nome] !== "sucesso");
  return {permitir: pendencias.length === 0, pendencias};
}`,
        hints:['Compare todos os obrigatórios com o único status que libera.', 'Uma propriedade ausente devolve undefined e deve ser listada.'],
        note:'O código simula a decisão para o ticket. Na prática, configure e valide os checks exigidos nas regras do repositório.',
        tests:[
          test('Libera quando todos os obrigatórios passaram',[{rastreabilidade:'sucesso',privacidade:'sucesso',lint:'falha'},['rastreabilidade','privacidade']],{permitir:true,pendencias:[]}),
          test('Bloqueia check obrigatório ausente',[{privacidade:'sucesso'},['rastreabilidade','privacidade']],{permitir:false,pendencias:['rastreabilidade']}),
          test('Lista falha e pendência na ordem configurada',[{rastreabilidade:'pendente',privacidade:'falha'},['privacidade','rastreabilidade']],{permitir:false,pendencias:['privacidade','rastreabilidade']}),
          test('Libera com lista obrigatória vazia',[{lint:'falha'},[]],{permitir:true,pendencias:[]})
        ]
      },
      delivery:delivery(quiz('Qual detalhe deve aparecer no ticket de regressão?', 1,
        ['Que a versão é a mais recente.', 'Isso não reproduz a falta do check.'],
        ['Nome do check obrigatório, condição para bloquear e caso de homologação.', 'O revisor consegue localizar a configuração e executar o caso.'],
        ['Que testes podem ser ignorados sempre em homologação.', 'A finalidade é detectar regressão antes de liberar a mudança.']),
        'Comentário no PR · HEM-118','Removi o check de rastreabilidade de uma execução fictícia e confirmei o bloqueio. Testei também privacidade com falha e execução pendente.'),
      recall:[
        quiz('Um check obrigatório ainda está rodando. A branch está pronta no laboratório?',2,['Sim, o job já iniciou.','Executar e concluir com sucesso são etapas diferentes.'],['Sim, porque o código compilou.','O check obrigatório pode cobrir outra propriedade.'],['Não. O status ainda não é sucesso.','A regra exige evidência de sucesso para todos os obrigatórios.']),
        quiz('Qual teste detectaria este bug mesmo sem um check vermelho?',0,['O caso em que o nome obrigatório não aparece nos resultados.','O bug confundia ausência com sucesso.'],['O caso em que o único check falha.','O código inicial já cobria a falha explícita.'],['Um teste do título do PR.','O título não determina a presença de checks.']),
        quiz('Em que ferramenta o time exige esses resultados para o merge?',1,['Somente no Slack.','A mensagem não protege a branch.'],['Na proteção de branch ou nas regras do repositório.','A regra do repositório aplica a exigência aos merges.'],['No CSS da tela.','CSS não controla integração de código.'])
      ],
      guide:{level:'essencial',prerequisites:['Ler um resultado de CI.', 'Usar filter para selecionar itens de uma lista.', 'Entender a função de um teste de regressão.'],theory:[
        source('GitHub · Proteção de branches','https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches','Veja como exigir checks antes de fazer merge de uma mudança.'),trace
      ]}
    },
    {
      id:'HEM-119', area:'integracao', category:'Migração de dados', title:'O identificador legado perdeu os zeros',
      description:'Importe vínculos sintéticos do FoxPro como texto e preserve a chave de rastreamento.',
      minutes:24, icon:'database', theme:'blue', skills:['SQL Server','Visual FoxPro','Idempotência'],
      technologies:['javascript','sqlserver','foxpro','git','jira'], evidenceLanguage:'json',
      story:{
        person:'Sami', role:'Dados',
        message:'Na homologação, o exportador do legado trouxe "000231 " e o importador gravou "231". O vínculo com a doação original deixou de aparecer na busca.',
        criteria:['O código fictício tem seis algarismos e é armazenado como texto.', 'O preenchimento à direita é removido e os zeros à esquerda ficam.', 'A mesma chave e doação não duplicam a entrada. Vínculos divergentes são tratados como conflito.'],
        evidence:{label:'Linha fictícia do arquivo legado',code:'{"codigo":"000231 ","doacaoId":"D-F23"}'},
        question:quiz('Como preservar a identidade durante a importação?', 2,
          ['Converter para número antes de gravar.', 'A conversão numérica descarta zeros iniciais.'],
          ['Remover caracteres até obter um número válido.', 'Isso poderia aproximar identificadores diferentes.'],
          ['Remover preenchimento à direita e manter texto.', 'O código permanece comparável à origem e conserva os zeros.'])
      },
      lab:{
        functionName:'prepararImportacao',
        goal:'Implemente prepararImportacao(linha, existentes). Aceite codigo textual de seis algarismos depois de trimEnd(). Entrada inválida devolve {status:422,codigo:null}. Para código novo, devolva 201 e o código aparado. Se já existir, devolva 200 quando doacaoId for igual e 409 quando for diferente. Ambos incluem o código.',
        starter:`function prepararImportacao(linha, existentes) {
  const codigo = typeof linha.codigo === "string" ? linha.codigo.trimEnd() : "";
  if (!/^[0-9]{6}$/.test(codigo)) return {status: 422, codigo: null};
  const normalizado = String(Number(codigo));
  const existente = existentes.find(item => item.codigo === normalizado);
  if (!existente) return {status: 201, codigo: normalizado};
  return {status: existente.doacaoId === linha.doacaoId ? 200 : 409, codigo: normalizado};
}`,
        answer:`function prepararImportacao(linha, existentes) {
  const codigo = typeof linha.codigo === "string" ? linha.codigo.trimEnd() : "";
  if (!/^[0-9]{6}$/.test(codigo)) return {status: 422, codigo: null};
  const existente = existentes.find(item => item.codigo === codigo);
  if (!existente) return {status: 201, codigo};
  return {status: existente.doacaoId === linha.doacaoId ? 200 : 409, codigo};
}`,
        hints:['O código representa um identificador. Compare e devolva a própria string.', 'Depois de achar a chave, compare doacaoId para distinguir repetição de conflito.'],
        note:'Seis algarismos é um formato fictício para o exercício, sem correspondência obrigatória com códigos usados em hemoterapia.',
        tests:[
          test('Preserva zeros e remove preenchimento à direita',[{codigo:'000231 ',doacaoId:'D-F23'},[]],{status:201,codigo:'000231'}),
          test('Reenvio da mesma linha preserva vínculo',[{codigo:'000231',doacaoId:'D-F23'},[{codigo:'000231',doacaoId:'D-F23'}]],{status:200,codigo:'000231'}),
          test('Vínculo divergente gera conflito',[{codigo:'000231',doacaoId:'D-F99'},[{codigo:'000231',doacaoId:'D-F23'}]],{status:409,codigo:'000231'}),
          test('Recusa valor numérico que já perdeu zeros',[{codigo:231,doacaoId:'D-F23'},[]],{status:422,codigo:null}),
          test('Código textual sem zero inicial continua válido',[{codigo:'123456',doacaoId:'D-F11'},[]],{status:201,codigo:'123456'})
        ]
      },
      bridge:{
        title:'Do cursor FoxPro ao SQL Server',
        text:'Um legado Visual FoxPro pode consultar a origem por SQLEXEC e devolver um cursor. Na migração, confira o tamanho e o preenchimento dos campos do cursor. No destino SQL Server, use um tipo de texto e uma chave única para preservar a identidade. Valide amostras e registre divergências antes de promover o lote.',
        code:'SELECT Codigo, DoacaoId\nFROM dbo.ComponenteImportado\nWHERE Codigo = @codigo;',
        language:'sql'
      },
      delivery:delivery(quiz('Como entregar a validação do lote?', 0,
        ['Registrar a amostra de IDs com zeros, repetição sem duplicidade e divergências pendentes.', 'A equipe pode comparar origem e destino e revisar conflitos antes de concluir.'],
        ['Declarar sucesso apenas porque os totais batem.', 'O total não detecta um código alterado ou um vínculo trocado.'],
        ['Regravar os vínculos em conflito sem guardar evidência.', 'A divergência precisa ser revisada e rastreável.']),
        'Evidência de migração · HEM-119','Em homologação, "000231 " vira "000231". O segundo envio de D-F23 reaproveita o vínculo. D-F99 com o mesmo código permanece em conflito para análise.'),
      recall:[
        quiz('Por que usar tipo de texto para o código?',1,['Porque texto elimina a necessidade de validação.','O formato ainda precisa ser validado.'],['Porque a sequência de caracteres identifica a unidade.','Zeros à esquerda fazem parte da identidade do exemplo.'],['Porque SQL Server só compara textos.','O banco compara vários tipos. O tipo deve refletir a semântica.']),
        quiz('Uma linha com o mesmo código traz outra doação. O que fazer?',2,['Alterar o vínculo de destino silenciosamente.','Isso esconderia um erro de identidade.'],['Duplicar o código.','Uma duplicidade quebra a unicidade esperada.'],['Registrar conflito para revisão do lote.','O vínculo existente fica preservado.']),
        quiz('Qual verificação além da quantidade ajuda a aceitar a migração?',0,['Conferir código e vínculo em amostras de origem e destino.','Essa verificação detecta perda de zeros e associações trocadas.'],['Conferir apenas a cor do relatório.','A cor não mostra integridade.'],['Comparar só o tamanho do arquivo.','Arquivos de tamanhos similares podem ter valores diferentes.'])
      ],
      guide:{level:'intermediario',prerequisites:['Distinguir identificadores de quantidades.', 'Ler validações simples de string.', 'Entender chaves únicas e reenvio de um lote.'],theory:[
        source('Visual FoxPro · SQLEXEC','https://www.vfphelp.com/vfp9/html/8dd6491b-da44-401f-b972-0d51f12f1a07.htm','Leia como executar SQL na fonte e recuperar o conjunto de resultados do legado.'),
        source('Microsoft Learn · Restrições UNIQUE','https://learn.microsoft.com/en-us/sql/relational-databases/tables/create-unique-constraints','Veja como manter o identificador único no banco de destino.'),trace
      ]}
    },
    {
      id:'HEM-120', area:'vigilancia', category:'Conciliação de registros', title:'O relatório perdeu o destino final',
      description:'Compare unidades encerradas e eventos para localizar faltas de vínculo.',
      minutes:24, icon:'filter', theme:'violet', skills:['Conciliação','Rastreabilidade','SQL Server'],
      technologies:['javascript','sqlserver','jira'], evidenceLanguage:'json',
      story:{
        person:'Noa', role:'Qualidade',
        message:'O fechamento de homologação aponta HC-82 como encerrada, mas o relatório perdeu o destino final. A exportação também contém um evento para um código que não aparece na relação de unidades.',
        criteria:['Liste unidades encerradas sem evento de destino.', 'Liste eventos de destino sem unidade correspondente.', 'Ignore outros tipos de evento neste relatório.'],
        evidence:{label:'Exportação fictícia para conciliação',code:'{"unidades":[{"codigo":"HC-82","status":"encerrada"}],"eventos":[{"codigo":"HC-82","tipo":"transferencia"},{"codigo":"HC-99","tipo":"destino_registrado"}]}'},
        question:quiz('Quais problemas o relatório precisa mostrar?', 1,
          ['Apenas unidades que aparecem nos dois arquivos.', 'Os vínculos que faltam não apareceriam.'],
          ['Unidades encerradas sem destino e destinos sem unidade.', 'As duas diferenças mostram problemas distintos de completude e referência.'],
          ['Todas as unidades ainda em trânsito.', 'A regra desta conciliação mira unidades encerradas e eventos de destino.'])
      },
      lab:{
        functionName:'conciliarDestino',
        goal:'Implemente conciliarDestino(unidades, eventos). Retorne {semDestino,orfaos}. semDestino lista códigos das unidades encerradas sem evento destino_registrado. orfaos lista códigos únicos dos eventos destino_registrado sem unidade. Ordene as duas listas lexicograficamente.',
        starter:`function conciliarDestino(unidades, eventos) {
  const codigos = new Set(unidades.map(unidade => unidade.codigo));
  const orfaos = [...new Set(eventos.filter(evento =>
    evento.tipo === "destino_registrado" && !codigos.has(evento.codigo)
  ).map(evento => evento.codigo))].sort();
  const semDestino = unidades.filter(unidade =>
    unidade.status === "encerrada" && !eventos.some(evento => evento.codigo === unidade.codigo)
  ).map(unidade => unidade.codigo).sort();
  return {semDestino, orfaos};
}`,
        answer:`function conciliarDestino(unidades, eventos) {
  const codigos = new Set(unidades.map(unidade => unidade.codigo));
  const destinos = new Set(eventos.filter(evento => evento.tipo === "destino_registrado").map(evento => evento.codigo));
  const semDestino = unidades.filter(unidade =>
    unidade.status === "encerrada" && !destinos.has(unidade.codigo)
  ).map(unidade => unidade.codigo).sort();
  const orfaos = [...destinos].filter(codigo => !codigos.has(codigo)).sort();
  return {semDestino, orfaos};
}`,
        hints:['Um evento de transferência não substitui um evento de destino.', 'Use Set para evitar listar o mesmo código órfão duas vezes.'],
        note:'O relatório sinaliza discrepâncias para conferência humana. Ele não cria nem altera destinos.',
        tests:[
          test('Transferência não encerra a trilha',[[{codigo:'HC-82',status:'encerrada'}],[{codigo:'HC-82',tipo:'transferencia'},{codigo:'HC-99',tipo:'destino_registrado'}]],{semDestino:['HC-82'],orfaos:['HC-99']}),
          test('Destino existente deixa o relatório limpo',[[{codigo:'HC-81',status:'encerrada'}],[{codigo:'HC-81',tipo:'destino_registrado'}]],{semDestino:[],orfaos:[]}),
          test('Ordena e elimina duplicatas de destinos sem unidade',[[],[{codigo:'HC-99',tipo:'destino_registrado'},{codigo:'HC-90',tipo:'destino_registrado'},{codigo:'HC-99',tipo:'destino_registrado'}]],{semDestino:[],orfaos:['HC-90','HC-99']}),
          test('Ignora unidade em trânsito e evento sem destino',[[{codigo:'HC-88',status:'em_transito'}],[{codigo:'HC-90',tipo:'transferencia'}]],{semDestino:[],orfaos:[]})
        ]
      },
      delivery:delivery(quiz('O que a equipe de qualidade recebe depois do teste?', 2,
        ['Os destinos corrigidos automaticamente.', 'O relatório localiza divergências. Corrigir os registros exige investigação.'],
        ['A lista de eventos sem separação.', 'Isso mistura os casos que precisam de tratamentos diferentes.'],
        ['Duas listas com os códigos fictícios e o critério aplicado.', 'A separação ajuda a equipe a investigar completude e vínculo.']),
        'Relato de validação · HEM-120','Em homologação, HC-82 aparece em semDestino porque só existe transferência. HC-99 aparece uma vez em orfaos porque o evento de destino está sem a unidade correspondente.'),
      recall:[
        quiz('Qual evento satisfaz esta verificação de encerramento?',0,['O evento destino_registrado da mesma unidade.','A comparação precisa usar o tipo certo e o código correspondente.'],['Qualquer transferência anterior.','A transferência só indica uma etapa da trilha.'],['O primeiro evento de outro componente.','Um destino precisa estar vinculado à própria unidade.']),
        quiz('Como representar a primeira diferença no SQL?',1,['INNER JOIN com os destinos válidos.','INNER JOIN só traz os registros com correspondência.'],['LEFT JOIN para destinos seguido de filtro de correspondência ausente.','A consulta preserva as unidades sem par antes de selecionar as ausentes.'],['Somar todos os eventos em uma linha.','Uma soma não identifica quais vínculos faltam.']),
        quiz('O relatório apontou um evento sem unidade. O que o produto faz?',2,['Exclui o evento automaticamente.','A evidência precisa permanecer disponível para apuração.'],['Cria uma unidade fictícia no banco.','Isso encobriria a origem da inconsistência.'],['Sinaliza a diferença para conciliação.','O responsável verifica a fonte e decide se há correção.'])
      ],
      guide:{level:'avancado',prerequisites:['Comparar conjuntos por um identificador.', 'Distinguir eventos intermediários do registro final neste cenário.', 'Ler junções com registros ausentes.'],theory:[
        trace,source('Microsoft Learn · Junções no SQL Server','https://learn.microsoft.com/en-us/sql/relational-databases/performance/joins?view=sql-server-ver17','Compare junções internas e externas para localizar registros que não possuem correspondência.')
      ]}
    }
  ];

  window.hemoOperationsMissions = entries.map(({guide, ...mission}) => ({
    ...mission, refs: guide.theory.map(({label,url}) => ({label,url}))
  }));
  window.hemoOperationsGuide = Object.fromEntries(entries.map(({id,guide}) => [id,guide]));
})();
