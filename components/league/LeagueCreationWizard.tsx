/**
 * League Creation Wizard Component
 * Step-by-step league setup process for fantasy football leagues
 * Implements T2.1 League Management System requirements
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../../contexts/AppContext';
import { Widget } from '../ui/Widget';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { CheckIcon } from '../icons/CheckIcon';

interface WizardSettings {
    // Basic Info
    name: string;
    teamCount: number;
    commissionerId: string;
    isPublic: boolean;
    description: string;
    
    // Scoring Settings
    scoringType: 'standard' | 'ppr' | 'half_ppr' | 'custom';
    
    // Draft Settings
    draftType: 'snake' | 'auction';
    draftDate: string;
    draftTime: string;
}

interface LeagueCreationStep {
    id: string;
    title: string;
    description: string;
    component: React.ComponentType<StepProps>;
    validation: (data: WizardSettings) => string | null;
}

interface StepProps {
    settings: WizardSettings;
    updateSettings: (updates: Partial<WizardSettings>) => void;
    errors: Record<string, string>;
}

// Step 1: Basic Information
const BasicInfoStep: React.FC<StepProps> = ({ settings, updateSettings, errors }) => {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    League Name *
                </label>
                <input
                    type="text"
                    value={settings.name}
                    onChange={(e: any) => updateSettings({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your league name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Number of Teams *
                </label>
                <select
                    value={settings.teamCount}
                    onChange={(e: any) => updateSettings({ teamCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {[8, 10, 12, 14, 16].map((count: any) => (
                        <option key={count} value={count}>{count} Teams</option>
                    ))}
                </select>
                {errors.teamCount && <p className="text-red-500 text-sm mt-1">{errors.teamCount}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    League Description
                </label>
                <textarea
                    value={settings.description}
                    onChange={(e: any) => updateSettings({ description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description for your league"
                />
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="isPublic"
                    checked={settings.isPublic}
                    onChange={(e: any) => updateSettings({ isPublic: e.target.checked })}
                    className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm text-[var(--text-primary)]">
                    Make this league public (others can request to join)
                </label>
            </div>
        </div>
    );
};

// Step 2: Scoring Settings
const ScoringStep: React.FC<StepProps> = ({ settings, updateSettings, errors }) => {
    const scoringPresets = {
        standard: { description: "Standard scoring (no points for receptions)" },
        ppr: { description: "Point Per Reception (1 point per catch)" },
        half_ppr: { description: "Half Point Per Reception (0.5 points per catch)" },
        custom: { description: "Custom scoring settings" }
    };

    const handlePresetChange = (preset: keyof typeof scoringPresets) => {
        updateSettings({
            scoringType: preset
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-4">
                    Scoring Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(scoringPresets).map(([key, preset]) => (
                        <div
                            key={key}
                            onClick={() => handlePresetChange(key as keyof typeof scoringPresets)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                settings.scoringType === key
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-[var(--panel-border)] hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-[var(--text-primary)] capitalize">
                                    {key.replace('_', ' ')}
                                </h3>
                                {settings.scoringType === key && (
                                    <CheckIcon className="w-5 h-5 text-blue-500" />
                                )}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">{preset.description}</p>
                        </div>
                    ))}
                </div>
                {errors.scoringType && <p className="text-red-500 text-sm mt-1">{errors.scoringType}</p>}
            </div>
        </div>
    );
};

// Step 3: Draft Settings
const DraftStep: React.FC<StepProps> = ({ settings, updateSettings, errors }) => {
    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-4">
                    Draft Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { key: 'snake', name: 'Snake Draft', description: 'Order reverses each round' },
                        { key: 'auction', name: 'Auction Draft', description: 'Bid on players with budget' }
                    ].map((type: any) => (
                        <div
                            key={type.key}
                            onClick={() => updateSettings({ draftType: type.key as any })}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                settings.draftType === type.key
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-[var(--panel-border)] hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-[var(--text-primary)]">{type.name}</h3>
                                {settings.draftType === type.key && (
                                    <CheckIcon className="w-5 h-5 text-blue-500" />
                                )}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">{type.description}</p>
                        </div>
                    ))}
                </div>
                {errors.draftType && <p className="text-red-500 text-sm mt-1">{errors.draftType}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Draft Date
                    </label>
                    <input
                        type="date"
                        value={settings.draftDate}
                        onChange={(e: any) => updateSettings({ draftDate: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                    />
                    {errors.draftDate && <p className="text-red-500 text-sm mt-1">{errors.draftDate}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Draft Time
                    </label>
                    <input
                        type="time"
                        value={settings.draftTime}
                        onChange={(e: any) => updateSettings({ draftTime: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--panel-border)] rounded-lg bg-[var(--panel-bg)] text-[var(--text-primary)]"
                    />
                    {errors.draftTime && <p className="text-red-500 text-sm mt-1">{errors.draftTime}</p>}
                </div>
            </div>
        </div>
    );
};

// Step 4: Review & Create
const ReviewStep: React.FC<StepProps> = ({ settings }) => {
    return (
        <div className="space-y-6">
            <div className="bg-[var(--panel-bg)] p-6 rounded-lg border border-[var(--panel-border)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">League Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Basic Information</h4>
                        <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                            <li>Name: {settings.name}</li>
                            <li>Teams: {settings.teamCount}</li>
                            <li>Type: {settings.isPublic ? 'Public' : 'Private'}</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Scoring</h4>
                        <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                            <li>Type: {settings.scoringType.replace('_', ' ').toUpperCase()}</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-medium text-[var(--text-primary)] mb-2">Draft Settings</h4>
                        <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                            <li>Type: {settings.draftType.charAt(0).toUpperCase() + settings.draftType.slice(1)}</li>
                            <li>Date: {settings.draftDate}</li>
                            <li>Time: {settings.draftTime}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeagueCreationWizard: React.FC = () => {
    const { state, dispatch } = useAppState();
    const [currentStep, setCurrentStep] = React.useState(0);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isCreating, setIsCreating] = React.useState(false);

    const [settings, setSettings] = React.useState<WizardSettings>({
        name: '',
        teamCount: 12,
        commissionerId: state.user.id,
        isPublic: false,
        description: '',
        scoringType: 'ppr',
        draftType: 'snake',
        draftDate: new Date().toISOString().split('T')[0],
        draftTime: '19:00'
    });

    const steps: LeagueCreationStep[] = [
        {
            id: 'basic',
            title: 'Basic Information',
            description: 'Set up your league name and basic settings',
            component: BasicInfoStep,
            validation: (data) => {
                if (!data.name.trim()) return 'League name is required';
                if (data.teamCount < 4 || data.teamCount > 20) return 'Team count must be between 4 and 20';
                return null;
            }
        },
        {
            id: 'scoring',
            title: 'Scoring Settings',
            description: 'Configure how points are awarded',
            component: ScoringStep,
            validation: () => null
        },
        {
            id: 'draft',
            title: 'Draft Settings',
            description: 'Set up your draft format and schedule',
            component: DraftStep,
            validation: (data) => {
                if (!data.draftDate) return 'Draft date is required';
                if (!data.draftTime) return 'Draft time is required';
                return null;
            }
        },
        {
            id: 'review',
            title: 'Review & Create',
            description: 'Review your settings and create the league',
            component: ReviewStep,
            validation: () => null
        }
    ];

    const updateSettings = (updates: Partial<WizardSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
        setErrors({});
    };

    const validateCurrentStep = () => {
        const currentStepData = steps[currentStep];
        const error = currentStepData.validation(settings);
        
        if (error) {
            setErrors({ [currentStepData.id]: error });
            return false;
        }
        
        setErrors({});
        return true;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleCreateLeague = async () => {
        if (!validateCurrentStep()) return;
        
        setIsCreating(true);
        
        try {
            // Map wizard settings to proper LeagueSettings format
            const getDraftFormat = (): 'SNAKE' | 'AUCTION' => {
                if (settings.draftType === 'snake') return 'SNAKE';
                if (settings.draftType === 'auction') return 'AUCTION';
                return 'SNAKE'; // Default fallback
            };

            const getScoring = (): 'PPR' | 'Standard' | 'Half-PPR' => {
                if (settings.scoringType === 'ppr') return 'PPR';
                if (settings.scoringType === 'half_ppr') return 'Half-PPR';
                return 'Standard';
            };

            // Create the league payload that matches CreateLeaguePayload interface
            const createPayload = {
                id: Date.now().toString(),
                name: settings.name,
                settings: {
                    draftFormat: getDraftFormat(),
                    teamCount: settings.teamCount,
                    rosterSize: 16, // Default value
                    scoring: getScoring(),
                    tradeDeadline: 10, // Default week 10
                    playoffFormat: '6_TEAM' as const,
                    waiverRule: 'FAAB' as const,
                    aiAssistanceLevel: 'FULL' as const
                },
                status: 'PRE_DRAFT' as const,
                commissionerId: state.user.id,
                userTeamName: `${state.user.name}'s Team`,
                userTeamAvatar: state.user.avatar,
                aiProfiles: []
            };

            dispatch({ type: 'CREATE_LEAGUE', payload: createPayload });
            dispatch({ type: 'SET_ACTIVE_LEAGUE', payload: createPayload.id });
            dispatch({ type: 'SET_VIEW', payload: 'LEAGUE_HUB' });
            dispatch({ type: 'ADD_NOTIFICATION', payload: {
                message: `League "${settings.name}" created successfully!`,
                type: 'SYSTEM'
            }});
        } catch (error) {
            console.error('Failed to create league:', error);
            dispatch({ type: 'ADD_NOTIFICATION', payload: {
                message: 'Failed to create league. Please try again.',
                type: 'SYSTEM'
            }});
        } finally {
            setIsCreating(false);
        }
    };

    const CurrentStepComponent = steps[currentStep].component;

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                            Create League
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)] tracking-widest">
                            Step {currentStep + 1} of {steps.length}
                        </p>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })}
                        className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 mobile-touch-target"
                    >
                        Cancel
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between mb-6">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                index <= currentStep
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                                {index < currentStep ? <CheckIcon className="w-4 h-4" /> : index + 1}
                            </div>
                            <span className="text-xs text-[var(--text-secondary)] mt-1 text-center max-w-20">
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
            </header>

            <main className="flex-grow">
                <Widget title={steps[currentStep].title}>
                    <div className="p-6">
                        <p className="text-[var(--text-secondary)] mb-6">
                            {steps[currentStep].description}
                        </p>
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <CurrentStepComponent
                                    settings={settings}
                                    updateSettings={updateSettings}
                                    errors={errors}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </Widget>
            </main>

            <footer className="flex-shrink-0 flex justify-between items-center mt-6 pt-6 border-t border-[var(--panel-border)]">
                <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Previous
                </button>

                {currentStep === steps.length - 1 ? (
                    <button
                        onClick={handleCreateLeague}
                        disabled={isCreating}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target"
                    >
                        {isCreating ? 'Creating...' : 'Create League'}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mobile-touch-target"
                    >
                        Next
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                )}
            </footer>
        </div>
    );
};

export default LeagueCreationWizard;
