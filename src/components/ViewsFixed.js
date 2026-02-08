import { store } from '../state/store.js';
import { formatCurrency } from '../utils/format.js';
import { renderNews } from './News.js';
import { renderStockTableRows } from './StockTable.js';
import { fetchRealStockPrice } from '../services/api.js';
import { renderTVChart } from './Chart.js';
import { loginWithEmail, registerWithEmail, logout } from '../services/auth.js';

// Helper to calculate portfolio stats (duplicated in app.js originally, moving here)
const calculatePortfolioStats = () => {
    const state = store.getState();
    let totalValue = 0;
    let totalCost = 0;
    // We need stock prices. If not in state.stocks, fallback to base logic or store logic
    // We will assume store.state.stocks has latest prices updated by api
    const stocks = state.stocks;

    for (const [ticker, data] of Object.entries(state.portfolio)) {
        const stock = stocks.find(s => s.id === ticker);
        const price = stock ? stock.price : 0;
        totalValue += price * data.qty;
        totalCost += data.totalCost || 0;
    }
    return { totalValue, totalCost };
};

export const renderPortfolioChart = (invested, current) => {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return;

    // Destroy previous instance if exists to avoid glitch
    if (window.myChart) window.myChart.destroy();

    const isProfit = current >= invested;
    const state = store.getState();
    const isDark = state.theme === 'dark';
    const textColor = isDark ? '#ffffff' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)';

    const colorInv = isDark ? '#cbd5e1' : '#94a3b8'; // Brighter slate for dark mode
    const colorVal = isProfit ? '#22c55e' : '#ef4444';

    if (typeof Chart === 'undefined') return;

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Inversión Inicial', 'Valor Actual'],
            datasets: [{
                label: 'Pesos Chilenos (CLP)',
                data: [invested, current],
                backgroundColor: [colorInv, colorVal],
                borderRadius: 8,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            }
        }
    });
};

