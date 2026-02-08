export const renderNews = (newsItems = []) => {
    // Fallback if no news
    if (!newsItems || newsItems.length === 0) {
        return `
        <div class="card" style="margin-top: 24px;">
            <h3>📰 Noticias de Mercado</h3>
            <p style="color: var(--text-muted);">Cargando noticias...</p>
        </div>`;
    }

    return `
        <div class="card" style="margin-top: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="cursor: pointer;" onclick="window.navigate('news')">📰 Noticias de Mercado</h3>
                <button onclick="window.navigate('news')" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 12px; font-weight: 600;">Ver todas →</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${newsItems.map(news => `
                    <a href="${news.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: block;">
                        <div style="padding-bottom: 12px; border-bottom: 1px solid var(--border); last-child:border-bottom:none; cursor: pointer;" class="news-item-hover">
                            <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${news.title}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">
                                <span style="color: var(--primary); font-weight: 700;">${news.source}</span> • ${news.time}
                            </div>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
};
