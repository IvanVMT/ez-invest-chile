import { fetchStockHistory } from '../services/api.js';
import { store } from '../state/store.js';

export const renderTVChart = async (ticker) => {
    // Get params from global store or local storage fallback
    // We will use localStorage for chart params specifically as it's UI preference
    const savedChartParams = localStorage.getItem('ez_chartParams');
    const chartParams = savedChartParams ? JSON.parse(savedChartParams) : {
        interval: '1d',
        range: '1y',
        type: 'candles'
    };

    const container = document.getElementById('tv-chart-container');
    if (!container) return;

    // Add loading state
    container.style.opacity = '0.5';

    // Library Safety Check
    if (typeof LightweightCharts === 'undefined') {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px; color: var(--danger);">
                <div>⚠️ Error de Librería</div>
                <small>No se pudo cargar el módulo de gráficos.</small>
            </div>`;
        return;
    }

    // Reset opacity
    container.style.opacity = '1';

    try {
        // Fetch Data with Params
        const history = await fetchStockHistory(ticker, chartParams.interval, chartParams.range);

        // RACE CONDITION FIX: Clear container HERE, right before rendering.
        // If multiple fetches finished, this ensures we wipe any previous render (including one from a race)
        container.innerHTML = '';

        if (!history || history.candles.length === 0) {
            container.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%;color:var(--text-muted)">Datos no disponibles para este rango</div>';
            return;
        }

        // Theme Aware Colors
        const state = store.getState();
        const isDark = state.theme === 'dark';
        const textColor = isDark ? '#ffffff' : '#0f172a'; // White vs Slate 900
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

        // Calculate dimensions with safety fallbacks
        let width = container.clientWidth;
        if (width === 0) {
            width = container.parentElement ? container.parentElement.clientWidth : 800;
        }
        if (width === 0) width = 800; // Final fallback

        // Create Chart
        const chart = LightweightCharts.createChart(container, {
            width: width,
            height: 500,
            layout: {
                background: { color: 'transparent' },
                textColor: textColor,
                fontFamily: "'Outfit', sans-serif",
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            // Optimize for touch/mobile
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderVisible: false,
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                rightOffset: 12,
                barSpacing: 6,
                minBarSpacing: 0.5,
                fixLeftEdge: false,
                fixRightEdge: false,
                lockVisibleTimeRangeOnResize: true,
            },
            handleScale: {
                mouseWheel: true,
                pinch: true,
                axisPressedMouseMove: true,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        candlestickSeries.setData(history.candles);

        // Volume
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // Overlay
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        volumeSeries.setData(history.volume);

        // Resize handler
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== container) { return; }
            const newRect = entries[0].contentRect;
            chart.applyOptions({ width: newRect.width, height: newRect.height });
        });

        resizeObserver.observe(container);

        // Save reference for cleanup if needed
        container._chart = chart;
        container._resizeObserver = resizeObserver;

    } catch (e) {
        console.error("Chart Render Error", e);
        container.innerHTML = `<div style="text-align:center;padding:20px;">Error cargando gráfico</div>`;
    }
};

export const changeChartPeriod = (ticker, interval, range) => {
    const savedChartParams = localStorage.getItem('ez_chartParams');
    const params = savedChartParams ? JSON.parse(savedChartParams) : { interval: '1d', range: '1y', type: 'candles' };

    params.interval = interval;
    params.range = range;
    localStorage.setItem('ez_chartParams', JSON.stringify(params));
    renderTVChart(ticker);
};
