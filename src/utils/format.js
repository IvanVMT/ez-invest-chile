import { COMPANY_DOMAINS, TICKER_MAP } from '../config/constants.js';

export const getFriendlyName = (id) => {
    const names = {
        // Mining
        'SQM-B': 'Soquimich B', 'CAP': 'CAP Minería', 'CMPC': 'Empresas CMPC', 'COPEC': 'Empresas Copec',
        'PUCOBRE': 'Pucobre', 'MINERA': 'Minera Las Cenizas',

        // Bank/Fin
        'CHILE': 'Banco de Chile', 'BSANTANDER': 'Banco Santander', 'BCI': 'Banco BCI', 'ITAUCORP': 'Itaú CorpBanca',
        'SECURITY': 'Grupo Security', 'BICECORP': 'BICECORP', 'QUINENCO': 'Quiñenco', 'ALMENDRAL': 'Almendral', 'MOLLER': 'Moller & Perez-Cotapos',

        // Retail
        'FALABELLA': 'Falabella', 'CENCOSUD': 'Cencosud', 'CENCOSHOPP': 'Cencosud Shopping', 'PARAUCO': 'Parque Arauco',
        'MALLPLAZA': 'Mallplaza', 'RIPLEY': 'Ripley Corp', 'SMU': 'SMU (Unimarc)', 'HITES': 'Empresas Hites',
        'FORUS': 'Forus', 'TRICOT': 'Tricot', 'NUEVAPOLAR': 'La Polar',

        // Energy/Utilities
        'ENELAM': 'Enel Américas', 'ENELCHILE': 'Enel Chile', 'COLBUN': 'Colbún', 'AESANDES': 'AES Andes', 'ECL': 'Engie Energía',
        'AGUAS-A': 'Aguas Andinas', 'IAM': 'Inv. Aguas Metró.', 'GASCO': 'Empresas Gasco',

        // Food/Bev
        'CCU': 'CCU', 'ANDINA-B': 'Coca-Cola Andina', 'EMBONOR-B': 'Coca-Cola Embonor', 'CONCHATORO': 'Viña Concha y Toro',
        'WATTS': 'Watt\'s', 'IANSA': 'Empresas Iansa',

        // Farming/Ind
        'CAMANCHACA': 'Camanchaca', 'SALMOCAM': 'Salmones Camanchaca', 'BLUMAR': 'Blumar Seafoods',

        // Construction
        'SALFACORP': 'Salfacorp', 'BESALCO': 'Besalco', 'PAZ': 'Paz Corp', 'SOCOVESA': 'Socovesa', 'ECHEVERRIA': 'Echeverría Izquierdo',
        'ILC': 'Inv. La Construcción',

        // Transpy/Tech
        'VAPORES': 'Vapores (CSAV)', 'LTM': 'Latam Airlines', 'ENTEL': 'Entel Chile', 'SONDA': 'Sonda TI', 'SMSAAM': 'SAAM Towage',

        // Health/Pension
        'BANMEDICA': 'Banmédica', 'LAS_CONDES': 'Clínica Las Condes', 'HABITAT': 'AFP Habitat', 'PROVIDA': 'AFP Provida',

        // Others
        'ANTARCHILE': 'AntarChile', 'SK': 'Sigdo Koppers', 'CRISTALES': 'Cristalerías Chile', 'ZOFRI': 'Zofri S.A.',
        'MASISA': 'Masisa', 'ORO-BLANCO': 'Soc. Inv. Oro Blanco', 'NORTEGRAN': 'Norte Grande',

        // ETFs
        'IPSA-ETF': 'Itau IPSA ETF', 'CHILE-ETF': 'MSCI Chile ETF',

        // Sports & Others
        'LIPIGAS': 'Empresas Lipigas', 'CGE': 'CGE Gas Natural',
        'BLANCO': 'Colo-Colo', 'AZUL AZUL': 'Azul Azul (U. Chile)', 'CRUZADOS': 'Cruzados (U. Católica)'
    };
    return names[id] || id;
};

export const formatCurrency = (amount, currency = 'CLP') => {
    if (isNaN(amount) || amount === null) return '---';
    if (currency === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    if (currency === 'UF') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', currencyDisplay: 'name' }).format(amount).replace('chilenses', 'UF');

    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

// Initialize base stocks structure
export const getBaseStocks = () => {
    return Object.keys(TICKER_MAP).map(id => ({
        id,
        name: getFriendlyName(id),
        domain: COMPANY_DOMAINS[id] || (id.toLowerCase().replace(/-/g, '') + '.cl'),
        price: 0,
        change: 0,
        volume: 'Loading...'
    }));
};
