
// ==========================================
// SUPABASE - PERSISTENCIA DE DADOS
// ==========================================
var SUPA_URL = 'https://cktsokalrtnxnqhnoukq.supabase.co';
var SUPA_KEY = 'sb_publishable_J4zbhqu8ok8GkEHTi477BA_zwsA3-vL';

function supaFetch(path, method, body) {
  method = method || 'GET';
  var opts = {
    method: method,
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(SUPA_URL + '/rest/v1/' + path, opts)
    .then(function(res) {
      if (!res.ok) return null;
      return res.text().then(function(t) { return t ? JSON.parse(t) : null; });
    })
    .catch(function(e) { console.log('Supabase error:', e); return null; });
}

// ── CARREGAR dados salvos do Supabase (motivos, backlog, metas)
function carregarDadosSalvos() {
  // Motivos
  supaFetch('tpv_motivos?select=*').then(function(data) {
    if (!data) return;
    data.forEach(function(m) {
      motivos[m.chave] = { exec: m.exec_nome, cat: m.categoria, text: m.texto };
    });
    renderTable();
    renderKPIs();
    renderPending();
  });

  // Backlog
  supaFetch('tpv_backlog?select=*').then(function(data) {
    if (!data) return;
    data.forEach(function(b) {
      backlogData[b.chave] = { etapa: b.etapa, motivo: b.motivo };
    });
  });

  // Metas gestor
  supaFetch('tpv_metas_gestor?select=*').then(function(data) {
    if (!data) return;
    data.forEach(function(m) {
      GESTOR_METAS[m.mes] = { metaMRR: parseFloat(m.meta_mrr)||0, metaOS: parseFloat(m.meta_os)||0 };
    });
  });

  // Metas time
  supaFetch('tpv_metas_time?select=*').then(function(data) {
    if (!data) return;
    data.forEach(function(m) {
      var exec = EXECUTIVOS.find(function(e) { return e.nome === m.executivo; });
      if (exec) {
        exec.metaMRR = parseFloat(m.meta_mrr) || exec.metaMRR;
        exec.metaOneShot = parseFloat(m.meta_oneshot) || exec.metaOneShot;
      }
    });
  });
}

// ── SALVAR motivo
function salvarMotivoSupabase(chave, exec, cat, text) {
  supaFetch('tpv_motivos?on_conflict=chave', 'POST', [{
    chave: chave, exec_nome: exec, categoria: cat, texto: text,
    updated_at: new Date().toISOString()
  }]);
}

// ── SALVAR backlog
function salvarBacklogSupabase(chave, etapa, motivo) {
  supaFetch('tpv_backlog?on_conflict=chave', 'POST', [{
    chave: chave, etapa: etapa, motivo: motivo,
    updated_at: new Date().toISOString()
  }]);
}

// ── SALVAR meta gestor
function salvarMetaGestorSupabase(mes, metaMRR, metaOS) {
  supaFetch('tpv_metas_gestor?on_conflict=mes', 'POST', [{
    mes: mes, meta_mrr: metaMRR, meta_os: metaOS,
    updated_at: new Date().toISOString()
  }]);
}

// ── SALVAR meta time
function salvarMetaTimeSupabase(executivo, mes, metaMRR, metaOneShot) {
  supaFetch('tpv_metas_time?on_conflict=executivo,mes', 'POST', [{
    executivo: executivo, mes: mes,
    meta_mrr: metaMRR, meta_oneshot: metaOneShot,
    updated_at: new Date().toISOString()
  }]);
}

// ── SALVAR casa (MRR, One Shot, edições do gestor)
function salvarCasaSupabase(row) {
  supaFetch('tpv_data?on_conflict=nome,mes', 'POST', [{
    nome: row.nome, mes: row.mes, executivo: row.executivo||'',
    informado: row.informado||0, real: row.real||0, momento: row.momento||0,
    mrr: row.mrr||0, oneshot: row.oneshot||0, status_impl: row.status_impl||'',
    updated_at: new Date().toISOString()
  }]);
}

// ── DELETAR casa
function deletarCasaSupabase(nome, mes) {
  supaFetch('tpv_data?nome=eq.' + encodeURIComponent(nome) + '&mes=eq.' + encodeURIComponent(mes), 'DELETE');
}

var allData = [];
var motivos = {};
var backlogData = {};


var MONTHS_ORDER = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

var EMBEDDED_DATA = [{"nome": "Choperia palmitense Lucas", "mes": "Janeiro", "executivo": "GUSTAVO MATHEUS", "informado": 500000.0, "real": 209992.17, "momento": 209992.17, "mrr": 2976.21, "oneshot": 2000.0, "status_impl": "IMPLANTADA"}, {"nome": "Choperia palmitense Sinop", "mes": "Janeiro", "executivo": "GUSTAVO MATHEUS", "informado": 500000.0, "real": 139825.01, "momento": 139825.01, "mrr": 4009.26, "oneshot": 11000.0, "status_impl": "IMPLANTADA"}, {"nome": "QUIOSQUE DO SOLON", "mes": "Janeiro", "executivo": "CHARLES CIPRIANO", "informado": 90000.0, "real": 163318.63, "momento": 163318.63, "mrr": 5635.69, "oneshot": 5200.0, "status_impl": "IMPLANTADA"}, {"nome": "Essepę", "mes": "Janeiro", "executivo": "KAIQUE OLIVEIRA", "informado": 120000.0, "real": 175724.59, "momento": 175724.59, "mrr": 5939.62, "oneshot": 8892.48, "status_impl": "IMPLANTADA"}, {"nome": "PARADA OBRIGATORIA", "mes": "Janeiro", "executivo": "GUSTAVO MATHEUS", "informado": 80000.0, "real": 51212.51, "momento": 51212.51, "mrr": 1736.23, "oneshot": 9400.0, "status_impl": "IMPLANTADA"}, {"nome": "Estancia Casa Na Arvore", "mes": "Janeiro", "executivo": "NATALIE STEFFANINI", "informado": 30000.0, "real": 27545.9, "momento": 27545.9, "mrr": 1136.78, "oneshot": 2800.0, "status_impl": "IMPLANTADA"}, {"nome": "Beco Bar Porto Velho", "mes": "Janeiro", "executivo": "NATALIE STEFFANINI", "informado": 150000.0, "real": 56917.5, "momento": 56917.5, "mrr": 2034.32, "oneshot": 5137.0, "status_impl": "IMPLANTADA"}, {"nome": "Caipirao Beer - Rio Preto", "mes": "Janeiro", "executivo": "RENATO PASSARETI", "informado": 250000.0, "real": 36391.48, "momento": 36391.48, "mrr": 1350.0, "oneshot": 10500.0, "status_impl": "IMPLANTADA"}, {"nome": "SANTO CHOPP CAIEIRAS", "mes": "Janeiro", "executivo": "NATALIE STEFFANINI", "informado": 90000.0, "real": 7935.35, "momento": 7935.35, "mrr": 800.0, "oneshot": 2700.0, "status_impl": "IMPLANTADA"}, {"nome": "The Vinil Pub", "mes": "Janeiro", "executivo": "KAIQUE OLIVEIRA", "informado": 80000.0, "real": 52553.22, "momento": 52553.22, "mrr": 1789.0, "oneshot": 4600.0, "status_impl": "IMPLANTADA"}, {"nome": "Mirante Atins", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 24882.7, "momento": 24882.7, "mrr": 750.0, "oneshot": 5000.0, "status_impl": ""}, {"nome": "Sushi Rancharia INT Atins", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 16532.08, "momento": 16532.08, "mrr": 750.0, "oneshot": 5000.0, "status_impl": ""}, {"nome": "Sushi Rancharia EXT Atins", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 1025.4, "momento": 1025.4, "mrr": 750.0, "oneshot": 5000.0, "status_impl": ""}, {"nome": "ÇA-VÁ RESTAURANTE ATINS", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 400000.0, "real": 90583.9, "momento": 90583.9, "mrr": 1757.46, "oneshot": 6000.0, "status_impl": ""}, {"nome": "BEACH BAR ATINS", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 600000.0, "real": 134801.51, "momento": 134801.51, "mrr": 2615.28, "oneshot": 19000.0, "status_impl": ""}, {"nome": "CERVEJARIA 4-6-2 BREWPUB", "mes": "Fevereiro", "executivo": "NATALIE STEFFANINI", "informado": 90000.0, "real": 73888.11, "momento": 73888.11, "mrr": 2475.34, "oneshot": 4400.0, "status_impl": ""}, {"nome": "BEBE E VAZA", "mes": "Fevereiro", "executivo": "NATALIE STEFFANINI", "informado": 150000.0, "real": 5853.06, "momento": 5853.06, "mrr": 850.47, "oneshot": 2144.0, "status_impl": ""}, {"nome": "Canto Gourmet", "mes": "Fevereiro", "executivo": "NATALIE STEFFANINI", "informado": 150000.0, "real": 81660.1, "momento": 81660.1, "mrr": 2029.15, "oneshot": 3188.0, "status_impl": ""}, {"nome": "CASTER CLUB - VILA FORMOSA", "mes": "Fevereiro", "executivo": "RENATO PASSARETI", "informado": 1000000.0, "real": 2063058.0, "momento": 2063058.0, "mrr": 15778.0, "oneshot": 37050.0, "status_impl": ""}, {"nome": "Queijaria", "mes": "Março", "executivo": "NATALIE STEFFANINI", "informado": 400000.0, "real": 372334.31, "momento": 372334.31, "mrr": 6292.67, "oneshot": 8400.0, "status_impl": "IMPLANTADA"}, {"nome": "Flamula", "mes": "Março", "executivo": "NATALIE STEFFANINI", "informado": 200000.0, "real": 123500.78, "momento": 123500.78, "mrr": 3861.01, "oneshot": 6360.0, "status_impl": "IMPLANTADA"}, {"nome": "ESQUINA BAR BRASA MUSICA E AMIGOS", "mes": "Março", "executivo": "NATALIE STEFFANINI", "informado": 50000.0, "real": 102.0, "momento": 102.0, "mrr": 91.93, "oneshot": 4898.0, "status_impl": "IMPLANTADA"}, {"nome": "Ginástico Club", "mes": "Março", "executivo": "NATALIE STEFFANINI", "informado": 70000.0, "real": 72800.17, "momento": 72800.17, "mrr": 2500.96, "oneshot": 3245.0, "status_impl": "IMPLANTADA"}, {"nome": "Primeira Saida Bar e Restaurante", "mes": "Março", "executivo": "KAIQUE OLIVEIRA", "informado": 200000.0, "real": 78048.29, "momento": 78048.29, "mrr": 2221.88, "oneshot": 9500.0, "status_impl": "IMPLANTADA"}, {"nome": "Siri Jack", "mes": "Março", "executivo": "KAIQUE OLIVEIRA", "informado": 180000.0, "real": 111238.43, "momento": 111238.43, "mrr": 2439.82, "oneshot": 5125.0, "status_impl": "IMPLANTADA"}, {"nome": "Bar Da Lora", "mes": "Março", "executivo": "KAIQUE OLIVEIRA", "informado": 120000.0, "real": 242699.63, "momento": 242699.63, "mrr": 7186.39, "oneshot": 5300.0, "status_impl": "IMPLANTADA"}, {"nome": "Primavera Bar e Restaurante", "mes": "Março", "executivo": "CHARLES CIPRIANO", "informado": 75000.0, "real": 48605.49, "momento": 48605.49, "mrr": 1676.98, "oneshot": 12700.0, "status_impl": "IMPLANTADA"}, {"nome": "Ministerios palavra da vida", "mes": "Março", "executivo": "GUSTAVO MATHEUS", "informado": 70000.0, "real": 62333.33, "momento": 62333.33, "mrr": 1496.02, "oneshot": 5500.0, "status_impl": "IMPLANTADA"}, {"nome": "Beco- Bebidas e Comidas", "mes": "Março", "executivo": "GUSTAVO MATHEUS", "informado": 50000.0, "real": 24242.0, "momento": 24242.0, "mrr": 800.1, "oneshot": 1480.0, "status_impl": "IMPLANTADA"}, {"nome": "Show Bar", "mes": "Março", "executivo": "KAIQUE OLIVEIRA", "informado": 300000.0, "real": 297540.65, "momento": 297540.65, "mrr": 9848.81, "oneshot": 9800.0, "status_impl": "IMPLANTADA"}, {"nome": "Tayo Sushi", "mes": "Março", "executivo": "GUSTAVO MATHEUS", "informado": 70000.0, "real": 72094.63, "momento": 72094.63, "mrr": 2451.31, "oneshot": 3150.0, "status_impl": "IMPLANTADA"}, {"nome": "Restaurante JN", "mes": "Março", "executivo": "IGOR LUIS", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 3280.0, "status_impl": "IMPLANTADA"}, {"nome": "Rocket Vaquejada", "mes": "Março", "executivo": "RENATO PASSARETI", "informado": 600000.0, "real": 465070.84, "momento": 465070.84, "mrr": 6459.83, "oneshot": 7500.0, "status_impl": "IMPLANTADA"}, {"nome": "FOGO E LENHA", "mes": "Abril", "executivo": "KAIQUE OLIVEIRA", "informado": 40000.0, "real": 15622.0, "momento": 15622.0, "mrr": 494.71, "oneshot": 1950.0, "status_impl": "IMPLANTADA"}, {"nome": "CABANA DA MARA", "mes": "Abril", "executivo": "KAIQUE OLIVEIRA", "informado": 40000.0, "real": 3832.65, "momento": 3832.65, "mrr": 128.8, "oneshot": 1950.0, "status_impl": "IMPLANTADA"}, {"nome": "O VARAL", "mes": "Abril", "executivo": "KAIQUE OLIVEIRA", "informado": 150000.0, "real": 77363.77, "momento": 77363.77, "mrr": 2486.55, "oneshot": 6000.0, "status_impl": "IMPLANTADA"}, {"nome": "MONTANHA CG", "mes": "Abril", "executivo": "KAIQUE OLIVEIRA", "informado": 50000.0, "real": 2525.52, "momento": 2525.52, "mrr": 83.31, "oneshot": 10000.0, "status_impl": "IMPLANTADA"}, {"nome": "SANTA MONICA TABOĂO", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 150000.0, "real": 2744.0, "momento": 2744.0, "mrr": 91.93, "oneshot": 8739.0, "status_impl": "IMPLANTADA"}, {"nome": "BEACH CHOPP", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 35000.0, "real": 10094.69, "momento": 10094.69, "mrr": 345.28, "oneshot": 6180.0, "status_impl": "IMPLANTADA"}, {"nome": "CASA ARTESANO", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 90000.0, "real": 4550.71, "momento": 4550.71, "mrr": 158.84, "oneshot": 5157.0, "status_impl": "IMPLANTADA"}, {"nome": "JS LOUNGE", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 40000.0, "real": 12941.0, "momento": 12941.0, "mrr": 455.55, "oneshot": 4529.0, "status_impl": "IMPLANTADA"}, {"nome": "LARGO DA CHOSEN", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 200000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 3825.0, "status_impl": "IMPLANTADA"}, {"nome": "BAR DO NATANZIN", "mes": "Abril", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 3000.0, "status_impl": "IMPLANTADA"}, {"nome": "DON BUTEKO", "mes": "Abril", "executivo": "CHARLES CIPRIANO", "informado": 80000.0, "real": 94571.14, "momento": 94571.14, "mrr": 2423.11, "oneshot": 3250.0, "status_impl": "IMPLANTADA"}, {"nome": "VILA MOURAN", "mes": "Abril", "executivo": "CHARLES CIPRIANO", "informado": 80000.0, "real": 57957.1, "momento": 57957.1, "mrr": 1954.82, "oneshot": 8050.0, "status_impl": "IMPLANTADA"}, {"nome": "ESPAÇO VITORIA", "mes": "Abril", "executivo": "IGOR LUIS", "informado": 150000.0, "real": 33575.1, "momento": 33575.1, "mrr": 651.43, "oneshot": 6995.0, "status_impl": "IMPLANTADA"}, {"nome": "DL SERVIÇOS", "mes": "Abril", "executivo": "IGOR LUIS", "informado": 250000.0, "real": 65161.86, "momento": 65161.86, "mrr": 1420.97, "oneshot": 3000.0, "status_impl": ""}, {"nome": "Bilhares Carvalho", "mes": "Abril", "executivo": "GUSTAVO MATHEUS", "informado": 50000.0, "real": 14152.54, "momento": 14152.54, "mrr": 484.05, "oneshot": 4550.0, "status_impl": ""}, {"nome": "Duda BEER HOUSE", "mes": "Abril", "executivo": "GUSTAVO MATHEUS", "informado": 50000.0, "real": 18469.52, "momento": 18469.52, "mrr": 618.75, "oneshot": 3700.0, "status_impl": ""}, {"nome": "PLUR ARENA", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 30000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "CAIANAS GASTROBAR", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 100000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "ATINS BEACH BAR", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 40000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "AKI ESPETO (GRU)", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 150000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "VILA BEACH", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 250000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "SHAKE N STIR BAR", "mes": "Maio", "executivo": "RENATO PASSARETI", "informado": 400000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "Nissin Miojolandia", "mes": "Maio", "executivo": "NATALIE STEFFANINI", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "ITA PARK EMPREENDIMENTOS E DIVERÇĂO", "mes": "Maio", "executivo": "NATALIE STEFFANINI", "informado": 300000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "PIRATA BAR", "mes": "Maio", "executivo": "NATALIE STEFFANINI", "informado": 250000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "QUINTAL SANTA LUZIA MG", "mes": "Maio", "executivo": "CHARLES CIPRIANO", "informado": 75000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "ATINS CHARME CHALES BA", "mes": "Maio", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "LAGO AZUL ACQUA PARK", "mes": "Maio", "executivo": "GUSTAVO MATHEUS", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "MEXE CLUB", "mes": "Maio", "executivo": "GUSTAVO MATHEUS", "informado": 300000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "SERIGUELA RESTAURANTE", "mes": "Maio", "executivo": "GUSTAVO MATHEUS", "informado": 75000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}];
var barInst = null, donutInst = null, lineInst = null, line2Inst = null;
var editKey = '';
var diasPassados = 0;
var diasTotais   = 30;
var pctPeriodo   = 0;  // 0..1


// ── DATE CALC
function updateDateCalc() {
  var inicio = document.getElementById('dt-inicio').value;
  var hoje   = document.getElementById('dt-hoje').value;
  var fim    = document.getElementById('dt-fim').value;
  if (!inicio || !hoje || !fim) return;
  var dI = new Date(inicio), dH = new Date(hoje), dF = new Date(fim);
  diasTotais   = Math.max(1, Math.round((dF - dI) / 86400000) + 1);
  diasPassados = Math.max(1, Math.round((dH - dI) / 86400000) + 1);
  diasPassados = Math.min(diasPassados, diasTotais);
  pctPeriodo   = diasPassados / diasTotais;

  document.getElementById('dias-passados').textContent = diasPassados;
  document.getElementById('dias-totais').textContent   = diasTotais;
  document.getElementById('pct-periodo').textContent   = Math.round(pctPeriodo * 100) + '%';
  document.getElementById('prog-label').textContent    = Math.round(pctPeriodo * 100) + '%';
  document.getElementById('prog-bar').style.width      = Math.min(pctPeriodo * 100, 100) + '%';

  renderAll();
}

// projection: at current daily pace, what will realizado be at end of period?
function projecao(r) {
  if (diasPassados <= 0) return r.momento;
  var diario = r.momento / diasPassados;
  return diario * diasTotais;
}

// % vs meta parcial: realizado vs (hubspot * pctPeriodo)
function pctParcial(r) {
  var metaParcial = r.informado * pctPeriodo;
  return metaParcial > 0 ? r.momento / metaParcial : 0;
}

// status based on pace (are they on track for the full period?)
function statusPace(r) {
  var proj = projecao(r);
  var p    = proj / r.informado;
  return p >= 0.8 ? 'ok' : p >= 0.5 ? 'warn' : 'danger';
}

// ── FORMAT
var fmtMoney = v => 'R$ ' + Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});
var fmtPct   = v => Math.round(v*100) + '%';
var pctVal   = (a,b) => b>0 ? (a/b) : 0;
var pctReal  = r => pctVal(r.momento, r.informado);
var getStatus = p => p>=.8?'ok':p>=.5?'warn':'danger';
var barClr   = p => p>=.8?'#16A34A':p>=.5?'#D97706':'#DC2626';

