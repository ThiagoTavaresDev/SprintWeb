'use strict';

(() => {
  const lineComment = String.raw`//[^\r\n]*`;
  const blockComment = String.raw`/\*[\s\S]*?(?:\*/|$)`;
  const doubleQuoted = String.raw`"(?:\\[^\r\n]|[^"\\\r\n])*"?`;
  const singleQuoted = String.raw`'(?:\\[^\r\n]|[^'\\\r\n])*'?`;
  const templateQuoted = String.raw`\x60(?:\\[\s\S]|[^\x60\\])*\x60?`;
  const jsonNumber = String.raw`-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?`;
  const number = String.raw`\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*)(?:\.[\d_]*)?(?:[eE][+-]?[\d_]+)?)n?\b`;
  const identifier = String.raw`[\p{ID_Start}_$][\p{ID_Continue}$\u200c\u200d]*`;
  const operator = String.raw`(?:===|!==|>>>|&&=|\|\|=|\?\?=|=>|==|!=|<>|<=|>=|\+\+|--|&&|\|\||\?\?|\?\.|\*\*|<<|>>|[+\-*/%&|^]=|[=+\-*/%&|!<>^~?:])`;
  const punctuation = String.raw`[{}[\]();,.]`;

  function tokenizer(rules, flags = 'gu') {
    return new RegExp(rules.map(([kind, pattern]) => `(?<${kind}>${pattern})`).join('|'), flags);
  }

  const jsKeywords = new Set('as async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch throw try typeof var void while with yield'.split(' '));
  const jsLiterals = new Set('true false null undefined NaN Infinity this'.split(' '));
  const jsTypes = new Set('Array BigInt Boolean Date Error Intl JSON Map Math Number Object Promise RegExp Set String Symbol URL URLSearchParams'.split(' '));
  const tsKeywords = new Set([...jsKeywords,...'abstract accessor asserts declare enum implements infer interface is keyof namespace out override private protected public readonly satisfies type unique unknown'.split(' ')]);
  const tsTypes = new Set([...jsTypes,...'any boolean never number object string symbol undefined void'.split(' ')]);
  const sqlKeywords = new Set('ADD ALL ALTER AND ANY AS ASC BEGIN BETWEEN BY CASE CAST CHECK COALESCE COLLATE COMMIT CONSTRAINT CONVERT CREATE CROSS DECLARE DEFAULT DELETE DESC DISTINCT DROP ELSE END EXEC EXECUTE EXISTS FETCH FIRST FOREIGN FROM FULL GROUP HAVING IN INDEX INNER INSERT INTO IS JOIN LEFT LIKE MERGE NEXT NOCOUNT NOT NULL OFFSET ON OR ORDER OUTER OUTPUT OVER PARTITION PRIMARY PROCEDURE REFERENCES RETURN RIGHT ROLLBACK ROW ROWS SELECT SET TABLE THEN TOP TRAN TRANSACTION TRUNCATE UNION UNIQUE UPDATE USE VALUES VIEW WHEN WHERE WHILE WITH'.split(' '));
  const sqlTypes = new Set('BIGINT BIT CHAR DATE DATETIME DATETIME2 DATETIMEOFFSET DECIMAL FLOAT INT MONEY NCHAR NUMERIC NVARCHAR REAL SMALLINT TIME TINYINT UNIQUEIDENTIFIER VARBINARY VARCHAR'.split(' '));
  const vfpKeywords = new Set('ACCEPT ADD ALLTRIM APPEND BROWSE CLOSE CONTINUE CREATE DELETE DELETED DISPLAY DO ELSE ENDCASE ENDDO ENDIF ENDPROC ENDSCAN ENDFUNC EXIT FOR FUNCTION IF INSERT INTO LPARAMETERS LOCAL LOOP LPARAMETER MODIFY ON OTHERWISE PARAMETERS PROCEDURE RECALL REPLACE RETURN SCAN SELECT SET SKIP STORE TABLE TO USE WHERE WITH'.split(' '));
  const csharpKeywords = new Set('as async await base bool break byte case catch char class const continue decimal default do double else enum event false finally float for foreach get if in init int interface is long namespace new null object out override params private protected public readonly record ref required return sealed set short static string struct switch this throw true try typeof using var virtual void while with'.split(' '));
  const regexpPrefixes = new Set(['(','[','{','=','=>',':',',',';','!','&&','||','??','?','return','case','throw','yield']);
  const regexpLiteral = /\/(?![/*])(?:\\[^\r\n]|\[(?:\\[^\r\n]|[^\]\\\r\n])*\]|[^/\\[\r\n])+\/[dgimsuvy]*/y;

  function quotedToken({value, after}) {
    return value.startsWith('"') && /^\s*:/.test(after) ? 'property' : 'string';
  }

  function scriptWord(keywords, literals = new Set(), types = new Set()) {
    return ({value, after, before}) => {
      if (before !== '.' && literals.has(value)) return 'literal';
      if (before !== '.' && keywords.has(value)) return 'keyword';
      if (types.has(value)) return 'type';
      if (/^\s*\(/.test(after)) return 'function';
      if (/^\s*:/.test(after)) return 'property';
      return '';
    };
  }

  const scriptTokens = tokenizer([
    ['comment', `${lineComment}|${blockComment}`],
    ['quote', `${doubleQuoted}|${singleQuoted}|${templateQuoted}`],
    ['number', number],
    ['identifier', identifier],
    ['operator', operator],
    ['punctuation', punctuation]
  ]);
  const sqlTokens = tokenizer([
    ['comment', String.raw`--[^\r\n]*|/\*[\s\S]*?(?:\*/|$)`],
    ['string', String.raw`N?'(?:''|[^'\r\n])*'?`],
    ['property', String.raw`\[(?:\]\]|[^\]\r\n])*\]?|"(?:""|[^"\r\n])*"?`],
    ['variable', `@@?${identifier}`],
    ['number', number],
    ['identifier', identifier],
    ['operator', operator],
    ['punctuation', punctuation]
  ]);
  const jsonTokens = tokenizer([
    ['quote', doubleQuoted],
    ['number', jsonNumber],
    ['literal', String.raw`\b(?:true|false|null)\b`],
    ['punctuation', String.raw`[{}[\]:,]`]
  ]);
  const httpTokens = tokenizer([
    ['keyword', String.raw`\b(?:GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS|CONNECT|TRACE|HTTP(?:/\d(?:\.\d)?)?)\b`],
    ['header', String.raw`^[ \t]*[A-Za-z][A-Za-z0-9-]*(?=:[ \t])`],
    ['url', String.raw`https?://[^\s"'<>{}[\]]+|/[\w][^\s"'<>{}[\]]*`],
    ['quote', doubleQuoted],
    ['literal', String.raw`\b(?:true|false|null)\b`],
    ['number', jsonNumber],
    ['punctuation', String.raw`[{}[\]:,]|→|←`]
  ], 'gmu');
  const vfpTokens = tokenizer([
    ['comment', String.raw`^[ \t]*\*[^\r\n]*|&&[^\r\n]*`],
    ['quote', `${doubleQuoted}|${singleQuoted}`],
    ['literal', String.raw`\.[TF]\.|\.NULL\.`],
    ['number', number],
    ['identifier', identifier],
    ['operator', operator],
    ['punctuation', punctuation]
  ], 'gimu');
  const htmlTokens = tokenizer([
    ['comment', String.raw`<!--[\s\S]*?(?:-->|$)`],
    ['tag', String.raw`</?[A-Za-z][\w:-]*|/?>`],
    ['keyword', String.raw`@(?:if|else|for|empty|switch|case|default|let|defer|placeholder|loading|error)\b`],
    ['quote', `${doubleQuoted}|${singleQuoted}`],
    ['property', String.raw`(?:\[\(?[\w.-]+\)?\]|\([\w.-]+\)|[A-Za-z][\w.:-]*)(?=\s*=)`],
    ['punctuation', String.raw`\{\{|\}\}|[{}=]`]
  ]);

  const languages = {
    js: {tokens:scriptTokens, classify:{quote:quotedToken,identifier:scriptWord(jsKeywords,jsLiterals,jsTypes)}},
    typescript: {tokens:scriptTokens, classify:{quote:quotedToken,identifier:scriptWord(tsKeywords,jsLiterals,tsTypes)}},
    html: {tokens:htmlTokens, classify:{quote:() => 'string',tag:() => 'keyword'}},
    json: {tokens:jsonTokens, classify:{quote:quotedToken}},
    sql: {tokens:sqlTokens, classify:{identifier:({value,after}) => {
      const word = value.toUpperCase();
      if (sqlKeywords.has(word)) return word === 'NULL' ? 'literal' : 'keyword';
      if (sqlTypes.has(word)) return 'type';
      return /^\s*\(/.test(after) ? 'function' : '';
    }}},
    http: {tokens:httpTokens, classify:{quote:quotedToken}},
    vfp: {tokens:vfpTokens, classify:{quote:quotedToken,identifier:({value,after}) => {
      if (vfpKeywords.has(value.toUpperCase())) return 'keyword';
      return /^\s*\(/.test(after) ? 'function' : '';
    }}},
    csharp: {tokens:scriptTokens, classify:{quote:quotedToken,identifier:scriptWord(csharpKeywords)}}
  };
  const aliases = {javascript:'js',ts:'typescript',tsql:'sql','t-sql':'sql',foxpro:'vfp','c#':'csharp'};
  const escaped = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  const editorStates = new WeakMap();
  const observed = new Set();
  const highContrast = window.matchMedia('(forced-colors: active)');
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    entries.forEach(({target}) => alignEditor(target));
  }) : null;

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g,char => escaped[char]);
  }

  function span(kind, value) {
    const text = escapeHtml(value);
    return kind ? `<span class="syntax-${kind}">${text}</span>` : text;
  }

  function canonicalLanguage(value) {
    const key = value.trim().toLowerCase();
    return Object.hasOwn(aliases,key) ? aliases[key] : key;
  }

  function diffLine(line) {
    if (/^(?:diff |index |@@|--- |\+\+\+ |<{7}|={7}|>{7})/.test(line)) return span('header',line);
    if (line.startsWith('+')) return span('added',line);
    if (line.startsWith('-')) return span('removed',line);
    return escapeHtml(line);
  }

  function highlight(text, language) {
    if (language === 'diff') return text.split('\n').map(diffLine).join('\n');
    if (!Object.hasOwn(languages,language)) return escapeHtml(text);
    const {tokens,classify} = languages[language];
    const output = [];
    let cursor = 0;
    let previous;
    tokens.lastIndex = 0;
    for (let match = tokens.exec(text); match; match = tokens.exec(text)) {
      let value = match[0];
      const group = Object.keys(match.groups).find(key => match.groups[key] !== undefined);
      let kind = classify[group]?.({value,after:text.slice(tokens.lastIndex),before:text[match.index - 1]}) ?? group;
      if ((language === 'js' || language === 'typescript') && value === '/' && (!previous || regexpPrefixes.has(previous))) {
        regexpLiteral.lastIndex = match.index;
        const literal = regexpLiteral.exec(text);
        if (literal) {
          kind = 'string';
          value = literal[0];
          tokens.lastIndex = regexpLiteral.lastIndex;
        }
      }
      output.push(escapeHtml(text.slice(cursor,match.index)),span(kind,value));
      cursor = tokens.lastIndex;
      if (kind !== 'comment') previous = value;
    }
    output.push(escapeHtml(text.slice(cursor)));
    return output.join('');
  }

  function updateScroll(editor) {
    const {mirror} = editorStates.get(editor);
    mirror.scrollTop = editor.scrollTop;
    mirror.scrollLeft = editor.scrollLeft;
  }

  function alignEditor(editor) {
    const state = editorStates.get(editor);
    if (!state) return;
    const {clientWidth,clientHeight,clientLeft,clientTop} = editor;
    state.mirror.style.width = `${clientWidth}px`;
    state.mirror.style.height = `${clientHeight}px`;
    state.mirror.style.left = `${clientLeft}px`;
    state.mirror.style.top = `${clientTop}px`;
    updateScroll(editor);
  }

  function syncEditor(editor) {
    const state = editorStates.get(editor);
    if (!state) return;
    if (state.value !== editor.value) {
      state.value = editor.value;
      const trailingLine = state.value.endsWith('\n') ? ' ' : '';
      state.mirror.innerHTML = highlight(state.value,state.language) + trailingLine;
    }
    alignEditor(editor);
  }

  function mountEditor(editor) {
    if (editorStates.has(editor)) {
      syncEditor(editor);
      return;
    }
    const language = canonicalLanguage(editor.dataset.language);
    if (!Object.hasOwn(languages,language)) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'syntax-editor';
    const mirror = document.createElement('pre');
    mirror.className = 'syntax-mirror';
    mirror.setAttribute('aria-hidden','true');
    if (editor.getAttribute('wrap') === 'off') wrapper.classList.add('syntax-no-wrap');
    const {scrollTop,scrollLeft} = editor;
    editor.before(wrapper);
    wrapper.append(mirror,editor);
    editorStates.set(editor,{mirror,language,value:null});
    editor.addEventListener('input',() => syncEditor(editor));
    editor.addEventListener('scroll',() => updateScroll(editor),{passive:true});
    if (observer) {
      observer.observe(editor);
      observed.add(editor);
    }
    editor.scrollTop = scrollTop;
    editor.scrollLeft = scrollLeft;
    syncEditor(editor);
  }

  function mount(root) {
    if (observer) {
      for (const editor of observed) {
        if (editor.isConnected) continue;
        observer.unobserve(editor);
        observed.delete(editor);
      }
    }
    root.querySelectorAll('pre code[data-language]').forEach(code => {
      const language = canonicalLanguage(code.dataset.language);
      code.innerHTML = highlight(code.textContent,language);
    });
    root.querySelectorAll('textarea.editor[data-language]').forEach(mountEditor);
  }

  highContrast.addEventListener?.('change',() => {
    for (const editor of observed) syncEditor(editor);
  });
  window.sprintSyntax = {mount,syncEditor};
})();
