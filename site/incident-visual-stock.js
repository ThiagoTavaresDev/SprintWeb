'use strict';

(() => {
  const stock = [
    {code:'BOL-301',unit:'U-A',status:'Disponível'},
    {code:'BOL-302',unit:'U-B',status:'Quarentena'},
    {code:'BOL-303',unit:'U-A',status:'Quarentena'},
    {code:'BOL-304',unit:'U-B',status:'Disponível'}
  ];
  const all = 'Todos';
  const quarantine = 'Quarentena';
  const stockTable = items => ({columns:['Código','Unidade','Estado'],rows:items.map(item => [item.code,item.unit,item.status])});
  const filterByStatus = status => stock.filter(item => status === all || item.status === status);
  const notice = (tone,text) => ({tone,text});
  const select = (id,label,value,options) => ({id,label,type:'select',value,options:options.map(option => ({value:option,label:option}))});

  const ordering = {
    title:'O estoque perde o filtro ao ordenar',area:'Estoque',mission:'HNG-401',
    description:'Compare o filtro selecionado com as linhas exibidas ao mudar a ordenação.',
    report:'“Selecionei Quarentena e apliquei o filtro. Depois cliquei em Ordenar por código e a lista voltou a mostrar itens disponíveis.”',
    goal:'Aplique Quarentena e, em seguida, clique em Ordenar por código. A lista ordenada deve conter somente BOL-303 e BOL-302, nessa ordem.',
    screen:{title:'Conferência de estoque',context:'Filtro por estado operacional'},
    hints:[
      'O seletor continua em Quarentena quando as linhas erradas aparecem.',
      'A requisição de ordenação precisa carregar tanto o estado quanto a direção da ordenação.'
    ],
    choices:[
      {label:'Montar a consulta Angular com o filtro aplicado e a direção da ordenação.',feedback:'A mesma consulta preserva o conjunto filtrado e muda apenas a ordem dos resultados.'},
      {label:'Limpar o seletor ao clicar em Ordenar por código.',feedback:'O seletor passaria a refletir a consulta atual, mas o operador perderia o filtro que pediu.'},
      {label:'Esconder todas as linhas disponíveis depois de cada ordenação.',feedback:'A regra ficaria fixa em Quarentena e deixaria de respeitar outros estados escolhidos.'}
    ],
    answer:0,
    create:() => ({status:all,items:stock}),
    view(state) {
      return {fields:[select('status','Estado operacional',state.status,[all,'Disponível',quarantine])],
        actions:[{id:'filter',label:'Aplicar filtro'},{id:'order',label:'Ordenar por código'}],
        table:stockTable(state.items),
        details:[{label:'Resultado',value:`${state.items.length} componentes`}],message:state.message};
    },
    interact(state,action,values,fixed) {
      if (action === 'filter') {
        const status = ['Disponível',quarantine].includes(values.status) ? values.status : all;
        const items = filterByStatus(status);
        return {state:{status,items,message:notice('info',`Filtro aplicado: ${status}.`)}};
      }
      if (action !== 'order') return {state};
      const items = [...(fixed ? filterByStatus(state.status) : stock)].sort((a,b) => b.code.localeCompare(a.code));
      const requested = state.status === quarantine;
      const outside = items.some(item => item.status !== state.status);
      const message = requested && outside ? notice('error','A lista ordenada inclui componentes disponíveis, mesmo com Quarentena selecionada.')
        : notice('success','Lista ordenada por código decrescente.');
      return {state:{...state,items,message},outcome:requested ? (outside ? 'reproduced' : 'verified') : undefined};
    }
  };

  const labels = [
    ['000231','BOL-311','U-A'], ['231','BOL-312','U-B'], ['004509','BOL-313','U-A']
  ];
  const codeSearch = {
    title:'A busca confunde duas etiquetas',area:'Rastreabilidade',
    description:'Reproduza uma colisão entre identificadores com e sem zeros à esquerda.',
    report:'“Digitei 000231 na busca da etiqueta antiga. Apareceram dois componentes e não sei qual abrir.”',
    goal:'Busque 000231 e confira o código retornado. A resposta correta mostra apenas a etiqueta 000231, vinculada a BOL-311.',
    screen:{title:'Consulta de etiquetas legadas',context:'Identificadores importados do sistema anterior'},
    hints:[
      'Compare as etiquetas completas na primeira coluna. Os zeros fazem parte do identificador.',
      'A camada de busca precisa comparar strings. A conversão para número faz 000231 e 231 virarem o mesmo valor.'
    ],
    choices:[
      {label:'Ordenar os dois resultados pelo comprimento e usar o primeiro.',feedback:'Mudar a ordem esconde parte da colisão. Uma busca por 231 continuaria podendo apontar para o registro errado.'},
      {label:'Receber a busca como string e comparar com a coluna textual pelo EF Core.',feedback:'A comparação exata mantém 000231 separado de 231 e devolve o componente correspondente.'},
      {label:'Preencher o termo e a coluna com zeros antes de comparar.',feedback:'Preencher ambos com zeros volta a igualar identificadores que o legado mantém separados.'}
    ],
    answer:1,
    create:() => ({query:'',items:[]}),
    view(state) {
      return {fields:[{id:'query',label:'Código da etiqueta',type:'text',value:state.query}],actions:[{id:'search',label:'Buscar etiqueta'}],
        table:{columns:['Etiqueta','Componente','Unidade'],rows:state.items},message:state.message};
    },
    interact(state,action,values,fixed) {
      if (action !== 'search') return {state};
      const query = String(values.query ?? '').trim();
      if (!/^\d{1,12}$/.test(query)) {
        return {state:{query,items:[],message:notice('info','Digite um identificador com até 12 algarismos.')}};
      }
      const items = labels.filter(([code]) => fixed ? code === query : Number(code) === Number(query));
      const message = items.length > 1 ? notice('error','A busca retornou duas etiquetas distintas para um único identificador.')
        : items.length === 1 ? notice('success','Uma etiqueta encontrada.') : notice('info','Nenhuma etiqueta corresponde ao código digitado.');
      let outcome;
      if (query === '000231') {
        if (items.length > 1) outcome = 'reproduced';
        else if (items.length === 1 && items[0][0] === query) outcome = 'verified';
      }
      return {state:{query,items,message},outcome};
    }
  };

  const movement = [
    ['BOL-301','U-A','Registro'], ['BOL-302','U-B','Registro'], ['BOL-303','U-A','Movimentação'], ['BOL-304','U-B','Movimentação']
  ];
  const exportReport = {
    title:'O relatório exporta movimentações de outra unidade',area:'Relatórios',mission:'HFS-206',
    description:'Compare a tabela filtrada com as linhas que a exportação prepara.',
    report:'“Consultei a unidade U-B. Na tela apareceram só dois componentes, mas a prévia do CSV incluiu movimentações da U-A.”',
    goal:'Selecione U-B, clique em Consultar unidade e depois em Gerar prévia do CSV. A exportação deve mostrar apenas BOL-302 e BOL-304.',
    screen:{title:'Relatório de movimentações',context:'Exportação para conferência da unidade'},
    hints:[
      'A lista filtrada e a exportação usam consultas distintas.',
      'Use a unidade aplicada na chamada de exportação e filtre as linhas no ASP.NET antes de montar o CSV.'
    ],
    choices:[
      {label:'Adicionar o nome da unidade ao arquivo, mantendo todas as linhas.',feedback:'O nome identifica a unidade solicitada, mas as linhas continuam fora do recorte.'},
      {label:'Manter o filtro apenas na tabela Angular.',feedback:'O usuário vê a tabela certa, mas a API de exportação ainda produz o CSV completo.'},
      {label:'Enviar a unidade da consulta no Angular e filtrar o conjunto no endpoint de exportação.',feedback:'As duas ações usam o mesmo recorte. O CSV é gerado só com as movimentações da unidade aplicada.'}
    ],
    answer:2,
    create:() => ({unit:'U-A',applied:false,preview:null,items:[]}),
    view(state) {
      return {fields:[select('unit','Unidade',state.unit,['U-A','U-B'])],
        actions:[{id:'lookup',label:'Consultar unidade'},{id:'export',label:'Gerar prévia do CSV',disabled:!state.applied}],
        table:{columns:['Componente','Unidade','Movimentação'],rows:state.preview ?? state.items},
        details:[{label:'Exibindo',value:state.preview ? 'Prévia do CSV' : 'Tabela de consulta'}],message:state.message};
    },
    interact(state,action,values,fixed) {
      if (action === 'lookup') {
        const unit = values.unit === 'U-B' ? 'U-B' : 'U-A';
        const items = movement.filter(([,rowUnit]) => rowUnit === unit);
        return {state:{unit,applied:true,preview:null,items,message:notice('info',`Consulta de ${unit}: ${items.length} linhas.`)}};
      }
      if (action !== 'export' || !state.applied) return {state};
      const preview = fixed ? state.items : movement;
      const outside = preview.some(([,unit]) => unit !== state.unit);
      const message = outside ? notice('error',`A prévia inclui linhas de outras unidades além de ${state.unit}.`)
        : notice('success',`A prévia contém ${preview.length} linhas, todas de ${state.unit}.`);
      return {state:{...state,preview,message},outcome:state.unit === 'U-B' ? (outside ? 'reproduced' : 'verified') : undefined};
    }
  };

  Object.assign(window.sprintVisualCases,{
    'estoque-ordenacao':ordering,
    'estoque-codigo':codeSearch,
    'estoque-exportacao':exportReport
  });
})();