// ── UPLOAD
function triggerUpload() { document.getElementById('file-input').click(); }
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag');
  var f = e.dataTransfer.files[0];
  if(f) processFile(f);
}
function handleFile(inp) { if(inp.files[0]) processFile(inp.files[0]); inp.value=''; }
function processFile(f) {
  var reader = new FileReader();
  reader.onload = e => {
    var wb = XLSX.read(e.target.result, {type:'array'});
    var ws = wb.Sheets[wb.SheetNames[0]];
    var raw = XLSX.utils.sheet_to_json(ws, {defval:''});
    parseData(raw);
  };
  reader.readAsArrayBuffer(f);
}

// ── EXEC NAME NORMALIZATION
var EXEC_NAME_MAP = {
  'MILENA':           'MILENA SANTOS',
  'NATALIE':          'NATALIE STEFFANINI',
  'KAIQUE':           'KAIQUE OLIVEIRA',
  'GUSTAVO':          'GUSTAVO MATHEUS',
  'IGOR LUIS':        'IGOR LUIS',
  'IGOR':             'IGOR LUIS',
  'RENATO':           'RENATO PASSARETI',
  'RENATO PASSARETI': 'RENATO PASSARETI',
  'CHARLES':          'CHARLES CIPRIANO',
  'CHARLES CIPRIANO': 'CHARLES CIPRIANO',
  'MILENA SANTOS':       'MILENA SANTOS',
  'NATALIE STEFFANINI':  'NATALIE STEFFANINI',
  'KAIQUE OLIVEIRA':     'KAIQUE OLIVEIRA',
  'GUSTAVO MATHEUS':     'GUSTAVO MATHEUS',
};
function normalizeExec(raw) {
  if (!raw) return '';
  var up = raw.trim().toUpperCase();
  return EXEC_NAME_MAP[up] || raw.trim();
}

function parseData(raw) {
  if(!raw.length){ toast('Planilha vazia ou formato inválido.'); return; }
  var keys = Object.keys(raw[0]).map(k=>k.toLowerCase().trim());
  var findKey = (terms) => {
    var k = Object.keys(raw[0]).find(k => terms.some(t => k.toLowerCase().includes(t)));
    return k || null;
  };
  var kNome = findKey(['nome','estabelecimento','store']);
  var kMes  = findKey(['mês','mes','month','competencia']);
  var kInf  = findKey(['informado']);
  var kReal = findKey(['real']) ;
  var kMom  = findKey(['realizado','momento','acumulado']);
  if(!kNome||!kMes||!kInf){ toast('⚠ Colunas não identificadas. Verifique: Nome | Mês | TPV Hubspot | TPV Real | TPV Realizado'); return; }
  var kExec = findKey(['executivo','exec','responsavel','vendedor']);
  var kMrr  = findKey(['mrr','recorrente']);
  var kOs   = findKey(['one shot','oneshot','one-shot']);
  var cleanNum = v => parseFloat(String(v||'0').replace(/[^\d.,]/g,'').replace(',','.')) || 0;
  allData = raw.map(r=>({
    nome:      String(r[kNome]||'').trim(),
    mes:       String(r[kMes]||'').trim(),
    executivo: kExec ? normalizeExec(String(r[kExec]||'').trim()) : '',
    informado: cleanNum(r[kInf]),
    real:      kReal ? cleanNum(r[kReal]) : 0,
    momento:   kMom  ? cleanNum(r[kMom])  : 0,
    mrr:       kMrr  ? cleanNum(r[kMrr])  : 0,
    oneshot:   kOs   ? cleanNum(r[kOs])   : 0,
  })).filter(r=>r.nome&&r.mes);
  initDashboard();
  // Save newly uploaded data to Supabase
  if (typeof saveAllDataToSupabase === 'function') saveAllDataToSupabase();
}

// ── DEMO DATA
function loadDemo(e) {
  e && e.stopPropagation();
  allData = [...EMBEDDED_DATA];
  initDashboard();
  if (typeof saveAllDataToSupabase === 'function') saveAllDataToSupabase();
}

function parseData(raw) {
  if(!raw.length){ toast('Planilha vazia ou formato inválido.'); return; }
  var keys = Object.keys(raw[0]).map(k=>k.toLowerCase().trim());
  var findKey = (terms) => {
    var k = Object.keys(raw[0]).find(k => terms.some(t => k.toLowerCase().includes(t)));
    return k || null;
  };
  var kNome = findKey(['nome','estabelecimento','store']);
  var kMes  = findKey(['mês','mes','month','competencia']);
  var kInf  = findKey(['informado']);
  var kReal = findKey(['real']) ;
  var kMom  = findKey(['realizado','momento','acumulado']);
  if(!kNome||!kMes||!kInf){ toast('⚠ Colunas não identificadas. Verifique: Nome | Mês | TPV Hubspot | TPV Real | TPV Realizado'); return; }
  var kExec = findKey(['executivo','exec','responsavel','vendedor']);
  var kMrr  = findKey(['mrr','recorrente']);
  var kOs   = findKey(['one shot','oneshot','one-shot']);
  var cleanNum = v => parseFloat(String(v||'0').replace(/[^\d.,]/g,'').replace(',','.')) || 0;
  allData = raw.map(r=>({
    nome:      String(r[kNome]||'').trim(),
    mes:       String(r[kMes]||'').trim(),
    executivo: kExec ? normalizeExec(String(r[kExec]||'').trim()) : '',
    informado: cleanNum(r[kInf]),
    real:      kReal ? cleanNum(r[kReal]) : 0,
    momento:   kMom  ? cleanNum(r[kMom])  : 0,
    mrr:       kMrr  ? cleanNum(r[kMrr])  : 0,
    oneshot:   kOs   ? cleanNum(r[kOs])   : 0,
  })).filter(r=>r.nome&&r.mes);
  initDashboard();
  // Save newly uploaded data to Supabase
  if (typeof saveAllDataToSupabase === 'function') saveAllDataToSupabase();
}

// ── DEMO DATA


// ── INIT
function initDashboard() {
  document.getElementById('upload-zone').style.display = 'none';
  document.getElementById('dashboard').style.display   = 'block';
  var months = [...new Set(allData.map(d=>d.mes))].sort((a,b)=>{
    var ai = MONTHS_ORDER.indexOf(a), bi = MONTHS_ORDER.indexOf(b);
    return (ai<0?99:ai)-(bi<0?99:bi);
  });
  currentMonth = months[0];
  buildMonthChips(months);
  renderAll();
  renderEvo();
  renderPending();
  toast('✅ Dados carregados — ' + allData.length + ' registros');
}

function buildMonthChips(months) {
  // Global month bar — shown on all tabs
  var allActive = currentMonth === 'TODOS';
  document.getElementById('global-month-chips').innerHTML =
    `<button class="gmonth-chip${allActive?' active':''}" onclick="globalSelectMonth('TODOS',this)" style="font-weight:700;">Todos</button>` +
    months.map(m=>
      `<button class="gmonth-chip${m===currentMonth?' active':''}" onclick="globalSelectMonth('${m}',this)">${m}</button>`
    ).join('');
}

