import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, User, Trophy } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  bye: number;
  round: number;
  pick: number;
}

interface TeamRoster {
  teamId: string;
  teamName: string;
  owner: string;
  players: Player[];
}

interface DraftRosterViewProps {
  rosters: TeamRoster[];
  currentTeamId?: string;
}

const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'DST', 'K'];
const POSITION_LIMITS: Record<string, number> = {
  QB: 2,
  RB: 6,
  WR: 6,
  TE: 2,
  DST: 2,
  K: 2,
};

export function DraftRosterView({ rosters, currentTeamId }: DraftRosterViewProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(
    new Set(currentTeamId ? [currentTeamId] : [])
  );
  const [viewMode, setViewMode] = useState<'position' | 'round'>('position');

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      RB: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      WR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      TE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      DST: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      K: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  const getByeWeekColor = (bye: number) => {
    // Group bye weeks for color coding
    if (bye <= 6) return 'text-green-600 dark:text-green-400';
    if (bye <= 9) return 'text-yellow-600 dark:text-yellow-400';
    if (bye <= 12) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const analyzeRoster = (roster: TeamRoster) => {
    const positionCounts: Record<string, number> = {};
    const byeWeeks: Record<number, number> = {};

    roster.players.forEach((player) => {
      positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
      byeWeeks[player.bye] = (byeWeeks[player.bye] || 0) + 1;
    });

    const needs = POSITION_ORDER.filter(
      (pos) => (positionCounts[pos] || 0) < (POSITION_LIMITS[pos] || 2)
    );

    const maxByeWeek = Object.entries(byeWeeks).reduce(
      (max, [week, count]) => (count > max.count ? { week: Number(week), count } : max),
      { week: 0, count: 0 }
    );

    return { positionCounts, needs, maxByeWeek };
  };

  const renderPlayersByPosition = (players: Player[]) => {
    const grouped = POSITION_ORDER.reduce((acc, pos) => {
      acc[pos] = players.filter((p) => p.position === pos);
      return acc;
    }, {} as Record<string, Player[]>);

    return (
      <div className="space-y-2">
        {POSITION_ORDER.map((position) => {
          const positionPlayers = grouped[position] || [];
          const limit = POSITION_LIMITS[position] || 2;
          const emptySlots = Math.max(0, limit - positionPlayers.length);

          return (
            <div key={position}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    getPositionColor(position)
                  )}
                >
                  {position}
                </span>
                <span className="text-xs text-gray-500">
                  {positionPlayers.length}/{limit}
                </span>
              </div>
              <div className="ml-4 space-y-1">
                {positionPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between text-sm p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-xs text-gray-500">{player.team}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={getByeWeekColor(player.bye)}>
                        Bye {player.bye}
                      </span>
                      <span className="text-gray-400">
                        R{player.round}.{player.pick}
                      </span>
                    </div>
                  </div>
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div
                    key={`empty-${position}-${i}`}
                    className="text-sm p-1 text-gray-400 italic"
                  >
                    Empty slot
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPlayersByRound = (players: Player[]) => {
    const sorted = [...players].sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.pick - b.pick;
    });

    return (
      <div className="space-y-1">
        {sorted.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-12">
                R{player.round}.{player.pick}
              </span>
              <span className="font-medium">{player.name}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-xs font-medium',
                  getPositionColor(player.position)
                )}
              >
                {player.position}
              </span>
              <span className="text-xs text-gray-500">{player.team}</span>
            </div>
            <span className={cn('text-xs', getByeWeekColor(player.bye))}>
              Bye {player.bye}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      {/* View mode toggle */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 p-3 border-b dark:border-gray-700 z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Team Rosters</h3>
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('position')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                viewMode === 'position'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700'
              )}
            >
              By Position
            </button>
            <button
              onClick={() => setViewMode('round')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                viewMode === 'round'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700'
              )}
            >
              By Round
            </button>
          </div>
        </div>
      </div>

      {/* Rosters */}
      <div className="p-3 space-y-2">
        {rosters.map((roster) => {
          const isExpanded = expandedTeams.has(roster.teamId);
          const isCurrentTeam = roster.teamId === currentTeamId;
          const analysis = analyzeRoster(roster);

          return (
            <div
              key={roster.teamId}
              className={cn(
                'border rounded-lg overflow-hidden',
                isCurrentTeam
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              {/* Team header */}
              <button
                onClick={() => toggleTeam(roster.teamId)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <div className="flex items-center gap-2">
                    {isCurrentTeam && <Trophy className="w-4 h-4 text-primary-500" />}
                    <span className="font-semibold">{roster.teamName}</span>
                    <span className="text-xs text-gray-500">({roster.owner})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">
                    {roster.players.length} players
                  </span>
                  {analysis.needs.length > 0 && (
                    <span className="text-orange-500">
                      Needs: {analysis.needs.slice(0, 3).join(', ')}
                    </span>
                  )}
                  {analysis.maxByeWeek.count >= 3 && (
                    <span className="text-red-500">
                      {analysis.maxByeWeek.count} on bye {analysis.maxByeWeek.week}
                    </span>
                  )}
                </div>
              </button>

              {/* Team roster */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t dark:border-gray-700">
                  {roster.players.length === 0 ? (
                    <div className="py-4 text-center text-gray-500 text-sm">
                      No players drafted yet
                    </div>
                  ) : viewMode === 'position' ? (
                    renderPlayersByPosition(roster.players)
                  ) : (
                    renderPlayersByRound(roster.players)
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}