/*
Proxy configuration notes:
- During local development prefer the local proxy at http://localhost:3000 (see server/README.md).
- The client code will try the local proxy first when running on localhost and fall back to the
    `CORS_PROXY` public service if no local proxy is available. For production, run your own
    server-side proxy and never embed API keys in client code.
*/

// Data & Config
export const INDICATORS_API = 'https://mindicador.cl/api';
// Fallback public CORS proxy (use only for quick dev/testing). Do not rely on it in production.
export const CORS_PROXY = 'https://corsproxy.io/?';

// Local proxy base (used by README and client as recommended endpoint)
export const LOCAL_PROXY_BASE = 'http://localhost:3000';
export const YAHOO_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
export const YAHOO_QUOTE_API = 'https://query1.finance.yahoo.com/v7/finance/quote';

// Expanded Ticker Map (30+ Major Chilean Stocks & ETFs)
export const TICKER_MAP = {
    // 1. COMMODITIES & MINING
    'SQM-B': 'SQM-B.SN',
    'CAP': 'CAP.SN',
    'CMPC': 'CMPC.SN',
    'COPEC': 'COPEC.SN',
    'PUCOBRE': 'PUCOBRE.SN',
    'MINERA': 'MINERA.SN',

    // 2. BANKING & FINANCE
    'CHILE': 'CHILE.SN',
    'BSANTANDER': 'BSANTANDER.SN',
    'BCI': 'BCI.SN',
    'ITAUCORP': 'ITAUCORP.SN',
    'SECURITY': 'SECURITY.SN',
    'BICECORP': 'BICECORP.SN',
    'QUINENCO': 'QUINENCO.SN',
    'ALMENDRAL': 'ALMENDRAL.SN',
    'MOLLER': 'MOLLER.SN',

    // 3. RETAIL & CONSUMER
    'FALABELLA': 'FALABELLA.SN',
    'CENCOSUD': 'CENCOSUD.SN',
    'CENCOSHOPP': 'CENCOSHOPP.SN',
    'PARAUCO': 'PARAUCO.SN',
    'MALLPLAZA': 'MALLPLAZA.SN',
    'RIPLEY': 'RIPLEY.SN',
    'SMU': 'SMU.SN',
    'HITES': 'HITES.SN',
    'FORUS': 'FORUS.SN',
    'TRICOT': 'TRICOT.SN',
    'NUEVAPOLAR': 'NUEVAPOLAR.SN',

    // 4. POWER & UTILITIES
    'ENELAM': 'ENELAM.SN',
    'ENELCHILE': 'ENELCHILE.SN',
    'COLBUN': 'COLBUN.SN',
    'AESANDES': 'AESANDES.SN',
    'ECL': 'ECL.SN', // Engie
    'AGUAS-A': 'AGUAS-A.SN',
    'IAM': 'IAM.SN', // Inv. Aguas Metropolitanas
    'GASCO': 'GASCO.SN',

    // 5. FOOD & BEVERAGE
    'CCU': 'CCU.SN',
    'ANDINA-B': 'ANDINA-B.SN',
    'EMBONOR-B': 'EMBONOR-B.SN',
    'CONCHATORO': 'CONCHATORO.SN',
    'WATTS': 'WATTS.SN',
    'IANSA': 'IANSA.SN',

    // 6. FISHING & FARMING
    'CAMANCHACA': 'CAMANCHACA.SN',
    'SALMOCAM': 'SALMOCAM.SN',
    'BLUMAR': 'BLUMAR.SN',

    // 7. REAL ESTATE & CONSTRUCTION
    'SALFACORP': 'SALFACORP.SN',
    'BESALCO': 'BESALCO.SN',
    'PAZ': 'PAZ.SN',
    'SOCOVESA': 'SOCOVESA.SN',
    'ECHEVERRIA': 'ECHEVERRIA.SN',
    'ILC': 'ILC.SN', // Camara Chilena de la Construccion inv. branch

    // 8. TRANSPORT, TELECOM & TECH
    'VAPORES': 'VAPORES.SN',
    'LTM': 'LTM.SN',
    'ENTEL': 'ENTEL.SN',
    'SONDA': 'SONDA.SN',
    'SMSAAM': 'SMSAAM.SN', // Towage (SAAM)

    // 9. HEALTHCARE & PENSION
    'BANMEDICA': 'BANMEDICA.SN',
    'LAS_CONDES': 'CLC.SN',
    'HABITAT': 'HABITAT.SN',
    'PROVIDA': 'PROVIDA.SN',

    // 10. OTHERS & HOLDINGS
    'ANTARCHILE': 'ANTARCHILE.SN', // Major holding of Copec
    'SK': 'SK.SN', // Sigdo Koppers
    'CRISTALES': 'CRISTALES.SN',
    'ZOFRI': 'ZOFRI.SN',
    'MASISA': 'MASISA.SN',
    'ORO-BLANCO': 'ORO-BLANCO.SN',
    'NORTEGRAN': 'NORTEGRAN.SN',

    // ETFs
    'IPSA-ETF': 'CFMITNIPSA.SN',
    'CHILE-ETF': 'CFMSECH.SN',

    // 11. SPORTS & OTHERS
    'LIPIGAS': 'LIPIGAS.SN',
    'CGE': 'CGE.SN',
    'BLANCO': 'BLANCO.SN', // Colo-Colo
    'AZUL AZUL': 'AZUL AZUL.SN', // U. de Chile
    'CRUZADOS': 'CRUZADOS.SN' // U. Católica
};

