// Dividend Yields Database for Chilean Stocks
// Valores aproximados basados en rendimientos históricos

export const DIVIDEND_YIELDS = {
    // High Dividend Payers (>5% anual)
    'COPEC': 4.8,
    'ENELAM': 6.2,
    'COLBUN': 5.5,
    'CAP': 4.5,
    'AGUAS-A': 5.8,
    'IAM': 5.2,

    // Medium Dividend Payers (3-5% anual)
    'CMPC': 3.5,
    'CHILE': 4.2,
    'BSANTANDER': 3.8,
    'BCI': 4.0,
    'SQM-B': 3.2,
    'FALABELLA': 3.5,
    'CENCOSUD': 3.0,

    // Lower Dividend Payers (1-3% anual)
    'VAPORES': 2.5,
    'RIPLEY': 2.0,
    'SMU': 2.2,
    'ENELCHILE': 2.8,
    'SECURITY': 3.2,

    // Growth Stocks (0-1% anual)
    'SONDA': 1.5,
    'BESALCO': 1.0,
    'FORUS': 1.2,

    // Default for unlisted
    'DEFAULT': 2.0
};

// Get dividend yield for a stock
export const getDividendYield = (ticker) => {
    return DIVIDEND_YIELDS[ticker] || DIVIDEND_YIELDS['DEFAULT'];
};

// Calculate quarterly dividend payment
export const calculateQuarterlyDividend = (ticker, quantity, currentPrice) => {
    const annualYield = getDividendYield(ticker);
    const quarterlyYield = annualYield / 4; // Dividido en 4 trimestres
    const totalValue = quantity * currentPrice;
    const dividendAmount = totalValue * (quarterlyYield / 100);

    return {
        ticker,
        quantity,
        currentPrice,
        annualYield,
        quarterlyYield,
        dividendAmount,
        totalValue
    };
};

// Generate dividend payout for entire portfolio
export const generatePortfolioDividends = (portfolio, stocks) => {
    const dividends = [];

    Object.keys(portfolio).forEach(ticker => {
        const position = portfolio[ticker];
        const qty = typeof position === 'number' ? position : position.qty;

        if (qty > 0) {
            const stock = stocks.find(s => s.id === ticker);
            if (stock) {
                const dividend = calculateQuarterlyDividend(ticker, qty, stock.price);
                dividends.push(dividend);
            }
        }
    });

    return dividends;
};

// Format dividend date (quarterly)
export const getNextDividendDate = () => {
    const today = new Date();
    const month = today.getMonth();

    // Dividendos trimestrales: Marzo, Junio, Septiembre, Diciembre
    const dividendMonths = [2, 5, 8, 11]; // 0-indexed

    let nextMonth = dividendMonths.find(m => m > month);
    if (!nextMonth) {
        nextMonth = dividendMonths[0];
    }

    const nextDate = new Date(today.getFullYear(), nextMonth, 15);
    if (nextDate <= today) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    return nextDate;
};
