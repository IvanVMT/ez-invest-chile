import { store } from './state/store.js';
import { fetchIndicators, fetchRealStockPrice, fetchQuote, fetchMarketNews } from './services/api.js';
import { renderDashboard, renderMarket, renderPortfolio, renderTransactions, renderProfile, renderStockDetail, renderNewsFeed } from './components/ViewsFixed.js';

import { formatCurrency, getBaseStocks } from './utils/format.js';
import { changeChartPeriod, renderTVChart } from './components/Chart.js';
import { updateStockTable } from './components/StockTable.js';
import { initAuthListener } from './services/auth.js';

// --- Toast Notification ---
window.showToast = (message, type = 'info') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span style="font-size: 20px;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    // Allow click to dismiss immediately
    toast.addEventListener('click', () => toast.remove());

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- Main Render Function ---
const updateUI = () => {
    const state = store.getState();

    // Apply theme class
    document.body.classList.toggle('dark-theme', state.theme === 'dark');

    const appContainer = document.getElementById('view-container');
    const pageTitle = document.getElementById('page-title');

    if (!appContainer) return;

    // View Routing
    if (state.view === 'dashboard') {
        if (pageTitle) pageTitle.textContent = 'Panel General';
        appContainer.innerHTML = renderDashboard();
    } else if (state.view === 'market') {
        if (pageTitle) pageTitle.textContent = 'Mercado Accionario';
        appContainer.innerHTML = renderMarket();
    } else if (state.view === 'detail') {
        if (pageTitle) pageTitle.textContent = 'Detalle de Instrumento';
        appContainer.innerHTML = renderStockDetail();
    } else if (state.view === 'portfolio') {
        if (pageTitle) pageTitle.textContent = 'Mi Portafolio';
        appContainer.innerHTML = renderPortfolio();
    } else if (state.view === 'transactions') {
        if (pageTitle) pageTitle.textContent = 'Historial de Movimientos';
        appContainer.innerHTML = renderTransactions();
    } else if (state.view === 'profile') {
        if (pageTitle) pageTitle.textContent = 'Mi Perfil';
        appContainer.innerHTML = renderProfile();
    } else if (state.view === 'news') {
        if (pageTitle) pageTitle.textContent = 'Centro de Noticias';
        appContainer.innerHTML = renderNewsFeed();
    }

    // Active Navigation State
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.view === state.view);
    });


};

// Update button states (refresh, auto-refresh) on UI updates
store.subscribe(() => {
    try {
        const state = store.getState();
        const refreshBtn = document.getElementById('refresh-market-btn');
        const autoBtn = document.getElementById('auto-refresh-btn');
        if (refreshBtn) refreshBtn.disabled = !!state.loadingStocks;
        if (autoBtn) autoBtn.disabled = !!state.autoRefresh;
    } catch (e) { }
});

// Subscribe to store updates
store.subscribe(updateUI);

// --- Global Window Actions ---

