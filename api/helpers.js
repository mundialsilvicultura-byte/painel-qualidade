// Helpers compartilhados: parse de CSV, normalizações, etc.

function parseCSV(txt){
  const linhas=[]; let campo='', linha=[], dentro=false;
  for(let i=0;i<txt.length;i++){
    const c=txt[i], prox=txt[i+1];
    if(dentro){
      if(c==='"'&&prox==='"'){campo+='"';i++;}
      else if(c==='"'){dentro=false;}
      else campo+=c;
    } else {
      if(c==='"')dentro=true;
      else if(c===','){linha.push(campo);campo='';}
      else if(c==='\n'){linha.push(campo);linhas.push(linha);linha=[];campo='';}
      else if(c==='\r'){}
      else campo+=c;
    }
  }
  if(campo!==''||linha.length){linha.push(campo);linhas.push(linha);}
  return linhas;
}

// mapa nome->índice pela linha indicada (linha 2 = índice 1 no padrão novo; linha 1 = índice 0 no formato datascope)
function mapaCabecalho(linhas, linhaIdx){
  const m={}; const hdr=linhas[linhaIdx]||[];
  hdr.forEach((nome,i)=>{ if(nome && String(nome).trim()) m[String(nome).trim()]=i; });
  return m;
}

function num(v){
  if(v==null||v==='') return null;
  if(typeof v==='number') return isNaN(v)?null:v;
  const s=String(v).trim().replace(',','.');
  // rígido como float() do Python: só converte se a string inteira for numérica
  if(!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return null;
  const n=parseFloat(s);
  return isNaN(n)?null:n;
}
function limpa(s){ return s==null?'':String(s).replace(/\s+/g,' ').trim(); }
function limparHorto(h){
  h=limpa(h);
  const m=h.match(/^\s*[A-Za-z]?\d+\s*[-\u2013]\s*(.+)$/);
  return m?limpa(m[1]):h;
}
function normData(v){ if(!v)return ''; return String(v).trim().replace(/\//g,'-'); }
function dataOuSub(op,sub){
  let d=normData(op);
  if(d && d.split(' ')[0] && d.split(' ')[0]!=='00-00-0000') return d;
  return normData(sub);
}
function eqOuUser(eqval,uval){
  let e=limpa(eqval); if(e)return e;
  let u=limpa(uval), ul=u.toLowerCase();
  if(ul.includes('flex')){
    if(ul.includes('gua'))return'Equipe Flex Guaíba';
    if(ul.includes('rato'))return'Equipe Flex Ratos';
    return u;
  }
  let m=u.match(/(\d+)/);
  if(m&&(ul.includes('equipe')||ul.includes('eqp')||ul.includes('eq')))return'Equipe '+m[1].padStart(2,'0');
  return '';
}
function mean(xs){ return xs.reduce((a,b)=>a+b,0)/xs.length; }
function r1(x){ return x==null?null:Math.floor(x*10+0.5)/10; }

// arredondamento meio-par (banker's), como o round() do Python. Resolve a
// maioria dos casos de fronteira; em pouquíssimos casos de precisão binária
// pode diferir 0,1 ponto — irrelevante na interpretação da nota.
function roundPy(x, dec){
  dec = dec||0;
  if(x==null) return null;
  const f = Math.pow(10, dec);
  const n = x * f;
  const floor = Math.floor(n);
  const diff = n - floor;
  if(Math.abs(diff - 0.5) < 1e-9){
    return ((floor % 2 === 0) ? floor : floor + 1) / f;
  }
  return Math.round(n) / f;
}

// busca um CSV (roda no servidor Vercel — sem CORS)
async function fetchCSV(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error('HTTP '+r.status+' em '+url);
  const txt = await r.text();
  if(txt.trim().startsWith('<')) throw new Error('Retornou HTML (publicação não é CSV?): '+url);
  return parseCSV(txt);
}

module.exports = { parseCSV, mapaCabecalho, num, limpa, limparHorto,
  normData, dataOuSub, eqOuUser, mean, r1, roundPy, fetchCSV };
