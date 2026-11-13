'use strict';

(() => {
  const dates = [
    {value:'2026-05-18',label:'18/05/2026'},
    {value:'2026-05-19',label:'19/05/2026'}
  ];
  const auditEvents = [
    {code:'AUD-170',instant:'2026-05-18T02:40:00Z',local:'17/05 · 23:40',action:'Registro criado'},
    {code:'AUD-181',instant:'2026-05-18T12:20:00Z',local:'18/05 · 09:20',action:'Descrição revisada'},
    {code:'AUD-182',instant:'2026-05-19T02:50:00Z',local:'18/05 · 23:50',action:'Comentário incluído'},
    {code:'AUD-190',instant:'2026-05-19T03:00:00Z',local:'19/05 · 00:00',action:'Rascunho arquivado'}
  ];

  function filterAudit(day,fixed) {
    const start = Date.parse(`${day}T00:00:00${fixed ? '-03:00' : 'Z'}`);
    const nextDay = start + 24 * 60 * 60 * 1000;
    return auditEvents.filter(event => {
      const instant = Date.parse(event.instant);
      return instant >= start && instant < nextDay;
    });
  }

  const components = {
    'BOL-101':{code:'BOL-101',unit:'U-A',marker:'Cadastro importado'},
    'BOL-102':{code:'BOL-102',unit:'U-B',marker:'Conferência registrada'}
  };
  const detailsActions = [
    {id:'open-a',label:'Abrir BOL-101'},
    {id:'open-b',label:'Abrir BOL-102'}
  ];

  const movements = [
    {id:701,time:'10:11:00',event:'Rascunho recebido'},
    {id:702,time:'10:12:00',event:'Referência incluída'},
    {id:703,time:'10:12:00',event:'Revisão registrada'}
  ];

  function sortMovements(reverseSource,fixed) {
    const source = reverseSource ? [...movements].reverse() : [...movements];
    return source.sort((first,second) => first.time.localeCompare(second.time) || (fixed ? first.id - second.id : 0));
  }

  const units = [
    {value:'U-A',label:'U-A · Unidade da sessão'},
    {value:'U-B',label:'U-B · Outra unidade'}
  ];
  const records = [
    {id:'INT-701',unit:'U-A',status:'Aguardando revisão'},
    {id:'INT-702',unit:'U-A',status:'Revisado'},
    {id:'INT-801',unit:'U-B',status:'Rascunho'}
  ];

  Object.assign(window.sprintVisualCases,{
    'auditoria-fuso':{
      title:'O relatório puxou eventos do dia anterior',area:'Auditoria',
      description:'Compare o dia selecionado com os horários que aparecem no relatório.',
      report:'Selecionei 18 de maio e cliquei em Aplicar data. Apareceu um evento do dia 17 e sumiu o comentário do fim do dia 18.',
      goal:'Selecione 18/05/2026 e clique em Aplicar data. O resultado esperado é AUD-181 e AUD-182. O evento de 00:00 do dia 19 fica fora do intervalo.',
      screen:{title:'Auditoria de alterações',context:'Horário exibido em UTC−03:00'},mission:'HNT-307',
      hints:[
        'Compare as datas na coluna Horário local com a data que você selecionou.',
        'A meia-noite do dia 18 em UTC−03:00 corresponde a 03:00Z. Confira também o fim do intervalo.',
        'Converta as duas meias-noites locais para UTC e consulte do início inclusivo até o fim exclusivo.'
      ],
      choices:[
        {label:'Converter os limites locais para UTC e usar início inclusivo e fim exclusivo.',feedback:'A seleção inclui todo o dia local e evita contar a meia-noite duas vezes entre dias consecutivos.'},
        {label:'Somar três horas aos rótulos da tabela depois de consultar o banco.',feedback:'A exibição muda, mas a consulta ainda devolve eventos do intervalo errado.'},
        {label:'Filtrar o dia pelo prefixo da data armazenada em UTC.',feedback:'O prefixo em UTC divide a lista em uma meia-noite diferente da utilizada na tela.'}
      ],
      answer:0,
      create:() => ({day:dates[0].value,events:[],searched:false}),
      view(state) {
        return {
          fields:[{id:'day',label:'Data da auditoria',type:'select',value:state.day,options:dates}],
          actions:[{id:'apply-date',label:'Aplicar data'}],
          table:{columns:['Código','Horário local','Alteração'],rows:state.events.map(event => [event.code,event.local,event.action])},
          message:state.searched ? {tone:'info',text:`${state.events.length} eventos encontrados`} : {tone:'info',text:'Selecione uma data para carregar os eventos.'}
        };
      },
      interact(state,action,values,fixed) {
        const day = values.day;
        if (action !== 'apply-date' || !dates.some(date => date.value === day)) return {state};
        const events = filterAudit(day,fixed);
        const includesRightEvents = events.map(event => event.code).join(',') === 'AUD-181,AUD-182';
        return {
          state:{day,events,searched:true},
          outcome:day === '2026-05-18' ? includesRightEvents ? 'verified' : 'reproduced' : undefined
        };
      }
    },

    'detalhe-atrasado':{
      title:'Uma consulta lenta sobrescreve o detalhe selecionado',area:'Rastreabilidade',
      description:'Controle a ordem de chegada das respostas e confira qual registro permanece na tela.',
      report:'Abri o BOL-101 e logo depois o BOL-102. Por um momento apareceu o detalhe certo. Quando a primeira consulta terminou, a tela voltou para BOL-101 sozinha.',
      goal:'Abra BOL-101 e depois BOL-102. Entregue a próxima resposta duas vezes. O detalhe final precisa continuar em BOL-102.',
      screen:{title:'Consulta de componentes',context:'Rede simulada · BOL-101 responde depois de BOL-102'},mission:'HNG-405',
      hints:[
        'Compare Componente selecionado e Detalhe exibido depois de cada resposta.',
        'A ordem dos cliques determina a seleção. O tempo da rede pode inverter a ordem de conclusão.',
        'No Angular, switchMap mantém a inscrição da consulta mais recente e descarta emissões da seleção anterior.'
      ],
      choices:[
        {label:'Guardar a última resposta recebida como detalhe atual.',feedback:'A resposta atrasada ainda sobrescreve a tela, mesmo após uma seleção mais recente.'},
        {label:'Usar switchMap na seleção e atualizar o detalhe apenas com a consulta atual.',feedback:'Uma nova seleção invalida a consulta anterior. Só a resposta de BOL-102 pode preencher o detalhe.'},
        {label:'Esperar dois segundos antes de atualizar o detalhe.',feedback:'Um atraso fixo muda o tempo da falha. Uma resposta mais lenta ainda pode chegar fora de ordem.'}
      ],
      answer:1,
      create:() => ({selected:null,shown:null,pending:[],delivered:[],sequence:0,message:null}),
      view(state) {
        const record = components[state.shown];
        return {
          actions:[...detailsActions,{id:'deliver',label:'Entregar próxima resposta',disabled:state.pending.length === 0}],
          details:[
            {label:'Componente selecionado',value:state.selected ?? 'Nenhum'},
            {label:'Detalhe exibido',value:record?.code ?? 'Aguardando seleção'},
            {label:'Unidade do detalhe',value:record?.unit ?? '—'},
            {label:'Último evento do detalhe',value:record?.marker ?? '—'}
          ],
          table:{columns:['Resposta recebida','Efeito na tela'],rows:state.delivered.map(request => [request.code,request.effect])},
          message:state.message ?? {tone:'info',text:'Abra os dois componentes antes de entregar as respostas.'}
        };
      },
      interact(state,action,_values,fixed) {
        if (action === 'open-a' || action === 'open-b') {
          const code = action === 'open-a' ? 'BOL-101' : 'BOL-102';
          const sequence = state.sequence + 1;
          const request = {code,sequence,delay:code === 'BOL-101' ? 700 : 100};
          return {state:{...state,selected:code,sequence,pending:[...state.pending,request],message:{tone:'info',text:`Consulta de ${code} pendente`}}};
        }
        if (action !== 'deliver' || !state.pending.length) return {state};
        const [request,...pending] = [...state.pending].sort((first,second) => first.delay - second.delay || first.sequence - second.sequence);
        const stale = request.sequence !== state.sequence;
        const ignored = fixed && stale;
        const shown = ignored ? state.shown : request.code;
        const tested = state.selected === 'BOL-102' && state.shown === 'BOL-102' && request.code === 'BOL-101' && stale;
        const mismatch = shown !== state.selected;
        return {
          state:{...state,pending,shown,
            delivered:[...state.delivered,{code:request.code,effect:ignored ? 'Resposta antiga descartada' : 'Detalhe atualizado'}],
            message:{tone:mismatch ? 'error' : 'info',text:mismatch ? `O detalhe passou para ${shown}, mas ${state.selected} continua selecionado.` : `A tela exibe ${shown}.`}
          },
          outcome:tested ? mismatch ? 'reproduced' : 'verified' : undefined
        };
      }
    },

    'historico-ordem':{
      title:'Atualizar o histórico troca a ordem de dois eventos',area:'Rastreabilidade',
      description:'Reproduza a troca de ordem entre movimentações registradas no mesmo instante.',
      report:'A tela mostrou a referência antes da revisão. Cliquei em Atualizar histórico e as duas linhas trocaram de lugar, mesmo sem chegar evento novo.',
      goal:'Clique em Atualizar histórico. A ordem esperada é 701, 702 e 703 antes e depois da atualização, inclusive quando dois horários são iguais.',
      screen:{title:'Histórico do rascunho INT-701',context:'Movimentações do mesmo conjunto de dados'},mission:'HNT-302',
      hints:[
        'Confira quais linhas trocam de lugar e compare os horários até os segundos.',
        'Ordenar somente pelo horário deixa a sequência entre horários iguais indefinida na consulta.',
        'No EF Core, encadeie ThenBy para desempatar pelo ID crescente antes de materializar a consulta.'
      ],
      choices:[
        {label:'Ordenar por texto de descrição quando a tela atualiza.',feedback:'A descrição pode mudar ou ser traduzida. A sequência definida para esse histórico é por horário e ID.'},
        {label:'Memorizar no navegador a posição que veio na primeira consulta.',feedback:'Outra pessoa ou uma nova sessão ainda pode receber uma ordem diferente para os mesmos eventos.'},
        {label:'Ordenar a consulta por horário e usar ThenBy pelo ID do movimento.',feedback:'Com uma segunda chave estável, os mesmos movimentos mantêm a ordem entre consultas.'}
      ],
      answer:2,
      create:() => ({reverse:false,rows:sortMovements(false,true),previous:null}),
      view(state) {
        const currentOrder = state.rows.map(event => event.id).join(' → ');
        return {
          actions:[{id:'refresh',label:'Atualizar histórico'}],
          table:{columns:['ID','Horário','Movimentação'],rows:state.rows.map(event => [event.id,event.time,event.event])},
          details:[
            {label:'Ordem anterior',value:state.previous ?? '—'},
            {label:'Ordem exibida',value:currentOrder}
          ],
          message:state.previous ? {tone:state.previous === currentOrder ? 'info' : 'error',text:state.previous === currentOrder ? 'A ordem foi preservada.' : 'O mesmo histórico voltou em outra ordem.'} : null
        };
      },
      interact(state,action,_values,fixed) {
        if (action !== 'refresh') return {state};
        const reverse = !state.reverse;
        const rows = sortMovements(reverse,fixed);
        const previous = state.rows.map(event => event.id).join(' → ');
        const changed = previous !== rows.map(event => event.id).join(' → ');
        return {state:{reverse,rows,previous},outcome:changed ? 'reproduced' : 'verified'};
      }
    },

    'unidade-acesso':{
      title:'A listagem aceita outra unidade fora da sessão',area:'Segurança',
      description:'Confira se a API valida a unidade solicitada antes de devolver linhas e totais.',
      report:'Minha sessão está na U-A. Ao trocar a unidade pedida para U-B e clicar em Consultar registros, consegui ver um registro e o total de outra unidade.',
      goal:'Selecione U-B e clique em Consultar registros. A API deve devolver HTTP 403 sem registros nem total. A consulta normal da U-A continua disponível.',
      screen:{title:'Registros internos por unidade',context:'Sessão simulada com acesso apenas à U-A'},
      hints:[
        'Compare a unidade da sessão com a unidade enviada no filtro e observe o status HTTP.',
        'Um filtro preenchido no navegador é entrada do usuário. A API conhece o escopo autorizado da sessão.',
        'Valide a unidade no servidor antes de consultar a tabela. A interface deve limpar os dados se receber 403.'
      ],
      choices:[
        {label:'Validar a unidade na API com o escopo da sessão e limpar a tabela ao receber 403.',feedback:'A resposta negada fica sem linhas e sem total. A unidade permitida continua consultável.'},
        {label:'Ocultar a unidade U-B apenas no seletor do Angular.',feedback:'Uma requisição direta ainda pode enviar U-B e receber os registros fora do escopo.'},
        {label:'Esconder as linhas da U-B e manter a contagem recebida.',feedback:'O total também revela informação de outra unidade. O servidor precisa barrar a consulta inteira.'}
      ],
      answer:0,
      create:() => ({unit:'U-A',rows:[],http:null,total:null}),
      view(state) {
        return {
          fields:[{id:'unit',label:'Unidade pedida',type:'select',value:state.unit,options:units}],
          actions:[{id:'query',label:'Consultar registros'}],
          details:[
            {label:'Unidade da sessão',value:'U-A'},
            {label:'Status HTTP',value:state.http === null ? '—' : String(state.http)},
            {label:'Total retornado',value:state.total === null ? '—' : String(state.total)}
          ],
          table:{columns:['Registro','Unidade','Estado'],rows:state.rows.map(record => [record.id,record.unit,record.status])},
          message:state.http === 403 ? {tone:'error',text:'A sessão não tem acesso à unidade solicitada.'} : null
        };
      },
      interact(state,action,values,fixed) {
        const unit = values.unit;
        if (action !== 'query' || !units.some(option => option.value === unit)) return {state};
        const restricted = unit !== 'U-A';
        const denied = fixed && restricted;
        const rows = denied ? [] : records.filter(record => record.unit === unit);
        return {state:{unit,rows,http:denied ? 403 : 200,total:denied ? null : rows.length},
          outcome:restricted ? denied ? 'verified' : 'reproduced' : undefined};
      }
    }
  });
})();
