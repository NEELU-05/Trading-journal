import React, { useState } from 'react';
import StatsPanel from './StatsPanel';
import JournalTable from './JournalTable';
import TradeForm from './TradeForm';
import CsvImportModal from './CsvImportModal';
import axios from 'axios';

function Dashboard() {
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleFormSubmit = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleImportTrade = async (tradeData) => {
        await axios.post('/api/trades', tradeData);
    };

    const handleImportClose = () => {
        setShowImport(false);
        setRefreshKey(prev => prev + 1);
    };

    if (showForm) {
        return (
            <div className="min-h-screen bg-slate-900 p-6">
                <TradeForm
                    onClose={() => setShowForm(false)}
                    onSubmit={handleFormSubmit}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Trading Journal</h1>
                        <p className="text-gray-400 mt-1">Track, analyze, and improve your trading performance</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowImport(true)}
                            className="bg-slate-700 hover:bg-slate-600 text-white text-lg px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                            Import CSV
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary text-lg px-6 py-3"
                        >
                            + Add New Trade
                        </button>
                    </div>
                </div>

                {/* Stats Panel */}
                <StatsPanel key={`stats-${refreshKey}`} />

                {/* Journal Table */}
                <JournalTable key={`table-${refreshKey}`} onRefresh={handleRefresh} />

                {showImport && (
                    <CsvImportModal
                        isOpen={showImport}
                        onClose={handleImportClose}
                        onImport={handleImportTrade}
                    />
                )}
            </div>
        </div>
    );
}

export default Dashboard;
