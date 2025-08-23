'use client';

import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface CreateLeagueModalProps {
  onClose: () => void;
  onCreate: (data: any) => void;
}

const SCORING_PRESETS = {
  STANDARD: {
    name: 'Standard',
    description: 'Traditional scoring with 6pt passing TDs',
    passingTd: 6,
    rushingTd: 6,
    receivingTd: 6,
    ppr: 0,
  },
  PPR: {
    name: 'PPR',
    description: 'Full point per reception',
    passingTd: 4,
    rushingTd: 6,
    receivingTd: 6,
    ppr: 1,
  },
  HALF_PPR: {
    name: 'Half PPR',
    description: '0.5 points per reception',
    passingTd: 4,
    rushingTd: 6,
    receivingTd: 6,
    ppr: 0.5,
  },
};

export function CreateLeagueModal({ onClose, onCreate }: CreateLeagueModalProps) {
  const [step, setStep] = useState(1);
  const [leagueData, setLeagueData] = useState({
    // Basic Info
    name: '',
    type: 'REDRAFT',
    teamCount: 10,
    
    // Scoring
    scoringType: 'STANDARD',
    customScoring: false,
    scoring: SCORING_PRESETS.STANDARD,
    
    // Draft
    draftType: 'SNAKE',
    draftDate: '',
    draftTime: '',
    secondsPerPick: 90,
    
    // Roster
    roster: {
      qb: 1,
      rb: 2,
      wr: 2,
      te: 1,
      flex: 1,
      dst: 1,
      k: 1,
      bench: 6,
      ir: 1,
    },
    
    // Waivers
    waiverType: 'FAAB',
    faabBudget: 100,
    waiverDays: 2,
    
    // Playoffs
    playoffTeams: 4,
    playoffWeeks: [14, 15, 16],
    
    // Trade
    tradeDeadline: 10,
    tradeReviewPeriod: 2,
    tradeVoteThreshold: 4,
  });

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = () => {
    onCreate(leagueData);
  };

  const updateLeagueData = (updates: any) => {
    setLeagueData({ ...leagueData, ...updates });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div>
              <label className="block text-sm font-medium mb-2">League Name</label>
              <Input
                value={leagueData.name}
                onChange={(e) => updateLeagueData({ name: e.target.value })}
                placeholder="Enter league name"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">League Type</label>
              <div className="grid grid-cols-3 gap-4">
                {['REDRAFT', 'KEEPER', 'DYNASTY'].map((type) => (
                  <Card
                    key={type}
                    className={`p-4 cursor-pointer border-2 ${
                      leagueData.type === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => updateLeagueData({ type })}
                  >
                    <div className="text-center">
                      <p className="font-medium">{type}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {type === 'REDRAFT' && 'Fresh draft each season'}
                        {type === 'KEEPER' && 'Keep select players'}
                        {type === 'DYNASTY' && 'Keep entire roster'}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Number of Teams</label>
              <div className="grid grid-cols-4 gap-2">
                {[8, 10, 12, 14].map((count) => (
                  <Button
                    key={count}
                    variant={leagueData.teamCount === count ? 'default' : 'outline'}
                    onClick={() => updateLeagueData({ teamCount: count })}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Scoring Settings</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Scoring Type</label>
              <div className="space-y-2">
                {Object.entries(SCORING_PRESETS).map(([key, preset]) => (
                  <Card
                    key={key}
                    className={`p-4 cursor-pointer border-2 ${
                      leagueData.scoringType === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => updateLeagueData({ 
                      scoringType: key, 
                      scoring: preset 
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{preset.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {preset.description}
                        </p>
                      </div>
                      {leagueData.scoringType === key && (
                        <Check className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Draft Settings</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Draft Type</label>
              <div className="grid grid-cols-2 gap-4">
                {['SNAKE', 'AUCTION'].map((type) => (
                  <Card
                    key={type}
                    className={`p-4 cursor-pointer border-2 ${
                      leagueData.draftType === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => updateLeagueData({ draftType: type })}
                  >
                    <div className="text-center">
                      <p className="font-medium">{type}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {type === 'SNAKE' ? 'Traditional pick order' : 'Bid on players'}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Draft Date</label>
              <Input
                type="date"
                value={leagueData.draftDate}
                onChange={(e) => updateLeagueData({ draftDate: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Draft Time</label>
              <Input
                type="time"
                value={leagueData.draftTime}
                onChange={(e) => updateLeagueData({ draftTime: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Seconds Per Pick: {leagueData.secondsPerPick}
              </label>
              <input
                type="range"
                min="30"
                max="180"
                step="15"
                value={leagueData.secondsPerPick}
                onChange={(e) => updateLeagueData({ secondsPerPick: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Roster Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(leagueData.roster).map(([position, count]) => (
                <div key={position}>
                  <label className="block text-sm font-medium mb-1">
                    {position.toUpperCase()}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    value={count}
                    onChange={(e) => updateLeagueData({
                      roster: {
                        ...leagueData.roster,
                        [position]: parseInt(e.target.value),
                      },
                    })}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Waiver Settings</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Waiver Type</label>
              <div className="grid grid-cols-2 gap-4">
                {['FAAB', 'ROLLING'].map((type) => (
                  <Card
                    key={type}
                    className={`p-4 cursor-pointer border-2 ${
                      leagueData.waiverType === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => updateLeagueData({ waiverType: type })}
                  >
                    <div className="text-center">
                      <p className="font-medium">{type}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {type === 'FAAB' ? 'Auction budget' : 'Priority list'}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            {leagueData.waiverType === 'FAAB' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  FAAB Budget: ${leagueData.faabBudget}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={leagueData.faabBudget}
                  onChange={(e) => updateLeagueData({ faabBudget: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Waiver Period (days)</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((days) => (
                  <Button
                    key={days}
                    variant={leagueData.waiverDays === days ? 'default' : 'outline'}
                    onClick={() => updateLeagueData({ waiverDays: days })}
                  >
                    {days}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Settings</h3>
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">League Name</span>
                  <span className="font-medium">{leagueData.name || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type</span>
                  <span className="font-medium">{leagueData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Teams</span>
                  <span className="font-medium">{leagueData.teamCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Scoring</span>
                  <span className="font-medium">{leagueData.scoringType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Draft Type</span>
                  <span className="font-medium">{leagueData.draftType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Waiver Type</span>
                  <span className="font-medium">{leagueData.waiverType}</span>
                </div>
              </div>
            </Card>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                After creating the league, you'll be able to invite members and customize additional settings.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    'Basic Info',
    'Scoring',
    'Draft',
    'Roster',
    'Waivers',
    'Review',
  ];

  return (
    <Modal open={true} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create League</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {stepTitles.map((title, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index + 1 === step
                    ? 'bg-blue-500 text-white'
                    : index + 1 < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {index + 1 < step ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < stepTitles.length - 1 && (
                <div
                  className={`w-full h-1 mx-2 ${
                    index + 1 < step
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStep()}</div>

        {/* Footer */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={step === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          {step < 6 ? (
            <Button
              variant="default"
              onClick={handleNext}
              disabled={step === 1 && !leagueData.name}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={handleCreate}
              disabled={!leagueData.name}
            >
              Create League
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}