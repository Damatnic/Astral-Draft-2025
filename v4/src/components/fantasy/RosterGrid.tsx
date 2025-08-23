'use client';

import { useState, useEffect } from 'react';
// Drag and drop temporarily disabled for type compatibility
// import { DndContext, closestCenter } from '@dnd-kit/core';
// import type { DragEndEvent } from '@dnd-kit/core';
// import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronRight, AlertTriangle, Plus, Minus } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  points: number;
  status: 'active' | 'injured' | 'bye' | 'out';
  isStarter: boolean;
}

interface RosterGridProps {
  teamId: string;
}

export default function RosterGrid({ teamId }: RosterGridProps) {
  const [roster, setRoster] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', () => setIsMobile(window.innerWidth < 768));
    loadRoster();
  }, [teamId]);

  const loadRoster = async () => {
    // Mock data for now
    setRoster([
      { id: '1', name: 'Patrick Mahomes', position: 'QB', team: 'KC', points: 28.5, status: 'active', isStarter: true },
      { id: '2', name: 'Christian McCaffrey', position: 'RB', team: 'SF', points: 22.3, status: 'active', isStarter: true },
      { id: '3', name: 'Austin Ekeler', position: 'RB', team: 'LAC', points: 18.7, status: 'active', isStarter: true },
      { id: '4', name: 'Justin Jefferson', position: 'WR', team: 'MIN', points: 19.2, status: 'active', isStarter: true },
      { id: '5', name: 'Tyreek Hill', position: 'WR', team: 'MIA', points: 17.8, status: 'active', isStarter: true },
      { id: '6', name: 'Travis Kelce', position: 'TE', team: 'KC', points: 15.4, status: 'active', isStarter: true },
      { id: '7', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', points: 14.2, status: 'bye', isStarter: true },
      { id: '8', name: 'Joe Burrow', position: 'QB', team: 'CIN', points: 22.1, status: 'active', isStarter: false },
      { id: '9', name: 'Tony Pollard', position: 'RB', team: 'DAL', points: 12.3, status: 'bye', isStarter: false },
    ]);
    setLoading(false);
  };

  /*
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activePlayer = roster.find(p => p.id === active.id);
    const overPlayer = roster.find(p => p.id === over.id);
    
    if (activePlayer && overPlayer) {
      // Swap starter status
      const newRoster = roster.map(player => {
        if (player.id === activePlayer.id) {
          return { ...player, isStarter: overPlayer.isStarter };
        }
        if (player.id === overPlayer.id) {
          return { ...player, isStarter: activePlayer.isStarter };
        }
        return player;
      });
      setRoster(newRoster);
    }
  };
  */

  const handleSwipe = (playerId: string, direction: 'left' | 'right') => {
    if (!isMobile) return;
    
    const player = roster.find(p => p.id === playerId);
    if (!player) return;

    // Left swipe = bench, Right swipe = start
    const shouldStart = direction === 'right';
    setRoster(roster.map(p => 
      p.id === playerId ? { ...p, isStarter: shouldStart } : p
    ));
  };

  const starters = roster.filter(p => p.isStarter);
  const bench = roster.filter(p => !p.isStarter);

  if (loading) {
    return <div className="text-center py-8">Loading roster...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Starting Lineup */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
            Starting Lineup
            <span className="text-sm font-normal text-gray-600">
              {starters.reduce((sum, p) => sum + p.points, 0).toFixed(1)} pts
            </span>
          </h3>
          
          {/* Drag and drop disabled temporarily */}
            <div className="space-y-2">
              {['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX'].map((slot, index) => {
                const player = starters.find(p => p.position === slot) || starters[index];
                return (
                  <div
                    key={`${slot}-${index}`}
                    className={`border rounded-lg p-3 ${
                      player ? 'bg-white' : 'bg-gray-50 border-dashed'
                    } ${isMobile ? 'touch-manipulation' : ''}`}
                    style={{ minHeight: isMobile ? '60px' : '56px' }}
                  >
                    {player ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-medium text-gray-500 w-10">
                            {slot}
                          </div>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-gray-600">
                              {player.team} • {player.points} pts
                            </p>
                          </div>
                        </div>
                        {player.status !== 'active' && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            player.status === 'injured' ? 'bg-red-100 text-red-700' :
                            player.status === 'bye' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {player.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Plus className="h-5 w-5 mr-2" />
                        Empty {slot} Slot
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        </div>

        {/* Bench */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
            Bench
            <span className="text-sm font-normal text-gray-600">
              {bench.length} players
            </span>
          </h3>
          
          <div className="space-y-2">
            {bench.map((player) => (
              <div
                key={player.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ minHeight: isMobile ? '60px' : '56px' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-gray-500 w-10">
                      {player.position}
                    </div>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-sm text-gray-600">
                        {player.team} • {player.points} pts
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
            
            {bench.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No players on bench
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile hint */}
      {isMobile && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          💡 Tip: Swipe players left to bench or right to start them
        </div>
      )}
    </div>
  );
}