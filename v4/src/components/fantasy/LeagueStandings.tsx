import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, TrendingUp, TrendingDown, Minus, ChevronRight,
  Award, Medal, Star, Target, Activity
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  wins: number;
  losses: number;
  division?: string;
  ties: number;
  standing: number;
  pointsFor: number;
  pointsAgainst: number;
  winPercentage: number;
  pointsPerGame: number;
  streak?: string;
  lastWeekRank?: number;
  playoffClinched?: boolean;
  eliminated?: boolean;
}

interface LeagueStandingsProps {
  standings: Team[];
  currentWeek: number;
  leagueId: string;
}

export function LeagueStandings({ standings, currentWeek, leagueId }: LeagueStandingsProps) {
  const router = useRouter();
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'playoff'>('standard');

  // Calculate playoff line (top 6 teams make playoffs)
  const playoffLine = 6;
  
  // Group standings by divisions if applicable
  const divisions = standings.reduce((acc, team) => {
    const division = team.division || 'League';
    if (!acc[division]) acc[division] = [];
    acc[division].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  const getRankChange = (team: Team) => {
    if (!team.lastWeekRank) return null;
    const change = team.lastWeekRank - team.standing;
    if (change > 0) return { type: 'up', value: change };
    if (change < 0) return { type: 'down', value: Math.abs(change) };
    return { type: 'same', value: 0 };
  };

  const getStreakDisplay = (streak: string) => {
    if (!streak) return null;
    const type = streak[0];
    const count = parseInt(streak.slice(1));
    
    if (type === 'W') {
      return (
        <span className="text-green-600 dark:text-green-400 font-medium">
          W{count}
        </span>
      );
    } else if (type === 'L') {
      return (
        <span className="text-red-600 dark:text-red-400 font-medium">
          L{count}
        </span>
      );
    }
    return null;
  };

  const StandingIcon = ({ standing }: { standing: number }) => {
    if (standing === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (standing === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (standing === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    if (standing <= playoffLine) return <Star className="h-4 w-4 text-blue-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">League Standings</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('standard')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              viewMode === 'standard'
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            Standard
          </button>
          <button
            onClick={() => setViewMode('playoff')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              viewMode === 'playoff'
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            Playoff Picture
          </button>
        </div>
      </div>

      {/* Desktop Standings Table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  W-L-T
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Win %
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PF
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PA
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  PPG
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Streak
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {standings.map((team, index) => {
                const rankChange = getRankChange(team);
                const isPlayoffTeam = team.standing <= playoffLine;
                
                return (
                  <tr
                    key={team.id}
                    onClick={() => router.push(`/team/${team.id}`)}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
                      team.playoffClinched && "bg-green-50 dark:bg-green-900/20",
                      team.eliminated && "bg-red-50 dark:bg-red-900/20",
                      team.standing === playoffLine && "border-b-2 border-blue-500"
                    )}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">{team.standing}</span>
                        <StandingIcon standing={team.standing} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {team.owner.avatar ? (
                          <img 
                            src={team.owner.avatar} 
                            alt={team.owner.username}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {team.abbreviation.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{team.owner.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="font-medium">
                        {team.wins}-{team.losses}{team.ties > 0 && `-${team.ties}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="font-medium">
                        {(team.winPercentage * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="font-medium">{team.pointsFor.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-gray-600 dark:text-gray-400">
                        {team.pointsAgainst.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="font-medium">{team.pointsPerGame.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {getStreakDisplay(team.streak || '')}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {rankChange && (
                        <div className="flex items-center justify-center">
                          {rankChange.type === 'up' && (
                            <div className="flex items-center text-green-600">
                              <TrendingUp className="h-4 w-4" />
                              <span className="ml-1 text-sm">{rankChange.value}</span>
                            </div>
                          )}
                          {rankChange.type === 'down' && (
                            <div className="flex items-center text-red-600">
                              <TrendingDown className="h-4 w-4" />
                              <span className="ml-1 text-sm">{rankChange.value}</span>
                            </div>
                          )}
                          {rankChange.type === 'same' && (
                            <Minus className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Playoff Line Indicator */}
        {viewMode === 'playoff' && (
          <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-500">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Top {playoffLine} teams qualify for playoffs
            </p>
          </div>
        )}
      </Card>

      {/* Mobile Standings Cards */}
      <div className="md:hidden space-y-3">
        {standings.map((team, index) => {
          const rankChange = getRankChange(team);
          const isExpanded = expandedTeam === team.id;
          
          return (
            <Card
              key={team.id}
              className={cn(
                "p-4 cursor-pointer transition-all",
                team.playoffClinched && "border-green-500 border-2",
                team.eliminated && "opacity-75",
                team.standing === playoffLine && "border-b-4 border-blue-500"
              )}
              onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{team.standing}</span>
                    <StandingIcon standing={team.standing} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {team.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {team.wins}-{team.losses}{team.ties > 0 && `-${team.ties}`} • {team.pointsFor.toFixed(0)} PF
                    </p>
                  </div>
                </div>
                <ChevronRight 
                  className={cn(
                    "h-5 w-5 text-gray-400 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Win %</span>
                    <span className="font-medium">{(team.winPercentage * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Points For</span>
                    <span className="font-medium">{team.pointsFor.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Points Against</span>
                    <span className="font-medium">{team.pointsAgainst.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">PPG</span>
                    <span className="font-medium">{team.pointsPerGame.toFixed(1)}</span>
                  </div>
                  {team.streak && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Streak</span>
                      {getStreakDisplay(team.streak)}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}