function globalSelectMonth(m, el) {
  currentMonth = m;
  document.querySelectorAll('.gmonth-chip').forEach(c=>c.classList.remove('active'));
  if(el) el.classList.add('active');

  if (m === 'TODOS') {
    // Hide date bar — not applicable for all months
    document.getElementById('date-bar').style.display = 'none';
    diasPassados = 1; diasTotais = 1; pctPeriodo = 1;
  } else {
    document.getElementById('date-bar').style.display = '';
    var monthMap = {'Janeiro':1,'Fevereiro':2,'Março':3,'Abril':4,'Maio':5,'Junho':6,'Julho':7,'Agosto':8,'Setembro':9,'Outubro':10,'Novembro':11,'Dezembro':12};
    var mIdx = monthMap[m] || 1;
    var today = new Date();
    var yy = today.getFullYear();
    // Período de apuração = mês SEGUINTE
    var apIdx2 = mIdx + 1;
    var apYY2  = yy;
    if (apIdx2 > 12) { apIdx2 = 1; apYY2 += 1; }
    var apStr2   = String(apIdx2).padStart(2,'0');
    var lastDay  = new Date(apYY2, apIdx2, 0).getDate();
    var todayDD  = String(today.getDate()).padStart(2,'0');
    var todayMM  = String(today.getMonth()+1).padStart(2,'0');
    document.getElementById('dt-inicio').value = apYY2+'-'+apStr2+'-01';
    document.getElementById('dt-fim').value    = apYY2+'-'+apStr2+'-'+String(lastDay).padStart(2,'0');
    if (todayMM === apStr2 && today.getFullYear() === apYY2) {
      document.getElementById('dt-hoje').value = apYY2+'-'+todayMM+'-'+todayDD;
    } else if (apIdx2 < today.getMonth()+1) {
      document.getElementById('dt-hoje').value = apYY2+'-'+apStr2+'-'+String(lastDay).padStart(2,'0');
    } else {
      document.getElementById('dt-hoje').value = apYY2+'-'+apStr2+'-01';
    }
    updateDateCalc();
  }
  renderAll();
  renderEvo();
  renderPending();
  renderBacklog();
  renderComissoes();
}

function selectMonth(m, el) {
  globalSelectMonth(m, null);
  document.querySelectorAll('.gmonth-chip').forEach(c=>c.classList.toggle('active', c.textContent===m));
}

// ── MONTH DATA
function getMonthRows() {
  if (currentMonth === 'TODOS') return allData;
  return allData.filter(d=>d.mes===currentMonth);
}
function getFiltered() {
  var rows = getMonthRows();
  var q   = document.getElementById('search').value.toLowerCase();
  var st  = document.getElementById('filter-status').value;
  var srt = document.getElementById('sort-by').value;
  if(q) rows = rows.filter(r=>r.nome.toLowerCase().includes(q));
  var fe = (document.getElementById('filter-exec') ? document.getElementById('filter-exec').value : '')||'';
  if(fe) rows = rows.filter(r=>r.executivo===fe);
  if(st) rows = rows.filter(r=>getStatus(pctReal(r))===st);
  rows = [...rows].sort((a,b)=>{
    var pa=pctReal(a), pb=pctReal(b);
    if(srt==='pct-desc') return pb-pa;
    if(srt==='pct-asc')  return pa-pb;
    if(srt==='gap-desc') return (b.informado-b.real)-(a.informado-a.real);
    return a.nome.localeCompare(b.nome,'pt-BR');
  });
  return rows;
}

// ── KPIs
function renderKPIs() {
  var rows = getMonthRows();
  if(!rows.length) return;
  var totInf  = rows.reduce((s,r)=>s+r.informado,0);
  var totReal = rows.reduce((s,r)=>s+r.real,0);
  var totMom  = rows.reduce((s,r)=>s+r.momento,0);
  var pGeral  = pctVal(totMom,totInf);
  // period-aware
  var metaParcialTotal = totInf * (pctPeriodo || 1);
  var pParcial = metaParcialTotal > 0 ? totMom / metaParcialTotal : pGeral;
  var nOk     = rows.filter(r=>projecao(r)/r.informado>=.8).length;
  var nCrit   = rows.filter(r=>projecao(r)/r.informado<.5).length;
  var gap     = totInf - totReal;
  var nPend   = rows.filter(r=>pctReal(r)<.8&&!((motivos[currentMonth+'|'+r.nome] ? motivos[currentMonth+'|'+r.nome].text : null))).length;
  var totProj = rows.reduce((s,r)=>s+projecao(r),0);

  var mesLabel = currentMonth === 'TODOS' ? 'Todos os meses' : currentMonth;
  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card blue">
      <div class="kpi-label">% vs Meta Parcial</div>
      <div class="kpi-value" style="color:${pParcial>=1?'var(--green)':pParcial>=.7?'var(--amber)':'var(--red)'}">${fmtPct(pParcial)}</div>
      <div class="kpi-sub">Realizado vs esperado no período</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Projeção no ritmo atual</div>
      <div class="kpi-value" style="font-size:17px">${fmtMoney(totProj)}</div>
      <div class="kpi-sub">${fmtPct(pctVal(totProj,totInf))} do TPV Hubspot</div>
    </div>
    <div class="kpi-card teal">
      <div class="kpi-label">Realizado até hoje</div>
      <div class="kpi-value" style="font-size:17px">${fmtMoney(totMom)}</div>
      <div class="kpi-sub">${fmtPct(pctVal(totMom,totInf))} do Hubspot</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">No ritmo — vão bater</div>
      <div class="kpi-value">${nOk} <span style="font-size:14px;font-weight:400;color:var(--gray-400)">/ ${rows.length}</span></div>
      <div class="kpi-sub">Projeção ≥ 80% da meta</div>
    </div>
    <div class="kpi-card red">
      <div class="kpi-label">Fora do ritmo</div>
      <div class="kpi-value">${nCrit}</div>
      <div class="kpi-sub">Projeção < 50% — crítico</div>
    </div>
  `;
}

// ── CHARTS
function renderBarChart() {
  var rows = [...getMonthRows()].sort((a,b)=>pctReal(b)-pctReal(a));
  var labels = rows.map(r=>r.nome.length>20?r.nome.slice(0,20)+'…':r.nome);
  var values = rows.map(r=>Math.round(pctReal(r)*100));
  var colors = rows.map(r=>barClr(pctReal(r)));
  var h = Math.max(220, rows.length*28+60);
  document.getElementById('bar-wrap').style.height = h+'px';
  if(barInst) barInst.destroy();
  barInst = new Chart(document.getElementById('barChart'), {
    type:'bar',
    data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderRadius:4, borderSkipped:false }]},
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:c=>c.raw+'%' }}},
      scales:{
        x:{ min:0, max:120, ticks:{ callback:v=>v+'%', font:{size:10} }, grid:{color:'rgba(0,0,0,.05)'}},
        y:{ ticks:{ font:{size:11}, autoSkip:false }}
      }
    }
  });
}

function renderDonut() {
  var rows = getMonthRows();
  var ok   = rows.filter(r=>pctReal(r)>=.8).length;
  var warn = rows.filter(r=>{ var p=pctReal(r); return p>=.5&&p<.8; }).length;
  var bad  = rows.filter(r=>pctReal(r)<.5).length;
  if(donutInst) donutInst.destroy();
  donutInst = new Chart(document.getElementById('doughnutChart'),{
    type:'doughnut',
    data:{ labels:['Acima 80%','50–80%','Abaixo 50%'], datasets:[{ data:[ok,warn,bad], backgroundColor:['#16A34A','#D97706','#DC2626'], borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{legend:{display:false}} }
  });
  document.getElementById('donut-legend').innerHTML = [
    ['#16A34A','Acima de 80%',ok],['#D97706','50–80%',warn],['#DC2626','Abaixo de 50%',bad]
  ].map(([c,l,n])=>`<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--gray-600)"><span style="width:10px;height:10px;border-radius:2px;background:${c};display:inline-block;flex-shrink:0"></span><span style="flex:1">${l}</span><strong>${n}</strong></div>`).join('');
}

