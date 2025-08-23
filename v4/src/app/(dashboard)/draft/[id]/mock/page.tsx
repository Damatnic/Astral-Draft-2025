'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DraftBoard } from '@/components/draft/DraftBoard';
import { PlayerSearch } from '@/components/draft/PlayerSearch';
import { DraftTimer } from '@/components/draft/DraftTimer';
import { DraftQueue } from '@/components/draft/DraftQueue';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useMockDraft } from '@/hooks/useMockDraft';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import type { QueuedPlayer, MockDraftAnalysisProps, DraftStrategyTipsProps, YourMockRosterProps } from '@/types/draft';

export default function MockDraftPage() {
  const params = useParams();
  const router = useRouter();
  const mockDraftId = params['id'] as string;

  const {
    draftState,
    isMyTurn,
    timeRemaining,
    makePick,
    addToQueue,
    removeFromQueue,
    queue,
    simulatePick,
    startDraft,
    resetDraft,
  } = useMockDraft(mockDraftId);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('board');

  const handleMakePick = async (playerId: string) => {
    if (isMyTurn) {
      await makePick(playerId);
      setSelectedPlayer(null);
    }
  };

  // Auto-simulate CPU picks
  useEffect(() => {
    if (draftState?.isDrafting && !isMyTurn && timeRemaining > 0) {
      const timer = setTimeout(() => {
        simulatePick();
      }, 3000); // CPU picks after 3 seconds

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [draftState, isMyTurn, timeRemaining, simulatePick]);

  if (!draftState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Mock Draft Setup</h2>
          <p className="text-gray-600 mb-6">
            Practice your draft strategy against AI opponents
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Draft Position</label>
              <select className="w-full p-2 border rounded">
                <option>Random</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Pick {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={startDraft} variant="default" className="w-full">
              Start Mock Draft
            </Button>
            <Button 
              onClick={() => router.push('/draft')} 
              variant="outline" 
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left sidebar - Draft board */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Mock Draft</h2>
            <Button size="sm" variant="outline" onClick={resetDraft}>
              Reset
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            Round {draftState.currentRound} • Pick {draftState.currentPick}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <DraftBoard
            picks={draftState.picks || []}
            teams={draftState.teams || []}
            currentPick={draftState.currentPick}
            currentRound={draftState.currentRound}
            onPlayerSelect={setSelectedPlayer}
          />
        </div>
      </div>

      {/* Center - Main draft area */}
      <div className="flex-1 flex flex-col">
        {/* Header with timer */}
        <div className="bg-white dark:bg-gray-800 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {isMyTurn ? "Your Pick!" : `${draftState.currentTeam?.name || 'CPU'} is picking...`}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Practice your draft strategy with simulated opponents
              </p>
            </div>
            <DraftTimer 
              timeRemaining={timeRemaining} 
              isMyTurn={isMyTurn}
              size="large"
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="board" className="flex-1">Available Players</TabsTrigger>
              <TabsTrigger value="analysis" className="flex-1">Pick Analysis</TabsTrigger>
              <TabsTrigger value="strategy" className="flex-1">Strategy Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="h-full p-6">
              <PlayerSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                draftedPlayers={draftState.picks.map(p => p.playerId).filter((id): id is string => Boolean(id)) || []}
                onPlayerSelect={setSelectedPlayer}
                onAddToQueue={addToQueue}
                selectedPlayer={selectedPlayer}
                isMyTurn={isMyTurn}
                onDraftPlayer={handleMakePick}
              />
            </TabsContent>

            <TabsContent value="analysis" className="h-full p-6 overflow-auto">
              <MockDraftAnalysis 
                picks={draftState.picks}
                currentRound={draftState.currentRound}
                myTeamId={draftState.myTeamId}
              />
            </TabsContent>

            <TabsContent value="strategy" className="h-full p-6 overflow-auto">
              <DraftStrategyTips 
                currentRound={draftState.currentRound}
                myPicks={draftState.picks.filter(p => p.teamId === draftState.myTeamId)}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Queue */}
        <div className="border-t bg-white dark:bg-gray-800 p-4">
          <DraftQueue
            queue={queue}
            onRemove={removeFromQueue}
            onReorder={(_newQueue: QueuedPlayer[]) => {
              // Handle queue reordering - update this when implementing queue reordering
            }}
            draftedPlayers={draftState.picks.map(p => p.playerId).filter((id): id is string => Boolean(id)) || []}
          />
        </div>
      </div>

      {/* Right sidebar - Your roster */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Your Roster</h3>
        </div>
        <div className="p-4">
          <YourMockRoster 
            picks={draftState.picks.filter(p => p.teamId === draftState.myTeamId)}
          />
        </div>
      </div>
    </div>
  );
}

function MockDraftAnalysis({ picks, currentRound: _currentRound, myTeamId }: MockDraftAnalysisProps) {
  const myPicks = picks.filter((p: any) => p.teamId === myTeamId);
  
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Draft Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Average ADP</p>
            <p className="text-2xl font-bold">
              {myPicks.length > 0 
                ? Math.round(myPicks.reduce((sum: number, p: any) => sum + (p.player?.adp || 0), 0) / myPicks.length)
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Value Picks</p>
            <p className="text-2xl font-bold text-green-500">
              {myPicks.filter((p: any) => p.pick > (p.player?.adp || 0)).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Reaches</p>
            <p className="text-2xl font-bold text-red-500">
              {myPicks.filter((p: any) => p.pick < (p.player?.adp || 0) - 10).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Grade</p>
            <p className="text-2xl font-bold">B+</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Picks Analysis</h3>
        <div className="space-y-3">
          {picks.slice(-5).reverse().map((pick: any) => (
            <div key={pick.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <span className="font-medium">{pick.playerName}</span>
                <span className="ml-2 text-sm text-gray-500">
                  by {pick.teamName}
                </span>
              </div>
              <div className="text-sm">
                {pick.pick < (pick.player?.adp || pick.pick) - 5 ? (
                  <span className="text-green-500">Great Value!</span>
                ) : pick.pick > (pick.player?.adp || pick.pick) + 10 ? (
                  <span className="text-red-500">Reach</span>
                ) : (
                  <span className="text-gray-500">Fair Value</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DraftStrategyTips({ currentRound, myPicks }: DraftStrategyTipsProps) {
  const positionCounts = myPicks.reduce((acc: any, pick: any) => {
    const pos = pick.position || 'UNKNOWN';
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {});

  const tips = [];
  
  if (currentRound <= 3 && !positionCounts.RB) {
    tips.push("Consider drafting a RB - elite RBs are scarce");
  }
  if (currentRound <= 5 && !positionCounts.WR) {
    tips.push("Target a WR1 - top receivers provide consistent points");
  }
  if (currentRound >= 5 && currentRound <= 8 && !positionCounts.QB) {
    tips.push("QB sweet spot - consider grabbing your QB now");
  }
  if (currentRound >= 6 && !positionCounts.TE) {
    tips.push("Don't wait too long on TE - quality drops off quickly");
  }
  if (positionCounts.RB >= 5) {
    tips.push("You have enough RBs - focus on other positions");
  }
  if (positionCounts.WR >= 5) {
    tips.push("WR depth looks good - consider other needs");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Strategy Recommendations</h3>
        <div className="space-y-3">
          {tips.length > 0 ? tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                {index + 1}
              </div>
              <p className="text-sm">{tip}</p>
            </div>
          )) : (
            <p className="text-gray-500">Keep drafting best player available!</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Position Needs</h3>
        <div className="space-y-2">
          {['QB', 'RB', 'WR', 'TE', 'DST', 'K'].map(pos => {
            const count = positionCounts[pos] || 0;
            const needed = pos === 'QB' ? 2 : pos === 'RB' || pos === 'WR' ? 5 : 2;
            const remaining = Math.max(0, needed - count);
            
            return (
              <div key={pos} className="flex items-center justify-between">
                <span className="text-sm font-medium">{pos}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{count}/{needed}</span>
                  {remaining > 0 && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      Need {remaining}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function YourMockRoster({ picks }: YourMockRosterProps) {
  const byPosition = picks.reduce((acc: any, pick: any) => {
    const pos = pick.position || 'UNKNOWN';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(pick);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {['QB', 'RB', 'WR', 'TE', 'DST', 'K'].map(pos => (
        <div key={pos}>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">{pos}</h4>
          <div className="space-y-1">
            {(byPosition[pos] || []).map((pick: any) => (
              <div key={pick.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{pick.playerName}</div>
                <div className="text-xs text-gray-500">
                  Round {pick.round} • Pick {pick.pick}
                </div>
              </div>
            ))}
            {!byPosition[pos] && (
              <div className="text-sm text-gray-400 italic p-2">
                No {pos} drafted yet
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}