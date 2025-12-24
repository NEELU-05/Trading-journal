const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper function to calculate R-Multiple
function calculateRMultiple(entry, exit, stopLoss, direction) {
    if (direction === 'Long') {
        return (exit - entry) / (entry - stopLoss);
    } else {
        return (entry - exit) / (stopLoss - entry);
    }
}

// Helper function to calculate P&L
function calculatePnL(entry, exit, positionSize, direction) {
    if (direction === 'Long') {
        return (exit - entry) * positionSize;
    } else {
        return (entry - exit) * positionSize;
    }
}

// Helper function to calculate Risk-Reward ratio
function calculateRR(entry, takeProfit, stopLoss, direction) {
    if (direction === 'Long') {
        return (takeProfit - entry) / (entry - stopLoss);
    } else {
        return (entry - takeProfit) / (stopLoss - entry);
    }
}

// Helper function to determine if trade should be flagged
function shouldFlagTrade(rr, slMoved, followedRules) {
    return rr < 1.5 || slMoved === 1 || followedRules === 0;
}

// GET all trades
router.get('/', (req, res) => {
    const { sortBy, order } = req.query;
    let query = 'SELECT * FROM trades';

    // Add sorting
    if (sortBy) {
        const validSortColumns = ['datetime', 'r_multiple', 'setup_name', 'outcome'];
        const validOrder = order === 'asc' ? 'ASC' : 'DESC';

        if (validSortColumns.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${validOrder}`;
        }
    } else {
        query += ' ORDER BY datetime DESC';
    }

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Parse confirmations JSON string back to array
        const trades = rows.map(row => ({
            ...row,
            confirmations: JSON.parse(row.confirmations || '[]')
        }));

        res.json(trades);
    });
});

// GET single trade
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM trades WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Trade not found' });
            return;
        }

        const trade = {
            ...row,
            confirmations: JSON.parse(row.confirmations || '[]')
        };

        res.json(trade);
    });
});

// POST new trade
router.post('/', (req, res) => {
    const {
        symbol,
        timeframe,
        direction,
        datetime,
        entry_price,
        stop_loss,
        take_profit,
        risk_amount,
        position_size,
        setup_name,
        htf_trend,
        entry_reason,
        confirmations,
        sl_moved,
        manual_interference,
        exit_price,
        followed_rules,
        biggest_mistake,
        would_take_again
    } = req.body;

    // Calculate P&L and R-Multiple if exit price is provided
    let pnl = null;
    let r_multiple = null;
    let outcome = null;

    if (exit_price) {
        pnl = calculatePnL(entry_price, exit_price, position_size, direction);
        r_multiple = calculateRMultiple(entry_price, exit_price, stop_loss, direction);

        // Determine outcome
        if (Math.abs(pnl) < 0.01) {
            outcome = 'BE';
        } else if (pnl > 0) {
            outcome = 'Win';
        } else {
            outcome = 'Loss';
        }
    }

    // Calculate RR and check if trade should be flagged
    const rr = calculateRR(entry_price, take_profit, stop_loss, direction);
    const is_flagged = shouldFlagTrade(rr, sl_moved ? 1 : 0, followed_rules ? 1 : 0) ? 1 : 0;

    const query = `
    INSERT INTO trades (
      symbol, timeframe, direction, datetime, entry_price, stop_loss, take_profit,
      risk_amount, position_size, setup_name, htf_trend, entry_reason, confirmations,
      sl_moved, manual_interference, exit_price, pnl, r_multiple, outcome,
      followed_rules, biggest_mistake, would_take_again, is_flagged
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const params = [
        symbol,
        timeframe,
        direction,
        datetime,
        entry_price,
        stop_loss,
        take_profit,
        risk_amount,
        position_size,
        setup_name,
        htf_trend,
        entry_reason,
        JSON.stringify(confirmations || []),
        sl_moved ? 1 : 0,
        manual_interference ? 1 : 0,
        exit_price,
        pnl,
        r_multiple,
        outcome,
        followed_rules ? 1 : 0,
        biggest_mistake || '',
        would_take_again ? 1 : 0,
        is_flagged
    ];

    db.run(query, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            message: 'Trade created successfully'
        });
    });
});