// ── TABLE
function renderTable() {
  // Show/hide Mês column based on filter
  var thMes = document.getElementById('th-mes');
  if (thMes) thMes.style.display = currentMonth === 'TODOS' ? '' : 'none';
  var rows = getFiltered();
  document.getElementById('table-count').textContent = rows.length + ' registros';
  document.getElementById('table-body').innerHTML = rows.map(r=>{
    var p   = pctReal(r);
    var pR  = Math.round(p*100);
    var s   = getStatus(p);
    var key = currentMonth+'|'+r.nome;
    var m   = motivos[key];
    var bdg = s==='ok' ? `<span class="badge badge-ok" style="background:#16a34a;color:white;font-size:11px;padding:4px 12px;">✅ No ritmo</span>` : s==='warn' ? `<span class="badge badge-warn">⚠ Atenção</span>` : `<span class="badge badge-danger">🔴 Crítico</span>`;
    var rowBg = s==='ok' ? 'background:#f0fdf4;' : s==='warn' ? 'background:#fffbeb;' : 'background:#fff5f5;';
    var nameEsc = r.nome.replace(/'/g,"\\'");
    var motHtml = m && m.text
      ? `<span class="motivo-text" title="${m.text}">${m.text}</span><span class="motivo-exec">${m.exec||''} · ${m.cat||''}</span><button class="btn-edit" onclick="openMotivo('${nameEsc}',${pR})"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Editar</button>`
      : `<button class="btn-edit" onclick="openMotivo('${nameEsc}',${pR})"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>${s!=='ok'?'Registrar motivo':'OK'}</button>`;
    return `<tr style="${rowBg}">
      ${currentMonth==='TODOS'?`<td><span style="font-size:11px;font-weight:600;background:var(--blue-lt);color:var(--blue);padding:2px 8px;border-radius:99px;white-space:nowrap">${r.mes}</span></td>`:''}
      <td class="td-name">${r.nome}</td>
      ${currentMonth==='TODOS'?`<td style="font-size:11px;font-weight:600;color:var(--navy)">${(r.executivo||'—').split(' ').map(w=>w.charAt(0)+w.slice(1).toLowerCase()).join(' ')}</td>`:''}
      <td class="td-money">${fmtMoney(r.informado)}</td>
      <td class="td-money">${fmtMoney(r.real)}</td>
      <td class="td-money">${fmtMoney(r.momento)}</td>
      <td><div class="pct-wrap"><div class="pct-bar-bg"><div class="pct-bar" style="width:${Math.min(pR,100)}%;background:${barClr(p)}"></div></div><span class="pct-label" style="color:${barClr(p)}">${pR}%</span></div></td>
      <td>${bdg}</td>
      <td class="motivo-cell">${motHtml}</td>
    </tr>`;
  }).join('');
}

// ── EVOLUÇÃO ANUAL
function renderEvo() {
  var months = [...new Set(allData.map(d=>d.mes))].sort((a,b)=>(MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99));
  var avgPct  = months.map(m=>{ var rows=allData.filter(d=>d.mes===m); return rows.length ? Math.round(rows.reduce((s,r)=>s+pctReal(r),0)/rows.length*100) : 0; });
  var totInf  = months.map(m=>allData.filter(d=>d.mes===m).reduce((s,r)=>s+r.informado,0));
  var totReal = months.map(m=>allData.filter(d=>d.mes===m).reduce((s,r)=>s+r.real,0));
  var totMom  = months.map(m=>allData.filter(d=>d.mes===m).reduce((s,r)=>s+r.momento,0));
  var lbls    = months.map(m=>m.slice(0,3));

  if(lineInst) lineInst.destroy();
  lineInst = new Chart(document.getElementById('lineChart'),{
    type:'line',
    data:{ labels:lbls, datasets:[{ label:'% Médio', data:avgPct, borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,.08)', pointBackgroundColor:'#2563EB', borderWidth:2.5, pointRadius:4, tension:.35, fill:true }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw+'%'}}}, scales:{ y:{min:0,max:120,ticks:{callback:v=>v+'%',font:{size:10}}}, x:{ticks:{font:{size:10}}} }}
  });

  if(line2Inst) line2Inst.destroy();
  line2Inst = new Chart(document.getElementById('lineChart2'),{
    type:'line',
    data:{ labels:lbls, datasets:[
      { label:'Informado', data:totInf, borderColor:'#94A3B8', backgroundColor:'transparent', borderWidth:2, borderDash:[4,4], pointRadius:3, tension:.3 },
      { label:'Real',      data:totReal, borderColor:'#2563EB', backgroundColor:'transparent', borderWidth:2.5, pointRadius:4, tension:.3 },
      { label:'Realizado', data:totMom, borderColor:'#0D9488', backgroundColor:'rgba(13,148,136,.08)', borderWidth:2, pointRadius:4, tension:.3, fill:true }
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:true, position:'top', labels:{font:{size:11},boxWidth:10,padding:12} }}, scales:{ y:{ ticks:{ callback:v=>'R$'+Intl.NumberFormat('pt-BR',{notation:'compact'}).format(v), font:{size:10}}}, x:{ticks:{font:{size:10}}} }}
  });

  document.getElementById('evo-body').innerHTML = months.map((m,i)=>{
    var rows=allData.filter(d=>d.mes===m);
    var p=avgPct[i];
    var nOk=rows.filter(r=>pctReal(r)>=.8).length;
    var nCrit=rows.filter(r=>pctReal(r)<.5).length;
    var clr=barClr(p/100);
    return `<tr>
      <td><strong>${m}</strong></td>
      <td>${rows.length}</td>
      <td class="td-money">${fmtMoney(totInf[i])}</td>
      <td class="td-money">${fmtMoney(totReal[i])}</td>
      <td class="td-money">${fmtMoney(totMom[i])}</td>
      <td><strong style="color:${clr}">${p}%</strong></td>
      <td style="color:var(--green)">${nOk}</td>
      <td style="color:var(--red)">${nCrit}</td>
    </tr>`;
  }).join('');
}

// ── MOTIVOS PENDENTES
// Motivos selected month
if (typeof window.motivosMes === 'undefined') window.motivosMes = 'TODOS';

function selectMotivosMes(mes) {
  window.motivosMes = mes;
  renderPending();
}

function renderPending() {
  // Build month chips
  var allMonths = [...new Set(allData.map(d=>d.mes))].sort((a,b)=>(MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99));
  if (typeof window.motivosMes === 'undefined') window.motivosMes = 'TODOS';
  var chipsEl = document.getElementById('motivos-month-chips');
  if (chipsEl) {
    chipsEl.innerHTML = ['TODOS', ...allMonths].map(m=>
      `<button class="gmonth-chip${m===window.motivosMes?' active':''}" style="font-size:11px;padding:3px 10px;font-weight:${m==='TODOS'?'700':'500'};" onclick="selectMotivosMes('${m}')">${m==='TODOS'?'Todos':m}</button>`
    ).join('');
  }

  // Filter by selected month
  var pending = allData.filter(r => {
    var p = pctReal(r);
    var mesOk = window.motivosMes === 'TODOS' || r.mes === window.motivosMes;
    return p < .8 && !((motivos[r.mes+'|'+r.nome] ? motivos[r.mes+'|'+r.nome].text : null)) && mesOk;
  });

  document.getElementById('pending-count').textContent = pending.length + ' pendentes';
  document.getElementById('pending-body').innerHTML = pending.map(r => {
    var p = pctReal(r);
    var nameEsc = r.nome.replace(/'/g, "\'");
    return `<tr>
      <td><span class="badge" style="background:var(--blue-lt);color:var(--blue)">${r.mes}</span></td>
      <td class="td-name">${r.nome}</td>
      <td class="td-money">${fmtMoney(r.informado)}</td>
      <td class="td-money">${fmtMoney(r.real)}</td>
      <td><strong style="color:${barClr(p/100)}">${Math.round(p*100)}%</strong></td>
      <td><button class="btn-edit" onclick="openMotivoMes('${nameEsc}','${r.mes}',${Math.round(p*100)})">
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Registrar
      </button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gray-400)">✅ Nenhuma justificativa pendente!</td></tr>';
}

// ── MODAL
function openMotivo(nome, pct) { openMotivoMes(nome, currentMonth, pct); }
function openMotivoMes(nome, mes, pct) {
  editKey = mes+'|'+nome;
  var m = motivos[editKey]||{};
  var clr = barClr(pct/100);
  document.getElementById('modal-store-name').textContent = nome + ' — ' + mes;
  document.getElementById('modal-pct-info').innerHTML = `<div class="modal-pct-big" style="color:${clr}">${pct}%</div><div class="modal-pct-desc">de realização<br><span style="color:var(--gray-400);font-size:11px">${pct<50?'🔴 Status Crítico':pct<80?'⚠ Atenção':'✅ Meta atingida'}</span></div>`;
  document.getElementById('m-exec').value = m.exec||'';
  document.getElementById('m-cat').value  = m.cat||'';
  document.getElementById('m-text').value = m.text||'';

  document.getElementById('overlay').classList.add('open');
  setTimeout(()=>document.getElementById('m-exec').focus(),100);
}
function closeModal() { document.getElementById('overlay').classList.remove('open'); }
function saveMotivo() {
  var mExec = document.getElementById('m-exec').value.trim();
  var mCat  = document.getElementById('m-cat').value;
  var mText = document.getElementById('m-text').value.trim();
  motivos[editKey] = { exec: mExec, cat: mCat, text: mText };
  salvarMotivoSupabase(editKey, mExec, mCat, mText);
  closeModal();
  renderTable(); renderKPIs(); renderPending();
  toast('✅ Justificativa salva!');
}

// ── TABS
function switchTab(id, btn) {
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  btn.classList.add('active');
  if(id==='evolucao')     renderEvo();
  if(id==='motivos')      { window.motivosMes = window.motivosMes||'TODOS'; renderPending(); }
  if(id==='comissoes')    renderComissoes();
  if(id==='backlog')       renderBacklog();
  if(id==='gestor')       { /* login handled by user */ }
}

// ── EXPORT
function exportCSV() {
  var hdr = 'Mês,Estabelecimento,TPV Hubspot,TPV Real,TPV Realizado,% Realização,Executivo,Categoria,Motivo';
  var rows = allData.map(r=>{
    var m = motivos[r.mes+'|'+r.nome]||{};
    return `"${r.mes}","${r.nome}",${r.informado},${r.real},${r.momento},${Math.round(pctReal(r)*100)}%,"${m.exec||''}","${m.cat||''}","${m.text||''}"`;
  });
  var blob = new Blob([[hdr,...rows].join('\n')],{type:'text/csv;charset=utf-8;'});
  var a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tpv_dashboard.csv'; a.click();
}

// ── TOAST
function toast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 3000);
}

// ── RENDER ALL
function renderAll() { renderKPIs(); renderBarChart(); renderDonut(); renderTable(); }

// ==========================================
// EXECUTIVOS & COMISSÕES
// ==========================================

var EXECUTIVOS = [
  { nome: 'MILENA SANTOS',            nivel: 1, metaMRR: 3000,  metaOneShot: 4000  },
  { nome: 'NATALIE STEFFANINI',           nivel: 3, metaMRR: 8500,  metaOneShot: 12500 },
  { nome: 'KAIQUE OLIVEIRA',            nivel: 3, metaMRR: 8500,  metaOneShot: 12500 },
  { nome: 'GUSTAVO MATHEUS',           nivel: 3, metaMRR: 8500,  metaOneShot: 12500 },
  { nome: 'IGOR LUIS',         nivel: 3, metaMRR: 8500,  metaOneShot: 12500 },
  { nome: 'RENATO PASSARETI',  nivel: 4, metaMRR: 10000, metaOneShot: 15000 },
  { nome: 'CHARLES CIPRIANO',  nivel: 3, metaMRR: 8500,  metaOneShot: 12500 },
];

var NIVEIS = [
  { nivel: 1, fatorMRR: 0.12, fatorOneShot: 0.10 },
  { nivel: 2, fatorMRR: 0.14, fatorOneShot: 0.12 },
  { nivel: 3, fatorMRR: 0.20, fatorOneShot: 0.18 },
  { nivel: 4, fatorMRR: 0.22, fatorOneShot: 0.20 },
  { nivel: 5, fatorMRR: 0.25, fatorOneShot: 0.23 },
];

var FAIXAS = [
  { min: 0,    max: 0.60, mult: 0    },
  { min: 0.60, max: 0.70, mult: 0.6  },
  { min: 0.70, max: 0.80, mult: 0.7  },
  { min: 0.80, max: 0.90, mult: 0.9  },
  { min: 0.90, max: 1.00, mult: 0.95 },
  { min: 1.00, max: 1.20, mult: 1.1  },
  { min: 1.20, max: 999,  mult: 1.2  },
];

// Senhas dos executivos (em produção, use backend!)
var SENHAS = {
  'MILENA SANTOS':      'prata72',
  'NATALIE STEFFANINI': 'chuva45',
  'KAIQUE OLIVEIRA':    'folha83',
  'GUSTAVO MATHEUS':    'pedra16',
  'IGOR LUIS':          'vento59',
  'RENATO PASSARETI':   'chave37',
  'CHARLES CIPRIANO':   'nuvem91',
};

var AVATAR_COLORS = ['#2563EB','#0D9488','#D97706','#DC2626','#7C3AED','#059669','#DB2777'];

function getMultiplicador(pctAtingimento) {
  var f = FAIXAS.find(f => pctAtingimento >= f.min && pctAtingimento < f.max);
  return f ? f.mult : 0;
}

function getFaixaLabel(pct) {
  if (pct < 0.60) return { label: '< 60%',      color: '#DC2626', bg: '#FEE2E2' };
  if (pct < 0.70) return { label: '60% – 69%',  color: '#D97706', bg: '#FEF3C7' };
  if (pct < 0.80) return { label: '70% – 79%',  color: '#D97706', bg: '#FEF3C7' };
  if (pct < 0.90) return { label: '80% – 89%',  color: '#2563EB', bg: '#EFF6FF' };
  if (pct < 1.00) return { label: '90% – 99%',  color: '#2563EB', bg: '#EFF6FF' };
  if (pct < 1.20) return { label: '100% – 120%',color: '#16A34A', bg: '#DCFCE7' };
  return               { label: '≥ 120%',        color: '#16A34A', bg: '#DCFCE7' };
}

// Get realized MRR and OneShot for an exec in a given month
// MRR = sum of TPV Realizado for their stores
// OneShot = sum of TPV Real for their stores (one-time deals)
// Since stores aren't tied to execs in data, we compute from the global
// prorated: exec's share = (exec metaMRR / sum all metaMRR) * total realizado
function getExecRealizados(exec, mes) {
  // Sum real MRR and OneShot from stores assigned to this exec
  var rows = allData.filter(d => d.mes === mes && d.executivo === exec.nome);
  var realizadoMRR     = rows.reduce((s,r)=>s+(r.mrr||0), 0);
  var realizadoOneShot = rows.reduce((s,r)=>s+(r.oneshot||0), 0);
  return { realizadoMRR, realizadoOneShot };
}

function calcComissao(exec, mes) {
  var { realizadoMRR, realizadoOneShot } = getExecRealizados(exec, mes);
  var nivel = NIVEIS.find(n=>n.nivel===exec.nivel) || NIVEIS[0];

  var pctMRR     = exec.metaMRR     > 0 ? realizadoMRR     / exec.metaMRR     : 0;
  var pctOneShot = exec.metaOneShot > 0 ? realizadoOneShot / exec.metaOneShot : 0;

  var multMRR     = getMultiplicador(pctMRR);
  var multOneShot = getMultiplicador(pctOneShot);

  // Fórmula: (Meta atingida [valor] x fator de premiação da faixa) x multiplicador
  var comissaoMRR     = realizadoMRR     * nivel.fatorMRR     * multMRR;
  var comissaoOneShot = realizadoOneShot * nivel.fatorOneShot * multOneShot;

  return {
    realizadoMRR, realizadoOneShot,
    pctMRR, pctOneShot,
    multMRR, multOneShot,
    comissaoMRR, comissaoOneShot,
    total: comissaoMRR + comissaoOneShot,
    nivel,
  };
}

// ── RENDER COMISSÕES (público — sem valores R$)
function renderComissoes() {
  var filterMes = (document.getElementById('filter-exec-mes') ? document.getElementById('filter-exec-mes').value : '') || '';
  var months = [...new Set(allData.map(d=>d.mes))];

  // populate filter
  // Build month chips for comissoes
  var chipsEl = document.getElementById('comissoes-month-chips');
  if (chipsEl) {
    var allMonths = [...new Set(allData.map(d=>d.mes))].sort((a,b)=>(MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99));
    if (!window.comissoesMes) window.comissoesMes = allMonths[allMonths.length-1] || currentMonth;
    chipsEl.innerHTML = allMonths.map(m=>
      `<button class="gmonth-chip${m===window.comissoesMes?' active':''}" style="font-size:11px;padding:3px 10px;" onclick="selectComissoesMes('${m}')">${m}</button>`
    ).join('');
  }
  var mes = window.comissoesMes || currentMonth || (months[0] || '');
  if (!mes) return;

  document.getElementById('exec-grid').innerHTML = EXECUTIVOS.map((exec, i) => {
    var c = calcComissao(exec, mes);
    var pctMRR_disp = Math.round(c.pctMRR * 100);
    var pctOS_disp  = Math.round(c.pctOneShot * 100);
    var fMRR = getFaixaLabel(c.pctMRR);
    var fOS  = getFaixaLabel(c.pctOneShot);
    var avClr = AVATAR_COLORS[i % AVATAR_COLORS.length];
    var initials = exec.nome.split(' ').map(w=>w[0]).slice(0,2).join('');
    var barWMRR = Math.min(pctMRR_disp, 120);
    var barWOS  = Math.min(pctOS_disp, 120);
    return `<div class="exec-card">
      <div class="exec-card-head">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="exec-avatar" style="background:${avClr}20;color:${avClr}">${initials}</div>
          <div>
            <div class="exec-name">${exec.nome.charAt(0)+exec.nome.slice(1).toLowerCase()}</div>
            <div class="exec-nivel">Nível ${exec.nivel} · ${mes} · ${allData.filter(d=>d.mes===mes&&d.executivo===exec.nome).length} casas</div>
          </div>
        </div>
      </div>
      <div class="exec-card-body">
        <div style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px;">MRR</div>
        <div class="exec-metric">
          <span class="exec-metric-label">Meta</span>
          <span class="exec-metric-val">${fmtMoney(exec.metaMRR)}</span>
        </div>
        <div class="exec-ating-wrap">
          <div class="exec-ating-label">
            <span>Atingimento</span>
            <span style="font-weight:700;color:${fMRR.color}">${pctMRR_disp}%</span>
          </div>
          <div class="exec-ating-bar-bg">
            <div class="exec-ating-bar" style="width:${barWMRR/1.2}%;background:${fMRR.color}"></div>
          </div>
          <span class="faixa-badge" style="background:${fMRR.bg};color:${fMRR.color}">${fMRR.label}</span>
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.05em;margin:6px 0 2px;">One-Shot</div>
        <div class="exec-metric">
          <span class="exec-metric-label">Meta</span>
          <span class="exec-metric-val">${fmtMoney(exec.metaOneShot)}</span>
        </div>
        <div class="exec-ating-wrap">
          <div class="exec-ating-label">
            <span>Atingimento</span>
            <span style="font-weight:700;color:${fOS.color}">${pctOS_disp}%</span>
          </div>
          <div class="exec-ating-bar-bg">
            <div class="exec-ating-bar" style="width:${barWOS/1.2}%;background:${fOS.color}"></div>
          </div>
          <span class="faixa-badge" style="background:${fOS.bg};color:${fOS.color}">${fOS.label}</span>
        </div>
      </div>
      <div class="exec-card-foot">
        <span class="exec-card-foot-label">Comissão total</span>
        <span class="exec-card-foot-val" style="color:var(--gray-400);font-size:12px;font-style:italic;">🔐 Acesso privado</span>
      </div>
    </div>`;
  }).join('');
}

// ── LOGIN
var loggedExec = null;
var resultTabActive = 'mrr';
var execSelectedMonth = '';

function doLogin() {
  var nome  = document.getElementById('login-exec').value;
  var senha = document.getElementById('login-senha').value;
  var err   = document.getElementById('login-error');
  if (!nome) { err.style.display='block'; err.textContent='Selecione seu nome.'; return; }
  if (SENHAS[nome] !== senha) { err.style.display='block'; err.textContent='Senha incorreta. Tente novamente.'; return; }
  err.style.display = 'none';
  loggedExec = EXECUTIVOS.find(e=>e.nome===nome);
  document.getElementById('login-screen').style.display  = 'none';
  document.getElementById('result-screen').style.display = 'block';
  renderResultado();
}

function doLogout() {
  loggedExec = null;
  execSelectedMonth = '';
  document.getElementById('login-screen').style.display  = 'block';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('login-senha').value = '';
}

function switchResultTab(tab, btn) {
  resultTabActive = tab;
  document.querySelectorAll('.result-tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderResultado();
}

function selectExecMonth(mes) {
  execSelectedMonth = mes;
  renderResultado();
}

function renderResultado() {
  if (!loggedExec) return;
  var months = [...new Set(allData.map(d=>d.mes))].sort((a,b)=>{
    return (MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99);
  });
  // Init selected month
  if (!execSelectedMonth || !months.includes(execSelectedMonth)) {
    execSelectedMonth = months[months.length-1] || currentMonth;
  }
  var mes = execSelectedMonth;
  // Build month chips
  document.getElementById('exec-month-chips').innerHTML = months.map(m=>
    `<button class="gmonth-chip${m===mes?' active':''}" style="font-size:11px;padding:3px 10px;" onclick="selectExecMonth('${m}')">${m}</button>`
  ).join('');
  document.getElementById('result-mes-label').textContent = 'Período: ' + mes;
  var c = calcComissao(loggedExec, mes);
  var nivel = c.nivel;
  var avClr = AVATAR_COLORS[EXECUTIVOS.indexOf(loggedExec) % AVATAR_COLORS.length];
  var initials = loggedExec.nome.split(' ').map(w=>w[0]).slice(0,2).join('');

  var bodyHtml = '';

  if (resultTabActive === 'mrr') {
    var f = getFaixaLabel(c.pctMRR);
    bodyHtml = `
      <div class="result-card">
        <div class="result-card-head">
          <div class="result-avatar-lg" style="background:${avClr}30;color:${avClr}">${initials}</div>
          <div>
            <div class="result-name">${loggedExec.nome.charAt(0)+loggedExec.nome.slice(1).toLowerCase()}</div>
            <div class="result-nivel">Nível ${loggedExec.nivel} · MRR · ${mes}</div>
          </div>
        </div>
        <div class="result-body">
          <div class="result-row"><span class="result-row-label">Meta MRR</span><span class="result-row-val">${fmtMoney(loggedExec.metaMRR)}</span></div>
          <div class="result-row"><span class="result-row-label">Realizado MRR</span><span class="result-row-val">${fmtMoney(c.realizadoMRR)}</span></div>
          <div class="result-row"><span class="result-row-label">Atingimento</span><span class="result-row-val" style="color:${f.color}">${Math.round(c.pctMRR*100)}% — ${f.label}</span></div>
          <div class="result-row"><span class="result-row-label">Fator de premiação</span><span class="result-row-val">${(nivel.fatorMRR*100).toFixed(0)}%</span></div>
          <div class="result-row"><span class="result-row-label">Multiplicador</span><span class="result-row-val">${c.multMRR}x</span></div>
          <div class="result-comissao-box">
            <div class="result-comissao-label">Comissão MRR</div>
            <div class="result-comissao-val">${fmtMoney(c.comissaoMRR)}</div>
            <div class="result-comissao-sub">Realizado × ${(nivel.fatorMRR*100).toFixed(0)}% × ${c.multMRR}</div>
          </div>
        </div>
      </div>`;
  } else if (resultTabActive === 'oneshot') {
    var f = getFaixaLabel(c.pctOneShot);
    bodyHtml = `
      <div class="result-card">
        <div class="result-card-head">
          <div class="result-avatar-lg" style="background:${avClr}30;color:${avClr}">${initials}</div>
          <div>
            <div class="result-name">${loggedExec.nome.charAt(0)+loggedExec.nome.slice(1).toLowerCase()}</div>
            <div class="result-nivel">Nível ${loggedExec.nivel} · One-Shot · ${mes}</div>
          </div>
        </div>
        <div class="result-body">
          <div class="result-row"><span class="result-row-label">Meta One-Shot</span><span class="result-row-val">${fmtMoney(loggedExec.metaOneShot)}</span></div>
          <div class="result-row"><span class="result-row-label">Realizado One-Shot</span><span class="result-row-val">${fmtMoney(c.realizadoOneShot)}</span></div>
          <div class="result-row"><span class="result-row-label">Atingimento</span><span class="result-row-val" style="color:${f.color}">${Math.round(c.pctOneShot*100)}% — ${f.label}</span></div>
          <div class="result-row"><span class="result-row-label">Fator de premiação</span><span class="result-row-val">${(nivel.fatorOneShot*100).toFixed(0)}%</span></div>
          <div class="result-row"><span class="result-row-label">Multiplicador</span><span class="result-row-val">${c.multOneShot}x</span></div>
          <div class="result-comissao-box">
            <div class="result-comissao-label">Comissão One-Shot</div>
            <div class="result-comissao-val">${fmtMoney(c.comissaoOneShot)}</div>
            <div class="result-comissao-sub">Realizado × ${(nivel.fatorOneShot*100).toFixed(0)}% × ${c.multOneShot}</div>
          </div>
        </div>
      </div>`;
  } else {
    bodyHtml = `
      <div class="result-card">
        <div class="result-card-head">
          <div class="result-avatar-lg" style="background:${avClr}30;color:${avClr}">${initials}</div>
          <div>
            <div class="result-name">${loggedExec.nome.charAt(0)+loggedExec.nome.slice(1).toLowerCase()}</div>
            <div class="result-nivel">Nível ${loggedExec.nivel} · Resumo · ${mes}</div>
          </div>
        </div>
        <div class="result-body">
          <div class="result-row"><span class="result-row-label">Comissão MRR</span><span class="result-row-val" style="color:var(--green)">${fmtMoney(c.comissaoMRR)}</span></div>
          <div class="result-row"><span class="result-row-label">Comissão One-Shot</span><span class="result-row-val" style="color:var(--blue)">${fmtMoney(c.comissaoOneShot)}</span></div>
          <div class="result-comissao-box">
            <div class="result-comissao-label">💰 Comissão Total do Mês</div>
            <div class="result-comissao-val">${fmtMoney(c.total)}</div>
            <div class="result-comissao-sub">MRR + One-Shot · ${mes}</div>
          </div>
        </div>
      </div>`;
  }

  document.getElementById('result-content').innerHTML = bodyHtml;
}


// ==========================================
// GESTOR
// ==========================================

var GESTOR_CRED = { login: 'guilherme.freitas', senha: 'Lolo3005!' };

// Tabela de comissão do Gestor (imagem enviada)
// Atingimento do time por indicador (MRR e One-Shot separados)
var GESTOR_FAIXAS = [
  { min: 0,    max: 0.60, fatorMRR: 0.0000, fatorOS: 0.0000 },
  { min: 0.60, max: 0.70, fatorMRR: 0.0080, fatorOS: 0.0060 },
  { min: 0.70, max: 0.80, fatorMRR: 0.0100, fatorOS: 0.0080 },
  { min: 0.80, max: 0.90, fatorMRR: 0.0170, fatorOS: 0.0150 },
  { min: 0.90, max: 1.00, fatorMRR: 0.0200, fatorOS: 0.0180 },
  { min: 1.00, max: 1.20, fatorMRR: 0.0320, fatorOS: 0.0300 },
  { min: 1.20, max: 999,  fatorMRR: 0.0350, fatorOS: 0.0330 },
];

var GESTOR_METAS = {
  'Abril': { metaMRR: 65550,  metaOS: 91500  },
  'Maio':  { metaMRR: 75000,  metaOS: 100000 },
};
var GESTOR_BONUS_META = 2000;
var gestorSelectedMes = '';

function getGestorMeta(mes) {
  return GESTOR_METAS[mes] || { metaMRR: 65550, metaOS: 91500 };
}

function getGestorFaixa(pct) {
  return GESTOR_FAIXAS.find(f => pct >= f.min && pct < f.max) || GESTOR_FAIXAS[0];
}

function calcGestorComissao(mes) {
  var rows = (mes === 'TODOS') ? allData : allData.filter(d => d.mes === mes);
  var totMRR = rows.reduce((s,r)=>s+(r.mrr||0), 0);
  var totOS  = rows.reduce((s,r)=>s+(r.oneshot||0), 0);
  var { metaMRR: GESTOR_META_MRR, metaOS: GESTOR_META_OS } = getGestorMeta(mes);

  var pctMRR = GESTOR_META_MRR > 0 ? totMRR / GESTOR_META_MRR : 0;
  var pctOS  = GESTOR_META_OS  > 0 ? totOS  / GESTOR_META_OS  : 0;

  var faixaMRR = getGestorFaixa(pctMRR);
  var faixaOS  = getGestorFaixa(pctOS);

  var comMRR = totMRR * faixaMRR.fatorMRR;
  var comOS  = totOS  * faixaOS.fatorOS;

  // Bônus: apenas se atingir >= 100% em AMBOS
  var bonus = (pctMRR >= 1.0 && pctOS >= 1.0) ? GESTOR_BONUS_META : 0;

  return { totMRR, totOS, pctMRR, pctOS, faixaMRR, faixaOS, comMRR, comOS, bonus, total: comMRR + comOS + bonus };
}

function doGestorLogin() {
  var u = document.getElementById('gestor-login-user').value.trim();
  var s = document.getElementById('gestor-login-senha').value;
  var err = document.getElementById('gestor-login-error');
  if (u !== GESTOR_CRED.login || s !== GESTOR_CRED.senha) {
    err.style.display = 'block'; return;
  }
  err.style.display = 'none';
  document.getElementById('gestor-login-screen').style.display = 'none';
  document.getElementById('gestor-painel').style.display = 'block';
  renderGestor();
}

function doGestorLogout() {
  gestorSelectedMes = '';
  document.getElementById('gestor-login-screen').style.display = 'block';
  document.getElementById('gestor-painel').style.display = 'none';
  document.getElementById('gestor-login-user').value = '';
  document.getElementById('gestor-login-senha').value = '';
}

function selectComissoesMes(mes) {
  window.comissoesMes = mes;
  renderComissoes();
}

function selectGestorMes(mes) {
  gestorSelectedMes = mes;
  renderGestor();
}

function renderGestor() {
  var months = [...new Set(allData.map(d=>d.mes))].sort((a,b)=>(MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99));
  // Init selected month to most recent
  if (!gestorSelectedMes || !months.includes(gestorSelectedMes)) {
    gestorSelectedMes = months[months.length-1] || currentMonth;
  }
  var mes = gestorSelectedMes;

  // Build month chips
  var chipsEl = document.getElementById('gestor-month-chips');
  if (chipsEl) {
    chipsEl.innerHTML = months.map(m =>
      `<button class="gmonth-chip${m===mes?' active':''}" style="font-size:11px;padding:3px 12px;" onclick="selectGestorMes('${m}')">${m}</button>`
    ).join('');
  }

  var { metaMRR: GESTOR_META_MRR, metaOS: GESTOR_META_OS } = getGestorMeta(mes);
  document.getElementById('gestor-mes-label').textContent = 'Período: ' + mes + ' · Meta MRR: ' + fmtMoney(GESTOR_META_MRR) + ' · Meta One-Shot: ' + fmtMoney(GESTOR_META_OS);

  var c = calcGestorComissao(mes);

  // Total
  document.getElementById('gestor-total-val').textContent = fmtMoney(c.total);
  document.getElementById('gestor-total-sub').textContent = 'MRR ' + fmtMoney(c.comMRR) + ' + One-Shot ' + fmtMoney(c.comOS) + (c.bonus > 0 ? ' + Bônus ' + fmtMoney(c.bonus) : '');

  // Bônus box
  var bonusEl = document.getElementById('gestor-bonus-box');
  if (c.bonus > 0) {
    bonusEl.innerHTML = `<div class="bonus-box">
      <div class="bonus-box-label">🎯 Bônus de Atingimento — 100% MRR + 100% One-Shot</div>
      <div class="bonus-box-val">+ ${fmtMoney(c.bonus)}</div>
      <div class="bonus-box-sub">Parabéns! Você atingiu 100% em ambos os indicadores.</div>
    </div>`;
  } else {
    var faltaMRR = c.pctMRR < 1.0 ? ' MRR: ' + Math.round(c.pctMRR*100) + '%' : '';
    var faltaOS  = c.pctOS  < 1.0 ? ' One-Shot: ' + Math.round(c.pctOS*100)  + '%' : '';
    bonusEl.innerHTML = `<div style="background:var(--gray-100);border-radius:var(--radius-lg);padding:1rem 1.25rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">🎯</span>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--gray-600);">Bônus de R$ 2.000 — não atingido</div>
        <div style="font-size:12px;color:var(--gray-400);margin-top:2px;">É necessário 100% em MRR e One-Shot. Atual:${faltaMRR}${faltaOS}</div>
      </div>
    </div>`;
  }

  // KPIs
  var fMRR = getFaixaLabel(c.pctMRR);
  var fOS  = getFaixaLabel(c.pctOS);
  document.getElementById('gestor-kpi-grid').innerHTML = `
    <div class="gestor-kpi" style="border-color:${fMRR.color}">
      <div class="gestor-kpi-label">% Atingimento MRR</div>
      <div class="gestor-kpi-val" style="color:${fMRR.color}">${Math.round(c.pctMRR*100)}%</div>
      <div class="gestor-kpi-sub">Realizado: ${fmtMoney(c.totMRR)} / Meta: ${fmtMoney(GESTOR_META_MRR)}</div>
    </div>
    <div class="gestor-kpi" style="border-color:${fOS.color}">
      <div class="gestor-kpi-label">% Atingimento One-Shot</div>
      <div class="gestor-kpi-val" style="color:${fOS.color}">${Math.round(c.pctOS*100)}%</div>
      <div class="gestor-kpi-sub">Realizado: ${fmtMoney(c.totOS)} / Meta: ${fmtMoney(GESTOR_META_OS)}</div>
    </div>
    <div class="gestor-kpi">
      <div class="gestor-kpi-label">Comissão MRR</div>
      <div class="gestor-kpi-val" style="color:var(--teal)">${fmtMoney(c.comMRR)}</div>
      <div class="gestor-kpi-sub">Fator: ${(c.faixaMRR.fatorMRR*100).toFixed(2)}% · Faixa: ${fMRR.label}</div>
    </div>
    <div class="gestor-kpi">
      <div class="gestor-kpi-label">Comissão One-Shot</div>
      <div class="gestor-kpi-val" style="color:var(--blue)">${fmtMoney(c.comOS)}</div>
      <div class="gestor-kpi-sub">Fator: ${(c.faixaOS.fatorOS*100).toFixed(2)}% · Faixa: ${fOS.label}</div>
    </div>
  `;

  // Detalhes MRR
  document.getElementById('gestor-mrr-detail').innerHTML = `
    <div class="gestor-detail-row"><span class="gestor-detail-label">Meta</span><span class="gestor-detail-val">${fmtMoney(GESTOR_META_MRR)}</span></div>
    <div class="gestor-detail-row"><span class="gestor-detail-label">Total Realizado pelo Time</span><span class="gestor-detail-val">${fmtMoney(c.totMRR)}</span></div>
    <div class="gestor-detail-row"><span class="gestor-detail-label">Atingimento</span><span class="gestor-detail-val" style="color:${fMRR.color}">${Math.round(c.pctMRR*100)}% — ${fMRR.label}</span></div>
    <div class="gestor-detail-row"><span class="gestor-detail-label">Fator de Premiação</span><span class="gestor-detail-val">${(c.faixaMRR.fatorMRR*100).toFixed(2)}%</span></div>
    <div class="gestor-detail-row" style="background:var(--gray-50)"><span class="gestor-detail-label" style="font-weight:600">Comissão MRR</span><span class="gestor-detail-val" style="color:var(--teal);font-size:16px">${fmtMoney(c.comMRR)}</span></div>
  `;

  // Detalhes One-Shot
  document.getElementById('gestor-os-detail').innerHTML = `
    <div class="gestor-detail-row"><span class="gestor-detail-label">Meta</span><span class="gestor-detail-val">${fmtMoney(GESTOR_META_OS)}</span></div>
    <div class="gestor-detail-row"><span class="gestor-detail-label">Total Realizado pelo Time</span><span class="gestor-detail-val">${fmtMoney(c.totOS)}</span></div>
    <div class="gestor-detail-row"><span class="gestor-detail-label">Atingimento</span><span class="gestor-detail-val" style="color:${fOS.color}">${Math.round(c.pctOS*100)}% — ${fOS.label}</span></div>
    <div class="gestor-detail-row"><span class="gestor-detail-label">Fator de Premiação</span><span class="gestor-detail-val">${(c.faixaOS.fatorOS*100).toFixed(2)}%</span></div>
    <div class="gestor-detail-row" style="background:var(--gray-50)"><span class="gestor-detail-label" style="font-weight:600">Comissão One-Shot</span><span class="gestor-detail-val" style="color:var(--blue);font-size:16px">${fmtMoney(c.comOS)}</span></div>
  `;

  // Time de executivos
  initMgmtFilter();
  renderMgmtTable();
    document.getElementById('gestor-team-body').innerHTML = EXECUTIVOS.map((exec, i) => {
    var ec = calcComissao(exec, mes);
    var avClr = AVATAR_COLORS[i % AVATAR_COLORS.length];
    var casas = allData.filter(d=>d.mes===mes&&d.executivo===exec.nome).length;
    var fM = getFaixaLabel(ec.pctMRR);
    var fO = getFaixaLabel(ec.pctOneShot);
    return `<tr>
      <td><span style="font-size:12px;font-weight:600;color:${avClr}">${exec.nome.charAt(0)+exec.nome.slice(1).toLowerCase()}</span></td>
      <td style="text-align:center">${casas}</td>
      <td class="td-money">${fmtMoney(ec.realizadoMRR)}</td>
      <td class="td-money">${fmtMoney(ec.realizadoOneShot)}</td>
      <td><span style="font-weight:700;color:${fM.color}">${Math.round(ec.pctMRR*100)}%</span></td>
      <td><span style="font-weight:700;color:${fO.color}">${Math.round(ec.pctOneShot*100)}%</span></td>
      <td class="td-money" style="font-weight:700;color:var(--navy)">${fmtMoney(ec.total)}</td>
    </tr>`;
  }).join('');
}



// ==========================================
// BACKLOG
// ==========================================
var backlogData = {}; // key: mes|nome → { etapa, motivo }
var bkEditKey   = '';
var bkEditExec  = '';

function getLoggedExecName() {
  // Check if an exec is logged in on minha comissao tab
  return loggedExec ? loggedExec.nome : null;
}

function initBacklogFilters() {
  var sel = document.getElementById('bk-filter-mes');
  if (!sel || sel.options.length > 1) return;
  var months = [...new Set(allData.map(d=>d.mes))].sort((a,b)=>{
    return (MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99);
  });
  months.forEach(m=>{ var o=document.createElement('option'); o.value=m; o.textContent=m; sel.appendChild(o); });
}

function getBkFiltered() {
  var mes   = (document.getElementById('bk-filter-mes') ? document.getElementById('bk-filter-mes').value : '') || '';
  var exec  = (document.getElementById('bk-filter-exec') ? document.getElementById('bk-filter-exec').value : '') || '';
  var etapa = (document.getElementById('bk-filter-etapa') ? document.getElementById('bk-filter-etapa').value : '') || '';
  var q     = (document.getElementById('bk-search') ? document.getElementById('bk-search').value : '').toLowerCase() || '';

  // All rows below 80%
  var rows = allData.filter(r => pctReal(r) < 0.8);
  if (mes && mes !== 'TODOS') rows = rows.filter(r => r.mes === mes);
  if (exec)  rows = rows.filter(r => r.executivo === exec);
  if (q)     rows = rows.filter(r => r.nome.toLowerCase().includes(q));
  if (etapa) rows = rows.filter(r => ((backlogData[r.mes+'|'+r.nome] ? backlogData[r.mes+'|'+r.nome].etapa : null) || 'Pendente') === etapa);

  return rows;
}

function renderBacklog() {
  initBacklogFilters();
  var rows = getBkFiltered();
  var allPending = allData.filter(r => pctReal(r) < 0.8);
  var nPend   = allPending.filter(r => ((backlogData[r.mes+'|'+r.nome] ? backlogData[r.mes+'|'+r.nome].etapa : null)||'Pendente')==='Pendente').length;
  var nAndamento = allPending.filter(r => ((backlogData[r.mes+'|'+r.nome] ? backlogData[r.mes+'|'+r.nome].etapa : null)||'')==='Em andamento').length;
  var nResolv = allPending.filter(r => ((backlogData[r.mes+'|'+r.nome] ? backlogData[r.mes+'|'+r.nome].etapa : null)||'')==='Realizado').length;

  document.getElementById('bk-count').textContent = rows.length + ' casas';

  document.getElementById('backlog-stats').innerHTML = `
    <div class="backlog-stat"><div class="backlog-stat-val" style="color:var(--amber)">${nPend}</div><div class="backlog-stat-lbl">Pendente</div></div>
    <div class="backlog-stat"><div class="backlog-stat-val" style="color:var(--blue)">${nAndamento}</div><div class="backlog-stat-lbl">Em andamento</div></div>
    <div class="backlog-stat"><div class="backlog-stat-val" style="color:var(--green)">${nResolv}</div><div class="backlog-stat-lbl">Resolvido</div></div>
  `;

  var loggedName = getLoggedExecName();

  document.getElementById('backlog-body').innerHTML = rows.length ? rows.map(r => {
    var key    = r.mes+'|'+r.nome;
    var bk     = backlogData[key] || { etapa: 'Pendente', motivo: '' };
    var p      = Math.round(pctReal(r)*100);
    var etapaClass = bk.etapa==='Realizado'?'etapa-realizado':bk.etapa==='Em andamento'?'etapa-andamento':'etapa-pendente';
    var nameEsc = r.nome.replace(/'/g,"\'");
    var execEsc = r.executivo.replace(/'/g,"\'");
    var disabledAttr = '';
    return `<tr>
      <td><span style="font-size:11px;font-weight:600;background:var(--blue-lt);color:var(--blue);padding:2px 8px;border-radius:99px">${r.mes}</span></td>
      <td style="font-weight:500;font-size:12px">${r.nome}</td>
      <td class="td-money">${fmtMoney(r.momento)}</td>
      <td><strong style="color:${barClr(pctReal(r))}">${p}%</strong></td>
      <td><span class="etapa-badge ${etapaClass}">${bk.etapa}</span></td>
      <td><span class="backlog-motivo-text" title="${bk.motivo||''}">${bk.motivo||'—'}</span></td>
      <td>
        <button class="btn-backlog-edit" onclick="openBkModal('${nameEsc}','${r.mes}','${execEsc}')" ${disabledAttr}>
          ✏ Editar
        </button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" class="backlog-empty">✅ Nenhuma pendência encontrada com os filtros selecionados.</td></tr>`;
}

function openBkModal(nome, mes, exec) {
  bkEditKey  = mes+'|'+nome;
  bkEditExec = exec;
  var bk   = backlogData[bkEditKey] || { etapa:'Pendente', motivo:'' };
  document.getElementById('bk-modal-store').textContent = nome + ' — ' + mes;
  document.getElementById('bk-etapa').value  = bk.etapa  || 'Pendente';
  document.getElementById('bk-motivo').value = bk.motivo || '';
  document.getElementById('bk-exec-info').textContent = 'Responsável: ' + exec;
  document.getElementById('bk-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('bk-motivo').focus(), 100);
}

function closeBkModal() {
  document.getElementById('bk-overlay').classList.remove('open');
  bkEditKey = ''; bkEditExec = '';
}

function saveBkModal() {
  if (!bkEditKey) return;
  var bkEtapa  = document.getElementById('bk-etapa').value;
  var bkMotivo = document.getElementById('bk-motivo').value.trim();
  backlogData[bkEditKey] = { etapa: bkEtapa, motivo: bkMotivo };
  salvarBacklogSupabase(bkEditKey, bkEtapa, bkMotivo);
  saveBacklogToSupabase(bkEditKey, bkEtapa, bkMotivo);
  closeBkModal();
  renderBacklog();
  toast('✅ Pendência atualizada!');
}


// ==========================================
// PAINEL DE GESTÃO (GESTOR)
// ==========================================

function switchMgmtTab(tab, btn) {
  document.getElementById('mgmt-tab-casas').style.display  = tab==='casas'  ? '' : 'none';
  document.getElementById('mgmt-tab-metas').style.display  = tab==='metas'  ? '' : 'none';
  document.querySelectorAll('.mgmt-tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if (tab==='metas') renderMgmtMetas();
}

function initMgmtFilter() {
  var sel = document.getElementById('mgmt-filter-mes');
  if (!sel) return;
  var months = [...new Set(allData.map(d=>d.mes))].sort((a,b)=>(MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99));
  var current = sel.value || (currentMonth !== 'TODOS' ? currentMonth : 'TODOS');
  sel.innerHTML = '<option value="TODOS">Todos os meses</option>' +
    months.map(m=>`<option value="${m}">${m}</option>`).join('');
  sel.value = current;
}

function renderMgmtTable() {
  initMgmtFilter();
  var sel = document.getElementById('mgmt-filter-mes');
  var filterMes = (sel ? sel.value : undefined) || 'TODOS';
  var rows = filterMes === 'TODOS' ? allData : allData.filter(r=>r.mes===filterMes);

  document.getElementById('mgmt-table-body').innerHTML = rows.map((r, globalIdx) => {
    var realIdx = allData.indexOf(r);
    return `<tr>
      <td><span style="font-size:11px;font-weight:600;background:var(--blue-lt);color:var(--blue);padding:2px 8px;border-radius:99px">${r.mes}</span></td>
      <td>
        <input class="mgmt-inline-input" style="width:160px" value="${r.nome}" onchange="updateCasa(${realIdx},'nome',this.value)">
      </td>
      <td>
        <select class="mgmt-inline-input" style="width:160px" onchange="updateCasa(${realIdx},'executivo',this.value)">
          ${['MILENA SANTOS','NATALIE STEFFANINI','KAIQUE OLIVEIRA','GUSTAVO MATHEUS','IGOR LUIS','RENATO PASSARETI','CHARLES CIPRIANO']
            .map(e=>`<option${e===r.executivo?' selected':''}>${e}</option>`).join('')}
        </select>
      </td>
      <td><input class="mgmt-inline-input" type="number" value="${r.informado}" onchange="updateCasa(${realIdx},'informado',parseFloat(this.value)||0)"></td>
      <td><input class="mgmt-inline-input" type="number" value="${r.real}" onchange="updateCasa(${realIdx},'real',parseFloat(this.value)||0)"></td>
      <td><input class="mgmt-inline-input" type="number" value="${r.momento}" onchange="updateCasa(${realIdx},'momento',parseFloat(this.value)||0)"></td>
      <td><input class="mgmt-inline-input" type="number" value="${r.mrr||0}" onchange="updateCasa(${realIdx},'mrr',parseFloat(this.value)||0)" style="border-color:var(--teal)"></td>
      <td><input class="mgmt-inline-input" type="number" value="${r.oneshot||0}" onchange="updateCasa(${realIdx},'oneshot',parseFloat(this.value)||0)" style="border-color:var(--blue)"></td>
      <td>
        <button class="mgmt-del-btn" onclick="deleteCasa(${realIdx})">🗑</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--gray-400)">Nenhuma casa encontrada.</td></tr>';
}

function updateCasa(idx, field, value) {
  if (allData[idx]) {
    allData[idx][field] = value;
    if (field === 'momento') allData[idx].real = value;
    saveRowToSupabase(allData[idx]);
    refreshAllViews();
    toast('✅ Salvo!');
  }
}

function deleteCasa(idx) {
  var r = allData[idx];
  if (!confirm('Remover "' + (r ? r.nome : undefined) + '"?')) return;
  deleteRowFromSupabase(r.nome, r.mes);
  allData.splice(idx, 1);
  renderMgmtTable();
  refreshAllViews();
  toast('🗑 Casa removida.');
}

function addNewCasa() {
  var mes      = document.getElementById('new-mes').value;
  var nome     = document.getElementById('new-nome').value.trim();
  var exec_    = document.getElementById('new-exec').value;
  var hub      = parseFloat(document.getElementById('new-hub').value)  || 0;
  var real     = parseFloat(document.getElementById('new-real').value) || 0;
  var realiz   = parseFloat(document.getElementById('new-realizado').value) || 0;
  var mrr      = parseFloat(document.getElementById('new-mrr').value)  || 0;
  var os       = parseFloat(document.getElementById('new-os').value)   || 0;

  if (!mes || !nome || !exec_) { toast('⚠ Preencha Mês, Nome e Executivo.'); return; }

  var newRow = { nome, mes, executivo: exec_, informado: hub, real, momento: realiz, mrr, oneshot: os, status_impl: 'IMPLANTADA' };
  allData.push(newRow);
  salvarCasaSupabase(newRow);
  saveRowToSupabase(newRow);

  // Clear fields
  ['new-nome','new-hub','new-real','new-realizado','new-mrr','new-os'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('new-mes').value  = '';
  document.getElementById('new-exec').value = '';

  renderMgmtTable();
  refreshAllViews();
  buildMonthChips([...new Set(allData.map(d=>d.mes))].sort((a,b)=>(MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99)));
  toast('✅ Casa adicionada com sucesso!');
}

function renderMgmtMetas() {
  // All months that have either data or a defined meta
  var dataMonths = [...new Set(allData.map(d=>d.mes))];
  var metaMonths = Object.keys(GESTOR_METAS);
  var allMetaMonths = [...new Set([...dataMonths, ...metaMonths])]
    .sort((a,b)=>(MONTHS_ORDER.indexOf(a)||99)-(MONTHS_ORDER.indexOf(b)||99));

  document.getElementById('mgmt-metas-grid').innerHTML = allMetaMonths.map(m => {
    var meta = getGestorMeta(m);
    var hasData = dataMonths.includes(m);
    return `<div style="background:var(--gray-50);border-radius:var(--radius);border:1.5px solid ${hasData?'var(--blue-lt)':'var(--gray-200)'};padding:1rem;position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-size:13px;font-weight:700;color:var(--navy);">📅 ${m}</div>
        ${hasData
          ? '<span style="font-size:10px;background:var(--blue-lt);color:var(--blue);padding:2px 7px;border-radius:99px;font-weight:600;">Com dados</span>'
          : `<button onclick="removeGestorMeta('${m}')" style="background:none;border:none;color:var(--gray-400);cursor:pointer;font-size:16px;line-height:1;" title="Remover">×</button>`
        }
      </div>
      <div style="display:grid;gap:8px;">
        <div>
          <label style="font-size:11px;color:var(--gray-400);font-weight:600;text-transform:uppercase;display:block;margin-bottom:4px;">Meta MRR (R$)</label>
          <input type="number" class="mgmt-inline-input" style="width:100%;" value="${meta.metaMRR}"
            onchange="updateGestorMeta('${m}','metaMRR',parseFloat(this.value)||0)">
        </div>
        <div>
          <label style="font-size:11px;color:var(--gray-400);font-weight:600;text-transform:uppercase;display:block;margin-bottom:4px;">Meta One Shot (R$)</label>
          <input type="number" class="mgmt-inline-input" style="width:100%;" value="${meta.metaOS}"
            onchange="updateGestorMeta('${m}','metaOS',parseFloat(this.value)||0)">
        </div>
      </div>
    </div>`;
  }).join('') +

  // Card para adicionar novo mês
  `<div style="background:white;border-radius:var(--radius);border:2px dashed var(--gray-200);padding:1rem;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:160px;">
    <div style="font-size:13px;font-weight:600;color:var(--gray-400);">➕ Adicionar mês</div>
    <select id="new-meta-mes" style="font-size:12px;font-family:var(--font);padding:7px 10px;border:1.5px solid var(--gray-200);border-radius:8px;outline:none;width:100%;color:var(--gray-800);">
      <option value="">Selecione o mês...</option>
      ${MONTHS_ORDER.filter(m=>!allMetaMonths.includes(m)).map(m=>`<option value="${m}">${m}</option>`).join('')}
    </select>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;">
      <div>
        <label style="font-size:10px;color:var(--gray-400);font-weight:600;text-transform:uppercase;display:block;margin-bottom:3px;">Meta MRR</label>
        <input type="number" id="new-meta-mrr" placeholder="R$ 0" style="font-size:12px;font-family:var(--font);padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:8px;outline:none;width:100%;">
      </div>
      <div>
        <label style="font-size:10px;color:var(--gray-400);font-weight:600;text-transform:uppercase;display:block;margin-bottom:3px;">Meta One Shot</label>
        <input type="number" id="new-meta-os" placeholder="R$ 0" style="font-size:12px;font-family:var(--font);padding:6px 8px;border:1.5px solid var(--gray-200);border-radius:8px;outline:none;width:100%;">
      </div>
    </div>
    <button onclick="addGestorMeta()" class="add-row-btn" style="width:100%;">➕ Adicionar meta</button>
  </div>`;
}

function addGestorMeta() {
  var mes  = document.getElementById('new-meta-mes').value;
  var mrr  = parseFloat(document.getElementById('new-meta-mrr').value) || 0;
  var os   = parseFloat(document.getElementById('new-meta-os').value)  || 0;
  if (!mes) { toast('⚠ Selecione o mês!'); return; }
  GESTOR_METAS[mes] = { metaMRR: mrr, metaOS: os };
  salvarMetaGestorSupabase(mes, mrr, os);
  saveMetaGestorToSupabase(mes, mrr, os);
  document.getElementById('new-meta-mes').value = '';
  document.getElementById('new-meta-mrr').value = '';
  document.getElementById('new-meta-os').value  = '';
  renderMgmtMetas();
  renderGestor();
  toast('✅ Meta de ' + mes + ' adicionada!');
}

function removeGestorMeta(mes) {
  if (!confirm('Remover meta de ' + mes + '?')) return;
  delete GESTOR_METAS[mes];
  renderMgmtMetas();
  renderGestor();
  toast('🗑 Meta de ' + mes + ' removida.');
}

function updateGestorMeta(mes, field, value) {
  if (!GESTOR_METAS[mes]) GESTOR_METAS[mes] = { metaMRR: 0, metaOS: 0 };
  GESTOR_METAS[mes][field] = value;
  saveMetaGestorToSupabase(mes, GESTOR_METAS[mes].metaMRR, GESTOR_METAS[mes].metaOS);
  renderGestor();
  toast('✅ Meta salva!');
}

function refreshAllViews() {
  renderAll();
  renderEvo();
  renderPending();
  renderBacklog();
  renderComissoes();
  renderMgmtTable();
}


// ==========================================
// SUPABASE INTEGRATION
// ==========================================
var SUPA_URL = 'https://cktsokalrtnxnqhnoukq.supabase.co';
var SUPA_KEY = 'sb_publishable_J4zbhqu8ok8GkEHTi477BA_zwsA3-vL';

async function supaFetch(path, method='GET', body=null) {
  var opts = {
    method,
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer': method==='POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(SUPA_URL + '/rest/v1/' + path, opts);
  if (!res.ok) {
    var err = await res.text();
    console.error('Supabase error:', err);
    return null;
  }
  var txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

// ── LOAD ALL DATA FROM SUPABASE
async function loadFromSupabase() {
  showLoader('Carregando dados...');
  try {
    // Load tpv_data
    var data = await supaFetch('tpv_data?order=mes,nome');
    if (data && data.length > 0) {
      allData = data.map(r => ({
        nome: r.nome, mes: r.mes, executivo: r.executivo||'',
        informado: parseFloat(r.informado)||0,
        real: parseFloat(r.real)||0,
        momento: parseFloat(r.momento)||0,
        mrr: parseFloat(r.mrr)||0,
        oneshot: parseFloat(r.oneshot)||0,
        status_impl: r.status_impl||'',
        _id: r.id
      }));
    }

    // Load motivos
    var mots = await supaFetch('tpv_motivos?select=*');
    if (mots) {
      motivos = {};
      mots.forEach(m => {
        motivos[m.chave] = { exec: m.exec_nome, cat: m.categoria, text: m.texto };
      });
    }

    // Load backlog
    var bklog = await supaFetch('tpv_backlog?select=*');
    if (bklog) {
      backlogData = {};
      bklog.forEach(b => { backlogData[b.chave] = { etapa: b.etapa, motivo: b.motivo }; });
    }

    // Load metas gestor
    var metas = await supaFetch('tpv_metas_gestor?select=*');
    if (metas) {
      metas.forEach(m => {
        GESTOR_METAS[m.mes] = { metaMRR: parseFloat(m.meta_mrr)||0, metaOS: parseFloat(m.meta_os)||0 };
      });
    }

    hideLoader();

    if (allData.length > 0) {
      initDashboard();
    } else {
      // No data in DB yet — load from embedded data
      allData = EMBEDDED_DATA;
      if (allData.length > 0) {
        await saveAllDataToSupabase();
        initDashboard();
      }
    }
  } catch(e) {
    console.error('Load error:', e);
    hideLoader();
    // Fallback to embedded data
    allData = EMBEDDED_DATA;
    if (allData.length > 0) initDashboard();
    toast('⚠ Offline — usando dados locais');
  }
}

// ── SAVE SINGLE ROW TO SUPABASE
async function saveRowToSupabase(row) {
  await supaFetch('tpv_data?on_conflict=nome,mes', 'POST', [{
    nome: row.nome, mes: row.mes, executivo: row.executivo||'',
    informado: row.informado||0, real: row.real||0, momento: row.momento||0,
    mrr: row.mrr||0, oneshot: row.oneshot||0, status_impl: row.status_impl||'',
    updated_at: new Date().toISOString()
  }]);
}

// ── SAVE ALL DATA (initial upload)
async function saveAllDataToSupabase() {
  var batch = allData.map(r => ({
    nome: r.nome, mes: r.mes, executivo: r.executivo||'',
    informado: r.informado||0, real: r.real||0, momento: r.momento||0,
    mrr: r.mrr||0, oneshot: r.oneshot||0, status_impl: r.status_impl||'',
    updated_at: new Date().toISOString()
  }));
  await supaFetch('tpv_data?on_conflict=nome,mes', 'POST', batch);
  toast('✅ Dados salvos no banco!');
}

// ── DELETE ROW FROM SUPABASE
async function deleteRowFromSupabase(nome, mes) {
  await supaFetch(`tpv_data?nome=eq.${encodeURIComponent(nome)}&mes=eq.${encodeURIComponent(mes)}`, 'DELETE');
}

// ── SAVE MOTIVO TO SUPABASE
async function saveMotivoToSupabase(chave, exec, cat, text) {
  await supaFetch('tpv_motivos?on_conflict=chave', 'POST', [{
    chave, exec_nome: exec, categoria: cat, texto: text,
    updated_at: new Date().toISOString()
  }]);
}

// ── SAVE BACKLOG TO SUPABASE
async function saveBacklogToSupabase(chave, etapa, motivo) {
  await supaFetch('tpv_backlog?on_conflict=chave', 'POST', [{
    chave, etapa, motivo, updated_at: new Date().toISOString()
  }]);
}

// ── SAVE META GESTOR TO SUPABASE
async function saveMetaGestorToSupabase(mes, metaMRR, metaOS) {
  await supaFetch('tpv_metas_gestor?on_conflict=mes', 'POST', [{
    mes, meta_mrr: metaMRR, meta_os: metaOS,
    updated_at: new Date().toISOString()
  }]);
}

// ── LOADER UI
function showLoader(msg) {
  var el = document.getElementById('supa-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'supa-loader';
    el.style.cssText = 'position:fixed;top:56px;left:0;right:0;background:var(--blue);color:white;text-align:center;padding:8px;font-size:12px;font-weight:600;z-index:999;';
    document.body.appendChild(el);
  }
  el.textContent = '⏳ ' + msg;
  el.style.display = 'block';
}
function hideLoader() {
  var el = document.getElementById('supa-loader');
  if (el) el.style.display = 'none';
}



// ── DADOS E INICIALIZAÇÃO
var _dashData = [{"nome": "Choperia palmitense Lucas", "mes": "Janeiro", "executivo": "GUSTAVO MATHEUS", "informado": 500000.0, "real": 209992.17, "momento": 209992.17, "mrr": 2976.21, "oneshot": 2000.0, "status_impl": "IMPLANTADA"}, {"nome": "Choperia palmitense Sinop", "mes": "Janeiro", "executivo": "GUSTAVO MATHEUS", "informado": 500000.0, "real": 139825.01, "momento": 139825.01, "mrr": 4009.26, "oneshot": 11000.0, "status_impl": "IMPLANTADA"}, {"nome": "QUIOSQUE DO SOLON", "mes": "Janeiro", "executivo": "CHARLES CIPRIANO", "informado": 90000.0, "real": 163318.63, "momento": 163318.63, "mrr": 5635.69, "oneshot": 5200.0, "status_impl": "IMPLANTADA"}, {"nome": "Essepę", "mes": "Janeiro", "executivo": "KAIQUE OLIVEIRA", "informado": 120000.0, "real": 175724.59, "momento": 175724.59, "mrr": 5939.62, "oneshot": 8892.48, "status_impl": "IMPLANTADA"}, {"nome": "PARADA OBRIGATORIA", "mes": "Janeiro", "executivo": "GUSTAVO MATHEUS", "informado": 80000.0, "real": 51212.51, "momento": 51212.51, "mrr": 1736.23, "oneshot": 9400.0, "status_impl": "IMPLANTADA"}, {"nome": "Estancia Casa Na Arvore", "mes": "Janeiro", "executivo": "NATALIE STEFFANINI", "informado": 30000.0, "real": 27545.9, "momento": 27545.9, "mrr": 1136.78, "oneshot": 2800.0, "status_impl": "IMPLANTADA"}, {"nome": "Beco Bar Porto Velho", "mes": "Janeiro", "executivo": "NATALIE STEFFANINI", "informado": 150000.0, "real": 56917.5, "momento": 56917.5, "mrr": 2034.32, "oneshot": 5137.0, "status_impl": "IMPLANTADA"}, {"nome": "Caipirao Beer - Rio Preto", "mes": "Janeiro", "executivo": "RENATO PASSARETI", "informado": 250000.0, "real": 36391.48, "momento": 36391.48, "mrr": 1350.0, "oneshot": 10500.0, "status_impl": "IMPLANTADA"}, {"nome": "SANTO CHOPP CAIEIRAS", "mes": "Janeiro", "executivo": "NATALIE STEFFANINI", "informado": 90000.0, "real": 7935.35, "momento": 7935.35, "mrr": 800.0, "oneshot": 2700.0, "status_impl": "IMPLANTADA"}, {"nome": "The Vinil Pub", "mes": "Janeiro", "executivo": "KAIQUE OLIVEIRA", "informado": 80000.0, "real": 52553.22, "momento": 52553.22, "mrr": 1789.0, "oneshot": 4600.0, "status_impl": "IMPLANTADA"}, {"nome": "Mirante Atins", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 24882.7, "momento": 24882.7, "mrr": 750.0, "oneshot": 5000.0, "status_impl": ""}, {"nome": "Sushi Rancharia INT Atins", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 16532.08, "momento": 16532.08, "mrr": 750.0, "oneshot": 5000.0, "status_impl": ""}, {"nome": "Sushi Rancharia EXT Atins", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 1025.4, "momento": 1025.4, "mrr": 750.0, "oneshot": 5000.0, "status_impl": ""}, {"nome": "ÇA-VÁ RESTAURANTE ATINS", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 400000.0, "real": 90583.9, "momento": 90583.9, "mrr": 1757.46, "oneshot": 6000.0, "status_impl": ""}, {"nome": "BEACH BAR ATINS", "mes": "Fevereiro", "executivo": "CHARLES CIPRIANO", "informado": 600000.0, "real": 134801.51, "momento": 134801.51, "mrr": 2615.28, "oneshot": 19000.0, "status_impl": ""}, {"nome": "CERVEJARIA 4-6-2 BREWPUB", "mes": "Fevereiro", "executivo": "NATALIE STEFFANINI", "informado": 90000.0, "real": 73888.11, "momento": 73888.11, "mrr": 2475.34, "oneshot": 4400.0, "status_impl": ""}, {"nome": "BEBE E VAZA", "mes": "Fevereiro", "executivo": "NATALIE STEFFANINI", "informado": 150000.0, "real": 5853.06, "momento": 5853.06, "mrr": 850.47, "oneshot": 2144.0, "status_impl": ""}, {"nome": "Canto Gourmet", "mes": "Fevereiro", "executivo": "NATALIE STEFFANINI", "informado": 150000.0, "real": 81660.1, "momento": 81660.1, "mrr": 2029.15, "oneshot": 3188.0, "status_impl": ""}, {"nome": "CASTER CLUB - VILA FORMOSA", "mes": "Fevereiro", "executivo": "RENATO PASSARETI", "informado": 1000000.0, "real": 2063058.0, "momento": 2063058.0, "mrr": 15778.0, "oneshot": 37050.0, "status_impl": ""}, {"nome": "Queijaria", "mes": "Março", "executivo": "NATALIE STEFFANINI", "informado": 400000.0, "real": 372334.31, "momento": 372334.31, "mrr": 6292.67, "oneshot": 8400.0, "status_impl": "IMPLANTADA"}, {"nome": "Flamula", "mes": "Março", "executivo": "NATALIE STEFFANINI", "informado": 200000.0, "real": 123500.78, "momento": 123500.78, "mrr": 3861.01, "oneshot": 6360.0, "status_impl": "IMPLANTADA"}, {"nome": "ESQUINA BAR BRASA MUSICA E AMIGOS", "mes": "Março", "executivo": "NATALIE STEFFANINI", "informado": 50000.0, "real": 102.0, "momento": 102.0, "mrr": 91.93, "oneshot": 4898.0, "status_impl": "IMPLANTADA"}, {"nome": "Ginástico Club", "mes": "Março", "executivo": "NATALIE STEFFANINI", "informado": 70000.0, "real": 72800.17, "momento": 72800.17, "mrr": 2500.96, "oneshot": 3245.0, "status_impl": "IMPLANTADA"}, {"nome": "Primeira Saida Bar e Restaurante", "mes": "Março", "executivo": "KAIQUE OLIVEIRA", "informado": 200000.0, "real": 78048.29, "momento": 78048.29, "mrr": 2221.88, "oneshot": 9500.0, "status_impl": "IMPLANTADA"}, {"nome": "Siri Jack", "mes": "Março", "executivo": "KAIQUE OLIVEIRA", "informado": 180000.0, "real": 111238.43, "momento": 111238.43, "mrr": 2439.82, "oneshot": 5125.0, "status_impl": "IMPLANTADA"}, {"nome": "Bar Da Lora", "mes": "Março", "executivo": "KAIQUE OLIVEIRA", "informado": 120000.0, "real": 242699.63, "momento": 242699.63, "mrr": 7186.39, "oneshot": 5300.0, "status_impl": "IMPLANTADA"}, {"nome": "Primavera Bar e Restaurante", "mes": "Março", "executivo": "CHARLES CIPRIANO", "informado": 75000.0, "real": 48605.49, "momento": 48605.49, "mrr": 1676.98, "oneshot": 12700.0, "status_impl": "IMPLANTADA"}, {"nome": "Ministerios palavra da vida", "mes": "Março", "executivo": "GUSTAVO MATHEUS", "informado": 70000.0, "real": 62333.33, "momento": 62333.33, "mrr": 1496.02, "oneshot": 5500.0, "status_impl": "IMPLANTADA"}, {"nome": "Beco- Bebidas e Comidas", "mes": "Março", "executivo": "GUSTAVO MATHEUS", "informado": 50000.0, "real": 24242.0, "momento": 24242.0, "mrr": 800.1, "oneshot": 1480.0, "status_impl": "IMPLANTADA"}, {"nome": "Show Bar", "mes": "Março", "executivo": "KAIQUE OLIVEIRA", "informado": 300000.0, "real": 297540.65, "momento": 297540.65, "mrr": 9848.81, "oneshot": 9800.0, "status_impl": "IMPLANTADA"}, {"nome": "Tayo Sushi", "mes": "Março", "executivo": "GUSTAVO MATHEUS", "informado": 70000.0, "real": 72094.63, "momento": 72094.63, "mrr": 2451.31, "oneshot": 3150.0, "status_impl": "IMPLANTADA"}, {"nome": "Restaurante JN", "mes": "Março", "executivo": "IGOR LUIS", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 3280.0, "status_impl": "IMPLANTADA"}, {"nome": "Rocket Vaquejada", "mes": "Março", "executivo": "RENATO PASSARETI", "informado": 600000.0, "real": 465070.84, "momento": 465070.84, "mrr": 6459.83, "oneshot": 7500.0, "status_impl": "IMPLANTADA"}, {"nome": "FOGO E LENHA", "mes": "Abril", "executivo": "KAIQUE OLIVEIRA", "informado": 40000.0, "real": 15622.0, "momento": 15622.0, "mrr": 494.71, "oneshot": 1950.0, "status_impl": "IMPLANTADA"}, {"nome": "CABANA DA MARA", "mes": "Abril", "executivo": "KAIQUE OLIVEIRA", "informado": 40000.0, "real": 3832.65, "momento": 3832.65, "mrr": 128.8, "oneshot": 1950.0, "status_impl": "IMPLANTADA"}, {"nome": "O VARAL", "mes": "Abril", "executivo": "KAIQUE OLIVEIRA", "informado": 150000.0, "real": 77363.77, "momento": 77363.77, "mrr": 2486.55, "oneshot": 6000.0, "status_impl": "IMPLANTADA"}, {"nome": "MONTANHA CG", "mes": "Abril", "executivo": "KAIQUE OLIVEIRA", "informado": 50000.0, "real": 2525.52, "momento": 2525.52, "mrr": 83.31, "oneshot": 10000.0, "status_impl": "IMPLANTADA"}, {"nome": "SANTA MONICA TABOĂO", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 150000.0, "real": 2744.0, "momento": 2744.0, "mrr": 91.93, "oneshot": 8739.0, "status_impl": "IMPLANTADA"}, {"nome": "BEACH CHOPP", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 35000.0, "real": 10094.69, "momento": 10094.69, "mrr": 345.28, "oneshot": 6180.0, "status_impl": "IMPLANTADA"}, {"nome": "CASA ARTESANO", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 90000.0, "real": 4550.71, "momento": 4550.71, "mrr": 158.84, "oneshot": 5157.0, "status_impl": "IMPLANTADA"}, {"nome": "JS LOUNGE", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 40000.0, "real": 12941.0, "momento": 12941.0, "mrr": 455.55, "oneshot": 4529.0, "status_impl": "IMPLANTADA"}, {"nome": "LARGO DA CHOSEN", "mes": "Abril", "executivo": "NATALIE STEFFANINI", "informado": 200000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 3825.0, "status_impl": "IMPLANTADA"}, {"nome": "BAR DO NATANZIN", "mes": "Abril", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 3000.0, "status_impl": "IMPLANTADA"}, {"nome": "DON BUTEKO", "mes": "Abril", "executivo": "CHARLES CIPRIANO", "informado": 80000.0, "real": 94571.14, "momento": 94571.14, "mrr": 2423.11, "oneshot": 3250.0, "status_impl": "IMPLANTADA"}, {"nome": "VILA MOURAN", "mes": "Abril", "executivo": "CHARLES CIPRIANO", "informado": 80000.0, "real": 57957.1, "momento": 57957.1, "mrr": 1954.82, "oneshot": 8050.0, "status_impl": "IMPLANTADA"}, {"nome": "ESPAÇO VITORIA", "mes": "Abril", "executivo": "IGOR LUIS", "informado": 150000.0, "real": 33575.1, "momento": 33575.1, "mrr": 651.43, "oneshot": 6995.0, "status_impl": "IMPLANTADA"}, {"nome": "DL SERVIÇOS", "mes": "Abril", "executivo": "IGOR LUIS", "informado": 250000.0, "real": 65161.86, "momento": 65161.86, "mrr": 1420.97, "oneshot": 3000.0, "status_impl": ""}, {"nome": "Bilhares Carvalho", "mes": "Abril", "executivo": "GUSTAVO MATHEUS", "informado": 50000.0, "real": 14152.54, "momento": 14152.54, "mrr": 484.05, "oneshot": 4550.0, "status_impl": ""}, {"nome": "Duda BEER HOUSE", "mes": "Abril", "executivo": "GUSTAVO MATHEUS", "informado": 50000.0, "real": 18469.52, "momento": 18469.52, "mrr": 618.75, "oneshot": 3700.0, "status_impl": ""}, {"nome": "PLUR ARENA", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 30000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "CAIANAS GASTROBAR", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 100000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "ATINS BEACH BAR", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 40000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "AKI ESPETO (GRU)", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 150000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "VILA BEACH", "mes": "Maio", "executivo": "KAIQUE OLIVEIRA", "informado": 250000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "SHAKE N STIR BAR", "mes": "Maio", "executivo": "RENATO PASSARETI", "informado": 400000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "Nissin Miojolandia", "mes": "Maio", "executivo": "NATALIE STEFFANINI", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "ITA PARK EMPREENDIMENTOS E DIVERÇĂO", "mes": "Maio", "executivo": "NATALIE STEFFANINI", "informado": 300000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "PIRATA BAR", "mes": "Maio", "executivo": "NATALIE STEFFANINI", "informado": 250000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "QUINTAL SANTA LUZIA MG", "mes": "Maio", "executivo": "CHARLES CIPRIANO", "informado": 75000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "ATINS CHARME CHALES BA", "mes": "Maio", "executivo": "CHARLES CIPRIANO", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "LAGO AZUL ACQUA PARK", "mes": "Maio", "executivo": "GUSTAVO MATHEUS", "informado": 50000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "MEXE CLUB", "mes": "Maio", "executivo": "GUSTAVO MATHEUS", "informado": 300000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}, {"nome": "SERIGUELA RESTAURANTE", "mes": "Maio", "executivo": "GUSTAVO MATHEUS", "informado": 75000.0, "real": 0.0, "momento": 0.0, "mrr": 0.0, "oneshot": 0.0, "status_impl": "PENDENTE"}];

function startDashboard() {
  if (typeof Chart === 'undefined' || typeof initDashboard === 'undefined') {
    setTimeout(startDashboard, 100);
    return;
  }
  allData = _dashData;
  var uz = document.getElementById('upload-zone');
  var db = document.getElementById('dashboard');
  if (uz) uz.style.display = 'none';
  if (db) db.style.display = 'block';
  initDashboard();
  carregarDadosSalvos();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDashboard);
} else {
  startDashboard();
}
