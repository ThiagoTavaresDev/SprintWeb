'use strict';

const visualExistingCases = (() => {
  function requestFrom(probe,body = probe.request.body) {
    return {...probe.request,headers:probe.request.headers ?? [],body:body ? JSON.stringify(body) : ''};
  }

  function pagination(id) {
    const exercise = window.sprintIncidentCases.estoque;
    function read(page) {
      const index = id === 'frontend' ? 0 : page - 1;
      return exercise.respond(id,requestFrom(exercise.probes[index])).body.items;
    }
    return {
      screen:{title:'Conferência de estoque',context:'Confira os componentes da primeira página e clique em Próxima página.'},
      create:() => ({page:1,items:read(1)}),
      view:model => ({
        actions:[{id:'previous',label:'Página anterior',disabled:model.page === 1},{id:'next',label:'Próxima página',disabled:model.page === 2,primary:true}],
        details:[{label:'Página solicitada na tela',value:String(model.page)},{label:'Total de componentes',value:'3'}],
        table:{columns:['Componente','Tipo','Status'],rows:model.items.map(item => [item.codigo,item.tipo,item.status])},
        message:model.message
      }),
      interact(model,action) {
        const page = action === 'next' ? 2 : 1;
        const items = read(page);
        const repeated = page === 2 && items.map(item => item.codigo).join() === model.items.map(item => item.codigo).join();
        const message = repeated ? {tone:'error',text:'A tela avançou para a página 2, mas ainda lista BOL-101 e BOL-102.'} : undefined;
        return {state:{page,items,message},outcome:repeated ? 'reproduced' : undefined};
      }
    };
  }

  function validation(id) {
    const exercise = window.sprintIncidentCases.validacao;
    const {body} = exercise.probes[0].request;
    return {
      screen:{title:'Novo rascunho de ocorrência',context:'Informe BOL-999, preencha a descrição fictícia e clique em Salvar rascunho.'},
      create:() => ({code:body.codigoComponente,note:body.descricao}),
      view:model => ({
        fields:[{id:'code',label:'Código do componente',type:'text',value:model.code},{id:'note',label:'Descrição',type:'text',value:model.note}],
        actions:[{id:'save',label:'Salvar rascunho',primary:true}],
        details:model.rejected ? [{label:'Código do componente',value:'Campo sem mensagem de validação'}] : [],
        message:model.message
      }),
      interact(_model,_action,values) {
        const code = values.code.trim().toUpperCase();
        const note = values.note.trim();
        const response = exercise.respond(id,requestFrom(exercise.probes[0],{codigoComponente:code,descricao:note}));
        const fields = id === 'validacao-a' ? response.body?.erros : response.body?.errors;
        const reproduced = response.status === 422 && code === body.codigoComponente && Boolean(note) && !fields?.codigoComponente;
        const rejected = response.status === 422;
        const message = rejected ? {tone:'error',text:'Rascunho rejeitado. Confira os campos do formulário.'}
          : {tone:response.status === 201 ? 'success' : 'info',text:response.status === 201 ? 'Rascunho de teste salvo.' : 'Confira os dados e tente de novo.'};
        return {state:{code,note,rejected,message},outcome:reproduced ? 'reproduced' : undefined};
      }
    };
  }

  function support(id) {
    const exercise = window.sprintIncidentCases.suporte;
    return {
      screen:{title:'Consulta para suporte',context:'Procure BOL-999 e confira se a referência aparece no painel.'},
      create:() => ({code:'BOL-999'}),
      view:model => ({
        fields:[{id:'code',label:'Código do componente',type:'text',value:model.code}],
        actions:[{id:'lookup',label:'Consultar componente',primary:true}],
        details:model.status === 404 ? [{label:'Referência para o suporte',value:model.reference ?? 'Não exibida'}] : [],
        message:model.message
      }),
      interact(_model,_action,values) {
        const code = values.code.trim().toUpperCase();
        const request = requestFrom(exercise.probes[0]);
        request.path = request.path.replace(/[^/]+$/,encodeURIComponent(code));
        const response = exercise.respond(id,request);
        const reference = id === 'suporte-a' ? response.body?.correlationId : response.body?.correlacao;
        const reproduced = code === 'BOL-999' && response.status === 404 && !reference;
        const message = response.status === 200 ? {tone:'success',text:`Componente ${response.body.codigo} encontrado.`}
          : {tone:'error',text:response.status === 404 ? 'Componente não encontrado.' : 'Informe um código de componente válido.'};
        return {state:{code,status:response.status,reference,message},outcome:reproduced ? 'reproduced' : undefined};
      }
    };
  }

  function etag(id) {
    const exercise = window.sprintIncidentCases.etag;
    const previous = id === 'etag-b';
    const probe = exercise.probes.find(item => item.id === (previous ? 'antiga' : 'revalidar'));
    const version = previous ? 1 : 2;
    return {
      screen:{title:'Etiqueta do componente',context:'Reabra a etiqueta de BOL-101 e confira qual versão a tela apresenta.'},
      create:() => ({version,opened:false}),
      view:model => ({
        actions:[{id:'open',label:'Reabrir etiqueta',primary:true}],
        details:[{label:'Componente',value:'BOL-101'},{label:'Versão exibida',value:model.version ?? 'Sem dados'}],
        message:model.opened ? {tone:'error',text:model.version ? 'A tela ainda exibe a versão anterior da etiqueta.' : 'O detalhe da etiqueta desapareceu ao reabrir.'} : {tone:'info',text:'Dados da última consulta.'}
      }),
      interact(model) {
        const response = exercise.respond(id,requestFrom(probe));
        const visible = response.status === 304 ? (previous ? model.version : null) : response.body?.versao;
        const reproduced = response.status === 304 && visible !== 2;
        return {state:{version:visible,opened:true},outcome:reproduced ? 'reproduced' : undefined};
      }
    };
  }

  return {
    frontend:pagination('frontend'),backend:pagination('backend'),
    'validacao-a':validation('validacao-a'),'validacao-b':validation('validacao-b'),
    'suporte-a':support('suporte-a'),'suporte-b':support('suporte-b'),
    'etag-a':etag('etag-a'),'etag-b':etag('etag-b')
  };
})();

function visualEvidenceReady(id,run) {
  return !Object.hasOwn(visualExistingCases,id) || Boolean(run.visual?.reproduced);
}
