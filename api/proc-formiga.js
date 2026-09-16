const H = require('./helpers');

// Formiga vem no formato "datascope": aba única, cabeçalhos na LINHA 1 (índice 0), dados a partir da linha 2.
const FTIPO={'9102':'Combate','9201':'Primeiro Repasse','9209':'Segundo Repasse'};
const FDOSE={'9102':4.3,'9201':2.2,'9209':1.8};

function normDoseFormiga(v){
  if(v==null)return null; v=Number(v);
  if(v<=0)return null;
  for(let i=0;i<6;i++){
    if(v>=1&&v<=10)return Math.round(v*100)/100;
    v = v<1 ? v*10 : v/10;
  }
  return Math.round(v*100)/100;
}

function processarFormiga(linhasPrincipal, linhasQual){
  const FG=[]; const vistos={};
  const abas=[linhasPrincipal, linhasQual].filter(x=>x && x.length>=2);
  for(const linhas of abas){
    // detecta em qual linha está o cabeçalho: procura 'Código de formulário' ou 'form_id'
    let hdrIdx=0;
    for(let li=0; li<Math.min(3,linhas.length); li++){
      const row=linhas[li]||[];
      if(row.some(c=>{const s=String(c||'').trim(); return s==='Código de formulário'||s==='form_id';})){ hdrIdx=li; break; }
    }
    const mp=H.mapaCabecalho(linhas,hdrIdx);
    const g=(row,nome)=>{ const i=mp[nome]; return i!=null?row[i]:null; };
    // aceita tanto 'Código de formulário' (datascope) quanto 'form_id' (padrão)
    const fidNome = mp['Código de formulário']!=null ? 'Código de formulário' : 'form_id';
    for(let r=hdrIdx+1;r<linhas.length;r++){
      const row=linhas[r]; if(!row)continue;
      const fid=H.num(g(row,fidNome)); if(fid==null)continue;
      const fidI=Math.round(fid); if(vistos[fidI])continue; vistos[fidI]=1;
      processarLinhaFormiga(FG, row, g);
    }
  }
  FG.sort((a,b)=>a.form-b.form);
  return FG;
}

function processarLinhaFormiga(FG, row, g){
    const fid=H.num(g(row,'Código de formulário')!=null?g(row,'Código de formulário'):g(row,'form_id'));
    const fidI=Math.round(fid);
    let opRaw=g(row,'Operação');
    let opCode=''; const on=H.num(opRaw); if(on!=null)opCode=String(Math.round(on)); else opCode=String(opRaw||'').trim();
    const prevTempo=String(g(row,'Previsão do tempo')||'');
    let doseRec=normDoseFormiga(H.num(g(row,'Dose recomendada')));
    const distLRec=H.num(g(row,'Distância recomendada na linha'));
    const distELRec=H.num(g(row,'Distância recomendada na entrelinha'));
    let am=[1,2,3].map(i=>H.num(g(row,`Amostra ${i} (Amostra pesada de isca)`))).filter(x=>x!=null);
    let doseMed=null;
    if(am.length){
      let m0=am.reduce((a,b)=>a+b,0)/am.length;
      if(doseRec && m0>doseRec*2) m0=m0/3;
      doseMed=normDoseFormiga(m0);
    }
    let dL=[1,2,3].map(i=>H.num(g(row,`Distância medida ${i} (Distância média (m) na linha)`))).filter(x=>x!=null);
    let dEL=[1,2,3].map(i=>H.num(g(row,`Distância medida ${i} (Distância média (m) na entrelinha)`))).filter(x=>x!=null);
    const distLMed=dL.length?Math.round(dL.reduce((a,b)=>a+b,0)/dL.length*100)/100:null;
    const distELMed=dEL.length?Math.round(dEL.reduce((a,b)=>a+b,0)/dEL.length*100)/100:null;
    const desvDistL=(distLMed!=null&&distLRec)?Math.round((distLMed-distLRec)/distLRec*100*10)/10:null;
    const desvDistEL=(distELMed!=null&&distELRec)?Math.round((distELMed-distELRec)/distELRec*100*10)/10:null;
    const locRaw=g(row,'Localização da isca');
    const locNC=(typeof locRaw==='number')?Math.round(locRaw):(H.num(locRaw)!=null?Math.round(H.num(locRaw)):0);
    const notaLoc=Math.max(0,H.roundPy(100-locNC/10*100,1));
    const notaAF=H.num(g(row,'Nota da Avaliação'));
    const notaCob=(notaAF!=null&&notaAF>0)?notaAF:100;
    let desvDose=null, notaDose=null, ncDose=null;
    if(doseMed!=null&&doseRec){
      desvDose=Math.round((doseMed-doseRec)/doseRec*100*10)/10;
      notaDose=Math.abs(desvDose)>10?0:100; ncDose=notaDose===0;
    }
    const notaCond=prevTempo.includes('2 -')?100:0;
    let comps=[[20,notaDose],[25,notaLoc],[30,notaCond],[25,notaCob]].filter(c=>c[1]!=null);
    const tot=comps.reduce((s,c)=>s+c[0],0);
    const nf=tot?H.roundPy(comps.reduce((s,c)=>s+c[0]*c[1],0)/tot,1):null;
    FG.push({form:fidI,data:H.dataOuSub(g(row,'Data da operação'),g(row,'data')).slice(0,10),opCode,
      encarregado:H.limpa(g(row,'Equipe')),regional:g(row,'Regional')||'',
      equipe:H.eqOuUser(g(row,'Equipe'),g(row,'Nome de usuário')),
      horto:H.limparHorto(g(row,'Horto Florestal')),talhao:H.limpa(g(row,'Talhão')),talhaoErro:false,
      prevTempo:prevTempo.slice(0,50),umidade:String(g(row,'Umidade')||'').slice(0,30),
      doseRec,doseMed,desvDose,ncDose,distLRec,distLMed,desvDistL,distELRec,distELMed,desvDistEL,
      locNC,notaDose,notaLoc,notaCond,notaCob,notaFinal:nf,
      obs:H.limpa(g(row,'Ação corretiva e observações:')),
      tipoOp:FTIPO[opCode]||'Outro',doseRefHa:FDOSE[opCode]||null});
}
module.exports = { processarFormiga };
