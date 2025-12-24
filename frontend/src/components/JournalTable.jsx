import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency, formatR } from '../utils/calculations';

function JournalTable({ onRefresh }) {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'datetime', order: 'desc' });



    const fetchTrades = React.useCallback(async () => {
        try {
            const response = await axios.get('/api/trades', {
                params: {
                    sortBy: sortConfig.key,
                    order: sortConfig.order
                }
            });
            setTrades(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching trades:', error);
            setLoading(false);
        }
    }, [sortConfig]);


    useEffect(() => {
        // eslint-disable-next-line
        fetchTrades();
    }, [fetchTrades]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this trade?')) return;

        try {
            await axios.delete(`/api/trades/${id}`);
            fetchTrades();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting trade:', error);
            alert('Failed to delete trade');
        }
    };


    if (loading) {
        return (
            <div className="card">
                <h2 className="section-title">Trade Journal</h2>
                <div className="text-gray-400">Loading trades...</div>
            </div>
        );
    }

    if (trades.length === 0) {
        return (
            <div className="card">
                <h2 className="section-title">Trade Journal</h2>
                <div className="text-gray-400 text-center py-8">
                    No trades yet. Add your first trade to get started.
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <h2 className="section-title">Trade Journal ({trades.length} trades)</h2>

            <div className="overflow-x-auto">
                <table className="trade-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('datetime')}>
                                Date <SortIcon columnKey="datetime" sortConfig={sortConfig} />
                            </th>
                            <th>Symbol</th>
                            <th>TF</th>
                            <th>Dir</th>
                            <th onClick={() => handleSort('setup_name')}>
                                Setup <SortIcon columnKey="setup_name" sortConfig={sortConfig} />
                            </th>
                            <th>Entry</th>
                            <th>Exit</th>
                            <th onClick={() => handleSort('r_multiple')}>
                                R <SortIcon columnKey="r_multiple" sortConfig={sortConfig} />
                            </th>
                            <th>P&L</th>
                            <th onClick={() => handleSort('outcome')}>
                                Outcome <SortIcon columnKey="outcome" sortConfig={sortConfig} />
                            </th>
                            <th>HTF Trend</th>
                            <th>Rules</th>
                            <th>SL Moved</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map(trade => (
                            <tr key={trade.id} className={trade.is_flagged ? 'flagged' : ''}>
                                <td className="whitespace-nowrap">
                                    {new Date(trade.datetime).toLocaleString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td className="font-semibold">{trade.symbol}</td>
                                <td>{trade.timeframe}</td>
                                <td>
                                    <span className={trade.direction === 'Long' ? 'text-win-green' : 'text-loss-red'}>
                                        {trade.direction}
                                    </span>
                                </td>
                                <td>{trade.setup_name}</td>
                                <td>{trade.entry_price}</td>
                                <td>{trade.exit_price || '-'}</td>
                                <td className={trade.r_multiple >= 0 ? 'text-win-green font-semibold' : 'text-loss-red font-semibold'}>
                                    {formatR(trade.r_multiple)}
                                </td>
                                <td className={trade.pnl >= 0 ? 'text-win-green' : 'text-loss-red'}>
                                    {formatCurrency(trade.pnl)}
                                </td>
                                <td>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${trade.outcome === 'Win' ? 'bg-win-green bg-opacity-20 text-win-green' :
                                        trade.outcome === 'Loss' ? 'bg-loss-red bg-opacity-20 text-loss-red' :
                                            'bg-be-gray bg-opacity-20 text-be-gray'
                                        }`}>
                                        {trade.outcome || '-'}
                                    </span>
                                </td>
                                <td>{trade.htf_trend}</td>
                                <td>
                                    <span className={trade.followed_rules ? 'text-win-green' : 'text-flag-red'}>
                                        {trade.followed_rules ? '✓' : '✗'}
                                    </span>
                                </td>
                                <td>
                                    <span className={trade.sl_moved ? 'text-flag-red' : 'text-gray-400'}>
                                        {trade.sl_moved ? 'Yes' : 'No'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleDelete(trade.id)}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


const SortIcon = ({ columnKey, sortConfig }) => {
    if (sortConfig.key !== columnKey) return <span className="text-gray-500">↕</span>;
    return sortConfig.order === 'asc' ? <span>↑</span> : <span>↓</span>;
};

export default JournalTable;
