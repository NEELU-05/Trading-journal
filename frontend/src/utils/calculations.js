// Calculate R-Multiple based on direction
export function calculateRMultiple(entry, exit, stopLoss, direction) {
    if (!entry || !exit || !stopLoss) return null;

    const entryNum = parseFloat(entry);
    const exitNum = parseFloat(exit);
    const stopLossNum = parseFloat(stopLoss);

    if (direction === 'Long') {
        const risk = entryNum - stopLossNum;
        if (risk === 0) return 0;
        return (exitNum - entryNum) / risk;
    } else {
        const risk = stopLossNum - entryNum;
        if (risk === 0) return 0;
        return (entryNum - exitNum) / risk;
    }
}

// Calculate P&L based on direction
export function calculatePnL(entry, exit, positionSize, direction) {
    if (!entry || !exit || !positionSize) return null;

    const entryNum = parseFloat(entry);
    const exitNum = parseFloat(exit);
    const positionSizeNum = parseFloat(positionSize);

    if (direction === 'Long') {
        return (exitNum - entryNum) * positionSizeNum;
    } else {
        return (entryNum - exitNum) * positionSizeNum;
    }
}

// Calculate Risk-Reward ratio
export function calculateRR(entry, takeProfit, stopLoss, direction) {
    if (!entry || !takeProfit || !stopLoss) return null;

    const entryNum = parseFloat(entry);
    const takeProfitNum = parseFloat(takeProfit);
    const stopLossNum = parseFloat(stopLoss);

    if (direction === 'Long') {
        const risk = entryNum - stopLossNum;
        if (risk === 0) return 0;
        return (takeProfitNum - entryNum) / risk;
    } else {
        const risk = stopLossNum - entryNum;
        if (risk === 0) return 0;
        return (entryNum - takeProfitNum) / risk;
    }
}

// Determine if trade should be flagged
export function shouldFlagTrade(rr, slMoved, followedRules) {
    return rr < 1.5 || slMoved || !followedRules;
}

// Determine outcome based on P&L
export function determineOutcome(pnl) {
    if (pnl === null || pnl === undefined) return null;
    const pnlNum = parseFloat(pnl);

    if (Math.abs(pnlNum) < 0.01) return 'BE';
    return pnlNum > 0 ? 'Win' : 'Loss';
}

// Format currency
export function formatCurrency(value) {
    if (value === null || value === undefined) return '-';
    return `₹${parseFloat(value).toFixed(2)}`;
}

// Format R-Multiple
export function formatR(value) {
    if (value === null || value === undefined) return '-';
    const num = parseFloat(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}R`;
}

// Format percentage
export function formatPercentage(value) {
    if (value === null || value === undefined) return '-';
    return `${parseFloat(value).toFixed(2)}%`;
}
