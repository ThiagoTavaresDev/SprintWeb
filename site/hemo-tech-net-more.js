(() => {
  const registros = {
    label:'Ministério da Saúde · Registros hemoterápicos',
    url:'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2026/prt11685_03_07_2026.html',
    description:'Consulte a seção Dos Registros do Anexo IV-B para situar a rastreabilidade das movimentações.'
  };
  const arquivo = 'hemoterapia/api/OficinaNetInicio.cs';
  const tecnologias = ['csharp','aspnet','efcore'];
  const verificar = id => `Em hemoterapia/api, rode dotnet run. Em outro terminal nessa pasta, execute node verificar-net.mjs ${id}. Para conferir a solução, reinicie a API com dotnet run -- --Hemo:Modo=referencia e repita o teste.`;
  const microsoft = (titulo, caminho, description) => ({label:`Microsoft Learn · ${titulo}`,url:`https://learn.microsoft.com/en-us/${caminho}`,description});

  window.hemoNetMoreMissions = [
    {
      id:'HNT-304', area:'estoque', title:'Entregue um DTO para o seletor de componentes', level:'essencial', minutes:20,
      description:'Um seletor precisa de código e rótulo, mas a API envia a ficha resumida do componente. Ajuste o JSON na projeção do EF Core.',
      technologies:tecnologias, file:arquivo,
      prerequisites:['Ler um GET e o JSON que ele devolve.','Reconhecer Select e OrderBy em LINQ.','Instanciar um record C# com argumentos.'],
      theory:[microsoft('Projetar as propriedades necessárias','ef/core/performance/efficient-querying#project-only-properties-you-need','Compare as colunas de uma entidade com as colunas de uma projeção no banco.'),registros],
      goal:'Em Opcoes, use Select no IQueryable para projetar OpcaoComponente. Monte o rótulo no formato código · tipo e mantenha a ordem por código antes de ToListAsync.',
      criteria:['GET /api/hemoterapia/oficina-net/opcoes responde 200 e traz os três componentes, ordenados por código.','Cada item tem apenas codigo e rotulo.','BOL-101 aparece com o rótulo BOL-101 · CH.'],
      example:{language:'csharp',code:'var consulta = db.Componentes.AsNoTracking().OrderBy(item => item.Codigo);\nvar opcoes = consulta.Select(item => new OpcaoComponente(item.Codigo, item.Codigo + " · " + item.Tipo));'},
      verify:verificar('HNT-304'),
      question:{
        prompt:'Em que ponto o Select reduz os campos consultados no banco?',
        choices:['No IQueryable, antes de ToListAsync.','Na lista criada por ToListAsync.','No CSS da tela.'], answer:0,
        feedback:['O EF Core consegue traduzir a projeção para SQL.','Nesse ponto a consulta já foi executada.','O CSS só afeta o que é exibido na interface.']
      }
    },
    {
      id:'HNT-305', area:'transfusao', title:'Leia o último recebimento pela relação do EF Core', level:'intermediario', minutes:30,
      description:'O painel de rastreabilidade mostra a data de cadastro como se fosse recebimento. Encontre o evento correto e represente a ausência com null.',
      technologies:tecnologias, file:arquivo,
      prerequisites:['Reconhecer uma relação de um para muitos.','Ordenar uma consulta por mais de um campo.','Usar FirstOrDefault e interpretar null num DTO.'],
      theory:[microsoft('Navegações de relacionamento','ef/core/modeling/relationships/navigations','Veja como a coleção Movimentos representa os registros ligados a cada componente.'),registros],
      goal:'Em Recebimentos, projete todos os componentes. Na coleção Movimentos, filtre o tipo recebido antes de ordenar por instante decrescente e desempatar por Id decrescente. Selecione o instante e use FirstOrDefault.',
      criteria:['GET /api/hemoterapia/oficina-net/recebimentos lista BOL-101, BOL-102 e BOL-103.','O instante de BOL-101 é 2026-10-01T11:00:00Z.','BOL-102 e BOL-103 continuam visíveis com recebidoEm igual a null.'],
      example:{language:'csharp',code:'var recebimentos = item.Movimentos.Where(movimento => movimento.Tipo == "recebido")\n    .OrderByDescending(movimento => movimento.Instante).ThenByDescending(movimento => movimento.Id);'},
      verify:verificar('HNT-305'),
      question:{
        prompt:'Onde filtrar a movimentação para manter os componentes sem recebimento?',
        choices:['No componente, removendo quem não tem o evento.','Na coleção Movimentos dentro da projeção de cada componente.','Na lista ordenada, escolhendo sempre o primeiro evento.'], answer:1,
        feedback:['Esse filtro removeria componentes que precisam continuar visíveis.','O componente fica na resposta e o recebimento pode ser nulo.','O evento mais recente pode ter outro tipo.']
      }
    },
    {
      id:'HNT-306', area:'integracao', title:'Aceite o reenvio da mesma importação sem duplicar', level:'avancado', minutes:40,
      description:'Uma integração perde a resposta e envia o mesmo vínculo de novo. Use a chave única do SQLite para diferenciar repetição e conflito, inclusive com chamadas simultâneas.',
      technologies:tecnologias, file:arquivo,
      prerequisites:['Usar SaveChangesAsync e ler DbUpdateException.','Entender chaves primárias e o estado de uma entidade no ChangeTracker.','Distinguir uma repetição idempotente de uma alteração da carga.'],
      theory:[microsoft('Chaves no EF Core','ef/core/modeling/keys','Confira por que uma chave identifica um registro e impede que duas linhas usem o mesmo código.'),microsoft('Entidades rastreadas','ef/core/change-tracking/','Veja quando uma entidade está adicionada ou desanexada do DbContext.'),registros],
      goal:'Em Importar, preserve a tentativa de inserir com a chave CodigoExterno. Se houver violação de unicidade, desanexe a tentativa e busque o registro persistido. Retorne 200 para o mesmo componente e 409 se o vínculo divergir.',
      criteria:['POST /api/hemoterapia/oficina-net/importacoes cria um vínculo com 201 e Location.','Dois envios simultâneos do mesmo vínculo recebem 201 e 200 e devolvem o mesmo corpo.','Repetir o código com outro componente devolve 409 e o GET mantém o vínculo original.'],
      example:{language:'csharp',code:'db.Entry(registro).State = EntityState.Detached;\nvar existente = await db.Importacoes.AsNoTracking()\n    .SingleAsync(item => item.CodigoExterno == registro.CodigoExterno, ct);'},
      verify:verificar('HNT-306'),
      question:{
        prompt:'O que impede que duas chamadas simultâneas criem o mesmo vínculo?',
        choices:['O tamanho máximo do código externo.','Um GET executado antes do POST.','A chave única imposta pelo banco no momento de gravar.'], answer:2,
        feedback:['Códigos iguais podem ter o mesmo tamanho e chegar juntos.','Duas chamadas podem ler que o registro ainda não existe.','O banco aceita uma gravação e a API resolve a repetição com base no registro salvo.']
      }
    },
    {
      id:'HNT-307', area:'vigilancia', title:'Filtre a auditoria em UTC sem repetir eventos', level:'intermediario', minutes:30,
      description:'Na troca de turno, um evento aparece em dois relatórios consecutivos. Normalize os fusos e filtre o intervalo com um limite final exclusivo.',
      technologies:tecnologias, file:arquivo,
      prerequisites:['Interpretar horários ISO 8601 com Z ou deslocamento.','Entender um intervalo com início inclusivo e fim exclusivo.','Compor um Where em uma consulta EF Core.'],
      theory:[microsoft('Interpretar datas com DateTimeOffset','dotnet/api/system.datetimeoffset.tryparseexact?view=net-10.0','Veja como aceitar formatos explícitos e trabalhar com o fuso informado.'),registros],
      goal:'Em Auditoria, normalize de e ate com OficinaNet.EmUtc. Responda 400 se um limite faltar, não tiver fuso ou for inválido, e se de for igual ou posterior a ate. Filtre no IQueryable com de inclusivo e ate exclusivo. A coluna desta oficina usa texto UTC com formato fixo, então a ordem textual coincide com a cronológica.',
      criteria:['GET /api/hemoterapia/oficina-net/auditoria aceita de e ate em ISO 8601 com fuso e precisão de segundos.','Das 06:00 no fuso -03:00 até 11:00Z, entram os eventos de 09:00Z e 10:00Z. O de 11:00Z fica fora.','Um intervalo válido sem movimentações retorna items vazio. Um intervalo inválido recebe 400.'],
      example:{language:'csharp',code:'var inicio = OficinaNet.EmUtc(de);\nvar fim = OficinaNet.EmUtc(ate);\nvar consulta = db.Movimentos.AsNoTracking().Where(item =>\n    string.Compare(item.Instante, inicio) >= 0 && string.Compare(item.Instante, fim) < 0);'},
      verify:verificar('HNT-307'),
      question:{
        prompt:'Em qual faixa entra o evento no instante em que dois turnos consecutivos se encontram?',
        choices:['No turno seguinte, que inclui o próprio instante inicial.','Nos dois turnos.','No turno anterior, que inclui o próprio fim.'], answer:0,
        feedback:['Com [de, ate), cada evento de fronteira aparece uma vez.','As duas faixas se sobreporiam nesse instante.','O limite final da consulta é exclusivo.']
      }
    },
    {
      id:'HNT-308', area:'vigilancia', title:'Reverta o dossiê quando o evento de auditoria falhar', level:'avancado', minutes:40,
      description:'O dossiê de conferência é salvo antes do evento inicial. Quando o banco rejeita a nota, a equipe encontra um dossiê incompleto. Torne as duas gravações atômicas.',
      technologies:tecnologias, file:arquivo,
      prerequisites:['Distinguir SaveChangesAsync e CommitAsync.','Entender uma transação com mais de uma gravação e o descarte assíncrono com await using.','Ler uma violação de restrição retornada pelo SQLite.'],
      theory:[microsoft('Transações no EF Core','ef/core/saving/transactions','Leia como envolver múltiplas chamadas a SaveChanges em uma transação que só confirma ao final.'),registros],
      goal:'Em CriarDossie, abra uma transação antes de OficinaNet.SalvarDossie. O fluxo existente grava o dossiê para obter seu Id e grava o evento associado. Confirme a transação antes do 201 e deixe a transação ser descartada sem confirmar em caso de falha.',
      criteria:['POST /api/hemoterapia/oficina-net/dossies com nota acima do limite didático de 80 caracteres retorna 422.','Após esse erro, o GET pelo código retorna 404 e o código pode ser usado novamente.','O reenvio com nota válida recebe 201 e o GET devolve um único evento associado ao dossiê.'],
      example:{language:'csharp',code:'await using var transacao = await db.Database.BeginTransactionAsync(ct);\nawait OficinaNet.SalvarDossie(db, codigo, nota, ct);\nawait transacao.CommitAsync(ct);'},
      verify:verificar('HNT-308'),
      question:{
        prompt:'Quando enviar 201 para a interface?',
        choices:['Quando o Id do dossiê for gerado pela primeira gravação.','Após salvar o dossiê e seu evento e confirmar a transação.','Assim que o corpo da requisição for recebido.'], answer:1,
        feedback:['A segunda gravação ainda pode falhar.','A resposta confirma que o par dossiê e evento foi persistido.','O recebimento do POST ainda não confirma persistência.']
      }
    }
  ];
})();
