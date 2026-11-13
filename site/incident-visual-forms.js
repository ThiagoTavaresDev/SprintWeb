'use strict';

(() => {
  const texto = (value, fallback) => String(value ?? fallback).trim().slice(0, 120);
  const originalNote = 'Conferência do estoque em andamento.';
  const otherNote = 'Conferência revisada pela outra aba.';

  const duplicate = {
    title:'Um clique extra cria outro rascunho',
    area:'Rascunhos',
    description:'Veja o que acontece quando o mesmo formulário é enviado enquanto o primeiro pedido ainda está pendente.',
    report:'Cliquei duas vezes em Salvar enquanto a tela aguardava. Depois apareceram dois rascunhos com a mesma observação.',
    goal:'Acione Salvar rascunho duas vezes com a mesma observação antes de processar as respostas. A tabela deve ganhar apenas um registro.',
    screen:{title:'Rascunhos de conferência',context:'Componente fictício BOL-231 · simulação de rede lenta'},
    hints:[
      'O botão Processar respostas representa a chegada das respostas da API. Deixe as solicitações pendentes até o segundo clique.',
      'A lista de envios pendentes e as linhas da tabela mostram em que momento a duplicação acontece.',
      'Em RxJS, exhaustMap ignora novos disparos enquanto o envio atual está em andamento.'
    ],
    choices:[
      {label:'Enfileirar os cliques com concatMap.',feedback:'Cada clique ainda chega à API. O segundo envio só passa a ocorrer depois do primeiro.'},
      {label:'Aceitar um envio por vez no Angular usando exhaustMap.',feedback:'O primeiro envio continua ativo e o segundo disparo da mesma tela é ignorado enquanto a resposta está pendente.'},
      {label:'Esconder linhas iguais da tabela depois de salvar.',feedback:'A API continuaria recebendo dois envios e manteria os dois registros. O filtro só esconderia a consequência na tela.'}
    ],
    answer:1,
    mission:'HNG-408',
    create:() => ({description:'Conferência fictícia da etiqueta.',pending:[],rows:[],duplicateAttempt:false}),
    view(state) {
      return {
        fields:[{id:'description',label:'Observação do rascunho',type:'text',value:state.description}],
        actions:[{id:'save',label:'Salvar rascunho'},{id:'settle',label:'Processar respostas',disabled:state.pending.length === 0}],
        details:[{label:'Envios pendentes',value:String(state.pending.length)},{label:'Rascunhos gravados',value:String(state.rows.length)}],
        table:{columns:['Rascunho','Componente','Observação'],rows:state.rows},
        message:state.message
      };
    },
    interact(state,action,values,fixed) {
      if (action === 'save') {
        const description = texto(values.description,state.description);
        if (!description) return {state:{...state,description,message:{tone:'info',text:'Preencha a observação para enviar o rascunho.'}}};
        const duplicateAttempt = state.duplicateAttempt || state.pending.includes(description);
        if (fixed && state.pending.length) {
          return {state:{...state,description,duplicateAttempt,message:{tone:'info',text:'O primeiro envio continua em andamento.'}}};
        }
        return {state:{...state,description,duplicateAttempt,pending:[...state.pending,description],message:{tone:'info',text:'Envio em andamento. As respostas ainda estão pendentes.'}}};
      }
      if (action !== 'settle' || state.pending.length === 0) return {state};
      const created = state.pending.map((description,index) => [`RAS-${701 + state.rows.length + index}`,'BOL-231',description]);
      const rows = [...state.rows,...created];
      const duplicated = new Set(state.pending).size < state.pending.length;
      const outcome = duplicated ? 'reproduced' : fixed && state.duplicateAttempt && created.length === 1 ? 'verified' : undefined;
      const message = duplicated ? {tone:'error',text:'A mesma observação foi gravada em mais de um rascunho.'}
        : {tone:'success',text:created.length === 1 ? 'Um rascunho foi gravado.' : `${created.length} rascunhos foram gravados.`};
      return {state:{...state,pending:[],rows,duplicateAttempt:false,message},outcome};
    }
  };

  const lostDraft = {
    title:'A observação some ao abrir o histórico',
    area:'Rascunhos',
    description:'Investigue onde guardar a edição de um formulário que é recriado ao trocar de tela.',
    report:'Digitei uma observação e abri o histórico para conferir o último movimento. Ao voltar, o campo estava vazio.',
    goal:'Digite uma observação fictícia, abra o histórico e volte ao rascunho. O texto que você digitou deve continuar no campo.',
    screen:{title:'Conferência de componente',context:'Registro fictício BOL-524'},
    hints:[
      'Confira o valor do campo antes de sair do formulário e depois de voltar do histórico.',
      'A troca recria o componente que contém o formulário. Considere onde guardar uma edição que ainda não foi enviada.',
      'Guarde o rascunho em um serviço Angular e restaure pelo código do registro ao montar o formulário.'
    ],
    choices:[
      {label:'Chamar o reset do formulário ao sair do histórico.',feedback:'Reset volta ao estado inicial e perde a observação que estava em edição.'},
      {label:'Gravar toda alteração de campo diretamente na API.',feedback:'Uma observação ainda em edição viraria um registro no servidor antes da confirmação do usuário.'},
      {label:'Guardar o texto por registro num serviço de rascunhos e restaurá-lo ao voltar.',feedback:'O rascunho sobrevive à troca de tela na sessão e continua vinculado ao componente correto.'}
    ],
    answer:2,
    create:() => ({tab:'draft',draft:'',before:''}),
    view(state) {
      if (state.tab === 'history') {
        return {
          actions:[{id:'draft',label:'Voltar ao rascunho'}],
          table:{columns:['Hora','Movimento'],rows:[['09:10','Recebimento registrado'],['09:42','Conferência da etiqueta']]},
          message:{tone:'info',text:'Histórico de BOL-524'}
        };
      }
      return {
        fields:[{id:'note',label:'Observação em edição',type:'text',value:state.draft}],
        actions:[{id:'history',label:'Abrir histórico'}],
        message:state.message
      };
    },
    interact(state,action,values,fixed) {
      if (action === 'history' && state.tab === 'draft') {
        const before = String(values.note ?? state.draft);
        return {state:{tab:'history',before,draft:fixed ? before : ''}};
      }
      if (action !== 'draft' || state.tab !== 'history') return {state};
      const next = {...state,tab:'draft'};
      if (!state.before.trim()) return {state:{...next,message:{tone:'info',text:'Digite uma observação e visite o histórico para conferir se ela é preservada.'}}};
      const preserved = state.draft === state.before;
      const message = preserved ? {tone:'success',text:'A observação em edição foi recuperada.'}
        : {tone:'error',text:'O formulário voltou vazio depois da visita ao histórico.'};
      return {state:{...next,message},outcome:preserved ? 'verified' : 'reproduced'};
    }
  };

  const concurrentEdit = {
    title:'Uma aba sobrescreve a observação da outra',
    area:'Conferência e auditoria',
    description:'Reproduza uma atualização concorrente e confirme que o servidor protege a versão mais recente.',
    report:'Deixei uma aba aberta. Outra pessoa revisou o registro e, quando salvei pela minha aba, a alteração dela sumiu.',
    goal:'Altere a observação nesta aba, simule uma edição em outra aba e depois salve. O servidor deve preservar a versão mais recente, e o seu texto deve continuar no formulário.',
    screen:{title:'Editar observação da conferência',context:'Registro fictício BOL-643 · edição em duas abas'},
    hints:[
      'Compare a versão que a sua aba abriu com a versão exibida no servidor depois da edição simulada.',
      'Enviar uma alteração com a versão que estava aberta permite ao servidor detectar uma gravação desatualizada.',
      'Use If-Match com a versão da aba e trate HTTP 412 preservando o texto em edição.'
    ],
    choices:[
      {label:'Enviar a versão conhecida em If-Match e bloquear a gravação desatualizada.',feedback:'O ASP.NET Core pode responder 412 para uma versão antiga. A gravação deve verificar a versão de forma atômica, e o Angular preserva a edição local.'},
      {label:'Recarregar a página depois de salvar.',feedback:'A leitura acontece após a sobrescrita. O conteúdo mais recente já teria sido perdido.'},
      {label:'Buscar a versão atual imediatamente antes do envio e usá-la para salvar o texto antigo.',feedback:'A versão precisa corresponder ao conteúdo que o usuário viu ao iniciar a edição. Substituí-la no envio esconderia o conflito.'}
    ],
    answer:0,
    create:() => ({draft:originalNote,serverNote:originalNote,opened:1,version:1,externalEdit:false}),
    view(state) {
      return {
        fields:[{id:'note',label:'Observação nesta aba',type:'text',value:state.draft}],
        actions:[{id:'external',label:'Simular edição em outra aba',disabled:state.externalEdit},{id:'save',label:'Salvar edição'}],
        details:[{label:'Versão aberta nesta aba',value:String(state.opened)},{label:'Versão no servidor',value:String(state.version)},{label:'Observação no servidor',value:state.serverNote}],
        message:state.message
      };
    },
    interact(state,action,values,fixed) {
      if (action !== 'external' && action !== 'save') return {state};
      const draft = texto(values.note,state.draft);
      if (action === 'external') {
        if (state.externalEdit) return {state};
        return {state:{...state,draft,serverNote:otherNote,version:state.version + 1,externalEdit:true,message:{tone:'info',text:'A outra aba gravou uma nova versão no servidor.'}}};
      }
      if (!draft) return {state:{...state,draft,message:{tone:'info',text:'Preencha a observação desta aba para salvar.'}}};
      const stale = state.opened !== state.version;
      const wouldOverwrite = stale && draft !== state.serverNote;
      if (fixed && stale) {
        const message = {tone:'info',text:'HTTP 412 · A outra versão foi preservada. Sua observação continua em edição.'};
        return {state:{...state,draft,message},outcome:wouldOverwrite ? 'verified' : undefined};
      }
      const version = state.version + 1;
      const message = wouldOverwrite ? {tone:'error',text:'A gravação substituiu a observação que veio da outra aba.'}
        : {tone:'success',text:'Observação gravada.'};
      return {state:{...state,draft,serverNote:draft,opened:version,version,externalEdit:false,message},outcome:wouldOverwrite ? 'reproduced' : undefined};
    }
  };

  Object.assign(window.sprintVisualCases,{
    'rascunho-duplo':duplicate,
    'rascunho-sumiu':lostDraft,
    'edicao-concorrente':concurrentEdit
  });
})();
