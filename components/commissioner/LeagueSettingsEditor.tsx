/**
 * Enhanced League Settings Editor Modal
 * Comprehensive league configuration management
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { XIcon } from '../icons/XIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { League, LeagueSettings } from '../../types';

interface LeagueSettingsEditorProps {
    league: League;
    onClose: () => void;
    onSave: (settings: LeagueSettings) => void;
}

interface SettingsFormData {
    draftFormat: 'SNAKE' | 'AUCTION';
    teamCount: number;
    rosterSize: number;
    scoring: 'Standard' | 'PPR' | 'Half-PPR';
    tradeDeadline: number;
    playoffFormat: '4_TEAM' | '6_TEAM';
    waiverRule: 'FAAB' | 'REVERSE_ORDER';
    aiAssistanceLevel: 'FULL' | 'BASIC';
    // Additional settings
    rosterPositions: {
        QB: number;
        RB: number;
        WR: number;
        TE: number;
        FLEX: number;
        K: number;
        DST: number;
        BENCH: number;
        IR: number;
    };
    faabBudget: number;
    pickTimer: number;
    maxKeepers: number;
    tradingEnabled: boolean;
    waiverPeriod: number;
}

const LeagueSettingsEditor: React.FC<LeagueSettingsEditorProps> = ({ league, onClose, onSave }) => {
    const [formData, setFormData] = React.useState<SettingsFormData>({
        draftFormat: league.settings.draftFormat,
        teamCount: league.settings.teamCount,
        rosterSize: league.settings.rosterSize,
        scoring: league.settings.scoring,
        tradeDeadline: league.settings.tradeDeadline,
        playoffFormat: league.settings.playoffFormat,
        waiverRule: league.settings.waiverRule,
        aiAssistanceLevel: league.settings.aiAssistanceLevel,
        rosterPositions: {
            QB: 1,
            RB: 2,
            WR: 2,
            TE: 1,
            FLEX: 1,
            K: 1,
            DST: 1,
            BENCH: 6,
            IR: 1
        },
        faabBudget: 100,
        pickTimer: 90,
        maxKeepers: 0,
        tradingEnabled: true,
        waiverPeriod: 1
    });

    const [activeTab, setActiveTab] = React.useState<'basic' | 'roster' | 'scoring' | 'waivers' | 'advanced'>('basic');
    const [hasChanges, setHasChanges] = React.useState(false);

    const updateField = <K extends keyof SettingsFormData>(field: K, value: SettingsFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const updateRosterPosition = (position: keyof SettingsFormData['rosterPositions'], value: number) => {
        setFormData(prev => ({
            ...prev,
            rosterPositions: { ...prev.rosterPositions, [position]: value }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        const updatedSettings: LeagueSettings = {
            draftFormat: formData.draftFormat,
            teamCount: formData.teamCount,
            rosterSize: formData.rosterSize,
            scoring: formData.scoring,
            tradeDeadline: formData.tradeDeadline,
            playoffFormat: formData.playoffFormat,
            waiverRule: formData.waiverRule,
            aiAssistanceLevel: formData.aiAssistanceLevel
        };
        onSave(updatedSettings);
        onClose();
    };

    const tabs = [
        { id: 'basic', label: 'Basic', icon: '⚙️' },
        { id: 'roster', label: 'Roster', icon: '👥' },
        { id: 'scoring', label: 'Scoring', icon: '🏆' },
        { id: 'waivers', label: 'Waivers', icon: '📋' },
        { id: 'advanced', label: 'Advanced', icon: '🔧' }
    ] as const;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
                onClick={(e: any) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[var(--panel-border)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <SettingsIcon className="w-6 h-6 text-blue-500" />
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">League Settings</h2>
                                <p className="text-sm text-[var(--text-secondary)]">{league.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-[var(--panel-border)] bg-[var(--bg-secondary)]">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'text-blue-500 border-b-2 border-blue-500 bg-[var(--panel-bg)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {activeTab === 'basic' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            Draft Format
                                        </label>
                                        <select
                                            value={formData.draftFormat}
                                            onChange={(e: any) => updateField('draftFormat', e.target.value as 'SNAKE' | 'AUCTION')}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        >
                                            <option value="SNAKE">Snake Draft</option>
                                            <option value="AUCTION">Auction Draft</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            Team Count
                                        </label>
                                        <select
                                            value={formData.teamCount}
                                            onChange={(e: any) => updateField('teamCount', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        >
                                            {[8, 10, 12, 14, 16, 18, 20].map((count: any) => (
                                                <option key={count} value={count}>{count} Teams</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            Playoff Format
                                        </label>
                                        <select
                                            value={formData.playoffFormat}
                                            onChange={(e: any) => updateField('playoffFormat', e.target.value as any)}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        >
                                            <option value="4_TEAM">4 Team Playoff</option>
                                            <option value="6_TEAM">6 Team Playoff</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            Trade Deadline (Week)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="17"
                                            value={formData.tradeDeadline}
                                            onChange={(e: any) => updateField('tradeDeadline', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'roster' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Roster Positions</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(formData.rosterPositions).map(([position, count]) => (
                                            <div key={position}>
                                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                                    {position}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={count}
                                                    onChange={(e: any) => updateRosterPosition(position as any, parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'scoring' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                        Scoring System
                                    </label>
                                    <select
                                        value={formData.scoring}
                                        onChange={(e: any) => updateField('scoring', e.target.value as any)}
                                        className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                    >
                                        <option value="Standard">Standard (No PPR)</option>
                                        <option value="Half-PPR">Half PPR (0.5 pts/reception)</option>
                                        <option value="PPR">Full PPR (1 pt/reception)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {activeTab === 'waivers' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            Waiver System
                                        </label>
                                        <select
                                            value={formData.waiverRule}
                                            onChange={(e: any) => updateField('waiverRule', e.target.value as any)}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        >
                                            <option value="FAAB">FAAB (Free Agent Auction Budget)</option>
                                            <option value="REVERSE_ORDER">Reverse Order (Waiver Priority)</option>
                                        </select>
                                    </div>
                                    {formData.waiverRule === 'FAAB' && (
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                                FAAB Budget ($)
                                            </label>
                                            <input
                                                type="number"
                                                min="50"
                                                max="1000"
                                                step="25"
                                                value={formData.faabBudget}
                                                onChange={(e: any) => updateField('faabBudget', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            Waiver Period (Days)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="7"
                                            value={formData.waiverPeriod}
                                            onChange={(e: any) => updateField('waiverPeriod', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            AI Assistance Level
                                        </label>
                                        <select
                                            value={formData.aiAssistanceLevel}
                                            onChange={(e: any) => updateField('aiAssistanceLevel', e.target.value as any)}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        >
                                            <option value="BASIC">Basic Recommendations</option>
                                            <option value="FULL">Full Oracle Integration</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            Draft Pick Timer (seconds)
                                        </label>
                                        <input
                                            type="number"
                                            min="30"
                                            max="600"
                                            step="30"
                                            value={formData.pickTimer}
                                            onChange={(e: any) => updateField('pickTimer', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                            Max Keepers
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={formData.maxKeepers}
                                            onChange={(e: any) => updateField('maxKeepers', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="tradingEnabled"
                                            checked={formData.tradingEnabled}
                                            onChange={(e: any) => updateField('tradingEnabled', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="tradingEnabled" className="text-sm font-medium text-[var(--text-primary)]">
                                            Enable Trading
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-[var(--panel-border)] flex justify-between items-center">
                        <div className="text-sm text-[var(--text-secondary)]">
                            {hasChanges && '• Unsaved changes'}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <SaveIcon className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LeagueSettingsEditor;
