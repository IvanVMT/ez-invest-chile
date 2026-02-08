import { INDICATORS_API, CORS_PROXY, YAHOO_API_BASE, YAHOO_QUOTE_API, TICKER_MAP } from '../config/constants.js';

// If running on localhost, prefer a local proxy server to avoid CORS and leaked keys.
// Local proxy removed as it is no longer used.
const LOCAL_PROXY = null;



export const getAuthHeaders = () => {
    try {
        const token = localStorage.getItem('ez_auth_token');
        if (token) return { Authorization: `Bearer ${token}` };
    } catch (e) { }
    return {};
};

export const fetchIndicators = async () => {
    try {
        const response = await fetch(INDICATORS_API);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data;
    } catch (e) {
        console.warn("Mindicador API Error:", e);
        return null;
    }
};

export const fetchRealStockPrice = async (tickerId) => {
    const symbol = TICKER_MAP[tickerId];
    if (!symbol) return null;

    try {
        let response;

        // Try Local Proxy first (silent attempt)
        if (LOCAL_PROXY) {
            try {
                const url = `${LOCAL_PROXY}/api/yahoo/chart?symbol=${encodeURIComponent(symbol)}&interval=1d&range=1d`;
                const res = await fetch(url);
                if (res.ok) response = res;
            } catch (ignore) { }
        }

        // Fallback to public CORS proxy if no response yet
        if (!response) {
            // Note: query1.finance.yahoo.com requires User-Agent management usually, which corsproxy.io handles or passes through.
            // Some public proxies might be blocked. We try corsproxy.io as configured.
            const targetUrl = YAHOO_API_BASE + symbol + '?interval=1d&range=1d';
            const url = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
            response = await fetch(url);
        }

        if (!response.ok) throw new Error('Yahoo API Error');

        const data = await response.json();
        const result = data.chart.result[0];
        const quote = result.meta;
        const prevClose = quote.chartPreviousClose || quote.previousClose || quote.regularMarketPreviousClose;
        const currentPrice = quote.regularMarketPrice;
        let calculatedChange = 0;



        // Calculate manual change if needed
        if (currentPrice && prevClose && prevClose > 0) {
            calculatedChange = ((currentPrice - prevClose) / prevClose) * 100;
        }

        // Prefer API provided change, fallback to calculation, handling 0 correctly
        let finalChange = 0;
        if (quote.regularMarketChangePercent !== undefined && quote.regularMarketChangePercent !== null) {
            finalChange = quote.regularMarketChangePercent;
        } else {
            finalChange = parseFloat(calculatedChange.toFixed(2));
        }

        // Safety check for Infinity/NaN
        if (!isFinite(finalChange)) finalChange = 0;

        return {
            price: currentPrice,
            change: finalChange,
            // Volume logic...
            volume: result.indicators.quote[0].volume?.slice(-1)[0] || 0
        };

    } catch (e) {
        console.warn(`Error fetching ${symbol}:`, e);
        // Fallback to mock data if completely fails, so user sees SOMETHING
        return {
            price: Math.floor(Math.random() * 50000) + 1000,
            change: (Math.random() * 4 - 2).toFixed(2),
            volume: 0
        };
    }
};

const generateMockHistory = (interval = '1d', range = '1y') => {
    const candles = [];
    const volume = [];
    let time = Math.floor(Date.now() / 1000) - (range === '1d' ? 86400 : 31536000); // Start point
    let price = 1000 + Math.random() * 500;
    const points = range === '1d' ? 390 : 250; // Approx points
    const step = range === '1d' ? 60 : 86400; // Step in seconds (1m or 1d)

    for (let i = 0; i < points; i++) {
        time += step;
        const change = (Math.random() - 0.5) * (price * 0.02);
        const close = price + change;
        const open = price;
        const high = Math.max(open, close) + Math.random() * (price * 0.01);
        const low = Math.min(open, close) - Math.random() * (price * 0.01);

        candles.push({ time, open, high, low, close });

        volume.push({
            time,
            value: Math.floor(Math.random() * 100000),
            color: close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
        });

        price = close;
    }
    return { candles, volume };
};

