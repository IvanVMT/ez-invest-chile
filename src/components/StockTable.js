import { formatCurrency } from '../utils/format.js';
import { store } from '../state/store.js';

export const renderStockTableRows = (stocksToRender) => {
    return stocksToRender.map(stock => {
        const changeClass = stock.change >= 0 ? 'text-green' : 'text-red';
        const sign = stock.change > 0 ? '+' : '';
        const domain = stock.domain || (stock.id.toLowerCase().replace(/-/g, '') + '.cl');
        const logoUrl = `https://logo.clearbit.com/${domain}`;
        const fallbackUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        return `
            <tr role="button" tabindex="0" onclick="window.viewStock('${stock.id}')" style="cursor: pointer;" aria-label="Ver detalle ${stock.id}">
                <td>
                    <div style="display:flex; align-items:center; gap: 12px;">
                        <img src="${logoUrl}" 
                             onerror="if (this.src.includes('clearbit')) { this.src='${fallbackUrl}'; } else { this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 fill=%22%230052cc%22 rx=%226%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2214%22 font-weight=%22bold%22 fill=%22white%22%3E${stock.id.charAt(0)}%3C/text%3E%3C/svg%3E'; }" 
                             alt="${stock.id}"
                             style="width: 32px; height: 32px; border-radius: 6px; object-fit: contain; background: white; padding: 2px; border: 1px solid var(--border);">
                        <div>
                            <div class="stock-ticker">${stock.id}</div>
                            <div class="stock-name">${stock.name}</div>
                        </div>
                    </div>
                </td>
                <td>${formatCurrency(stock.price, 'CLP')}</td>
                <td class="${changeClass}">
                    ${sign}${stock.change}%
                </td>
                <td>${stock.volume || '---'}</td>
                <td>
                    <div style="display: flex; gap: 4px; flex-wrap: nowrap;">
                        <button type="button" aria-label="Comprar ${stock.id}" class="btn-trade btn-buy" style="font-size: 11px; padding: 6px 10px; white-space: nowrap;" onclick="event.stopPropagation(); window.openTradeModal('${stock.id}', 'buy')">Comprar</button>
                        <button type="button" aria-label="Vender ${stock.id}" class="btn-trade btn-sell" style="font-size: 11px; padding: 6px 10px; white-space: nowrap;" onclick="event.stopPropagation(); window.openTradeModal('${stock.id}', 'sell')">Vender</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};

export const updateStockTable = (stocks) => {
    const state = store.getState();
    const isDashboard = state.view === 'dashboard';

    let sortedStocks = [...stocks];

    // Search Logic
    if (state.marketSearch) {
        const term = state.marketSearch.toLowerCase();
        sortedStocks = sortedStocks.filter(s =>
            s.id.toLowerCase().includes(term) ||
            s.name.toLowerCase().includes(term)
        );
    }

    // Sort logic (Must match renderMarket)
    const filter = state.marketFilter || 'default';
    sortedStocks.sort((a, b) => {
        if (filter === 'price_desc') return b.price - a.price;
        if (filter === 'price_asc') return a.price - b.price;
        if (filter === 'change_desc') return b.change - a.change;
        if (filter === 'change_asc') return a.change - b.change;
        if (filter === 'volume_desc') return (b.rawVolume || 0) - (a.rawVolume || 0);
        return 0;
    });

    const displayStocks = isDashboard ? sortedStocks.slice(0, 5) : sortedStocks;

    const tableBody = document.querySelector('.stock-table tbody');
    if (tableBody) {
        tableBody.innerHTML = renderStockTableRows(displayStocks);
    }
};