// Helper: parse hash format: #/view or #/view/ticker
const parseLocationHash = () => {
    const hash = (location.hash || '').replace(/^#\/?/, '');
    if (!hash) return { view: null };
    const parts = hash.split('/').map(p => decodeURIComponent(p));
    return { view: parts[0] || null, ticker: parts[1] || null };
};

// Sync state from location (used on init and popstate)
const syncStateFromLocation = () => {
    const { view, ticker } = parseLocationHash();
    const state = store.getState();

    if (view) {
        const update = { view };
        if (ticker) update.selectedTicker = ticker;
        // Only update store if different to avoid unnecessary renders
        if (state.view !== update.view || state.selectedTicker !== update.selectedTicker) {
            store.setState(update);
        }
    }
};

window.navigate = (view, opts = {}) => {
    const { ticker } = opts;
    const update = { view };
    if (ticker) update.selectedTicker = ticker;
    store.setState(update);

    // Close mobile sidebar if open
    document.querySelector('.sidebar')?.classList.remove('active');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');

    // Push to history and update hash for deep links
    const newHash = ticker ? `#/${view}/${encodeURIComponent(ticker)}` : `#/${view}`;
    try { history.pushState({ view, ticker }, '', newHash); } catch (e) { location.hash = newHash; }
};

// Keep back/forward working
window.addEventListener('popstate', () => {
    syncStateFromLocation();
});

window.viewStock = (ticker) => {
    store.setState({ view: 'detail', selectedTicker: ticker });
};



window.setTheme = (theme) => {
    if (!['light', 'dark'].includes(theme)) return;
    store.setState({ theme });
    window.showToast(`Tema cambiado a ${theme}`, 'success');
};

window.openSettings = () => {
    const state = store.getState();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="max-width:420px;">
            <h2 style="margin-top:0;">Configuraciones</h2>
            <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>Tema</strong>
                        <div style="font-size:12px; color:var(--text-muted);">Ajusta apariencia de la app</div>
                    </div>
                    <div>
                        <button class="btn-trade" onclick="window.setTheme('light')" style="margin-right:8px;">Claro</button>
                        <button class="btn-trade" onclick="window.setTheme('dark')">Oscuro</button>
                    </div>
                </div>

                <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:6px;">
                    <button class="btn-cancel" onclick="document.querySelector('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn-confirm" id="settings-save">Guardar</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('settings-save').onclick = () => {
        document.querySelector('.modal-overlay').remove();
        window.showToast('Configuraciones guardadas', 'success');
    };
};

window.setMarketTab = (tab) => {
    store.setState({ marketTab: tab }); // Make sure we handle this in store or Views
    // Since marketTab wasn't initially in default state, setState will add it.
    // Ensure Views.js reads it correctly.
};

window.setMarketFilter = (filter) => {
    store.setState({ marketFilter: filter });
};

window.setMarketSearch = (term) => {
    // Optimization: Mutate state directly to avoid triggering a full app re-render (which kills input focus)
    store.state.marketSearch = term;
    updateStockTable(store.getState().stocks);
};

window.setPortfolioGoal = () => {
    const current = store.getState().portfolioGoal;
    const input = prompt("Ingresa tu meta de valor de portafolio (CLP):", current);
    if (input) {
        const val = parseInt(input);
        if (val > 0) {
            store.setState({ portfolioGoal: val });
            window.showToast("Meta actualizada", "success");
        }
    }
};

window.toggleWatchlist = (ticker) => {
    const { watchlist } = store.getState();
    const idx = watchlist.indexOf(ticker);
    let newWatchlist = [...watchlist];

    if (idx === -1) {
        newWatchlist.push(ticker);
        window.showToast(`${ticker} agregado a Favoritos`, 'success');
    } else {
        newWatchlist.splice(idx, 1);
        window.showToast(`${ticker} eliminado de Favoritos`, 'info');
    }
    store.setState({ watchlist: newWatchlist });
};



// --- Chart Actions ---
window.changeChartType = (ticker, type) => {
    // We import changeChartPeriod but logic for type is similar, just update params
    const savedChartParams = localStorage.getItem('ez_chartParams');
    const params = savedChartParams ? JSON.parse(savedChartParams) : { interval: '1d', range: '1y', type: 'candles' };

    params.type = type;
    localStorage.setItem('ez_chartParams', JSON.stringify(params));
    renderTVChart(ticker);
};
// changeChartPeriod is imported but we need to expose it
window.changeChartPeriod = changeChartPeriod;
window.toggleFullscreenChart = () => {
    const container = document.getElementById('tv-chart-container').parentElement;
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            alert(`Error trying to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
    // Chart resize observer handles the resizing automatically
};

// --- Trade Modal Logic ---
window.openTradeModal = (ticker, action) => {
    const state = store.getState();
    const stock = state.stocks.find(s => s.id === ticker);

    if (!stock || stock.price === 0) {
        alert("Precio cargando o no disponible.");
        return;
    }

    const isBuy = action === 'buy';
    const actionText = isBuy ? 'Comprar' : 'Vender';

    const position = state.portfolio[ticker];
    const ownedQty = position ? (position.qty || 0) : 0; // Handle {qty, cost} structure

    if (!isBuy && ownedQty === 0) {
        alert("No tienes acciones de esta empresa para vender.");
        return;
    }

    const headerColor = isBuy ? 'var(--accent)' : 'var(--danger)';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal" style="overflow: hidden;">
            <div style="background-color: ${headerColor}; margin: -30px -30px 20px -30px; padding: 20px; text-align: center;">
                <h2 style="color: white; margin: 0; font-size: 24px;">${actionText} ${stock.name}</h2>
                <div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 5px;">${ticker}</div>
            </div>
            
            <div class="form-group">
                <label>Precio Actual: ${formatCurrency(stock.price)}</label>
                ${!isBuy ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Tienes: ${ownedQty} Acc.</div>` : ''}
            </div>
            <div class="form-group">
                <label>Cantidad</label>
                <input type="number" id="trade-qty" class="form-input" min="1" max="${!isBuy ? ownedQty : 100000}" value="${!isBuy ? ownedQty : 10}">
            </div>
             <div class="form-group">
                <label>Total estimado</label>
                <div id="trade-total" style="font-weight: 700; font-size: 18px;">${formatCurrency(stock.price * (!isBuy ? ownedQty : 10))}</div>
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="document.querySelector('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-confirm" onclick="window.confirmTrade('${ticker}', '${action}', ${stock.price})">Confirmar ${actionText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const qtyInput = document.getElementById('trade-qty');
    const totalDisplay = document.getElementById('trade-total');

    qtyInput.addEventListener('input', (e) => {
        const qty = parseInt(e.target.value) || 0;
        totalDisplay.textContent = formatCurrency(stock.price * qty);
    });

    qtyInput.focus();
};

window.confirmTrade = (ticker, action, price) => {
    const qtyInput = document.getElementById('trade-qty');
    const qty = parseInt(qtyInput.value);

    if (!qty || qty <= 0) {
        alert("Ingresa una cantidad válida");
        return;
    }

    const total = price * qty;
    const isBuy = action === 'buy';
    const state = store.getState();

    if (isBuy && total > state.balance) {
        alert("Saldo insuficiente");
        return;
    }

    // Logic for Portfolio Update
    let newPortfolio = { ...state.portfolio };
    let newBalance = state.balance;

    if (isBuy) {
        newBalance -= total;
        if (!newPortfolio[ticker]) newPortfolio[ticker] = { qty: 0, totalCost: 0 };

        newPortfolio[ticker] = {
            qty: newPortfolio[ticker].qty + qty,
            totalCost: newPortfolio[ticker].totalCost + total
        };
    } else {
        // Sell
        newBalance += total;
        // Reduce cost basis proportionally? Or FIFO?
        // Simplification: Reduce totalCost proportionally to qty sold
        const position = newPortfolio[ticker];
        const costPerShare = position.totalCost / position.qty;
        const costSold = costPerShare * qty;

        newPortfolio[ticker] = {
            qty: position.qty - qty,
            totalCost: position.totalCost - costSold
        };

        if (newPortfolio[ticker].qty <= 0) {
            delete newPortfolio[ticker];
        }
    }

    // Transaction Record
    const transaction = {
        date: new Date().toISOString(),
        type: action,
        ticker,
        qty,
        price,
        total
    };

    const newTransactions = [...(state.transactions || []), transaction];

    store.setState({
        balance: newBalance,
        portfolio: newPortfolio,
        transactions: newTransactions
    });

    document.querySelector('.modal-overlay').remove();
    window.showToast(`Operación Exitosa: ${action === 'buy' ? 'Compra' : 'Venta'} de ${qty} ${ticker}`, 'success');
};


// --- Data Management ---
window.exportData = () => {
    const state = store.getState();
    const data = {
        balance: state.balance,
        portfolio: state.portfolio,
        transactions: state.transactions,
        theme: state.theme,
        timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ez-invest-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.showToast('Respaldo descargado exitosamente', 'success');
};

window.importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.balance === undefined || !data.portfolio) throw new Error('Formato inválido');

                if (confirm('¿Estás seguro de restaurar este respaldo? Se reemplazarán tus datos actuales.')) {
                    store.setState({
                        balance: data.balance,
                        portfolio: data.portfolio,
                        transactions: data.transactions || [],
                        theme: data.theme || 'light'
                    });

                    // We also need to update theme immediately if handled by CSS classes
                    // Assuming CSS specific logic is handled separately or standard
                    // TODO: Theme handling logic if uses body classes
                    window.showToast('Datos restaurados correctamente', 'success');
                }
            } catch (err) {
                window.showToast('Error al importar: Archivo inválido', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

window.openBalanceModal = (type) => {
    const title = type === 'deposit' ? 'Depositar Saldo' : 'Retirar Saldo';
    const amount = prompt(`Ingrese monto a ${type === 'deposit' ? 'depositar' : 'retirar'}:`);
    if (amount) {
        const val = parseInt(amount);
        if (val > 0) {
            const state = store.getState();
            let newBalance = state.balance;

            if (type === 'withdraw' && val > newBalance) {
                alert("Fondos insuficientes");
                return;
            }

            newBalance = type === 'deposit' ? newBalance + val : newBalance - val;

            // Record Transaction
            const transaction = {
                date: new Date().toISOString(),
                type: type, // 'deposit' or 'withdraw'
                ticker: 'CLP',
                qty: 1,
                price: val,
                total: val
            };
            const newTransactions = [...(state.transactions || []), transaction];

            store.setState({ balance: newBalance, transactions: newTransactions });
            window.showToast("Saldo actualizado exitosamente", "success");
        }
    }
};




// --- Initialization ---

const init = async () => {
    // Initial Render - sync with URL (deep-link support)
    syncStateFromLocation();
    // Initialize Auth
    initAuthListener();
    await updateUI();



    // Fetch Market Indicators
    const indicators = await fetchIndicators();
    store.setState({ marketIndicators: indicators });

    // Fetch News
    fetchMarketNews().then(newsItems => {
        store.setState({ news: newsItems });
    });

    // Fetch Stock Prices (Batching)
    // Initial background fetch (non-blocking)
    fetchAllStockPrices();
};

export const fetchAllStockPrices = async ({ batchSize = 6, progressCb } = {}) => {
    const state = store.getState();
    const stocks = [...state.stocks];
    if (!stocks || stocks.length === 0) return;

    store.setState({ loadingStocks: true });
    // Helper: try fetching a single ticker with retries and exponential backoff
    const fetchWithRetry = async (ticker, attempts = 3, delayMs = 300) => {
        for (let i = 0; i < attempts; i++) {
            try {
                const data = await fetchRealStockPrice(ticker);
                if (data) return data;
            } catch (e) {
                // swallow and retry
            }
            await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
        }
        return null;
    };

    const processBatch = async (batch) => {
        const promises = batch.map(async (stock) => {
            const data = await fetchWithRetry(stock.id, 3, 250);
            if (data) {
                const index = stocks.findIndex(s => s.id === stock.id);
                if (index !== -1) {
                    stocks[index] = {
                        ...stocks[index],
                        price: data.price,
                        change: typeof data.change === 'number' ? parseFloat(data.change.toFixed(2)) : (data.change || 0),
                        volume: new Intl.NumberFormat('es-CL', { notation: "compact" }).format(data.volume || 0),
                        rawVolume: data.volume || 0
                    };
                }
            }
        });
        await Promise.all(promises);
    };

    try {
        for (let i = 0; i < stocks.length; i += batchSize) {
            const batch = stocks.slice(i, i + batchSize);
            await processBatch(batch);
            store.setState({ stocks: [...stocks] });
            updateStockTable(stocks);
            if (typeof progressCb === 'function') progressCb(Math.min(i + batchSize, stocks.length), stocks.length);
            await new Promise(r => setTimeout(r, 60));
        }

        store.setState({ lastUpdated: new Date().toISOString() });
    } finally {
        store.setState({ loadingStocks: false });
    }
};

// Auto-refresh every X ms (defaults to 5 minutes)
let _autoRefreshInterval = null;
window.startAutoRefresh = (ms = 5 * 60 * 1000) => {
    if (_autoRefreshInterval) return;
    _autoRefreshInterval = setInterval(() => {
        fetchAllStockPrices();
    }, ms);
    store.setState({ autoRefresh: true });
};

window.stopAutoRefresh = () => {
    if (_autoRefreshInterval) {
        clearInterval(_autoRefreshInterval);
        _autoRefreshInterval = null;
        store.setState({ autoRefresh: false });
    }
};

// Expose a manual refresh handler
window.refreshMarket = async () => {
    window.showToast('Actualizando precios...', 'info');

    try {
        await fetchAllStockPrices();
        window.showToast('Precios actualizados', 'success');
    } catch (e) {
        console.error('Refresh failed', e);
        window.showToast('Error al actualizar precios', 'error');
    }
};

// Start App
document.addEventListener('DOMContentLoaded', init);

// Register Theme Handler separately or here?
// Theme was simple localStorage toggle.
// We can expose setTheme if needed or just use toggleTheme.
