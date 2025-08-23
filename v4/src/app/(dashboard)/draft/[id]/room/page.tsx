'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DraftBoard } from '@/components/draft/DraftBoard';
import { DraftChat } from '@/components/draft/DraftChat';
import { DraftQueue } from '@/components/draft/DraftQueue';
import { DraftRosterView } from '@/components/draft/DraftRosterView';
import { DraftTimer } from '@/components/draft/DraftTimer';
import { PlayerSearch } from '@/components/draft/PlayerSearch';
import { useDraftRoom } from '@/hooks/useDraftRoom';
import type { QueuedPlayer } from '@/types/draft';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function DraftRoomPage() {
  const params = useParams();
  const draftId = params.id as string;
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const {
    draftState,
    isConnected,
    isMyTurn,
    timeRemaining,
    makePick,
    addToQueue,
    removeFromQueue,
    sendMessage,
    toggleAutoPick,
    queue,
    messages,
    rosters,
  } = useDraftRoom(draftId);

  const [selectedTab, setSelectedTab] = useState('board');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMakePick = async (playerId: string) => {
    if (isMyTurn) {
      await makePick(playerId);
      setSelectedPlayer(null);
    }
  };

  const handleAddToQueue = (player: QueuedPlayer) => {
    addToQueue(player.playerId);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to draft room...</p>
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile layout
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header with timer */}
        <div className="bg-white dark:bg-gray-800 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Round {draftState?.currentRound} • Pick {draftState?.currentPick}
              </p>
              {draftState?.currentTeam && (
                <p className="font-semibold">
                  {isMyTurn ? 'Your Pick!' : `${draftState.currentTeam.name} is on the clock`}
                </p>
              )}
            </div>
            <DraftTimer 
              timeRemaining={timeRemaining} 
              isMyTurn={isMyTurn}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="board" className="flex-1">Board</TabsTrigger>
              <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
              <TabsTrigger value="roster" className="flex-1">Roster</TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="h-full overflow-auto">
              <DraftBoard
                picks={draftState?.picks || []}
                teams={draftState?.teams || []}
                currentPick={draftState?.currentPick}
                currentRound={draftState?.currentRound}
                onPlayerSelect={setSelectedPlayer}
              />
            </TabsContent>

            <TabsContent value="search" className="h-full overflow-auto p-4">
              <PlayerSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                draftedPlayers={draftState?.picks.map(p => p.playerId) || []}
                onPlayerSelect={setSelectedPlayer}
                onAddToQueue={handleAddToQueue}
              />
            </TabsContent>

            <TabsContent value="roster" className="h-full overflow-auto">
              <DraftRosterView
                rosters={rosters}
                currentTeamId={draftState?.myTeamId}
              />
            </TabsContent>

            <TabsContent value="chat" className="h-full flex flex-col">
              <DraftChat
                messages={messages}
                onSendMessage={sendMessage}
                currentUserId={draftState?.currentUserId}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Action bar */}
        {isMyTurn && selectedPlayer && (
          <div className="bg-white dark:bg-gray-800 border-t p-4">
            <Button
              onClick={() => handleMakePick(selectedPlayer)}
              variant="default"
              className="w-full"
            >
              Draft Player
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left sidebar - Draft board */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Draft Board</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <DraftBoard
            picks={draftState?.picks || []}
            teams={draftState?.teams || []}
            currentPick={draftState?.currentPick}
            currentRound={draftState?.currentRound}
            onPlayerSelect={setSelectedPlayer}
          />
        </div>
      </div>

      {/* Center - Main draft area */}
      <div className="flex-1 flex flex-col">
        {/* Header with timer and current pick */}
        <div className="bg-white dark:bg-gray-800 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Round {draftState?.currentRound}, Pick {draftState?.currentPick}
              </h1>
              {draftState?.currentTeam && (
                <p className="text-lg mt-1">
                  {isMyTurn ? (
                    <span className="text-green-500 font-semibold">You&apos;re on the clock!</span>
                  ) : (
                    <span>{draftState.currentTeam.name} is picking...</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <DraftTimer 
                timeRemaining={timeRemaining} 
                isMyTurn={isMyTurn}
                size="large"
              />
              <Button
                onClick={toggleAutoPick}
                variant={draftState?.autoPickEnabled ? 'default' : 'outline'}
              >
                Auto-Pick: {draftState?.autoPickEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Player search and available players */}
        <div className="flex-1 overflow-hidden p-6">
          <PlayerSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            draftedPlayers={draftState?.picks.map(p => p.playerId) || []}
            onPlayerSelect={setSelectedPlayer}
            onAddToQueue={handleAddToQueue}
            selectedPlayer={selectedPlayer}
            isMyTurn={isMyTurn}
            onDraftPlayer={handleMakePick}
          />
        </div>

        {/* Queue */}
        <div className="border-t bg-white dark:bg-gray-800 p-4">
          <DraftQueue
            queue={queue}
            onRemove={removeFromQueue}
            onReorder={(newQueue) => {
              // Handle queue reordering
            }}
            draftedPlayers={draftState?.picks.map(p => p.playerId) || []}
          />
        </div>
      </div>

      {/* Right sidebar - Rosters and chat */}
      <div className="w-96 bg-white dark:bg-gray-800 border-l flex flex-col">
        <Tabs defaultValue="rosters" className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none">
            <TabsTrigger value="rosters" className="flex-1">Rosters</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="rosters" className="flex-1 overflow-auto">
            <DraftRosterView
              rosters={rosters}
              currentTeamId={draftState?.myTeamId}
            />
          </TabsContent>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            <DraftChat
              messages={messages}
              onSendMessage={sendMessage}
              currentUserId={draftState?.currentUserId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}