export const renderDashboard = () => {
    const state = store.getState();
    const { totalValue, totalCost } = calculatePortfolioStats();

    // Check if marketIndicators exists in state, if not use placeholder
    const marketIndicators = state.marketIndicators;
    const ufValue = marketIndicators ? formatCurrency(marketIndicators.uf.valor).replace('$', '') : null;
    const dolarValue = marketIndicators ? formatCurrency(marketIndicators.dolar.valor).replace('CLP', '') : null;

    // Side effect for chart
    setTimeout(() => renderPortfolioChart(totalCost, totalValue), 100);

    return `
            <div class="card stat-card">
                <h3>Portafolio Total</h3>
                <span class="value text-green">${formatCurrency(totalValue)}</span>
            </div>
            <div class="card stat-card">
                <h3>Saldo Disponible</h3>
                <span class="value">${formatCurrency(state.balance)}</span>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <button class="btn-trade btn-buy" style="font-size: 11px; padding: 4px 10px; flex: 1;" onclick="window.openBalanceModal('deposit')">Depositar</button>
                    <button class="btn-trade btn-sell" style="font-size: 11px; padding: 4px 10px; flex: 1;" onclick="window.openBalanceModal('withdraw')">Retirar</button>
                </div>
            </div>
            <div class="card stat-card">
                <h3>Indicadores Hoy</h3>
                <div style="display: flex; gap: 15px; font-size: 14px;">
                    <div>🇺🇸 Dólar: <strong>${dolarValue ? dolarValue : `<span class=\"skeleton\" style=\"width:80px;height:16px;display:inline-block;vertical-align:middle;\"></span>`}</strong></div>
                    <div>🇨🇱 UF: <strong>${ufValue ? ufValue : `<span class=\"skeleton\" style=\"width:60px;height:16px;display:inline-block;vertical-align:middle;\"></span>`}</strong></div>
                </div>
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);">
                     <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                        <span>Meta: ${formatCurrency(state.portfolioGoal)}</span>
                        <span style="color: var(--primary); cursor: pointer;" onclick="window.setPortfolioGoal()">✏️</span>
                    </div>
                    <div style="background: var(--bg-hover); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="background: var(--accent); height: 100%; width: ${Math.min((totalValue / state.portfolioGoal) * 100, 100)}%;"></div>
                    </div>
                    <div style="font-size: 10px; text-align: right; color: var(--text-muted); margin-top: 2px;">
                        ${((totalValue / state.portfolioGoal) * 100).toFixed(1)}% completado
                    </div>
                </div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 15px;">Rendimiento de Inversiones</h3>
            <div style="height: 250px;">
                ${state.stocks && state.stocks.length ? '<canvas id="portfolioChart"></canvas>' : '<div class="skeleton" style="height:100%; width:100%;"></div>'}
            </div>
        </div>

        ${renderNews(state.news)}
    `;
};

export const renderMarket = () => {
    const state = store.getState();
    const stocks = state.stocks; // Use stocks from store

    // Market Tab Logic (stored in state or ephemeral?)
    // Original code used `state.marketTab`
    if (!state.marketTab) state.marketTab = 'all';

    const showFavorites = state.marketTab === 'favorites';
    let displayStocks = showFavorites ? stocks.filter(s => state.watchlist.includes(s.id)) : [...stocks];

    // Search Logic
    if (state.marketSearch) {
        const term = state.marketSearch.toLowerCase();
        displayStocks = displayStocks.filter(s =>
            s.id.toLowerCase().includes(term) ||
            s.name.toLowerCase().includes(term)
        );
    }

    // Sorting Logic
    const filter = state.marketFilter || 'default';
    displayStocks.sort((a, b) => {
        if (filter === 'price_desc') return b.price - a.price;
        if (filter === 'price_asc') return a.price - b.price;
        if (filter === 'change_desc') return b.change - a.change;
        if (filter === 'change_asc') return a.change - b.change;
        if (filter === 'volume_desc') return (b.rawVolume || 0) - (a.rawVolume || 0);
        return 0; // Default (Alphabetical or API order usually)
    });


    return `
        <div style="margin-bottom: 12px; display: flex; gap: 12px; align-items:center; justify-content:space-between; flex-wrap: wrap;">
            <div style="display:flex; gap: 8px;">
                <button class="btn-trade ${!showFavorites ? 'btn-buy' : ''}" style="background: ${!showFavorites ? 'var(--primary)' : 'var(--bg-card)'}; color: ${!showFavorites ? 'white' : 'var(--text-muted)'}; border: 1px solid var(--border);" onclick="window.setMarketTab('all')">
                    Todos
                </button>
                 <button class="btn-trade ${showFavorites ? 'btn-buy' : ''}" style="background: ${showFavorites ? 'var(--primary)' : 'var(--bg-card)'}; color: ${showFavorites ? 'white' : 'var(--text-muted)'}; border: 1px solid var(--border);" onclick="window.setMarketTab('favorites')">
                    ❤️ Favoritos
                </button>
            </div>
            
            <div style="display:flex; gap:8px; align-items:center;">
                <!-- Search Input -->
                <input type="text" 
                       placeholder="Buscar acción..." 
                       value="${state.marketSearch || ''}"
                       oninput="window.setMarketSearch(this.value)"
                       style="padding: 6px 10px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border); border-radius: 6px; outline: none; width: 140px;">

                <!-- Filter Dropdown -->
                <select class="btn-trade" style="padding: 6px 10px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border); outline: none;" onchange="window.setMarketFilter(this.value)">
                    <option value="default" ${filter === 'default' ? 'selected' : ''}>Orden: Por Defecto</option>
                    <option value="change_desc" ${filter === 'change_desc' ? 'selected' : ''}>Mayores Alzas</option>
                    <option value="change_asc" ${filter === 'change_asc' ? 'selected' : ''}>Mayores Bajas</option>
                    <option value="price_desc" ${filter === 'price_desc' ? 'selected' : ''}>Mayor Precio</option>
                    <option value="price_asc" ${filter === 'price_asc' ? 'selected' : ''}>Menor Precio</option>
                    <option value="volume_desc" ${filter === 'volume_desc' ? 'selected' : ''}>Más Transadas</option>
                </select>

                ${state.loadingStocks ? '<div class="skeleton" style="width:80px; height:28px; border-radius:8px;"></div>' : `<div style="font-size:12px; color:var(--text-muted); display:none;">Updated</div>`}
                <button class="btn-trade" style="padding:6px 10px;" onclick="window.refreshMarket()">Actualizar</button>
            </div>
        </div>

        <div class="stock-table-container">
            <div class="data-source-notice">
                Datos de Yahoo Finance (Proxy) - ${displayStocks.length} Instrumentos
            </div>
            <table class="stock-table">
                <thead>
                    <tr>
                        <th>Acción</th>
                        <th>Precio</th>
                        <th>Var %</th>
                        <th>Volumen</th>
                        <th>Operar</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayStocks.length === 0 ? (state.loadingStocks ? '<tr><td colspan="5" style="text-align:center; padding: 20px;"><div class="skeleton" style="height:36px; width:70%; margin: 0 auto;"></div></td></tr>' : '<tr><td colspan="5" style="text-align:center; padding: 20px;">No tienes favoritos aún.</td></tr>') :
            renderStockTableRows(displayStocks)
        }
                </tbody>
            </table>
        </div>

        <!-- Mobile Card Layout -->
        <div class="mobile-stock-cards">
            ${displayStocks.map(stock => {
            const domain = stock.domain || (stock.id.toLowerCase().replace(/-/g, '') + '.cl');
            return `
                <div class="stock-card" onclick="window.viewStock('${stock.id}')">
                    <div class="stock-card-header">
                        <img class="stock-logo" 
                             src="https://logo.clearbit.com/${domain}" 
                             onerror="if (this.src.includes('clearbit')) { this.src='https://www.google.com/s2/favicons?domain=${domain}&sz=128'; } else { this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%230052cc%22 rx=%228%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2220%22 font-weight=%22bold%22 fill=%22white%22%3E${stock.id.charAt(0)}%3C/text%3E%3C/svg%3E'; }" 
                             alt="${stock.id}">
                        <div class="stock-card-name">
                            <div class="stock-card-ticker">${stock.id}</div>
                            <div class="stock-card-company">${stock.name}</div>
                        </div>
                    </div>
                    <div class="stock-card-footer">
                        <div class="stock-card-price">${formatCurrency(stock.price)}</div>
                        <div class="stock-card-change ${stock.change >= 0 ? 'text-green' : 'text-red'}">
                            ${stock.change >= 0 ? '▲' : '▼'} ${stock.change >= 0 ? '+' : ''}${stock.change}%
                        </div>
                    </div>
                </div>
            `;
        }).join('')}
        </div>
    `;
};

export const renderPortfolio = () => {
    const state = store.getState();

    const portfolioItems = Object.keys(state.portfolio).map(ticker => {
        const stock = state.stocks.find(s => s.id === ticker);
        const position = state.portfolio[ticker];
        // Handle {qty, cost} vs simple qty for legacy
        const qty = position.qty !== undefined ? position.qty : position;
        const avgCost = position.avgCost || 0;

        if (!stock) return null; // Should not happen
        return { ...stock, qty, avgCost };
    }).filter(item => item && item.qty > 0);

    const totalValue = portfolioItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const dayChange = portfolioItems.reduce((sum, item) => sum + (item.price * item.change / 100 * item.qty), 0); // approx
    const totalCost = portfolioItems.reduce((sum, item) => sum + (item.avgCost * item.qty), 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const gainClass = totalGain >= 0 ? 'text-green' : 'text-red';

    return `
        <div class="portfolio-header card">
            <h2>Mi Portafolio</h2>
            <div class="portfolio-summary">
                <div class="summary-item">
                    <span class="label">Valor Total</span>
                    <span class="value big">${formatCurrency(totalValue, 'CLP')}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Ganancia/Pérdida Total</span>
                    <span class="value ${gainClass}">${formatCurrency(totalGain, 'CLP')} (${totalGainPercent.toFixed(2)}%)</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>Activos</h3>
            <div class="portfolio-list">
                ${portfolioItems.length === 0 ? '<p style="text-align:center; padding:20px; color:var(--text-muted);">No tienes acciones aún.</p>' : ''}
                ${portfolioItems.map(item => {
        const value = item.price * item.qty;
        const gain = value - (item.avgCost * item.qty);
        const gainPct = (item.avgCost > 0) ? (gain / (item.avgCost * item.qty) * 100) : 0;
        const itemClass = gain >= 0 ? 'text-green' : 'text-red';
        const sign = gain >= 0 ? '+' : '';
        const domain = item.domain || (item.id.toLowerCase().replace(/-/g, '') + '.cl');

        return `
                        <div class="portfolio-item-card" onclick="window.viewStock('${item.id}')">
                           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <div class="stock-icon-small">
                                         <img src="https://logo.clearbit.com/${domain}" 
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"
                                         style="width:100%; height:100%; object-fit:contain; border-radius:4px;">
                                         <div style="display:none; width:100%; height:100%; background:var(--primary); color:white; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border-radius:4px;">
                                            ${item.id.charAt(0)}
                                         </div>
                                    </div>
                                    <div>
                                        <div class="stock-ticker">${item.id}</div>
                                        <div class="stock-name" style="font-size:12px; color:var(--text-muted);">${item.qty} acciones</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="value">${formatCurrency(value, 'CLP')}</div>
                                    <div class="change ${itemClass}" style="font-size:12px;">${sign}${formatCurrency(gain, 'CLP')} (${gainPct.toFixed(2)}%)</div>
                                </div>
                           </div>
                           <div class="action-buttons">
                                <button class="btn-trade btn-buy" onclick="event.stopPropagation(); window.openTradeModal('${item.id}', 'buy')">Comprar</button>
                                <button class="btn-trade btn-sell" onclick="event.stopPropagation(); window.openTradeModal('${item.id}', 'sell')">Vender</button>
                           </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
};

export const renderTransactions = () => {
    const state = store.getState();
    if (!state.transactions || state.transactions.length === 0) {
        return `
            <div class="card" style="text-align: center; padding: 60px;">
                <h3 style="margin-bottom: 20px;">No hay movimientos</h3>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Tus compras, ventas y dividendos aparecerán aquí.</p>
                <button class="btn-trade" onclick="window.navigate('dashboard')">Ir al Mercado</button>
            </div>
        `;
    }

    // Sort by date desc
    const sorted = [...state.transactions].reverse();

    // Calculate total dividends received
    const totalDividends = sorted
        .filter(t => t.type === 'dividend')
        .reduce((sum, t) => sum + t.total, 0);

    return `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0;">Historial de Movimientos</h3>
            </div>
            
            ${totalDividends > 0 ? `
                <div style="padding: 12px; background: linear-gradient(135deg, #22c55e15, #22c55e05); border-left: 4px solid #22c55e; border-radius: 8px; margin-bottom: 20px;">
                    <strong>Total Dividendos Recibidos:</strong> <span style="color: #22c55e; font-size: 18px; font-weight: 700;">${formatCurrency(totalDividends)}</span>
                </div>
            ` : ''}
            
            <div class="stock-table-container">
                <table class="stock-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Acción</th>
                            <th>Operación</th>
                            <th>Cantidad</th>
                            <th>Precio/Yield</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(t => {
        let badgeColor, badgeText, qtyText, priceText;

        if (t.type === 'buy') {
            badgeColor = 'var(--primary)';
            badgeText = 'COMPRA';
            qtyText = t.qty;
            priceText = formatCurrency(t.price);
        } else if (t.type === 'sell') {
            badgeColor = 'var(--danger)';
            badgeText = 'VENTA';
            qtyText = t.qty;
            priceText = formatCurrency(t.price);
        } else if (t.type === 'dividend') {
            badgeColor = '#22c55e';
            badgeText = 'DIVIDENDO';
            qtyText = t.qty;
            priceText = `${t.yield}% anual`;
        } else if (t.type === 'deposit') {
            badgeColor = 'var(--accent)';
            badgeText = 'ABONO';
            qtyText = '-';
            priceText = '-';
        } else if (t.type === 'withdraw') {
            badgeColor = 'var(--text-muted)';
            badgeText = 'RETIRO';
            qtyText = '-';
            priceText = '-';
        }

        return `
                            <tr>
                                <td>${new Date(t.date).toLocaleString('es-CL')}</td>
                                <td><strong>${t.ticker}</strong></td>
                                <td>
                                    <span class="badge" 
                                          style="padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; background-color: ${badgeColor}">
                                        ${badgeText}
                                    </span>
                                </td>
                                <td>${qtyText}</td>
                                <td>${priceText}</td>
                                <td class="${t.type === 'dividend' ? 'text-green' : ''}" style="font-weight: ${t.type === 'dividend' ? '700' : 'normal'}">
                                    ${t.type === 'dividend' ? '+' : ''}${formatCurrency(t.total)}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// --- Global Auth Handlers ---
if (typeof window !== 'undefined') {
    window.handleLogin = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button');

        btn.innerHTML = '<span class="skeleton" style="width:20px;height:20px;display:inline-block"></span>';
        btn.disabled = true;

        const result = await loginWithEmail(email, password);

        if (result.success) {
            window.showToast('Bienvenido nuevamente', 'success');
        } else {
            window.showToast(result.error, 'error');
            btn.innerHTML = 'Iniciar Sesión';
            btn.disabled = false;
        }
    };

    window.handleRegister = async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = e.target.querySelector('button');

        btn.innerHTML = '<span class="skeleton" style="width:20px;height:20px;display:inline-block"></span>';
        btn.disabled = true;

        const result = await registerWithEmail(email, password);

        if (result.success) {
            window.showToast('Cuenta creada exitosamente', 'success');
        } else {
            window.showToast(result.error, 'error');
            btn.innerHTML = 'Registrarse';
            btn.disabled = false;
        }
    };

    window.handleLogout = async () => {
        await logout();
        window.showToast('Sesión cerrada');
    };

    window.toggleAuthMode = (mode) => {
        const loginForm = document.getElementById('login-form-container');
        const regForm = document.getElementById('register-form-container');
        if (mode === 'register') {
            loginForm.style.display = 'none';
            regForm.style.display = 'block';
        } else {
            loginForm.style.display = 'block';
            regForm.style.display = 'none';
        }
    };
}

export const renderProfile = () => {
    const state = store.getState();
    return `
    <div style="display: flex; justify-content: space-between;">
        <span>Acciones en Portfolio:</span>
        <strong>${Object.keys(state.portfolio).length}</strong>
    </div>
                    </div>
                </div>

                <!-- Data Management -->
                <div style="padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-md);">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--text-muted);">Gestión de Datos</h3>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-trade" style="flex: 1; background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border);" onclick="window.exportData()">
                            📥 Exportar
                        </button>
                        <button class="btn-trade" style="flex: 1; background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border);" onclick="window.importData()">
                            📤 Importar
                        </button>
                    </div>
                </div>

                <!-- Settings Button -->
    <button class="btn-trade" style="padding: 16px; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 10px;"
        onclick="window.openSettings()">
        ⚙️ Configuraciones
    </button>
            </div>
        </div>
    `;
};

export const renderStockDetail = () => {
    const state = store.getState();
    const stocks = state.stocks;
    const ticker = state.selectedTicker;
    const stock = stocks.find(s => s.id === ticker);

    if (!stock) return '<div>Acción no encontrada</div>';

    // Trigger chart render after DOM update
    setTimeout(() => {
        renderTVChart(ticker);
    }, 200);

    return `
    <div class="stock-detail-wrapper">
        <div style="margin-bottom: 20px;">
            <button class="btn-trade" style="background-color: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border-color);" onclick="window.navigate('dashboard')">← Volver al Mercado</button>
        </div>

        <div class="stock-detail-grid" style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <!-- Left Column: Chart & Info -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <h2 style="font-size: 32px; margin: 0;">${stock.id}</h2>
                            <div style="color: var(--text-muted); font-size: 18px;">${stock.name}</div>
                        </div>
                        <div style="text-align: right;">
                             <div style="font-size: 32px; font-weight: 700;">${formatCurrency(stock.price)}</div>
                            <div class="${stock.change >= 0 ? 'text-green' : 'text-red'}" style="font-size: 18px; font-weight: 500;">
                                ${stock.change >= 0 ? '+' : ''}${stock.change}%
                            </div>
                            <!-- Favorite Button -->
                            <button onclick="window.toggleWatchlist('${stock.id}')" style="background:none; border:none; cursor:pointer; font-size: 24px; margin-top: 5px;" title="${state.watchlist.includes(stock.id) ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}">
                                ${state.watchlist.includes(stock.id) ? '❤️' : '🤍'}
                            </button>
                        </div>
                    </div>
                    
                    <!-- Chart Controls -->
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; gap: 8px; margin-bottom: 8px; overflow-x: auto;">
                            <span style="font-size: 12px; color: var(--text-muted); align-self: center; margin-right: 5px;">Tipo:</span>
                            <button class="btn-timeframe" onclick="window.changeChartType('${ticker}', 'candles')">🕯️ Velas</button>
                            <button class="btn-timeframe" onclick="window.changeChartType('${ticker}', 'area')">⛰️ Área</button>
                            <button class="btn-timeframe" onclick="window.changeChartType('${ticker}', 'line')">📈 Línea</button>
                            <button class="btn-timeframe" style="background: var(--primary); color: white; font-weight: bold;" onclick="window.toggleFullscreenChart()">⛶ Full</button>
                        </div>
                        <!-- Interval Selector (Resolution) -->
                        <div style="display: flex; gap: 6px; overflow-x: auto; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 12px; color: var(--text-muted); align-self: center; margin-right: 5px; min-width: 60px;">Resolución:</span>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1m', '1d')" title="Velas de 1 minuto (Ver Hoy)">1m</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '5m', '5d')" title="Velas de 5 minutos (Ver Semana)">5m</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '15m', '1mo')" title="Velas de 15 minutos (Ver Mes)">15m</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '30m', '1mo')" title="Velas de 30 minutos (Ver Mes)">30m</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1h', '1mo')" title="Velas de 1 hora (Ver Mes)">1h</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '4h', '6m')" title="Velas de 4 horas (Ver Semestre)">4h</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1d', '1y')" title="Velas Diarias (Ver Año)">D</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1wk', '5y')" title="Velas Semanales (Ver 5 Años)">S</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1mo', 'max')" title="Velas Mensuales (Máximo)">M</button>
                        </div>
                        
                        <!-- Range Selector (Zoom Preset) -->
                         <div style="display: flex; gap: 6px; overflow-x: auto; align-items: center;">
                            <span style="font-size: 12px; color: var(--text-muted); align-self: center; margin-right: 5px; min-width: 60px;">Zoom:</span>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '2m', '1d')" title="Ver Hoy (Res: 2m)">1D</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '15m', '5d')" title="Ver Semana (Res: 15m)">5D</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '30m', '1mo')" title="Ver Mes (Res: 30m)">1M</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1h', '3mo')" title="Ver Trimestre (Res: 1h)">3M</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1d', '1y')" title="Ver Año (Res: Diario)">1A</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1d', '5y')" title="Ver 5 Años (Res: Diario)">5A</button>
                            <button class="btn-timeframe" onclick="window.changeChartPeriod('${ticker}', '1wk', 'max')" title="Ver Todo (Res: Semanal)">MAX</button>
                        </div>
                    </div>

                    <div id="tv-chart-container" style="height: 250px; width: 100%; position: relative;"></div>
                </div>
            </div>

            <!-- Right Column: Actions & Order Book -->
            <div style="display: flex; flex-direction: column; gap: 24px;">
                 <div class="card">
                    <h3>Operar</h3>
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button class="btn-trade btn-buy" style="flex: 1;" onclick="window.openTradeModal('${stock.id}', 'buy')">COMPRAR</button>
                        <button class="btn-trade btn-sell" style="flex: 1;" onclick="window.openTradeModal('${stock.id}', 'sell')">VENDER</button>
                    </div>
                    <div style="margin-top: 15px; font-size: 14px; text-align: center;">
                        Saldo Disponible: <strong>${formatCurrency(state.balance)}</strong>
                    </div>
                </div>
                

            </div>
        </div>
      </div>
    `;
};



export const renderNewsFeed = () => {
    const state = store.getState();
    const newsItems = state.news || [];

    return `
    <div style="max-width: 800px; margin: 0 auto;">
            <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                <h2 style="margin: 0;">📰 Centro de Noticias</h2>
                <button class="btn-trade" style="background-color: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border);" onclick="window.navigate('dashboard')">← Volver</button>
            </div>

            <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, var(--card-bg) 0%, var(--bg-hover) 100%);">
                <h3 style="margin-bottom: 10px;">Resumen de Mercado</h3>
                <p style="color: var(--text-muted);">
                    Mantente informado con las últimas noticias financieras de Chile y el mundo. 
                    Nuestra cobertura incluye Diario Financiero, La Tercera (Pulso), Bloomberg y más.
                </p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${newsItems.length === 0 ? '<div class="card">Cargando noticias...</div>' : newsItems.map(news => `
                    <div class="card news-card-hover" style="display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
                         onclick="window.open('${news.url}', '_blank')">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h3 style="font-size: 18px; margin: 0; color: var(--primary); line-height: 1.4;">${news.title}</h3>
                            <span style="font-size: 20px;">↗️</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-muted);">
                            <span style="background: var(--bg-hover); padding: 4px 8px; border-radius: 4px; font-weight: 600; color: var(--text-main);">${news.source}</span>
                            <span>🕒 ${news.time}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top: 30px; text-align: center; color: var(--text-muted); font-size: 12px;">
                Noticias provistas por Google News RSS • Actualizado automáticamente
            </div>
        </div>
    `;
};