// Domain Map for Logos
export const COMPANY_DOMAINS = {
    'SQM-B': 'sqm.com', 'CAP': 'cap.cl', 'CMPC': 'cmpc.com', 'COPEC': 'copec.cl',
    'CHILE': 'bancochile.cl', 'BSANTANDER': 'santander.cl', 'BCI': 'bci.cl', 'ITAUCORP': 'itau.cl',
    'SECURITY': 'security.cl', 'BICECORP': 'bice.cl', 'QUINENCO': 'quinenco.cl',
    'FALABELLA': 'falabella.com', 'CENCOSUD': 'cencosud.com', 'CENCOSHOPP': 'cencosud.com',
    'PARAUCO': 'parauco.cl', 'MALLPLAZA': 'mallplaza.cl', 'RIPLEY': 'ripleychile.com',
    'SMU': 'smu.cl', 'HITES': 'hites.com', 'FORUS': 'forus.cl', 'TRICOT': 'tricot.cl',
    'ENELAM': 'enel.cl', 'ENELCHILE': 'enel.cl', 'COLBUN': 'colbun.cl', 'AESANDES': 'aesandes.cl',
    'ECL': 'engie-energia.cl', 'AGUAS-A': 'aguasandinas.cl', 'IAM': 'iam.cl', 'GASCO': 'gasco.cl',
    'CCU': 'ccu.cl', 'ANDINA-B': 'koandina.com', 'EMBONOR-B': 'embonor.cl', 'CONCHATORO': 'conchaytoro.com',
    'WATTS': 'watts.cl', 'IANSA': 'iansa.cl', 'CAMANCHACA': 'camanchaca.cl', 'SALMOCAM': 'camanchaca.cl',
    'BLUMAR': 'blumar.com', 'SALFACORP': 'salfacorp.com', 'BESALCO': 'besalco.cl', 'PAZ': 'paz.cl',
    'SOCOVESA': 'socovesa.cl', 'ILC': 'ilc.cl', 'VAPORES': 'csav.com', 'LTM': 'latamairlines.com',
    'ENTEL': 'entel.cl', 'SONDA': 'sonda.com', 'SMSAAM': 'saam.com', 'BANMEDICA': 'banmedica.cl',
    'LAS_CONDES': 'clinicalascondes.cl', 'HABITAT': 'afphabitat.cl', 'PROVIDA': 'provida.cl',
    'ANTARCHILE': 'antarchile.cl', 'SK': 'sigdokoppers.cl', 'ZOFRI': 'zofri.cl', 'MASISA': 'masisa.com',
    'IPSA-ETF': 'bolsadesantiago.com', 'CHILE-ETF': 'blackrock.com',
    'LIPIGAS': 'lipigas.cl', 'CGE': 'cge.cl',
    'BLANCO': 'colocolo.cl', 'AZUL AZUL': 'udechile.cl', 'CRUZADOS': 'cruzados.cl'
};