// PUT update trade
router.put('/:id', (req, res) => {
    const {
        symbol,
        timeframe,
        direction,
        datetime,
        entry_price,
        stop_loss,
        take_profit,
        risk_amount,
        position_size,
        setup_name,
        htf_trend,
        entry_reason,
        confirmations,
        sl_moved,
        manual_interference,
        exit_price,
        followed_rules,
        biggest_mistake,
        would_take_again
    } = req.body;

    // Calculate P&L and R-Multiple if exit price is provided
    let pnl = null;
    let r_multiple = null;
    let outcome = null;

    if (exit_price) {
        pnl = calculatePnL(entry_price, exit_price, position_size, direction);
        r_multiple = calculateRMultiple(entry_price, exit_price, stop_loss, direction);

        if (Math.abs(pnl) < 0.01) {
            outcome = 'BE';
        } else if (pnl > 0) {
            outcome = 'Win';
        } else {
            outcome = 'Loss';
        }
    }

    const rr = calculateRR(entry_price, take_profit, stop_loss, direction);
    const is_flagged = shouldFlagTrade(rr, sl_moved ? 1 : 0, followed_rules ? 1 : 0) ? 1 : 0;

    const query = `
    UPDATE trades SET
      symbol = ?, timeframe = ?, direction = ?, datetime = ?, entry_price = ?,
      stop_loss = ?, take_profit = ?, risk_amount = ?, position_size = ?,
      setup_name = ?, htf_trend = ?, entry_reason = ?, confirmations = ?,
      sl_moved = ?, manual_interference = ?, exit_price = ?, pnl = ?,
      r_multiple = ?, outcome = ?, followed_rules = ?, biggest_mistake = ?,
      would_take_again = ?, is_flagged = ?
    WHERE id = ?
  `;

    const params = [
        symbol, timeframe, direction, datetime, entry_price, stop_loss, take_profit,
        risk_amount, position_size, setup_name, htf_trend, entry_reason,
        JSON.stringify(confirmations || []), sl_moved ? 1 : 0, manual_interference ? 1 : 0,
        exit_price, pnl, r_multiple, outcome, followed_rules ? 1 : 0,
        biggest_mistake || '', would_take_again ? 1 : 0, is_flagged, req.params.id
    ];

    db.run(query, params, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Trade not found' });
            return;
        }
        res.json({ message: 'Trade updated successfully' });
    });
});

// DELETE trade
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM trades WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Trade not found' });
            return;
        }
        res.json({ message: 'Trade deleted successfully' });
    });
});

// GET statistics
router.get('/api/stats', (req, res) => {
    const statsQuery = `
    SELECT 
      COUNT(*) as total_trades,
      SUM(CASE WHEN outcome = 'Win' THEN 1 ELSE 0 END) as wins,
      AVG(r_multiple) as avg_r,
      setup_name,
      AVG(CASE WHEN r_multiple IS NOT NULL THEN r_multiple ELSE 0 END) as setup_avg_r
    FROM trades
    GROUP BY setup_name
  `;

    db.all('SELECT * FROM trades', [], (err, allTrades) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const totalTrades = allTrades.length;
        const wins = allTrades.filter(t => t.outcome === 'Win').length;
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

        const tradesWithR = allTrades.filter(t => t.r_multiple !== null);
        const avgR = tradesWithR.length > 0
            ? tradesWithR.reduce((sum, t) => sum + t.r_multiple, 0) / tradesWithR.length
            : 0;

        // Calculate best and worst setups
        const setupStats = {};
        allTrades.forEach(trade => {
            if (trade.r_multiple !== null) {
                if (!setupStats[trade.setup_name]) {
                    setupStats[trade.setup_name] = { total: 0, count: 0 };
                }
                setupStats[trade.setup_name].total += trade.r_multiple;
                setupStats[trade.setup_name].count += 1;
            }
        });

        let bestSetup = { name: 'N/A', avgR: 0 };
        let worstSetup = { name: 'N/A', avgR: 0 };

        Object.keys(setupStats).forEach(setupName => {
            const avgR = setupStats[setupName].total / setupStats[setupName].count;
            if (avgR > bestSetup.avgR) {
                bestSetup = { name: setupName, avgR };
            }
            if (worstSetup.name === 'N/A' || avgR < worstSetup.avgR) {
                worstSetup = { name: setupName, avgR };
            }
        });

        res.json({
            totalTrades,
            winRate: parseFloat(winRate.toFixed(2)),
            avgR: parseFloat(avgR.toFixed(2)),
            bestSetup,
            worstSetup
        });
    });
});

// GET all setup names
router.get('/api/setups', (req, res) => {
    db.all('SELECT * FROM setups ORDER BY name', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// POST new setup name
router.post('/api/setups', (req, res) => {
    const { name } = req.body;

    db.run('INSERT INTO setups (name) VALUES (?)', [name], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                res.status(400).json({ error: 'Setup name already exists' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        res.json({
            id: this.lastID,
            name,
            message: 'Setup created successfully'
        });
    });
});

module.exports = router;
