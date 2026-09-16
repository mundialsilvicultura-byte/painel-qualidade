const H = require('./helpers');

function faixa5(d){
  d=Math.abs(d);
  if(d<=5)return 100;
  if(d<=10)return 80;
  if(d<=15)return 70;
  return 0;
}

// linhasPrincipal + linhasQual (formulário); linhasConf = Conformaodepreparo (parâmetros)
function processarSubsolagem(linhasPrincipal, linhasConf, linhasQual){
  const mcp=H.mapaCabecalho(linhasConf,1);
  const confPorForm={};
  for(let r=2;r<linhasConf.length;r++){
    const row=linhasConf[r]; if(!row)continue;
    const fid=H.num(row[mcp['form_id']]); if(fid==null)continue;
    (confPorForm[Math.round(fid)]=confPorForm[Math.round(fid)]||[]).push({
      profCont:H.num(row[mcp['Profundidade contínua']]),
      loc:H.limpa(row[mcp['Localização do adubo']])
    });
  }
  const SUB=[], ADM=[]; const vistos={};
  const abas=[linhasPrincipal, linhasQual].filter(x=>x && x.length>=3);
  for(const linhasF of abas){
    const mp=H.mapaCabecalho(linhasF,1);
    for(let r=2;r<linhasF.length;r++){
      const row=linhasF[r]; if(!row)continue;
      const fid=H.num(row[mp['form_id']]); if(fid==null)continue;
      const fidI=Math.round(fid); if(vistos[fidI])continue; vistos[fidI]=1;
      const base={data:H.dataOuSub(row[mp['Data da avaliação:']], row[mp['created']]).slice(0,10),
        resp:H.limpa(row[mp['Responsável:']]),regional:row[mp['Regional']]||'',
        equipe:H.eqOuUser(row[mp['Equipe:']], row[mp['user']]),
        horto:H.limparHorto(row[mp['Horto Florestal:']]),talhao:H.limpa(row[mp['Talhão:']]),
        talhaoErro:false,obs:H.limpa(row[mp['Contramedidas e observações']])};
      const linhas=confPorForm[fidI]||[];
      // SUBSOLAGEM
      const profRec=H.num(row[mp['Profundidade recomendada:']]);
      const conts=linhas.map(l=>l.profCont).filter(x=>x!=null);
      let ncProfPct=null, profMed=null, notaProf=null;
      if(conts.length&&profRec){
        const lim=profRec*0.9;
        ncProfPct=H.roundPy(conts.filter(x=>x<lim).length/conts.length*100,1);
        profMed=H.roundPy(conts.reduce((a,b)=>a+b,0)/conts.length,1);
        notaProf=Math.max(0,H.roundPy(100-ncProfPct,1));
      }
      const loc_p=linhas.map(l=>l.loc).filter(x=>x);
      let ncLocPct=null, notaLoc=null;
      if(loc_p.length){
        const conf=loc_p.filter(v=>v.toUpperCase().trim().startsWith('C')&&!v.toUpperCase().trim().startsWith('NC')).length;
        ncLocPct=H.roundPy((loc_p.length-conf)/loc_p.length*100,1);
        notaLoc=Math.max(0,H.roundPy(100-ncLocPct,1));
      }
      const comps=[];
      if(notaProf!=null)comps.push([60,notaProf]);
      if(notaLoc!=null)comps.push([40,notaLoc]);
      const tot=comps.reduce((s,c)=>s+c[0],0);
      const nfSub=tot?H.roundPy(comps.reduce((s,c)=>s+c[0]*c[1],0)/tot,1):null;
      SUB.push({...base,form:fidI,opCode:String(row[mp['Operação:']]||''),
        profRec,profContMedia:profMed,nConts:conts.length,
        ncProfPct,notaProf,ncLocPct,notaLoc,notaFinal:nfSub});
      // ADUBACAO MECANIZADA
      const doseRecCol=mp['Dosagem adubo recomendada'];
      const doses=doseRecCol!=null?[1,2,3].map(k=>H.num(row[doseRecCol+k])):[];
      const doses_ok=doses.filter(x=>x!=null);
      const doseMed=doses_ok.length?Math.round(doses_ok.reduce((a,b)=>a+b,0)/doses_ok.length*100)/100:null;
      const drec_raw=H.num(row[mp['Dosagem adubo recomendada']]);
      const desvCols=doseRecCol!=null?[4,5,6].map(k=>H.num(row[doseRecCol+k])):[];
      const desvVals=desvCols.filter(x=>x!=null).map(x=>Math.abs(x));
      let desvMed=null, notaAdm=null, doseRecDisp=drec_raw;
      if(desvVals.length){
        desvMed=Math.round(desvVals.reduce((a,b)=>a+b,0)/desvVals.length*100)/100;
        notaAdm=faixa5(desvMed);
      } else if(doseMed!=null&&drec_raw){
        let dr=drec_raw, dm=doseMed;
        for(let i=0;i<6;i++){
          if(dm>0&&dr>0&&dr/dm>3)dm=dm*10;
          else if(dm>0&&dr>0&&dm/dr>3)dr=dr*10;
          else break;
        }
        if(dr){ desvMed=Math.round(Math.abs(dm-dr)/dr*100*100)/100; notaAdm=faixa5(desvMed); }
      }
      ADM.push({...base,form:fidI,doseRec:doseRecDisp,doseMed,desvMed,notaFinal:notaAdm});
    }
  }
  SUB.sort((a,b)=>a.form-b.form); ADM.sort((a,b)=>a.form-b.form);
  return {SUB, ADM};
}
module.exports = { processarSubsolagem };
