const H = require('./helpers');

function normTo(rec, v){
  if(v==null||v<=0||!rec) return null;
  for(let i=0;i<6;i++){
    if(rec/3<=v && v<=rec*3) return Math.round(v*100)/100;
    v = v<rec/3 ? v*10 : v/10;
  }
  return null;
}
const ACFG={t1:5,t2:10,t3:15,pEst:30,pCam:50,pLoc:20};
function aNotaFaixa(desvioPct){
  const d=Math.abs(desvioPct);
  if(d<=ACFG.t1)return 100;
  if(d<=ACFG.t2)return 80;
  if(d<=ACFG.t3)return 70;
  return 0;
}
const ANOM_LOC=['       - Adubo Phusion e Agroblen > 8 cm da muda; (9250) -> lenta absorção',
  '- Adubo Phusion e Agroblen < 5  cm da muda; (9250) -> lenta absorção',
  'Adubo exposto','Ausência de adubo',
  'Distância do adubo  > 15 cm da muda','Distância do adubo < 10 cm da muda'];
const ANOM_KEY=['adubo_8cm','adubo_5cm','exposto','ausencia','dist_15','dist_10'];
const TIPO={9311:'Manutenção',9224:'Cobertura',9250:'Arranque'};

function processarAdubacao(linhasPrincipal, linhasDados, linhasQual){
  const mpd=H.mapaCabecalho(linhasDados,1);
  const dosePorForm={};
  for(let r=2;r<linhasDados.length;r++){
    const row=linhasDados[r]; if(!row)continue;
    const fid=H.num(row[mpd['form_id']]); if(fid==null)continue;
    const grupo=['Amostra 1','Amostra 2','Amostra 3'].map(k=>H.num(row[mpd[k]]));
    (dosePorForm[Math.round(fid)]=dosePorForm[Math.round(fid)]||[]).push(grupo);
  }
  const ADU=[]; const vistos={};
  const abas=[linhasPrincipal, linhasQual].filter(x=>x && x.length>=3);
  for(const linhasF of abas){
    const mp=H.mapaCabecalho(linhasF,1);
    // mapa "strip" para achar anomalias com espaços estranhos
    const mpStrip={}; (linhasF[1]||[]).forEach((nome,i)=>{ if(nome)mpStrip[String(nome).trim()]=i; });
    for(let r=2;r<linhasF.length;r++){
      const row=linhasF[r]; if(!row)continue;
      const fid=H.num(row[mp['form_id']]); if(fid==null)continue;
      const fidI=Math.round(fid); if(vistos[fidI])continue; vistos[fidI]=1;
      const equipe=H.eqOuUser(row[mp['Equipe:']], row[mp['user']]);
      const data=H.dataOuSub(row[mp['Data da operação:']], row[mp['created']]);
      const horto=H.limparHorto(row[mp['Horto Florestal:']]);
      let doseRec=H.num(row[mp['Dose recomendada por planta']]);
      if(doseRec && doseRec>0 && doseRec<1) doseRec=Math.round(doseRec*1000*10)/10;
      let camValores=[]; for(let i=1;i<=5;i++){ const v=H.num(row[mp['Equipamento '+i]]); if(v!=null)camValores.push(v); }
      let colabs=[];
      for(const grupo of (dosePorForm[fidI]||[])){
        const am=grupo.filter(x=>x!=null);
        if(am.length)colabs.push(Math.round(am.reduce((a,b)=>a+b,0)/am.length*100)/100);
      }
      if(doseRec){
        colabs=colabs.map(v=>normTo(doseRec,v)).filter(x=>x!=null);
        camValores=camValores.map(v=>normTo(doseRec,v)).filter(x=>x!=null);
      }
      const locTipos={};
      ANOM_LOC.forEach((nome,i)=>{ const idx=mpStrip[nome.trim()]; const v=idx!=null?H.num(row[idx]):null; locTipos[ANOM_KEY[i]]=v?Math.round(v):0; });
      const ltd=H.num(row[mp['Total de desvios']]);
      const locTotalDesv=ltd!=null?Math.round(ltd):Object.values(locTipos).reduce((a,b)=>a+b,0);
      const locNC=H.roundPy(locTotalDesv/50*100,1);
      const R=doseRec; let notaEst=null;
      if(colabs.length&&R){
        const conf=colabs.filter(cc=>Math.abs((cc-R)/R*100)<=ACFG.t1).length;
        notaEst=Math.round(conf/colabs.length*1000)/10;
      }
      let notaCam=null, desvCam=0, camFlag=false;
      if(camValores.length&&R){
        const mc=camValores.reduce((a,b)=>a+b,0)/camValores.length; desvCam=(mc-R)/R*100;
        notaCam=aNotaFaixa(desvCam);
        if(Math.abs(desvCam)>8)camFlag=true;
      }
      const notaLoc=Math.max(0,100-locNC);
      const comps=[];
      if(notaEst!=null)comps.push([ACFG.pEst,notaEst]);
      if(notaCam!=null)comps.push([ACFG.pCam,notaCam]);
      comps.push([ACFG.pLoc,notaLoc]);
      const tot=comps.reduce((s,c)=>s+c[0],0);
      const notaFinal=tot?H.roundPy(comps.reduce((s,c)=>s+c[0]*c[1],0)/tot,1):null;
      let opRaw=row[mp['Operação:']];
      let opCode=null;
      const on=H.num(opRaw); if(on!=null)opCode=Math.round(on);
      ADU.push({form:fidI,data,encarregado:H.limpa(row[mp['Encarregado']]),
        regional:row[mp['Regional']]||'',equipe,horto,
        talhao:H.limpa(row[mp['Talhão:']]),talhaoErro:false,
        doseRec,colabs,camValores,locTipos,locTotalDesv,locNC,
        biOrig:locNC,obs:H.limpa(row[mp['Ação corretiva e observações:']]),
        opCode,tipoOp:TIPO[opCode]||'Outro',
        notaEst,notaCam,notaLoc,desvCam:Math.round(desvCam*10)/10,
        camFlag,notaFinal});
    }
  }
  ADU.sort((a,b)=>a.form-b.form);
  return ADU;
}
module.exports = { processarAdubacao };
