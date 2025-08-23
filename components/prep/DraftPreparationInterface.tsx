/**
 * Draft Preparation Interface
 * Comprehensive UI for draft preparation with cheat sheets, rankings, strategy planning, and mock drafts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
    List, 
    Download, 
    Settings, 
    Play, 
    Target,
    Star,
    AlertTriangle,
    Move,
    Clock,
    Trophy,
    FileText,
    Edit3,
    Copy,
    Share2
} from 'lucide-react';
import { 
    draftPreparationService,
    DraftPlayer,
    CheatSheet,
    DraftStrategy,
    MockDraftResult,
    CheatSheetTemplate,
    CheatSheetCustomization,
    CheatSheetSettings,
    MockDraftSettings
} from '../../services/draftPreparationService';

interface DraftPreparationInterfaceProps {
    userId: string;
    leagueSettings?: {
        scoringFormat: string;
        leagueSize: number;
        rosterPositions: Record<string, number>;
    };
    onClose?: () => void;
}

export const DraftPreparationInterface: React.FC<DraftPreparationInterfaceProps> = ({
    userId,
    leagueSettings,
    onClose
}) => {
    // State Management
    const [activeTab, setActiveTab] = useState<'cheatsheets' | 'rankings' | 'strategy' | 'mockdraft'>('cheatsheets');
    const [loading, setLoading] = useState(false);
    
    // Data State
    const [players, setPlayers] = useState<DraftPlayer[]>([]);
    const [strategies, setStrategies] = useState<DraftStrategy[]>([]);
    
    // Current Selection State
    const [selectedStrategy, setSelectedStrategy] = useState<string>('');
    const [selectedCheatSheet, setSelectedCheatSheet] = useState<CheatSheet | null>(null);
    const [currentMockDraft, setCurrentMockDraft] = useState<MockDraftResult | null>(null);
    
    // UI State
    const [showFilters, setShowFilters] = useState(false);
    const [editingRankings, setEditingRankings] = useState(false);
    const [cheatSheetSettings, setCheatSheetSettings] = useState<CheatSheetSettings>({
        autoUpdate: true,
        includeInjuredPlayers: false,
        maxPlayersPerTier: 8,
        showADP: true,
        showProjections: true,
        customWeights: {}
    });

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [playersData, strategiesData] = await Promise.all([
                draftPreparationService.getDraftPlayers(),
                draftPreparationService.getDraftStrategies()
            ]);
            
            setPlayers(playersData);
            setStrategies(strategiesData);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Filter players (simplified for demo)
    const filteredPlayers = players;

    // Generate cheat sheet
    const handleGenerateCheatSheet = async () => {
        setLoading(true);
        try {
            const template: CheatSheetTemplate = {
                id: 'default',
                name: 'Standard Cheat Sheet',
                layout: 'tiers',
                sections: [
                    { id: '1', title: 'QB Rankings', type: 'player_rankings', position: 'QB', visible: true, order: 1, config: {} },
                    { id: '2', title: 'RB Rankings', type: 'player_rankings', position: 'RB', visible: true, order: 2, config: {} },
                    { id: '3', title: 'WR Rankings', type: 'player_rankings', position: 'WR', visible: true, order: 3, config: {} },
                    { id: '4', title: 'TE Rankings', type: 'player_rankings', position: 'TE', visible: true, order: 4, config: {} },
                    { id: '5', title: 'Sleepers', type: 'sleepers', visible: true, order: 5, config: {} },
                    { id: '6', title: 'Strategy Notes', type: 'strategy_notes', visible: true, order: 6, config: {} }
                ],
                colorScheme: 'default',
                density: 'normal'
            };

            const customizations: CheatSheetCustomization = {
                highlightTargets: true,
                showTiers: true,
                showByeWeeks: true,
                showRiskLevels: true,
                colorCodePositions: true,
                includeNotes: true,
                fontSize: 'medium',
                columnsPerPage: 3
            };

            const newCheatSheet = await draftPreparationService.generateCheatSheet(
                userId,
                template,
                customizations,
                cheatSheetSettings
            );

            setSelectedCheatSheet(newCheatSheet);
            // In production, would save to cheat sheets list
        } catch (error) {
            console.error('Failed to generate cheat sheet:', error);
        } finally {
            setLoading(false);
        }
    };

    // Run mock draft
    const handleRunMockDraft = async () => {
        if (!selectedStrategy) return;
        
        setLoading(true);
        try {
            const mockDraftSettings: MockDraftSettings = {
                leagueSize: leagueSettings?.leagueSize || 12,
                scoringFormat: leagueSettings?.scoringFormat || 'ppr',
                draftType: 'snake',
                timePerPick: 90,
                autopickEnabled: true,
                strategy: selectedStrategy,
                difficulty: 'medium'
            };

            const mockDraftResult = await draftPreparationService.runMockDraft(
                mockDraftSettings,
                selectedStrategy
            );

            setCurrentMockDraft(mockDraftResult);
            // In production, would save to mock drafts list
        } catch (error) {
            console.error('Failed to run mock draft:', error);
        } finally {
            setLoading(false);
        }
    };

    // Render cheat sheets tab
    const renderCheatSheetsTab = () => (
        <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cheat Sheets</h2>
                    <p className="text-gray-600">Generate and customize draft cheat sheets</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </button>
                    <button
                        onClick={handleGenerateCheatSheet}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <FileText className="h-4 w-4" />
                        Generate Cheat Sheet
                    </button>
                </div>
            </div>

            {/* Cheat sheet settings */}
            {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold text-gray-900">Cheat Sheet Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Format
                            </label>
                            <select className="w-full p-2 border border-gray-300 rounded-lg">
                                <option value="tiers">Tiers View</option>
                                <option value="list">List View</option>
                                <option value="grid">Grid View</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Density
                            </label>
                            <select className="w-full p-2 border border-gray-300 rounded-lg">
                                <option value="compact">Compact</option>
                                <option value="normal">Normal</option>
                                <option value="spacious">Spacious</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Color Scheme
                            </label>
                            <select className="w-full p-2 border border-gray-300 rounded-lg">
                                <option value="default">Default</option>
                                <option value="colorblind">Colorblind Friendly</option>
                                <option value="dark">Dark Mode</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center">
                            <input 
                                type="checkbox" 
                                className="mr-2" 
                                checked={cheatSheetSettings.showADP}
                                onChange={(e: any) => setCheatSheetSettings(prev => ({
                                    ...prev,
                                    showADP: e.target.checked
                                }))}
                            />
                            Show ADP
                        </label>
                        <label className="flex items-center">
                            <input 
                                type="checkbox" 
                                className="mr-2"
                                checked={cheatSheetSettings.showProjections}
                                onChange={(e: any) => setCheatSheetSettings(prev => ({
                                    ...prev,
                                    showProjections: e.target.checked
                                }))}
                            />
                            Show Projections
                        </label>
                        <label className="flex items-center">
                            <input 
                                type="checkbox" 
                                className="mr-2"
                                checked={cheatSheetSettings.includeInjuredPlayers}
                                onChange={(e: any) => setCheatSheetSettings(prev => ({
                                    ...prev,
                                    includeInjuredPlayers: e.target.checked
                                }))}
                            />
                            Include Injured Players
                        </label>
                    </div>
                </div>
            )}

            {/* Generated cheat sheet display */}
            {selectedCheatSheet && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">{selectedCheatSheet.name}</h3>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                                    <Copy className="h-3 w-3" />
                                    Copy
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                                    <Download className="h-3 w-3" />
                                    Export
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                                    <Share2 className="h-3 w-3" />
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4">
                        {/* Player tiers display */}
                        <div className="space-y-6">
                            {['QB', 'RB', 'WR', 'TE'].map((position: any) => {
                                const positionPlayers = filteredPlayers.filter((p: any) => p.position === position).slice(0, 20);
                                return (
                                    <div key={position} className="space-y-3">
                                        <h4 className="font-semibold text-lg text-gray-900">{position} Rankings</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {positionPlayers.map((player, index) => (
                                                <div 
                                                    key={player.id}
                                                    className={`p-3 rounded-lg border ${
                                                        player?.tier === 1 ? 'border-green-200 bg-green-50' :
                                                        player?.tier === 2 ? 'border-blue-200 bg-blue-50' :
                                                        'border-gray-200 bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{player.name}</div>
                                                            <div className="text-sm text-gray-600">{player.team}</div>
                                                            {cheatSheetSettings.showADP && (
                                                                <div className="text-xs text-gray-500">ADP: {player?.adp}</div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium">#{index + 1}</div>
                                                            {player.sleeper && <Star className="h-3 w-3 text-yellow-500" />}
                                                            {player.riskLevel === 'high' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Render rankings tab
    const renderRankingsTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Custom Rankings</h2>
                    <p className="text-gray-600">Create and customize your player rankings</p>
                </div>
                <button
                    onClick={() => setEditingRankings(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Edit3 className="h-4 w-4" />
                    Create Rankings
                </button>
            </div>

            {/* Rankings editor */}
            {editingRankings && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Customize Player Rankings</h3>
                    
                    {/* Drag and drop rankings interface */}
                    <div className="space-y-4">
                        {['QB', 'RB', 'WR', 'TE'].map((position: any) => (
                            <div key={position} className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">{position} Rankings</h4>
                                <div className="space-y-2">
                                    {filteredPlayers
                                        .filter((p: any) => p.position === position)
                                        .slice(0, 10)
                                        .map((player, index) => (
                                            <div
                                                key={player.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-move"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Move className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium">#{index + 1}</span>
                                                    <span>{player.name}</span>
                                                    <span className="text-sm text-gray-600">({player.team})</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                                        Tier {player?.tier}
                                                    </span>
                                                    <button className="text-gray-400 hover:text-gray-600">
                                                        <Edit3 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setEditingRankings(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Save Rankings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    // Render strategy tab
    const renderStrategyTab = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Draft Strategy</h2>
                <p className="text-gray-600">Plan your draft approach and strategy</p>
            </div>

            {/* Strategy selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {strategies.map((strategy: any) => (
                    <div
                        key={strategy.id}
                        className={`p-6 rounded-lg border-2 cursor-pointer transition-colors ${
                            selectedStrategy === strategy.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedStrategy(strategy.id)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                                strategy.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                strategy.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {strategy.difficulty}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{strategy.description}</p>
                        
                        {/* Strategy stats */}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Success Rate</span>
                            <span className="font-medium">{strategy.success_rate}%</span>
                        </div>
                        
                        {/* Strategy details */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-2">
                                <div>
                                    <span className="text-xs font-medium text-green-600">Pros:</span>
                                    <ul className="text-xs text-gray-600 mt-1">
                                        {strategy.pros.slice(0, 2).map((pro, index) => (
                                            <li key={index}>• {pro}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-red-600">Cons:</span>
                                    <ul className="text-xs text-gray-600 mt-1">
                                        {strategy.cons.slice(0, 2).map((con, index) => (
                                            <li key={index}>• {con}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected strategy details */}
            {selectedStrategy && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    {(() => {
                        const strategy = strategies.find((s: any) => s.id === selectedStrategy);
                        if (!strategy) return null;
                        
                        return (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-4">
                                    {strategy.name} - Round by Round Guide
                                </h3>
                                <div className="space-y-4">
                                    {strategy.rounds.map((round: any) => (
                                        <div key={round.round} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-medium">Round {round.round}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                        Flexibility: {Math.round(round.flexibility * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-700">Target Positions:</span>
                                                    <div className="text-gray-600 mt-1">
                                                        {round.positions.join(', ')}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-green-700">Targets:</span>
                                                    <div className="text-gray-600 mt-1">
                                                        {round.targets.join(', ')}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-red-700">Avoid:</span>
                                                    <div className="text-gray-600 mt-1">
                                                        {round.avoid.join(', ')}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {round.notes && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600">
                                                    {round.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );

    // Render mock draft tab
    const renderMockDraftTab = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mock Draft</h2>
                    <p className="text-gray-600">Practice your draft strategy</p>
                </div>
                <button
                    onClick={handleRunMockDraft}
                    disabled={!selectedStrategy || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    <Play className="h-4 w-4" />
                    {loading ? 'Running...' : 'Start Mock Draft'}
                </button>
            </div>

            {/* Mock draft settings */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Mock Draft Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            League Size
                        </label>
                        <select className="w-full p-2 border border-gray-300 rounded-lg">
                            <option value="8">8 Teams</option>
                            <option value="10">10 Teams</option>
                            <option value="12">12 Teams</option>
                            <option value="14">14 Teams</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Draft Type
                        </label>
                        <select className="w-full p-2 border border-gray-300 rounded-lg">
                            <option value="snake">Snake Draft</option>
                            <option value="linear">Linear Draft</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time per Pick
                        </label>
                        <select className="w-full p-2 border border-gray-300 rounded-lg">
                            <option value="60">60 seconds</option>
                            <option value="90">90 seconds</option>
                            <option value="120">2 minutes</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Strategy
                        </label>
                        <select 
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={selectedStrategy}
                            onChange={(e: any) => setSelectedStrategy(e.target.value)}
                        >
                            <option value="">Select Strategy</option>
                            {strategies.map((strategy: any) => (
                                <option key={strategy.id} value={strategy.id}>
                                    {strategy.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Mock draft results */}
            {currentMockDraft && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Mock Draft Results</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {Math.floor(currentMockDraft.duration / 60)}m {currentMockDraft.duration % 60}s
                                </span>
                                <span className="flex items-center gap-1">
                                    <Trophy className="h-4 w-4" />
                                    Grade: {currentMockDraft.analysis.teamGrade}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        {/* Team analysis */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Your Draft Picks</h4>
                                <div className="space-y-2">
                                    {currentMockDraft.userTeam.map((player: any) => (
                                        <div
                                            key={player.id}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div>
                                                <span className="font-medium">{player.name}</span>
                                                <span className="text-sm text-gray-600 ml-2">
                                                    ({player.position} - {player.team})
                                                </span>
                                            </div>
                                            <div className="text-right text-sm">
                                                <div>Round {player.round}.{player.pick}</div>
                                                <div className={`${
                                                    player.valueAtPick > 10 ? 'text-green-600' :
                                                    player.valueAtPick < -5 ? 'text-red-600' :
                                                    'text-gray-600'
                                                }`}>
                                                    Value: {player.valueAtPick > 0 ? '+' : ''}{player.valueAtPick.toFixed(1)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Analysis</h4>
                                <div className="space-y-4">
                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2">Strengths</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {currentMockDraft.analysis.strengthPositions.map((pos: any) => (
                                                <span 
                                                    key={pos} 
                                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                                >
                                                    {pos}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2">Weaknesses</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {currentMockDraft.analysis.weakPositions.map((pos: any) => (
                                                <span 
                                                    key={pos} 
                                                    className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                                                >
                                                    {pos}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="font-medium text-gray-700 mb-2">Recommendations</h5>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            {currentMockDraft.analysis.recommendations.map((rec, index) => (
                                                <li key={index}>• {rec}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-600">Projected Finish:</span>
                                                <span className="ml-2 font-medium">
                                                    {currentMockDraft.analysis.projectedFinish}
                                                    {currentMockDraft.analysis.projectedFinish === 1 ? 'st' :
                                                     currentMockDraft.analysis.projectedFinish === 2 ? 'nd' :
                                                     currentMockDraft.analysis.projectedFinish === 3 ? 'rd' : 'th'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Total Points:</span>
                                                <span className="ml-2 font-medium">
                                                    {currentMockDraft.analysis.totalProjectedPoints.toFixed(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (loading && players.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading draft preparation tools...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Draft Preparation</h1>
                    <p className="text-gray-600 mt-1">
                        Complete toolkit for draft preparation and strategy planning
                    </p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Close
                    </button>
                )}
            </div>

            {/* Navigation tabs */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="flex space-x-8">
                    {[
                        { id: 'cheatsheets', label: 'Cheat Sheets', icon: FileText },
                        { id: 'rankings', label: 'Rankings', icon: List },
                        { id: 'strategy', label: 'Strategy', icon: Target },
                        { id: 'mockdraft', label: 'Mock Draft', icon: Play }
                    ].map((tab: any) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab content */}
            <div className="min-h-[600px]">
                {activeTab === 'cheatsheets' && renderCheatSheetsTab()}
                {activeTab === 'rankings' && renderRankingsTab()}
                {activeTab === 'strategy' && renderStrategyTab()}
                {activeTab === 'mockdraft' && renderMockDraftTab()}
            </div>
        </div>
    );
};

export default DraftPreparationInterface;
