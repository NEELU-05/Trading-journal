import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatR, formatPercentage } from '../utils/calculations';

function StatsPanel() {
    const [stats, setStats] = useState({
        totalTrades: 0,
        winRate: 0,
        avgR: 0,
        bestSetup: { name: 'N/A', avgR: 0 },
        worstSetup: { name: 'N/A', avgR: 0 }
    });
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/api/trades/api/stats');
                setStats(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="card">
                <h2 className="section-title">Statistics</h2>
                <div className="text-gray-400">Loading stats...</div>
            </div>
        );
    }

    return (
        <div className="card">
            <h2 className="section-title">Performance Statistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Total Trades */}
                <div className="bg-slate-700 rounded p-4">
                    <div className="text-gray-400 text-xs uppercase mb-1">Total Trades</div>
                    <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
                </div>

                {/* Win Rate */}
                <div className="bg-slate-700 rounded p-4">
                    <div className="text-gray-400 text-xs uppercase mb-1">Win Rate</div>
                    <div className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-win-green' : 'text-loss-red'}`}>
                        {formatPercentage(stats.winRate)}
                    </div>
                </div>

                {/* Average R */}
                <div className="bg-slate-700 rounded p-4">
                    <div className="text-gray-400 text-xs uppercase mb-1">Avg R-Multiple</div>
                    <div className={`text-2xl font-bold ${stats.avgR >= 0 ? 'text-win-green' : 'text-loss-red'}`}>
                        {formatR(stats.avgR)}
                    </div>
                </div>

                {/* Best Setup */}
                <div className="bg-slate-700 rounded p-4">
                    <div className="text-gray-400 text-xs uppercase mb-1">Best Setup</div>
                    <div className="text-sm font-semibold text-win-green">{stats.bestSetup.name}</div>
                    <div className="text-xs text-gray-400">{formatR(stats.bestSetup.avgR)}</div>
                </div>

                {/* Worst Setup */}
                <div className="bg-slate-700 rounded p-4">
                    <div className="text-gray-400 text-xs uppercase mb-1">Worst Setup</div>
                    <div className="text-sm font-semibold text-loss-red">{stats.worstSetup.name}</div>
                    <div className="text-xs text-gray-400">{formatR(stats.worstSetup.avgR)}</div>
                </div>
            </div>
        </div>
    );
}

export default StatsPanel;
