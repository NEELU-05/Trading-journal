import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import axios from 'axios';
import { X, Upload, AlertCircle, Check, ArrowRight, Save, Copy } from 'lucide-react';

const REQUIRED_FIELDS = [
    { key: 'symbol', label: 'Symbol', type: 'text' },
    { key: 'timeframe', label: 'Timeframe', type: 'select', options: ['1m', '5m', '15m', '1h', '4h', 'D', 'W'] },
    { key: 'direction', label: 'Direction', type: 'select', options: ['Long', 'Short'] },
    { key: 'datetime', label: 'Date/Time', type: 'datetime-local' },
    { key: 'entry_price', label: 'Entry Price', type: 'number' },
    { key: 'position_size', label: 'Position Size', type: 'number' },
    { key: 'stop_loss', type: 'number' },
    { key: 'take_profit', label: 'Take Profit', type: 'number' },
    { key: 'risk_amount', label: 'Risk Amount ($)', type: 'number' },
    { key: 'setup_name', label: 'Setup Name', type: 'select', options: [] }, // Options populated via API
    { key: 'htf_trend', label: 'HTF Trend', type: 'select', options: ['Uptrend', 'Downtrend', 'Ranging'] },
    { key: 'entry_reason', label: 'Entry Reason', type: 'textarea' },
];

// Heuristic to map common CSV headers to our keys
const mapHeaderToKey = (header) => {
    const h = header.toLowerCase().trim();
    if (['symbol', 'ticker', 'instrument'].includes(h)) return 'symbol';
    if (['side', 'direction', 'type'].includes(h)) return 'direction';
    if (['date', 'time', 'datetime', 'timestamp'].includes(h)) return 'datetime';
    if (['price', 'entry', 'entry price', 'avg price', 'fill price'].includes(h)) return 'entry_price';
    if (['qty', 'quantity', 'size', 'amount', 'volume'].includes(h)) return 'position_size';
    if (['pnl', 'profit', 'loss', 'realalized pnl'].includes(h)) return '_pnl_hint'; // Just a hint, not required for creation
    return null;
};

