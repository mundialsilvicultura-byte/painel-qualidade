const H = require('./helpers');

const QA_CODES=new Set(['9102','9201','9209','9203','9215','9250','9224','9311','9227',
  '9112','9207','9302','9304','9308','9309','9104','9120','9121','9125']);
const CODE_ATIV={'9102':'Formiga','9201':'Formiga','9209':'Formiga','9203':'Plantio','9215':'Replantio',
  '9250':'Adubação','9224':'Adubação','9311':'Adubação','9227':'Adubação',
  '9112':'Capina','9207':'Capina','9302':'Capina','9304':'Capina','9308':'Capina','9309':'Capina','9104':'Capina',
  '9120':'Subsolagem','9121':'Subsolagem','9125':'Subsolagem'};
const AD_EQUIPES=new Set(["Equipe 01","Equipe 02","Equipe 03","Equipe 04","Equipe 05","Equipe 06","Equipe 07","Equipe 08","Equipe 09","Equipe 13","Equipe 21","Equipe 22","Equipe 23","Equipe 38","Flex Guaíba","Flex Ratos"]);

function extraiCod(txt){ const m=String(txt).match(/-\s*(\d{4})\s*-/); return m?m[1]:null; }
function normEq(u){
  u=String(u||'').trim().toUpperCase();
  let m=u.match(/EQUIPE\s*0*(\d+)/);
  if(m)return 'Equipe '+m[1].padStart(2,'0');
  if(u.includes('FLEX')&&(u.includes('RATO')||u.includes(' II')||u.includes('FLEX 2')||u.includes('FLEX2')))return 'Flex Ratos';
  if(u.includes('FLEX')&&(u.includes('GUA')||u.includes(' I')||u.includes('FLEX 1')||u.includes('FLEX1')))return 'Flex Guaíba';
  return u.charAt(0)+u.slice(1).toLowerCase();
}
function normDataISO(v){
  // aceita datetime string dd/mm/aaaa ou aaaa-mm-dd; retorna aaaa-mm-dd
  if(!v)return null;
  const s=String(v).trim();
  let m=s.match(/(\d{4})-(\d{2})-(\d{2})/); if(m)return m[1]+'-'+m[2]+'-'+m[3];
  m=s.match(/(\d{2})\/(\d{2})\/(\d{4})/); if(m)return m[3]+'-'+m[2]+'-'+m[1];
  m=s.match(/(\d{2})-(\d{2})-(\d{4})/); if(m)return m[3]+'-'+m[2]+'-'+m[1];
  return null;
}

// linhasManual, linhasMec: abas de produção (atividade + área). linhasGeral: aba Produção (evento/mau tempo)
function processarProducao(linhasManual, linhasMec, linhasGeral){
  const cel={}; // (eq|data) -> {areaQA, areaSem, ativs:{}}
  function addCel(eq,d,cod,area){
    const k=eq+'|'+d;
    if(!cel[k])cel[k]={areaQA:0,areaSem:0,ativs:{}};
    if(QA_CODES.has(cod)){ cel[k].areaQA+=area; const a=CODE_ATIV[cod]; cel[k].ativs[a]=(cel[k].ativs[a]||0)+area; }
    else cel[k].areaSem+=area;
  }
  for(const [linhas,acol,arcol] of [[linhasManual,'Atividade',21],[linhasMec,null,null]]){
    if(!linhas||linhas.length<3)continue;
    const mp=H.mapaCabecalho(linhas,1);
    // achar coluna de atividade e área por nome (fallback por índice)
    const atvIdx = mp['Atividade'] != null ? mp['Atividade'] : (linhas===linhasMec ? 22 : 18);
    // área e data e user por índice do padrão conhecido
    const userIdx=mp['user']!=null?mp['user']:4;
    const createdIdx=mp['created']!=null?mp['created']:0;
    for(let r=2;r<linhas.length;r++){
      const row=linhas[r]; if(!row)continue;
      const u=row[userIdx], dt=row[createdIdx], a=row[atvIdx];
      if(!(u&&dt&&a))continue;
      const cod=extraiCod(a); if(!cod)continue;
      // área: procurar por 'Área executada' ou índice conhecido
      let areaIdx=mp['Área executada']!=null?mp['Área executada']:(mp['Area executada']!=null?mp['Area executada']:(linhas===linhasMec?25:20));
      const area=H.num(row[areaIdx])||0;
      const eq=normEq(u), d=normDataISO(dt);
      if(!d)continue;
      addCel(eq,d,cod,area);
    }
  }
  // eventos Mau tempo
  const maus=new Set();
  if(linhasGeral&&linhasGeral.length>=2){
    const mg=H.mapaCabecalho(linhasGeral,0); // aba Produção: cabeçalho linha 1
    const eIdx=mg['Evento']!=null?mg['Evento']:8;
    const eqIdx=mg['Equipe']!=null?mg['Equipe']:3;
    const dIdx=mg['Data da operação']!=null?mg['Data da operação']:2;
    for(let r=1;r<linhasGeral.length;r++){
      const row=linhasGeral[r]; if(!row)continue;
      const e=String(row[eIdx]||'').trim();
      const eq=normEq(row[eqIdx]); const d=normDataISO(row[dIdx]);
      if(!d)continue;
      if(e==='Mau tempo')maus.add(eq+'|'+d);
    }
  }
  // montar saída
  const saida={};
  const chaves=new Set([...Object.keys(cel), ...maus]);
  for(const k of chaves){
    const [eq,d]=k.split('|');
    if(!AD_EQUIPES.has(eq))continue;
    const c=cel[k]||{areaQA:0,areaSem:0,ativs:{}};
    const chuva=maus.has(k);
    const temQA=c.areaQA>0, temSem=c.areaSem>0;
    let tipo=null;
    if(temQA&&c.areaQA>=c.areaSem)tipo='qa';
    else if(temSem)tipo='semqa';
    else if(temQA)tipo='qa';
    else tipo=chuva?'chuva_only':null;
    if(tipo==null)continue;
    let ativPred=null;
    const ativs=Object.entries(c.ativs);
    if(ativs.length)ativPred=ativs.sort((a,b)=>b[1]-a[1])[0][0];
    if(!saida[eq])saida[eq]={};
    saida[eq][d]={tipo,chuva,ativ:ativPred};
  }
  return saida;
}
module.exports = { processarProducao };
