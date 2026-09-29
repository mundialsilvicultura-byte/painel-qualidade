module.exports = {
  plantio: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJDvvYbFUOHBGR3v7NUB46L18QEEjHUzH0a4sMTnM2-yUF_m29uxVZM7O6qdHnn_wSJi4AzwpoxJxI/pub?output=csv",
    abas: { principal:"1106197588", parametros:"72759821", qual:"1243754569" }
  },
  replantio: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2CVV7Eo0Y0xQ6IMTQUbBRVZQy1Worlb_emvapdnSOCK_IKdsw6f6Byq65i04kfJC44RQYYQa7UhRd/pub?output=csv",
    abas: { principal:"432983061", parametros:"1924169681" }
  },
  capina: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRtefJ3AQXRuhmaEkS5Lpft9I-KnnX2qXv2SETDBjkFZpn--CnY-n6dUtudHlIc2whGriwv1MU-L3pe/pub?output=csv",
    abas: { principal:"1563976590", dose:"811504204", caminhamento:"1536299973", qual:"1142585420" }
  },
  adubacao: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK-D_OgMPG9XBu5iEI7372V13_a9ruPMi5XzsXJCSGsXe6Lg0dOVLCcN2drS_JomHn_ccMgkxGWUy/pub?output=csv",
    abas: { principal:"1428249926", dados:"1596835929", qual:"1592371361" }
  },
  formiga: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYnkBeOzZNPLrCcwSDvC3gRvuh1MwL3G7pCtiA1xJ5-R9KPpjdmDL3LbsNw_4ORGHRWHSXYc70rE47/pub?output=csv",
    abas: { principal:"1805327260", qual:"1070423420" }
  },
  subsolagem: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQTs5lCgCM5KdYcqc00GFgeBAwg5WaHaUNYWg5pqK2bRIKm4ykTcBLPd9_j8oin0IibDv9Yet2xlZU/pub?output=csv",
    abas: { principal:"1802982946", conformacao:"243943851", qual:"1075999276" }
  },
  producao: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRxkCzcYRDwiz-52bRyvlAbGmoDWaHk12f2y3X0zLl9Je4kjcD1DwXsW4jhMGgqJ_OynTc8mSmJd9Fy/pub?output=csv",
    abas: { manual:"725924708", mecanizada:"669628848", geral:"1023543759" }
  },
  capinaMec: {
    base: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwhW779Kn_-Ht0HS5QhEnaSwqfTy71dHTGqsMB5k-CHlY9M5ngPyE35FXoemsHPinNN-6P75p4WD8Q/pub?output=csv",
    abas: { principal:"1032822133", dose:"1712473274", qual:"85364512" }
  }
};
module.exports.url = function(base, gid){ return base + "&gid=" + gid; };
