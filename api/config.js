// ============================================================
//  CONFIGURAÇÃO DAS PLANILHAS
//  Cole aqui a BASE do link publicado de cada atividade e os
//  gids de cada aba. (Arquivo → Compartilhar → Publicar na web
//  → CSV; o gid de cada aba está no #gid=... da URL da aba.)
//
//  BASE = a parte antes de &gid, terminando em ?output=csv
//  Ex.:  https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
// ============================================================

module.exports = {

  plantio: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJDvvYbFUOHBGR3v7NUB46L18QEEjHUzH0a4sMTnM2-yUF_m29uxVZM7O6qdHnn_wSJi4AzwpoxJxI/pub?output=csv",
    abas: {
      principal:  "1106197588",   // Plantio-503446
      parametros: "72759821",   // ParmetrosdePlantio-503446
      qual:       "1243754569"          // Qual.-Plantio-fev23 (versão antiga)
    }
  },

  replantio: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2CVV7Eo0Y0xQ6IMTQUbBRVZQy1Worlb_emvapdnSOCK_IKdsw6f6Byq65i04kfJC44RQYYQa7UhRd/pub?output=csv",
    abas: {
      principal:  "432983061",  // Replantio-596454
      parametros: "1924169681"  // ParmetrosdeReplantio-596454
    }
  },

  capina: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRtefJ3AQXRuhmaEkS5Lpft9I-KnnX2qXv2SETDBjkFZpn--CnY-n6dUtudHlIc2whGriwv1MU-L3pe/pub?output=csv",
    abas: {
      principal:  "1563976590",     // CapinaQuímicaManual-668849
      dose:       "811504204",          // Amostragemdose-668849
      caminhamento:"1536299973", // Amostragemcaminhamento-668849
      qual:       "1142585420"           // Qual.-CapinaQuímicaManual
    }
  },

  adubacao: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK-D_OgMPG9XBu5iEI7372V13_a9ruPMi5XzsXJCSGsXe6Lg0dOVLCcN2drS_JomHn_ccMgkxGWUy/pub?output=csv",
    abas: {
      principal:  "1428249926",   // Adubação-504054
      dados:      "1596835929",       // dadosdaavaliao-504054
      qual:       "1592371361"         // Qual.-AdubaçãoManual-fev23
    }
  },

  formiga: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYnkBeOzZNPLrCcwSDvC3gRvuh1MwL3G7pCtiA1xJ5-R9KPpjdmDL3LbsNw_4ORGHRWHSXYc70rE47/pub?output=csv",
    abas: {
      principal:  "1805327260",   // Combate a Formiga (cabeçalho na linha 1)
      qual:       "1070423420"    // Qual. antiga
    }
  },

  subsolagem: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQTs5lCgCM5KdYcqc00GFgeBAwg5WaHaUNYWg5pqK2bRIKm4ykTcBLPd9_j8oin0IibDv9Yet2xlZU/pub?output=csv",
    abas: {
      principal:  "1802982946", // Subsolagem-503914
      conformacao:"243943851",// Conformaodepreparo-503914
      qual:       "1075999276"        // Qual.-Subsolagem-fev23
    }
  },

  producao: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRxkCzcYRDwiz-52bRyvlAbGmoDWaHk12f2y3X0zLl9Je4kjcD1DwXsW4jhMGgqJ_OynTc8mSmJd9Fy/pub?output=csv",
    abas: {
      manual:     "725924708",       // ProduoManual
      mecanizada: "669628848",    // ProduoMecanizada
      geral:      "1023543759"          // Produção (evento/mau tempo)
    }
  }

};

// monta a URL completa de uma aba: base + &gid=...
module.exports.url = function(base, gid){
  return base + "&gid=" + gid;
};
