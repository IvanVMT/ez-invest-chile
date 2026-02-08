import { getBaseStocks } from '../utils/format.js';

// Initial State defaults
const DEFAULT_BALANCE = 10000000;
const DEFAULT_GOAL = 5000000;

// Helper to get initial state from localStorage
const getSavedState = () => {
    const balance = parseInt(localStorage.getItem('ez_balance')) || DEFAULT_BALANCE;
    const portfolio = JSON.parse(localStorage.getItem('ez_portfolio')) || {};



    // Watchlist
    const watchlist = JSON.parse(localStorage.getItem('ez_watchlist')) || [];

    // Portfolio Goal
    const portfolioGoal = parseInt(localStorage.getItem('ez_portfolio_goal')) || DEFAULT_GOAL;

    // View
    const view = localStorage.getItem('ez_view') || 'dashboard';
    // Filter
    const marketFilter = localStorage.getItem('ez_market_filter') || 'default';
    const selectedTicker = localStorage.getItem('ez_selected_ticker') || null;

    // Theme
    const theme = localStorage.getItem('ez_theme') || 'light';

    // Transactions
    const transactions = JSON.parse(localStorage.getItem('ez_transactions')) || [];

    // Migrate Portfolio if needed (old number format to object)
    const migratedPortfolio = {};
    for (const [key, value] of Object.entries(portfolio)) {
        if (typeof value === 'number') {
            migratedPortfolio[key] = { qty: value, totalCost: 0 };
        } else {
            migratedPortfolio[key] = value;
        }
    }

    const savedAuthUser = JSON.parse(localStorage.getItem('ez_auth_user') || 'null');
    const savedAuthToken = localStorage.getItem('ez_auth_token') || null;

    const isAuthenticated = localStorage.getItem('ez_is_authenticated') === 'true';

    return {
        balance,
        portfolio: migratedPortfolio,
        transactions,
        view,
        marketFilter,
        selectedTicker,
        theme,

        watchlist,
        portfolioGoal,
        auth: {
            isAuthenticated: isAuthenticated,
            user: savedAuthUser,
            token: savedAuthToken
        },
        stocks: getBaseStocks(),
        marketSearch: '', // Ephemeral search state
        marketIndicators: null,
        news: [
            { source: "Diario Financiero", time: "Hace 2h", title: "Bolsa chilena cierra 2024 con su mejor desempeño anual desde 1993", url: "https://www.df.cl/mercados/bolsa" },
            { source: "Bloomberg Línea", time: "Hace 3h", title: "Chile: IPSA salta 56% en 2024 y alcanza el mejor desempeño desde 1993", url: "https://www.bloomberglinea.com/chile/economia/" },
            { source: "Yahoo Finanzas", time: "Hace 5h", title: "Economía chilena crece 3,1% en el segundo trimestre según Banco Central", url: "https://es-us.finanzas.yahoo.com/" },
            { source: "La Tercera", time: "Hace 6h", title: "Dólar cierra el 2024 a la baja y anota su mayor caída anual en siete años", url: "https://www.latercera.com/pulso/financiero/" },
            { source: "LATAM Airlines", time: "Hace 8h", title: "LATAM proyecta verano histórico con más de 26 millones de asientos", url: "https://www.latamairlines.com/cl/es/prensa/comunicados" }
        ]
    };
};


class Store {
    constructor() {
        this.state = getSavedState();
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
        this.persist();
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    setAuthUser(authData) {
        this.state.auth = authData;
        this.notify();
        this.persist();
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    persist() {
        // Persist core data to localStorage
        localStorage.setItem('ez_balance', this.state.balance);
        localStorage.setItem('ez_portfolio', JSON.stringify(this.state.portfolio));
        localStorage.setItem('ez_transactions', JSON.stringify(this.state.transactions));
        localStorage.setItem('ez_watchlist', JSON.stringify(this.state.watchlist));
        localStorage.setItem('ez_portfolio_goal', this.state.portfolioGoal);
        localStorage.setItem('ez_theme', this.state.theme);
        localStorage.setItem('ez_market_filter', this.state.marketFilter);
        localStorage.setItem('ez_view', this.state.view);
        localStorage.setItem('ez_selected_ticker', this.state.selectedTicker || '');

        // Persist minimal auth info (demo only)
        try {
            const auth = this.state.auth || { isAuthenticated: false, user: null, token: null };
            localStorage.setItem('ez_auth_user', JSON.stringify(auth.user || null));
            localStorage.setItem('ez_is_authenticated', auth.isAuthenticated ? 'true' : 'false');
            if (auth.token) localStorage.setItem('ez_auth_token', auth.token);
            else localStorage.removeItem('ez_auth_token');
        } catch (e) {
            // ignore storage errors
        }
    }
}

export const store = new Store();
