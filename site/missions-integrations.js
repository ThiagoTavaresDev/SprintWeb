window.integrationMissions = (() => {
  function question(prompt, answer, ...options) {
    return {prompt, answer, choices:options.map(([text]) => text), feedback:options.map(([,feedback]) => feedback)};
  }

  function tests(...cases) {
    return cases.map(([label,args,expected]) => ({label,args,expected}));
  }

  function delivery(item, label, text, jiraStatus) {
    return {...item, artifact:{label,text}, jiraStatus};
  }

  return [
    {
      id:'WEB-137', category:'Webhooks', title:'O webhook voltou no tempo',
      description:'Rejeite uma tentativa de reutilizar uma notificação de pagamento antiga.',
      minutes:20, icon:'shield', theme:'rose', skills:['Webhooks','Assinatura','Janela de tempo'],
      story:{
        person:'Lia', role:'Pagamentos', message:'Um corpo assinado que capturamos no teste ainda é aceito horas depois. A mesma notificação reaparece como nova na nossa integração.',
        criteria:['A assinatura deve ser válida antes de confiar no timestamp.', 'Aceitar somente diferenças de até 300 segundos, inclusive, em qualquer direção.', 'Manter a deduplicação de IDs na etapa de processamento.'],
        evidence:{label:'Webhook de teste',code:'Agora:                1764000000 s\nTimestamp assinado:   1763996400 s\nAssinatura:           válida\nResultado atual:      aceito'},
        question:question('Qual decisão trata a evidência?',1,
          ['Aceitar qualquer payload cuja assinatura bata.','Um payload antigo pode continuar com assinatura válida.'],
          ['Validar a assinatura e recusar o timestamp fora da janela.','A assinatura autentica a mensagem e a janela limita replays antigos.'],
          ['Confiar no horário vindo em qualquer campo do JSON.','Use o timestamp coberto pela assinatura, validada com o corpo bruto.'])
      },
      lab:{
        functionName:'aceitarWebhook',
        goal:'Implemente aceitarWebhook(assinaturaValida, enviadoEm, agora). Retorne true somente se assinaturaValida for true e a diferença absoluta for de até 300 segundos. Os horários de entrada são segundos Unix inteiros.',
        starter:'function aceitarWebhook(assinaturaValida, enviadoEm, agora) {\n  return assinaturaValida;\n}',
        answer:'function aceitarWebhook(assinaturaValida, enviadoEm, agora) {\n  return assinaturaValida === true && Math.abs(agora - enviadoEm) <= 300;\n}',
        hints:['Use Math.abs para tratar mensagens antigas e timestamps no futuro.', 'O teste fornece o resultado da verificação criptográfica como booleano.'],
        note:'Este exercício modela a política de aceitação. No endpoint real, use a verificação do SDK do provedor com o corpo bruto, a assinatura e o segredo. A janela permite entregas repetidas dentro dela, por isso o processamento também precisa deduplicar IDs de eventos.',
        tests:tests(['Assinatura válida e evento recente',[true,995,1000],true],['Aceita no limite de 300 segundos',[true,700,1000],true],['Recusa assinatura inválida',[false,995,1000],false],['Recusa replay de 301 segundos',[true,699,1000],false],['Recusa timestamp distante no futuro',[true,1301,1000],false])
      },
      delivery:delivery(question('O que levar para a revisão de segurança?',2,
        ['Só a evidência de uma assinatura válida.','Exercite a diferença de tempo e também uma assinatura inválida.'],
        ['O segredo de webhook no corpo do Jira.','Registre evidências sem expor segredos.'],
        ['Casos recente, expirado e inválido, com a deduplicação explicada.','Isso permite revisar as duas fronteiras: aceitação e processamento.']),
        'Descrição de PR · WEB-137','Valido a assinatura antes da janela de 300 segundos. Rodei casos de assinatura inválida, replay expirado e evento recente. A deduplicação por ID segue no processamento.'),
      recall:[
        question('A mensagem é de agora, mas a assinatura é inválida. Qual decisão?',0,['Rejeitar.','A janela temporal não autentica a origem.'],['Aceitar e marcar como suspeita.','Uma assinatura inválida impede o processamento.'],['Usar o horário local como assinatura.','Horário e assinatura resolvem problemas diferentes.']),
        question('O mesmo evento válido chega duas vezes em dez segundos. O que evita o efeito repetido?',2,['A janela de cinco minutos.','As duas entregas cabem na janela.'],['Um relógio sincronizado.','Ele ajuda na comparação de tempos, mas a repetição ainda é possível.'],['A deduplicação pelo ID do evento.','O ID permite reconhecer um evento já processado.']),
        question('O que preservar ao chamar a biblioteca de assinatura?',1,['A ordem alfabética dos campos.','Reserializar pode mudar os bytes assinados.'],['O corpo bruto recebido.','A verificação precisa dos bytes originais.'],['Só a lista de chaves do JSON.','As chaves sozinhas não representam o payload assinado.'])
      ],
      refs:[{label:'Stripe · Webhooks e proteção contra replay',url:'https://docs.stripe.com/webhooks#preventing-replay-attacks'}]
    },
    {
      id:'WEB-138', category:'Limites de tráfego', title:'O pico que lotou as cotações',
      description:'Devolva 429 com uma espera útil quando o cliente atinge a cota da janela.',
      minutes:18, icon:'activity', theme:'orange', skills:['HTTP 429','Retry-After','Rate limit'],
      story:{
        person:'Igor', role:'Plataforma', message:'O serviço de cotação ficou lento durante uma importação. O gateway já mede quantas chamadas cada conta fez, mas encaminha tudo.',
        criteria:['A conta tem 3 chamadas aceitas por janela de 60 segundos.', 'No limite, a próxima chamada recebe 429 com Retry-After em segundos.', 'Aos 60 segundos, uma nova janela permite requisições.'],
        evidence:{label:'Gateway · uma conta',code:'Janela começou no segundo 100\nChamadas já aceitas: 3\nNova chamada: segundo 143\nAtual: 200 · Esperado: 429 com Retry-After: 17'},
        question:question('Qual informação permite que o cliente espere o tempo certo?',0,
          ['Enviar 429 com a espera restante em Retry-After.','O cabeçalho pode indicar quantos segundos aguardar.'],
          ['Enviar 200 e dormir por um minuto no servidor.','Isso retém recursos e esconde o limite do cliente.'],
          ['Aumentar o timeout do serviço de cotação.','O problema de entrada continua ocorrendo.'])
      },
      lab:{
        functionName:'decidirCota',
        goal:'Receba decidirCota(usados, inicio, agora), com segundos inteiros. Se a janela expirou ou usados é menor que 3, retorne {status:200}. Caso contrário, retorne {status:429,retryAfter:segundosRestantes}.',
        starter:'function decidirCota(usados, inicio, agora) {\n  return {status: 200};\n}',
        answer:'function decidirCota(usados, inicio, agora) {\n  const restantes = 60 - (agora - inicio);\n  if (restantes <= 0 || usados < 3) return {status: 200};\n  return {status: 429, retryAfter: restantes};\n}',
        hints:['Usados é o total anterior à chamada atual.', 'Subtraia o tempo decorrido de 60 para obter a espera.'],
        note:'Em produção, a janela e o contador são mantidos atomicamente por chave de cota. O laboratório recebe o snapshot de uma conta.',
        tests:tests(['Terceira chamada cabe na janela',[2,100,110],{status:200}],['Quarta chamada deve esperar',[3,100,143],{status:429,retryAfter:17}],['Espera de um segundo',[4,100,159],{status:429,retryAfter:1}],['Janela reinicia no limite',[3,100,160],{status:200}])
      },
      delivery:delivery(question('Qual atualização ajuda o time do cliente a adaptar a integração?',2,
        ['“Cota implantada.”','Inclua valores, status e como ler a espera.'],
        ['“Tentem novamente no mesmo instante.”','Uma nova tentativa imediata continua dentro da mesma janela.'],
        ['“Até 3 chamadas por conta a cada janela, com 429 e Retry-After em segundos.”','O cliente pode reagir ao cabeçalho e QA consegue testar a fronteira.']),
        'Mensagem na thread · #integracoes','WEB-138 limita cotações a 3 chamadas por conta em uma janela de 60 s. Exceder retorna 429 e Retry-After em segundos. Validei a última chamada permitida, a primeira recusada e a reabertura.'),
      recall:[
        question('A janela tem 1 segundo restante e a cota acabou. Qual status?',1,['200.','O novo segundo ainda não começou.'],['429 com Retry-After: 1.','O cliente recebe a espera restante.'],['404.','O recurso existe e a restrição é de cota.']),
        question('Duas instâncias recebem chamadas da mesma conta. Onde manter a contagem?',0,['Em estado compartilhado com atualização atômica.','As instâncias precisam observar a mesma cota.'],['Em uma variável separada por processo.','Cada processo aceitaria até seu próprio limite.'],['Somente em um banner do navegador.','Outros clientes também chamam a API.']),
        question('Qual limite o algoritmo do exercício ainda permite?',2,['Chamadas ilimitadas dentro da mesma janela.','Cada janela limita a contagem por conta.'],['Nenhuma chamada na fronteira.','Uma nova janela começa no segundo 60.'],['Dois pequenos picos em janelas vizinhas.','Janelas fixas podem aceitar um lote logo antes e outro logo depois da virada.'])
      ],
      refs:[{label:'RFC 6585 · HTTP 429',url:'https://www.rfc-editor.org/rfc/rfc6585#section-4'}]
    },
    {
      id:'WEB-139', category:'CORS e origens', title:'A origem parecia confiável',
      description:'Corrija o CORS do portal de parceiros com uma lista exata de origens.',
      minutes:15, icon:'shield', theme:'violet', skills:['CORS','Origin','HTTP'],
      story:{
        person:'Davi', role:'Parceiros', message:'O navegador bloqueava o portal novo. O ajuste abriu acesso para uma origem parecida com a oficial em homologação.',
        criteria:['Permitir somente duas origens HTTPS previamente aprovadas.', 'Tratar esquema, host e porta como parte da origem.', 'Omitir o cabeçalho de permissão em origens desconhecidas.'],
        evidence:{label:'Preflight em homologação',code:'Origin: https://portal.pedidos.example.outro.example\nAccess-Control-Allow-Origin: https://portal.pedidos.example.outro.example\nRegra atual: Origin inclui "pedidos.example"'},
        question:question('Qual mudança resolve a correspondência incorreta?',2,
          ['Testar se o nome contém pedidos.example.','Subdomínios de outro domínio podem conter esse texto.'],
          ['Usar * com requisições credenciadas.','O navegador exige uma origem explícita quando CORS é usado com credenciais.'],
          ['Comparar a origem completa com uma lista autorizada.','A comparação exata considera esquema, host e porta.'])
      },
      lab:{
        functionName:'origemPermitida',
        goal:'Retorne a origem original somente para https://portal.pedidos.example e https://parceiros.pedidos.example. Para qualquer outro valor, retorne null, que significa omitir Access-Control-Allow-Origin.',
        starter:'function origemPermitida(origem) {\n  return origem?.includes("pedidos.example") ? origem : null;\n}',
        answer:'function origemPermitida(origem) {\n  const permitidas = ["https://portal.pedidos.example", "https://parceiros.pedidos.example"];\n  return permitidas.includes(origem) ? origem : null;\n}',
        hints:['Compare a string inteira com cada entrada aprovada.', 'A entrada é o valor do cabeçalho Origin, sem caminho.'],
        note:'CORS governa o acesso de scripts de outra origem à resposta no navegador. A API ainda autentica e autoriza a requisição. Em respostas cuja origem refletida varia, use Vary: Origin conforme a política de cache.',
        tests:tests(['Portal aprovado',['https://portal.pedidos.example'],'https://portal.pedidos.example'],['Parceiro aprovado',['https://parceiros.pedidos.example'],'https://parceiros.pedidos.example'],['Host com nome parecido',['https://portal.pedidos.example.outro.example'],null],['Porta diferente',['https://portal.pedidos.example:8443'],null],['HTTP em vez de HTTPS',['http://portal.pedidos.example'],null])
      },
      delivery:delivery(question('Qual teste sustenta a descrição do PR?',1,
        ['Só abrir o portal aprovado em desenvolvimento.','O caso permissivo não mostra se um host parecido foi bloqueado.'],
        ['Verificar os dois portais aprovados e uma origem parecida sem cabeçalho.','Assim o revisor pode conferir tanto compatibilidade quanto restrição.'],
        ['Verificar apenas o código 200 no servidor.','CORS depende de cabeçalhos e do tratamento pelo navegador.']),
        'Comentário de QA · WEB-139','Verifiquei Access-Control-Allow-Origin para os dois portais aprovados. Uma origem parecida, HTTP e uma porta alternativa ficaram sem o cabeçalho. A API mantém a validação de sessão.'),
      recall:[
        question('A mesma URL de host mudou de HTTPS para HTTP. Continua sendo a mesma origem?',0,['Não, o esquema mudou.','O esquema é parte da origem.'],['Sim, porque o host é igual.','Host igual ainda permite origens distintas.'],['Sim, porque o caminho é igual.','O caminho nem faz parte da origem.']),
        question('O cliente é um serviço de backend sem navegador. O CORS basta para impedir acesso?',1,['Sim, sempre.','A política é aplicada pelo navegador em requisições web.'],['Não. A API precisa autenticar e autorizar.','As permissões do servidor também valem para clientes fora do navegador.'],['Sim, desde que a resposta seja JSON.','JSON não aplica a política a clientes de backend.']),
        question('Duas origens aprovadas recebem cabeçalhos diferentes. Qual cabeçalho ajuda o cache?',2,['Content-Length.','Ele informa tamanho, não variação por origem.'],['Retry-After.','Esse cabeçalho indica espera para nova tentativa.'],['Vary: Origin.','O cache pode distinguir respostas conforme o Origin da requisição.'])
      ],
      refs:[{label:'WHATWG · Protocolo CORS',url:'https://fetch.spec.whatwg.org/#http-cors-protocol'}]
    },
    {
      id:'WEB-140', category:'Links seguros', title:'O link com endereço falso',
      description:'Valide o destino do link de rastreamento antes de renderizá-lo no pedido.',
      minutes:18, icon:'shield', theme:'rose', skills:['URL','XSS','Listas de permissão'],
      story:{
        person:'Nina', role:'Frontend', message:'Um fornecedor enviou um link que começa com nosso domínio de rastreio, mas abre outro site. O código usa startsWith.',
        criteria:['Aceitar URL absoluta HTTPS com origem https://rastreio.entrega.example.', 'Recusar credenciais embutidas.', 'Quando não houver URL confiável, ocultar o link.'],
        evidence:{label:'Link recebido',code:'https://rastreio.entrega.example@outro.example/p/104\nValidação atual: startsWith("https://rastreio.entrega.example")\nHost efetivo: outro.example'},
        question:question('Qual abordagem interpreta o destino real?',1,
          ['Usar startsWith com mais caracteres.','Prefixos são frágeis para interpretar URLs.'],
          ['Analisar com URL e verificar origem e credenciais.','O parser separa host efetivo, esquema e credenciais.'],
          ['Apenas trocar o texto visível do link.','O clique ainda navega ao href efetivo.'])
      },
      lab:{
        functionName:'linkRastreio',
        goal:'Implemente linkRastreio(valor). Retorne a URL normalizada (href) se a origem for exatamente https://rastreio.entrega.example e não houver username nem password. Para URL inválida ou recusada, retorne null.',
        starter:'function linkRastreio(valor) {\n  return valor.startsWith("https://rastreio.entrega.example") ? valor : null;\n}',
        answer:'function linkRastreio(valor) {\n  try {\n    const url = new URL(valor);\n    const aprovada = url.protocol === "https:" && url.origin === "https://rastreio.entrega.example";\n    if (!aprovada || url.username || url.password) return null;\n    return url.href;\n  } catch {\n    return null;\n  }\n}',
        hints:['Use new URL(valor) sem URL base para exigir um endereço absoluto.', 'A propriedade origin contém o esquema, host e porta efetiva.'],
        note:'Após validar, atribua a URL ao href por uma API de DOM e escreva o rótulo com textContent. Este exercício valida apenas o destino inicial.',
        tests:tests(['Rastreamento do parceiro',['https://rastreio.entrega.example/p/104'],'https://rastreio.entrega.example/p/104'],['Domínio parecido',['https://rastreio.entrega.example.outro.example/p/104'],null],['Usuário falso e outro host',['https://rastreio.entrega.example@outro.example/p/104'],null],['Credenciais mesmo no host aprovado',['https://ana:senha@rastreio.entrega.example/p/104'],null],['Esquema ativo recusado',['javascript:alert(1)'],null],['URL blob com origem aprovada também é recusada',['blob:https://rastreio.entrega.example/id'],null])
      },
      delivery:delivery(question('Qual evidência é apropriada para a revisão?',0,
        ['Um link legítimo e exemplos inofensivos de domínio parecido e credenciais.','Casos positivos e negativos tornam a regra reproduzível.'],
        ['Somente uma captura do botão “Rastrear”.','A aparência do botão não mostra seu destino.'],
        ['Um link ativo para o site malicioso em uma mensagem da equipe.','Use domínios reservados de exemplo para reproduzir o mecanismo.']),
        'Descrição de PR · WEB-140','Atribuo o href apenas depois de validar a origem e a ausência de credenciais. Validei rastreio legítimo, domínio parecido, credenciais e esquema recusado.'),
      recall:[
        question('Em https://loja.example@outro.example/p, qual é o host?',2,['loja.example','Esse trecho é interpretado como credencial.'],['loja.example@outro.example','O @ separa credenciais do host.'],['outro.example','O parser identifica outro.example como destino.']),
        question('Qual propriedade contém HTTPS e host efetivo para a comparação?',1,['pathname','Contém a parte do caminho.'],['origin','A origem contém esquema, host e porta aplicável.'],['hash','Contém o fragmento.']),
        question('Se o texto do botão vier de fora, como inseri-lo como texto?',0,['Com textContent.','O conteúdo entra como texto no DOM.'],['Com innerHTML.','O navegador interpretaria as marcações do conteúdo.'],['Como parte da URL.','O rótulo e o destino têm papéis diferentes.'])
      ],
      refs:[{label:'WHATWG · URL',url:'https://url.spec.whatwg.org/#url-class'},{label:'OWASP · Prevenção de XSS',url:'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'}]
    },
    {
      id:'WEB-141', category:'Segurança de sessão', title:'Cancelado de outra aba',
      description:'Exija a proteção CSRF antes de aceitar alterações de pedidos com sessão por cookie.',
      minutes:20, icon:'shield', theme:'orange', skills:['CSRF','Sessão','Métodos HTTP'],
      story:{
        person:'Leo', role:'Segurança', message:'Uma página externa conseguiu enviar um formulário de cancelamento. O navegador tinha uma sessão ativa no ambiente de teste.',
        criteria:['GET, HEAD e OPTIONS podem passar pela regra CSRF, sem mudar dados.', 'Para outros métodos, exigir token CSRF validado pelo servidor e origem aprovada.', 'Autenticação e autorização continuam como etapas separadas.'],
        evidence:{label:'Requisição capturada em teste',code:'POST /pedidos/104/cancelar\nCookie de sessão presente\nOrigin: https://outra.example\nToken CSRF válido: não\nResultado atual: pedido cancelado'},
        question:question('O que a sessão sozinha prova nessa requisição?',0,
          ['Que há uma sessão, mas a ação ainda precisa de proteção contra CSRF.','O navegador pode anexar o cookie a uma requisição iniciada fora do portal, conforme sua configuração.'],
          ['Que a pessoa clicou no botão do portal.','O cookie não identifica como a ação foi iniciada.'],
          ['Que o método POST rejeita formulários externos automaticamente.','Formulários podem enviar POST.'])
      },
      lab:{
        functionName:'passaCsrf',
        goal:'Implemente passaCsrf(metodo, tokenValido, origemPermitida). Para GET, HEAD e OPTIONS, retorne true. Para os outros métodos, retorne true somente se as duas verificações forem true. A entrada metodo é maiúscula.',
        starter:'function passaCsrf(metodo, tokenValido, origemPermitida) {\n  return true;\n}',
        answer:'function passaCsrf(metodo, tokenValido, origemPermitida) {\n  if (["GET", "HEAD", "OPTIONS"].includes(metodo)) return true;\n  return tokenValido === true && origemPermitida === true;\n}',
        hints:['Separe a decisão por método das verificações de origem e token.', 'Para as alterações, as duas condições precisam ser verdadeiras.'],
        note:'O exercício recebe o resultado de duas verificações já feitas no servidor. Ele não implementa geração ou validação criptográfica de tokens e não concede acesso ao recurso.',
        tests:tests(['GET de leitura',[ 'GET',false,false],true],['PATCH válido',['PATCH',true,true],true],['POST com origem externa',['POST',true,false],false],['DELETE sem token',['DELETE',false,true],false],['Método desconhecido falha sem verificações',['CUSTOM',false,false],false])
      },
      delivery:delivery(question('Como QA deve validar o cancelamento?',2,
        ['Validar apenas uma chamada autenticada.','Uma sessão válida também aparece no cenário vulnerável.'],
        ['Usar GET para facilitar o teste da alteração.','O cancelamento precisa de um método de escrita protegido.'],
        ['Tentar POST externo, POST sem token e POST válido, conferindo o estado do pedido.','QA confirma que os bloqueios preservam o estado e que o fluxo autorizado funciona.']),
        'Comentário de QA · WEB-141','Testar POST de outra origem e POST sem token válido, confirmando que o pedido segue aberto. Depois cancelar com origem e token válidos em uma conta autorizada.'),
      recall:[
        question('GET cancela um pedido quando chamado. Onde está o problema?',1,['O caminho tem verbo.','O nome do caminho não define a segurança do método.'],['GET está alterando estado e precisa virar uma operação de escrita protegida.','Métodos seguros são usados para leitura.'],['O código 200 está errado.','O efeito colateral do GET é o ponto principal.']),
        question('A origem está aprovada e o token falhou. O que a política do portal faz?',0,['Bloqueia a escrita.','As duas verificações são exigidas.'],['Aceita pela origem.','Isso ignora a verificação de token definida pela política.'],['Transforma a escrita em GET.','Mudar método não resolve o acesso à operação.']),
        question('As verificações CSRF passaram. O que ainda é necessário antes de cancelar?',2,['Aumentar o timeout.','Timeout não verifica permissão.'],['Enviar o token ao Slack.','O token pertence à requisição e deve ser tratado como sensível.'],['Autorizar essa pessoa a cancelar esse pedido.','CSRF e autorização tratam ameaças diferentes.'])
      ],
      refs:[{label:'OWASP · Prevenção de CSRF',url:'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html'}]
    },
    {
      id:'WEB-142', category:'Cache HTTP', title:'O recibo que ficou no cache',
      description:'Separe a política de cache de um arquivo público e de uma resposta com dados de cliente.',
      minutes:18, icon:'layers', theme:'blue', skills:['Cache-Control','CDN','HTTP'],
      story:{
        person:'Paula', role:'Plataforma', message:'Os cabeçalhos foram configurados em bloco no gateway. O PDF do recibo ficou com a mesma política do logo público.',
        criteria:['Recibos devem usar no-store.', 'Arquivos públicos versionados podem ser armazenados por um ano.', 'Tudo que não estiver classificado recebe no-store.'],
        evidence:{label:'Cabeçalhos do gateway',code:'GET /recibos/104.pdf → Cache-Control: public, max-age=31536000, immutable\nGET /assets/logo.8ac9.svg → Cache-Control: public, max-age=31536000, immutable'},
        question:question('Qual regra separa os dois tipos de resposta?',2,
          ['Dar max-age=60 aos recibos.','Ainda permite armazenar a resposta pelo tempo especificado.'],
          ['Marcar tudo como public e mudar o nome do recibo.','Renomear não transforma a resposta em pública.'],
          ['Classificar a resposta e enviar no-store no recibo.','Um recurso público versionado e um recibo sensível precisam de políticas próprias.'])
      },
      lab:{
        functionName:'politicaCache',
        goal:'Retorne "public, max-age=31536000, immutable" somente quando tipo for "asset-publico-versionado". Para "recibo" e todo tipo desconhecido, retorne "no-store".',
        starter:'function politicaCache(tipo) {\n  return "public, max-age=31536000, immutable";\n}',
        answer:'function politicaCache(tipo) {\n  if (tipo === "asset-publico-versionado") return "public, max-age=31536000, immutable";\n  return "no-store";\n}',
        hints:['Cache longo exige classificação explicitamente pública e versionada.', 'Faça o retorno padrão ser no-store.'],
        note:'O novo cabeçalho se aplica às novas respostas. Para conteúdo sensível anteriormente armazenado, verifique também a invalidação no cache e o procedimento de incidente.',
        tests:tests(['Asset público e versionado',['asset-publico-versionado'],'public, max-age=31536000, immutable'],['Recibo sensível',['recibo'],'no-store'],['Tipo novo fica protegido',['exportacao-nova'],'no-store'],['Classificação ausente',[null],'no-store'])
      },
      delivery:delivery(question('Qual próximo passo faz sentido para a resposta já armazenada?',1,
        ['Só atualizar o README.','Um objeto já armazenado pode continuar no cache.'],
        ['Invalidar as chaves afetadas e verificar com a equipe o alcance do incidente.','A atualização do cabeçalho precisa ser acompanhada de uma ação para respostas antigas.'],
        ['Publicar o recibo como exemplo no ticket.','Use identificadores e evidência sem replicar os dados sensíveis.']),
        'Atualização de incidente · WEB-142','A regra agora envia no-store para recibos e mantém cache longo no asset versionado. As chaves anteriores precisam de invalidação e o time de segurança está avaliando o alcance.', 'Em andamento'),
      recall:[
        question('Qual diretiva expressa que o cache não deve armazenar a resposta nova?',0,['no-store','É a diretiva de não armazenamento.'],['no-cache','Pode permitir armazenamento com revalidação antes do uso.'],['public','Permite armazenamento em cache compartilhado nas condições da diretiva.']),
        question('Quando faz sentido usar cache longo no CSS?',2,['Quando o CSS tem o mesmo nome em todos os deploys.','O navegador pode continuar usando um arquivo antigo.'],['Quando o CSS contém dados de cada cliente.','Dados personalizados não devem entrar nessa política pública.'],['Quando o conteúdo muda junto com o nome versionado.','Uma nova versão passa a ter outro endereço.']),
        question('Qual cuidado adicional existe após mudar um cabeçalho de um endpoint?',1,['A alteração apaga todos os caches imediatamente.','Objetos anteriores podem continuar armazenados.'],['Verificar se versões antigas precisam de invalidação.','A ação de invalidação depende da infraestrutura usada.'],['Alterar o status do HTTP para 404 em todos os casos.','O endpoint ainda precisa entregar o recurso autorizado.'])
      ],
      refs:[{label:'RFC 9111 · Cache-Control',url:'https://www.rfc-editor.org/rfc/rfc9111#name-cache-control'},{label:'RFC 8246 · immutable',url:'https://datatracker.ietf.org/doc/html/rfc8246'}]
    },
    {
      id:'WEB-143', category:'Integração logística', title:'A transportadora inventou um status',
      description:'Converta eventos de rastreamento em estados estáveis para o portal.',
      minutes:17, icon:'layers', theme:'mint', skills:['Integração','Mapeamento','Contratos'],
      story:{
        person:'Rafa', role:'Operações', message:'Uma nova resposta da transportadora exibiu um código em inglês na tela. O cliente quer saber se a entrega atrasou ou se ainda está em rota.',
        criteria:['IN_TRANSIT e OUT_FOR_DELIVERY viram em_transito.', 'DELIVERED vira entregue e DELAYED vira atrasado.', 'Valores desconhecidos viram sem_atualizacao para evitar afirmar uma entrega.'],
        evidence:{label:'Resposta da transportadora',code:'{ "status": "OUT_FOR_DELIVERY" }\nTela atual: OUT_FOR_DELIVERY\nEstado interno esperado: em_transito'},
        question:question('Em qual ponto aplicar a tradução dos estados?',1,
          ['Em cada tela que lê o código original.','Isso espalha o contrato do fornecedor por vários consumidores.'],
          ['No adaptador que recebe dados da transportadora.','O restante do produto trabalha com estados internos estáveis.'],
          ['Somente no CSS dos badges.','O valor também é usado em filtros e regras.'])
      },
      lab:{
        functionName:'estadoRastreio',
        goal:'Implemente estadoRastreio(codigo). Mapeie IN_TRANSIT e OUT_FOR_DELIVERY para em_transito, DELIVERED para entregue e DELAYED para atrasado. Qualquer outro código vira sem_atualizacao. Compare códigos exatamente.',
        starter:'function estadoRastreio(codigo) {\n  if (codigo === "DELIVERED") return "entregue";\n  return "sem_atualizacao";\n}',
        answer:'function estadoRastreio(codigo) {\n  switch (codigo) {\n    case "IN_TRANSIT":\n    case "OUT_FOR_DELIVERY": return "em_transito";\n    case "DELIVERED": return "entregue";\n    case "DELAYED": return "atrasado";\n    default: return "sem_atualizacao";\n  }\n}',
        hints:['Dois códigos externos compartilham um estado interno.', 'Mantenha um retorno explícito para valores desconhecidos.'],
        tests:tests(['Confirma entrega',['DELIVERED'],'entregue'],['Saiu para entrega',['OUT_FOR_DELIVERY'],'em_transito'],['Em trânsito',['IN_TRANSIT'],'em_transito'],['Parceiro informa atraso',['DELAYED'],'atrasado'],['Código novo usa fallback',['LOCATION_UPDATED'],'sem_atualizacao'])
      },
      delivery:delivery(question('O que registrar no Jira para dar manutenção ao mapeamento?',2,
        ['Somente o print do badge em produção.','O print não revela qual código do fornecedor produziu o estado.'],
        ['Todos os possíveis códigos como concluídos.','Códigos desconhecidos ainda precisam de fallback e análise.'],
        ['A tabela externa → interna e o caso de valor desconhecido.','QA e operações podem reproduzir e revisar cada correspondência.']),
        'Nota para Operações · WEB-143','O adaptador transforma DELAYED em atrasado e OUT_FOR_DELIVERY em em_transito. Códigos fora da tabela aparecem como sem_atualizacao. Registrei o mapeamento e os testes no ticket.'),
      recall:[
        question('A transportadora cria um código novo. Qual estado inicial é mais honesto?',0,['sem_atualizacao','O portal evita inventar um significado.'],['entregue','O código novo não comprova entrega.'],['atrasado','O código novo não comprova atraso.']),
        question('O produto recebe dois códigos com o mesmo significado de interface. Como modelar?',1,['Criar dois estados de interface obrigatoriamente.','O domínio pode agrupar códigos equivalentes.'],['Mapear os dois códigos para o mesmo estado interno.','O restante do portal fica independente da distinção externa.'],['Recusar os dois.','São estados conhecidos e úteis para o cliente.']),
        question('Qual teste detecta regressão no fallback?',2,['Verificar DELIVERED.','É um caminho já conhecido.'],['Verificar que a resposta é uma string.','Um significado incorreto ainda pode ser string.'],['Enviar um código desconhecido e esperar sem_atualizacao.','O teste exerce o comportamento quando a integração evolui.'])
      ],
      refs:[{label:'Shopify · Exemplo de estados de entrega',url:'https://shopify.dev/docs/api/admin-graphql/latest/enums/FulfillmentEventStatus'}]
    },
    {
      id:'WEB-144', category:'Campos de resposta', title:'O JSON trouxe dados demais',
      description:'Monte uma resposta pública do pedido com os campos que a interface realmente usa.',
      minutes:17, icon:'shield', theme:'violet', skills:['DTO','JSON','Minimização de dados'],
      story:{
        person:'Cris', role:'Segurança', message:'No Network, a resposta do pedido mostra margem e anotações internas. Esses campos chegaram no JSON apesar de nunca aparecerem na tela.',
        criteria:['Retornar id e status.', 'Retornar somente primeiroNome de cliente quando houver um objeto cliente, senão null.', 'Campos novos do banco não devem entrar automaticamente na resposta.'],
        evidence:{label:'GET /api/pedidos/104',code:'{"id":104,"status":"enviado","margem":27,"cliente":{"primeiroNome":"Ana","email":"ana@example.com"},"notaInterna":"revisar frete"}'},
        question:question('Onde corrigir a exposição?',2,
          ['Ocultar as colunas do componente.','O dado continua disponível no corpo da resposta.'],
          ['Excluir apenas a margem, mantendo o resto da linha.','Outros campos atuais e futuros ainda podem ser expostos.'],
          ['Montar no servidor uma resposta com os campos explicitamente aprovados.','O JSON fica limitado ao contrato público, inclusive em objetos internos.'])
      },
      lab:{
        functionName:'pedidoPublico',
        goal:'Implemente pedidoPublico(pedido). Retorne {id,status,cliente}. Quando pedido.cliente existir, cliente deve conter só primeiroNome. Se estiver ausente ou for null, retorne cliente:null.',
        starter:'function pedidoPublico(pedido) {\n  return pedido;\n}',
        answer:'function pedidoPublico(pedido) {\n  const cliente = pedido.cliente == null ? null : {primeiroNome: pedido.cliente.primeiroNome};\n  return {id: pedido.id, status: pedido.status, cliente};\n}',
        hints:['Monte um objeto novo declarando os campos de saída.', 'Faça o mesmo dentro de cliente para excluir e-mail e outros dados.'],
        tests:tests(
          ['Preserva os campos públicos',[{id:1,status:'enviado',cliente:{primeiroNome:'Ana'}}],{id:1,status:'enviado',cliente:{primeiroNome:'Ana'}}],
          ['Omite e-mail e margem',[{id:2,status:'pago',margem:27,cliente:{primeiroNome:'Bia',email:'bia@example.com'}}],{id:2,status:'pago',cliente:{primeiroNome:'Bia'}}],
          ['Cliente ausente vira null',[{id:3,status:'pago'}],{id:3,status:'pago',cliente:null}],
          ['Novas propriedades ficam de fora',[{id:4,status:'pendente',chaveInterna:'X9',cliente:null}],{id:4,status:'pendente',cliente:null}])
      },
      delivery:delivery(question('O que deve aparecer no PR?',0,
        ['Contrato público e teste que procura campos proibidos na resposta.','O revisor consegue ver a fronteira do dado no servidor.'],
        ['Uma imagem do pedido com as colunas escondidas.','A imagem não informa o conteúdo da resposta.'],
        ['Um payload real com os e-mails de clientes.','Dados fictícios bastam para reproduzir e evitam expor pessoas.']),
        'Descrição de PR · WEB-144','A resposta passa a selecionar id, status e cliente.primeiroNome. Rodei casos com margem, nota e e-mail fictícios para validar que campos fora do contrato ficam de fora.'),
      recall:[
        question('Uma coluna interna foi adicionada ao banco. O que deve ocorrer no JSON público?',1,['Ela entra na resposta até que alguém reclame.','O contrato público não precisa acompanhar novas colunas internas.'],['Ela fica de fora enquanto não for adicionada ao contrato.','A lista explícita evita exposição acidental.'],['Ela substitui o campo status.','A nova coluna não muda o contrato existente.']),
        question('Como conferir uma suspeita de campo exposto?',0,['Ler a resposta bruta na aba Network.','Assim você vê os campos transmitidos à aplicação.'],['Inspecionar apenas as cores da tabela.','As cores não mostram os dados recebidos.'],['Perguntar se o campo aparece em mobile.','Um campo pode vazar em qualquer viewport sem ser renderizado.']),
        question('A lista de campos públicos concede acesso a pedidos de outra pessoa?',2,['Sim, porque agora o JSON tem poucos campos.','Mesmo campos públicos dentro de um recurso podem exigir autorização.'],['Sim, se o ID for um número.','O formato do identificador não concede acesso.'],['Não. O servidor também verifica a permissão para aquele pedido.','A autorização do recurso e a seleção de propriedades são verificações diferentes.'])
      ],
      refs:[{label:'OWASP · Autorização por propriedade',url:'https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/'}]
    },
    {
      id:'WEB-145', category:'Exportação CSV', title:'A vírgula que criou outra coluna',
      description:'Preserve colunas e quebras de linha no arquivo de pedidos usado pela conciliação.',
      minutes:17, icon:'database', theme:'blue', skills:['CSV','Exportação','Serialização'],
      story:{
        person:'Eva', role:'Financeiro', message:'A nova exportação separou o rótulo “Retirada, balcão 2” em duas colunas. Alguns rótulos padronizados também têm aspas ou quebra de linha.',
        criteria:['Cada rótulo deve continuar em uma única célula.', 'Aspas internas são duplicadas nos campos delimitados.', 'Campos simples saem sem aspas.'],
        evidence:{label:'Arquivo em homologação',code:'id,etapa\n104,Retirada, balcão 2\n\nA segunda linha é interpretada como três campos.'},
        question:question('Qual correção conserva o rótulo original e as colunas?',1,
          ['Remover vírgulas dos rótulos.','Isso altera o dado original.'],
          ['Delimitar com aspas os campos especiais e duplicar aspas internas.','O leitor pode reconstruir o campo original.'],
          ['Trocar todas as vírgulas por espaços no arquivo inteiro.','Isso elimina também os separadores das colunas.'])
      },
      lab:{
        functionName:'linhaCsv',
        goal:'Implemente linhaCsv(campos), que recebe strings e retorna uma linha sem quebra final. Una com vírgulas. Se um campo tem vírgula, aspas duplas, CR ou LF, cerque-o com aspas duplas e duplique as aspas internas.',
        starter:'function linhaCsv(campos) {\n  return campos.join(",");\n}',
        answer:String.raw`function linhaCsv(campos) {
  return campos.map(campo => {
    if (!/[,"\r\n]/.test(campo)) return campo;
    return '"' + campo.replace(/"/g, '""') + '"';
  }).join(",");
}`,
        hints:['O escape ocorre campo por campo antes de juntar.', 'A expressão /[,"\\r\\n]/ encontra os caracteres que exigem delimitação.'],
        note:'O exercício recebe IDs e rótulos fixos do sistema. Exportações abertas em planilhas que incluem texto de usuários precisam de uma política adicional contra injeção de fórmulas.',
        tests:tests(['Campos simples',[['104','Pendente']],'104,Pendente'],['Vírgula dentro de um campo',[['104','Retirada, balcão 2']],'104,"Retirada, balcão 2"'],['Aspas internas',[['105','Tipo "A"']],'105,"Tipo ""A"""'],['Quebra de linha interna',[['106','Linha 1\nLinha 2']],'106,"Linha 1\nLinha 2"'],['Carriage return interno',[['107','Linha 1\rLinha 2']],'107,"Linha 1\rLinha 2"'])
      },
      delivery:delivery(question('Qual evidência ajuda o Financeiro a aceitar a correção?',2,
        ['Um arquivo com apenas rótulos simples.','Esse arquivo não reproduz a falha original.'],
        ['A contagem de caracteres do CSV.','O tamanho não demonstra que as células foram reconstruídas.'],
        ['Um CSV fictício importado com vírgula, aspas e quebra dentro da mesma coluna.','O caso confirma o resultado no consumidor real.']),
        'Comentário de aceite · WEB-145','A exportação preserva o rótulo original. Validar a importação com registros fictícios contendo vírgula, aspas e quebra de linha dentro da coluna etapa.'),
      recall:[
        question('Um campo contém aspas duplas. Como registrá-las dentro de um campo delimitado?',0,['Duplique cada aspa interna.','O leitor trata as duas aspas como uma aspa do valor.'],['Apague todas as aspas.','Isso muda o dado de origem.'],['Adicione uma vírgula após cada aspa.','A vírgula adicionaria caracteres ao valor.']),
        question('O valor contém uma quebra de linha. Como evitar um registro a mais?',1,['Remova a quebra sempre.','Nesse contrato, a quebra faz parte do dado.'],['Cerque o campo com aspas.','A quebra é interpretada dentro do campo.'],['Aumente o número de colunas.','A quantidade de colunas é definida pelo contrato.']),
        question('O exportador passa a incluir observações digitadas por clientes. Qual risco adicional verificar?',2,['A cor do cabeçalho.','A cor não afeta a interpretação da célula.'],['O status HTTP 429 em toda linha.','Limites de tráfego são independentes do conteúdo exportado.'],['Fórmulas interpretadas pelo programa de planilhas.','O escape sintático de CSV, sozinho, não trata fórmulas.'])
      ],
      refs:[{label:'RFC 4180 · Formato CSV',url:'https://www.rfc-editor.org/rfc/rfc4180'},{label:'OWASP · Injeção em CSV',url:'https://owasp.org/www-community/attacks/CSV_Injection'}]
    },
    {
      id:'WEB-146', category:'Métricas e plantão', title:'Um erro virou alerta de madrugada',
      description:'Use volume e taxa de falhas para distinguir um pico relevante de uma amostra pequena.',
      minutes:19, icon:'activity', theme:'mint', skills:['Métricas','Alertas','Operação'],
      story:{
        person:'Gui', role:'Plantão', message:'O alerta de pedidos disparou com 1 erro em 2 requisições de madrugada. O plantão quer uma regra reproduzível para este alerta de 5 minutos.',
        criteria:['Pedir pelo menos 100 requisições na janela.', 'Alertar se 5% ou mais das requisições falharem.', 'Zero tráfego não gera alerta de taxa por esta regra.'],
        evidence:{label:'Janela de cinco minutos',code:'03:05 · total 2 · falhas 1 · taxa 50% · alerta atual: sim\n14:35 · total 400 · falhas 28 · taxa 7% · alerta esperado: sim'},
        question:question('Que regra corresponde a esse alerta?',0,
          ['Combinar taxa de falhas com volume mínimo.','O denominador dá contexto à taxa antes de acionar o plantão.'],
          ['Alertar com a primeira falha, sem olhar o volume.','Em janelas pequenas isso gera muitos avisos.'],
          ['Alertar apenas quando não existe tráfego.','Ausência de tráfego é outro sinal, com outra investigação.'])
      },
      lab:{
        functionName:'acionarPlantao',
        goal:'Implemente acionarPlantao(total, falhas). Receba contagens não negativas e retorne true somente com total >= 100 e falhas correspondendo a pelo menos 5% do total.',
        starter:'function acionarPlantao(total, falhas) {\n  return falhas / total >= 0.05;\n}',
        answer:'function acionarPlantao(total, falhas) {\n  return total >= 100 && falhas * 20 >= total;\n}',
        hints:['Verifique primeiro o volume mínimo.', 'Uma falha para cada 20 requisições é 5%.'],
        note:'Esses limites são uma política didática para um alerta. Sistemas de baixo tráfego podem exigir sondas sintéticas ou outras janelas para detectar indisponibilidade.',
        tests:tests(['Tráfego alto e falhas acima do limite',[400,28],true],['Amostra minúscula',[2,1],false],['Exatamente no limite de 5%',[100,5],true],['Falhas abaixo do limite',[200,9],false],['Sem requisições',[0,0],false])
      },
      delivery:delivery(question('Que dados incluir na atualização do plantão?',1,
        ['Só o percentual, sem horário ou volume.','O plantão precisa do contexto da janela para interpretar o número.'],
        ['Janela, total, falhas, regra e próximo passo para tráfego baixo.','A equipe pode reproduzir o disparo e discutir como detectar ausência de tráfego.'],
        ['Garantir que a nova regra encontra toda indisponibilidade.','A cobertura depende do tráfego e do tipo de falha.']),
        'Atualização para o plantão · WEB-146','A regra de cinco minutos dispara com 100 ou mais requisições e taxa de falhas de pelo menos 5%. Validei 2/1, 100/5 e 400/28. Vou acompanhar o volume noturno com uma sonda separada.'),
      recall:[
        question('São 120 requisições e 6 falhas. O alerta dispara?',1,['Não, a regra é maior que 5%.','O critério inclui exatamente 5%.'],['Sim, volume e taxa estão dentro dos critérios.','Seis falhas em 120 requisições correspondem a 5%.'],['Não, 6 é menor que 100.','O limite 100 se aplica ao total de requisições.']),
        question('Em uma janela de tráfego baixo, como obter um sinal independente?',2,['Desligar todas as verificações.','Ainda é possível detectar problemas por outros sinais.'],['Trocar os erros reais por um percentual fixo.','O percentual perderia relação com o serviço.'],['Adicionar uma sonda sintética do fluxo relevante.','Uma sonda pode testar o fluxo mesmo sem chamadas de clientes.']),
        question('Por que 1 falha em 2 requisições não aciona esse alerta?',0,['O volume mínimo é 100.','A taxa é alta, mas a política exige uma amostra mínima.'],['A taxa é menor que 5%.','Uma falha em duas chamadas é 50%.'],['Falhas de madrugada não contam.','O horário não está na regra.'])
      ],
      refs:[{label:'Google SRE · Alertas orientados a SLOs',url:'https://sre.google/workbook/alerting-on-slos/'}]
    }
  ];
})();