const CsvImportModal = ({ isOpen, onClose, onImport }) => { // Removed setups prop
    const [step, setStep] = useState('upload'); // upload, review, fixing, importing, success
    const [rawRows, setRawRows] = useState([]);
    const [processedTrades, setProcessedTrades] = useState([]);
    const [currentFixIndex, setCurrentFixIndex] = useState(0);
    const [currentTradeData, setCurrentTradeData] = useState({});
    const [importProgress, setImportProgress] = useState(0);
    const [availableSetups, setAvailableSetups] = useState([]);

    useEffect(() => {
        const fetchSetups = async () => {
            try {
                const res = await axios.get('/api/setups');
                setAvailableSetups(res.data);
            } catch (err) {
                console.error("Failed to fetch setups", err);
            }
        };
        if (isOpen) fetchSetups();
    }, [isOpen]);

    // Reset state when opening: Handled by parent conditionally rendering or key changing

    const isValid = useCallback((trade) => {
        return REQUIRED_FIELDS.every(field => {
            const val = trade[field.key];
            return val !== undefined && val !== null && val !== '';
        });
    }, []);

    const processInitialData = useCallback((rows) => {
        const processed = rows.map((row) => {
            const newTrade = {};

            // Auto-map keys
            Object.keys(row).forEach((header) => {
                const key = mapHeaderToKey(header);
                if (key) {
                    let value = row[header];
                    // Simple cleaning
                    if (key === 'entry_price' || key === 'position_size' || key === '_pnl_hint') {
                        value = parseFloat(value.replace(/[^0-9.-]/g, ''));
                    }
                    if (key !== '_pnl_hint') newTrade[key] = value;
                }
            });

            // Defaults
            newTrade.confirmations = [];
            newTrade.manual_interference = 0;
            newTrade.sl_moved = 0;
            newTrade.is_flagged = 0;

            return newTrade;
        });

        setProcessedTrades(processed);
        setStep('fixing');
        // Find first invalid
        const firstInvalid = processed.findIndex(t => !isValid(t));
        if (firstInvalid !== -1) {
            setCurrentFixIndex(firstInvalid);
            setCurrentTradeData(processed[firstInvalid]);
        } else {
            setStep('review');
        }
    }, [isValid, setProcessedTrades, setStep, setCurrentFixIndex, setCurrentTradeData]);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setRawRows(results.data);
                processInitialData(results.data);
            },
        });
    }, [processInitialData, setRawRows]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

    const handleFixChange = (key, value) => {
        setCurrentTradeData(prev => ({ ...prev, [key]: value }));
    };

    const applyFix = () => {
        const newProcessed = [...processedTrades];
        newProcessed[currentFixIndex] = currentTradeData;
        setProcessedTrades(newProcessed);

        // Find next invalid
        let nextIndex = -1;
        for (let i = currentFixIndex + 1; i < newProcessed.length; i++) {
            if (!isValid(newProcessed[i])) {
                nextIndex = i;
                break;
            }
        }

        if (nextIndex !== -1) {
            setCurrentFixIndex(nextIndex);
            setCurrentTradeData(newProcessed[nextIndex]);
        } else {
            setStep('review'); // All fixed
        }
    };

    const applyToAll = (key) => {
        const val = currentTradeData[key];
        if (!val) return;

        const newProcessed = processedTrades.map((t, idx) => {
            if (idx >= currentFixIndex && !t[key]) {
                return { ...t, [key]: val };
            }
            return t;
        });

        // Update current one too
        const updatedCurrent = { ...currentTradeData, [key]: val };
        setCurrentTradeData(updatedCurrent);

        // Update state but don't move next yet, user might be fixing other fields
        // Actually we should update the whole list in state
        newProcessed[currentFixIndex] = updatedCurrent;
        setProcessedTrades(newProcessed);
    };

    const handleImport = async () => {
        setStep('importing');

        for (let i = 0; i < processedTrades.length; i++) {
            try {
                await onImport(processedTrades[i]);
                setImportProgress(((i + 1) / processedTrades.length) * 100);
            } catch (e) {
                console.error("Import failed for row", i, e);
            }
        }
        setStep('success');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Upload className="w-6 h-6 text-blue-400" />
                            Import Trades via CSV
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {step === 'upload' && "Upload a generic broker export CSV"}
                            {step === 'fixing' && `Reviewing Trade ${currentFixIndex + 1} of ${processedTrades.length}`}
                            {step === 'review' && "Ready to Import"}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {step === 'upload' && (
                        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all
                ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}>
                            <input {...getInputProps()} />
                            <Upload className={`w-12 h-12 mb-4 ${isDragActive ? 'text-blue-400' : 'text-slate-500'}`} />
                            <p className="text-lg font-medium text-slate-300">Drag & drop CSV here, or click to select</p>
                            <p className="text-sm text-slate-500 mt-2">Supports generic broker exports</p>
                        </div>
                    )}

                    {step === 'fixing' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Raw Data View */}
                            <div className="lg:col-span-1 bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-fit">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Found in CSV</h3>
                                <div className="space-y-2">
                                    {rawRows[currentFixIndex] && Object.entries(rawRows[currentFixIndex]).map(([k, v]) => (
                                        <div key={k} className="flex flex-col border-b border-slate-700/50 pb-1">
                                            <span className="text-xs text-slate-500">{k}</span>
                                            <span className="text-sm text-slate-200 truncate" title={v}>{v || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Form */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-200">Missing required data. Please fill in the details below.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {REQUIRED_FIELDS.map((field) => {
                                        const isMissing = !currentTradeData[field.key] && currentTradeData[field.key] !== 0; // 0 is valid for price/size
                                        return (
                                            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className={`text-sm font-medium ${isMissing ? 'text-red-400' : 'text-slate-300'}`}>
                                                        {field.label} {isMissing && '*'}
                                                    </label>
                                                    {isMissing && (
                                                        <button
                                                            onClick={() => applyToAll(field.key)}
                                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                                            title="Use this value for all incomplete trades"
                                                        >
                                                            <Copy className="w-3 h-3" /> Apply to all
                                                        </button>
                                                    )}
                                                </div>

                                                {field.type === 'select' ? (
                                                    <select
                                                        value={currentTradeData[field.key] || ''}
                                                        onChange={(e) => handleFixChange(field.key, e.target.value)}
                                                        className={`w-full bg-slate-800/50 border rounded-lg px-3 py-2 text-white outline-none focus:ring-2 transition-all
                                                ${isMissing ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700 focus:ring-blue-500/50'}`}
                                                    >
                                                        <option value="">Select...</option>
                                                        {(field.key === 'setup_name' && availableSetups.length > 0 ? availableSetups.map(s => s.name) : field.options || []).map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={currentTradeData[field.key] || ''}
                                                        onChange={(e) => handleFixChange(field.key, e.target.value)}
                                                        className={`w-full bg-slate-800/50 border rounded-lg px-3 py-2 text-white outline-none focus:ring-2 transition-all
                                                ${isMissing ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700 focus:ring-blue-500/50'}`}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">All Set!</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-8">
                                We have prepared {processedTrades.length} trades for import. All required data fields are populated.
                            </p>

                            <div className="bg-slate-800 rounded-lg p-4 max-w-sm mx-auto text-left">
                                <div className="flex justify-between text-sm py-2 border-b border-slate-700">
                                    <span className="text-slate-400">Total Trades</span>
                                    <span className="text-white font-medium">{processedTrades.length}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2">
                                    <span className="text-slate-400">Estimated Value</span>
                                    <span className="text-white font-medium">
                                        {processedTrades.reduce((acc, t) => acc + (parseFloat(t._pnl_hint) || 0), 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                            <div className="w-full max-w-md bg-slate-800 rounded-full h-4 mb-4 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-300 ease-out"
                                    style={{ width: `${importProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-slate-300 font-medium">Importing... {Math.round(importProgress)}%</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-12">
                            <Check className="w-16 h-16 text-green-500 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Import Successful!</h3>
                            <p className="text-slate-400 mb-8">All trades have been added to your journal.</p>
                            <button onClick={onClose} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                                Close
                            </button>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    {step === 'fixing' && (
                        <button
                            onClick={applyFix}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Next Trade <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                    {step === 'review' && (
                        <button
                            onClick={handleImport}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                        >
                            <Save className="w-4 h-4" /> Import {processedTrades.length} Trades
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CsvImportModal;