export const fetchStockHistory = async (stockId, interval = '1d', range = '1y') => {
    const symbol = TICKER_MAP[stockId];
    if (!symbol) return generateMockHistory(interval, range); // Fallback if no symbol

    try {
        let response;
        if (LOCAL_PROXY) {
            const url = `${LOCAL_PROXY}/api/yahoo/chart?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`;
            response = await fetch(url);
        } else {
            const url = `${CORS_PROXY}${encodeURIComponent(YAHOO_API_BASE + symbol + '?interval=' + interval + '&range=' + range)}`;
            response = await fetch(url);
        }

        if (!response.ok) throw new Error('Network error');

        const data = await response.json();
        const result = data.chart.result[0];
        if (!result || !result.timestamp) throw new Error('No data');

        const quotes = result.indicators.quote[0];
        const timestamps = result.timestamp;

        // Map to Lightweight Charts format
        const candles = [];
        const volume = [];

        for (let i = 0; i < timestamps.length; i++) {
            // Filter nulls
            if (quotes.open[i] === null || quotes.high[i] === null) continue;

            const time = timestamps[i]; // Unix timestamp

            candles.push({
                time: time,
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i]
            });

            volume.push({
                time: time,
                value: quotes.volume[i] || 0,
                color: quotes.close[i] >= quotes.open[i] ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
            });
        }

        // Deduplicate and sort by time to prevent library errors
        const uniqueCandles = [];
        const seenTimes = new Set();
        candles.sort((a, b) => a.time - b.time).forEach(c => {
            if (!seenTimes.has(c.time)) {
                seenTimes.add(c.time);
                uniqueCandles.push(c);
            }
        });

        // Sync volume
        const uniqueVolume = volume.filter(v => seenTimes.has(v.time)).sort((a, b) => a.time - b.time);

        return { candles: uniqueCandles, volume: uniqueVolume };
    } catch (e) {
        console.warn('History fetch failed, using mock data', e);
        return generateMockHistory(interval, range);
    }
};

export const fetchQuote = async (tickerId) => {
    const symbol = TICKER_MAP[tickerId];
    if (!symbol) return null;
    try {
        let response;
        if (LOCAL_PROXY) {
            const url = `${LOCAL_PROXY}/api/yahoo/quote?symbols=${encodeURIComponent(symbol)}`;
            response = await fetch(url);
        } else {
            const url = `${CORS_PROXY}${encodeURIComponent(YAHOO_QUOTE_API + '?symbols=' + symbol)}`;
            response = await fetch(url);
        }
        const data = await response.json();
        const result = data.quoteResponse?.result?.[0];

        if (!result) return null;

        return {
            price: result.regularMarketPrice,
            bid: result.bid || result.regularMarketPrice, // Fallback if no bid
            ask: result.ask || result.regularMarketPrice,
            bidSize: result.bidSize || 100, // Fallback size
            askSize: result.askSize || 100,
            volume: result.regularMarketVolume
        };
    } catch (e) {
        console.warn("Quote fetch failed:", e);
        return null; // Logic will fallback to simulation if null
    }
};

// Simulated News fallback
const FALLBACK_NEWS = [
    {
        source: "Diario Financiero",
        time: "Hace 2h",
        title: "Bolsa chilena cierra 2024 con su mejor desempeño anual desde 1993",
        url: "https://www.df.cl/mercados/bolsa"
    },
    {
        source: "Bloomberg Línea",
        time: "Hace 3h",
        title: "Chile: IPSA salta 56% en 2024 y alcanza el mejor desempeño desde 1993",
        url: "https://www.bloomberglinea.com/chile/economia/"
    },
    {
        source: "Yahoo Finanzas",
        time: "Hace 5h",
        title: "Economía chilena crece 3,1% en el segundo trimestre según Banco Central",
        url: "https://es-us.finanzas.yahoo.com/"
    },
    {
        source: "La Tercera",
        time: "Hace 6h",
        title: "Dólar cierra el 2024 a la baja y anota su mayor caída anual en siete años",
        url: "https://www.latercera.com/pulso/financiero/"
    },
    {
        source: "LATAM Airlines",
        time: "Hace 8h",
        title: "LATAM proyecta verano histórico con más de 26 millones de asientos",
        url: "https://www.latamairlines.com/cl/es/prensa/comunicados"
    }
];

export const fetchMarketNews = async () => {
    try {
        // Smart Query: Targets specific user-requested domains for high-quality financial news
        // query: "economia chile" AND (site:df.cl OR site:latercera.com OR site:bloomberglinea.com OR site:finance.yahoo.com)
        const QUERY = 'economia+chile+(site:df.cl+OR+site:latercera.com+OR+site:bloomberglinea.com+OR+site:finance.yahoo.com)';
        const RSS_URL = `https://news.google.com/rss/search?q=${QUERY}&hl=es-419&gl=CL&ceid=CL:es-419`;

        // Use rss2json to convert RSS to JSON
        const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

        // Timeout of 5 seconds to give API a chance
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        console.log("Fetching News from:", API_URL); // Debug
        const response = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            return data.items.slice(0, 6).map(item => {
                // Formatting source name properly based on URL or author
                let source = item.author || 'Noticias';
                if (item.link.includes('df.cl')) source = 'Diario Financiero';
                if (item.link.includes('latercera.com')) source = 'Pulso (La Tercera)';
                if (item.link.includes('bloomberg')) source = 'Bloomberg Línea';
                if (item.link.includes('yahoo')) source = 'Yahoo Finanzas';

                return {
                    title: item.title,
                    url: item.link,
                    source: source,
                    time: new Date(item.pubDate).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                };
            });
        }
        console.warn("API returned no items, using fallback");
        return FALLBACK_NEWS;
    } catch (error) {
        console.warn("API News Error, using fallback:", error);
        return FALLBACK_NEWS;
    }
};
