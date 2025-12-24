import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    calculateRMultiple,
    calculatePnL,
    calculateRR,
    determineOutcome,
    formatCurrency,
    formatR
} from '../utils/calculations';

function TradeForm({ onClose, onSubmit }) {
    const [setups, setSetups] = useState([]);
    const [formData, setFormData] = useState({
        // Section 1: Trade Info
        symbol: '',
        timeframe: '5m',
        direction: 'Long',
        datetime: new Date().toISOString().slice(0, 16),

        // Section 2: Risk & Execution
        entry_price: '',
        stop_loss: '',
        take_profit: '',
        risk_amount: '',
        position_size: '',

        // Section 3: Strategy Logic
        setup_name: '',
        htf_trend: 'Up',
        entry_reason: '',
        confirmations: [],

        // Section 4: Trade Management
        sl_moved: false,
        manual_interference: false,

        // Section 5: Result
        exit_price: '',

        // Section 6: Discipline
        followed_rules: true,
        biggest_mistake: '',
        would_take_again: true,
        tags: [] // Array of strings
    });

    const [tagInput, setTagInput] = useState('');



    const fetchSetups = React.useCallback(async () => {
        try {
            const response = await axios.get('/api/trades/api/setups');
            setSetups(response.data);
            if (response.data.length > 0) {
                setFormData(prev => ({ ...prev, setup_name: response.data[0].name }));
            }
        } catch (error) {
            console.error('Error fetching setups:', error);
        }
    }, []);


    useEffect(() => {
        // eslint-disable-next-line
        fetchSetups();
    }, [fetchSetups]);



    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = tagInput.trim().toUpperCase();
            if (tag && !formData.tags.includes(tag)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleConfirmationChange = (confirmation) => {
        setFormData(prev => ({
            ...prev,
            confirmations: prev.confirmations.includes(confirmation)
                ? prev.confirmations.filter(c => c !== confirmation)
                : [...prev.confirmations, confirmation]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.symbol || !formData.entry_price || !formData.stop_loss || !formData.take_profit) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            await axios.post('/api/trades', formData);
            alert('Trade added successfully!');
            if (onSubmit) onSubmit();
            if (onClose) onClose();
        } catch (error) {
            console.error('Error adding trade:', error);
            alert('Failed to add trade');
        }
    };

    const handleAddSetup = async () => {
        const newSetup = prompt('Enter new setup name:');
        if (!newSetup) return;

        try {
            await axios.post('/api/trades/api/setups', { name: newSetup });
            fetchSetups();
            setFormData(prev => ({ ...prev, setup_name: newSetup }));
        } catch (error) {
            console.error('Error adding setup:', error);
            alert('Failed to add setup (may already exist)');
        }
    };


    // Derived state calculations
    const calculateValues = () => {
        let pnl = null;
        let r_multiple = null;
        let outcome = null;
        let rr = null;

        if (formData.exit_price && formData.entry_price && formData.stop_loss && formData.position_size) {
            pnl = calculatePnL(
                formData.entry_price,
                formData.exit_price,
                formData.position_size,
                formData.direction
            );
            r_multiple = calculateRMultiple(
                formData.entry_price,
                formData.exit_price,
                formData.stop_loss,
                formData.direction
            );
            outcome = determineOutcome(pnl);
        }

        if (formData.entry_price && formData.take_profit && formData.stop_loss) {
            rr = calculateRR(
                formData.entry_price,
                formData.take_profit,
                formData.stop_loss,
                formData.direction
            );
        }

        return { pnl, r_multiple, outcome, rr };
    };

    const calculatedValues = calculateValues();

    return (
        <div className="card max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Trade</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
                    ×
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* SECTION 1: Trade Info */}
                <div className="form-section">
                    <h3 className="section-title">Trade Identification</h3>
                    <div className="form-grid">
                        <div>
                            <label className="label">Symbol?</label>
                            <input
                                type="text"
                                name="symbol"
                                value={formData.symbol}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="e.g., NIFTY, BANKNIFTY"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Timeframe?</label>
                            <select
                                name="timeframe"
                                value={formData.timeframe}
                                onChange={handleChange}
                                className="select-field"
                            >
                                <option value="1m">1 Minute</option>
                                <option value="5m">5 Minutes</option>
                                <option value="15m">15 Minutes</option>
                                <option value="1h">1 Hour</option>
                                <option value="4h">4 Hours</option>
                                <option value="1D">1 Day</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Long or Short?</label>
                            <select
                                name="direction"
                                value={formData.direction}
                                onChange={handleChange}
                                className="select-field"
                            >
                                <option value="Long">Long</option>
                                <option value="Short">Short</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Date & time of entry?</label>
                            <input
                                type="datetime-local"
                                name="datetime"
                                value={formData.datetime}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Risk & Execution */}
                <div className="form-section">
                    <h3 className="section-title">Risk & Execution</h3>
                    <div className="form-grid-3">
                        <div>
                            <label className="label">Entry price?</label>
                            <input
                                type="number"
                                step="0.01"
                                name="entry_price"
                                value={formData.entry_price}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Stop-loss?</label>
                            <input
                                type="number"
                                step="0.01"
                                name="stop_loss"
                                value={formData.stop_loss}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Take-profit?</label>
                            <input
                                type="number"
                                step="0.01"
                                name="take_profit"
                                value={formData.take_profit}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Risk per trade (₹)?</label>
                            <input
                                type="number"
                                step="0.01"
                                name="risk_amount"
                                value={formData.risk_amount}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Position size / lot?</label>
                            <input
                                type="number"
                                step="1"
                                name="position_size"
                                value={formData.position_size}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0"
                                required
                            />
                        </div>

                        {/* RR Display */}
                        {calculatedValues.rr !== null && (
                            <div>
                                <label className="label">Risk-Reward Ratio</label>
                                <div className={`input-field ${calculatedValues.rr < 1.5 ? 'border-flag-red' : 'border-win-green'}`}>
                                    {calculatedValues.rr.toFixed(2)}
                                    {calculatedValues.rr < 1.5 && <span className="text-flag-red ml-2">⚠ Low RR</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION 3: Strategy Logic */}
                <div className="form-section">
                    <h3 className="section-title">Logic (Edge)</h3>
                    <div className="form-grid">
                        <div>
                            <label className="label">Setup name?</label>
                            <div className="flex gap-2">
                                <select
                                    name="setup_name"
                                    value={formData.setup_name}
                                    onChange={handleChange}
                                    className="select-field flex-1"
                                    required
                                >
                                    {setups.map(setup => (
                                        <option key={setup.id} value={setup.name}>{setup.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAddSetup}
                                    className="btn-secondary"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="label">HTF trend?</label>
                            <select
                                name="htf_trend"
                                value={formData.htf_trend}
                                onChange={handleChange}
                                className="select-field"
                            >
                                <option value="Up">Up</option>
                                <option value="Down">Down</option>
                                <option value="Range">Range</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="label">Why THIS entry? (1 line only)</label>
                        <input
                            type="text"
                            name="entry_reason"
                            value={formData.entry_reason}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Brief reason for entry"
                            maxLength="200"
                            required
                        />
                    </div>

                    <div className="mt-4">
                        <label className="label">What confirmed it?</label>
                        <div className="flex flex-wrap gap-4 mt-2">
                            {['Delta', 'Volume', 'VWAP', 'Structure'].map(conf => (
                                <label key={conf} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.confirmations.includes(conf)}
                                        onChange={() => handleConfirmationChange(conf)}
                                        className="w-4 h-4"
                                    />
                                    {conf}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SECTION 4: Trade Management */}
                <div className="form-section">
                    <h3 className="section-title">Management</h3>
                    <div className="form-grid">
                        <div>
                            <label className="label">Did you move SL?</label>
                            <select
                                name="sl_moved"
                                value={formData.sl_moved}
                                onChange={handleChange}
                                className="select-field"
                            >
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Did you interfere?</label>
                            <select
                                name="manual_interference"
                                value={formData.manual_interference}
                                onChange={handleChange}
                                className="select-field"
                            >
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECTION 5: Result */}
                <div className="form-section">
                    <h3 className="section-title">Result</h3>
                    <div className="form-grid-3">
                        <div>
                            <label className="label">Exit price?</label>
                            <input
                                type="number"
                                step="0.01"
                                name="exit_price"
                                value={formData.exit_price}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0.00 (optional)"
                            />
                        </div>

                        <div>
                            <label className="label">P&L (₹)</label>
                            <div className={`input-field ${calculatedValues.pnl >= 0 ? 'text-win-green' : 'text-loss-red'}`}>
                                {formatCurrency(calculatedValues.pnl)}
                            </div>
                        </div>

                        <div>
                            <label className="label">R multiple</label>
                            <div className={`input-field ${calculatedValues.r_multiple >= 0 ? 'text-win-green' : 'text-loss-red'}`}>
                                {formatR(calculatedValues.r_multiple)}
                            </div>
                        </div>
                    </div>

                    {calculatedValues.outcome && (
                        <div className="mt-4">
                            <label className="label">Outcome</label>
                            <div className={`inline-block px-4 py-2 rounded font-semibold ${calculatedValues.outcome === 'Win' ? 'bg-win-green bg-opacity-20 text-win-green' :
                                calculatedValues.outcome === 'Loss' ? 'bg-loss-red bg-opacity-20 text-loss-red' :
                                    'bg-be-gray bg-opacity-20 text-be-gray'
                                }`}>
                                {calculatedValues.outcome}
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 6: Discipline */}
                <div className="form-section">
                    <h3 className="section-title">Discipline & Psychology</h3>
                    <div className="form-grid">
                        <div>
                            <label className="label">Followed rules?</label>
                            <select
                                name="followed_rules"
                                value={formData.followed_rules}
                                onChange={handleChange}
                                className="select-field"
                            >
                                <option value={true}>Yes</option>
                                <option value={false}>No</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Would you take this trade again?</label>
                            <select
                                name="would_take_again"
                                value={formData.would_take_again}
                                onChange={handleChange}
                                className="select-field"
                            >
                                <option value={true}>Yes</option>
                                <option value={false}>No</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="label">Tags (e.g., FOMO, REVENGE, A+)</label>
                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-800/50 rounded-lg min-h-[42px] border border-slate-700">
                            {formData.tags.map(tag => (
                                <span key={tag} className="bg-blue-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-300">×</button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                className="bg-transparent outline-none text-white flex-1 min-w-[60px]"
                                placeholder={formData.tags.length === 0 ? "Type and press Enter..." : ""}
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="label">Biggest mistake? (1 sentence)</label>
                        <input
                            type="text"
                            name="biggest_mistake"
                            value={formData.biggest_mistake}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="What went wrong or could be improved?"
                            maxLength="200"
                        />
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 justify-end mt-6">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                        Save Trade
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TradeForm;
