import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, ChevronLeft, ChevronRight, Trophy, Shield,
  Clock, TrendingUp, Users, Swords
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Matchup {
  id: string;
  week: number;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    owner: {
      username: string;
      avatar?: string;
    };
    score: number;
    projected: number;
    record: string;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    owner: {
      username: string;
      avatar?: string;
    };
    score: number;
    projected: number;
    record: string;
  };
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  isPlayoff: boolean;
  isChampionship: boolean;
}

interface LeagueScheduleProps {
  leagueId: string;
  currentWeek: number;
  teams: any[];
}

const WEEKS = Array.from({ length: 17 }, (_, i) => i + 1);
const PLAYOFF_START_WEEK = 15;

export function LeagueSchedule({ leagueId, currentWeek, teams }: LeagueScheduleProps) {
  const router = useRouter();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [viewMode, setViewMode] = useState<'week' | 'season'>('week');

  // Use tRPC React Query hook for fetching matchups
  const { data, isLoading: loading, error } = api.league.getMatchups.useQuery(
    { 
      leagueId, 
      week: selectedWeek 
    },
    {
      // Re-fetch when selectedWeek changes
      enabled: !!leagueId
    }
  );

  // Transform API data to match component expectations
  const matchups: Matchup[] = data ? data.map((m: any) => ({
    ...m,
    homeTeam: {
      id: m.homeTeamId,
      name: `Team ${m.homeTeamId}`,
      abbreviation: 'HOM',
      owner: { username: 'Home Owner' },
      score: m.homeScore,
      projected: 0,
      record: '0-0'
    },
    awayTeam: {
      id: m.awayTeamId,
      name: `Team ${m.awayTeamId}`,
      abbreviation: 'AWY',
      owner: { username: 'Away Owner' },
      score: m.awayScore,
      projected: 0,
      record: '0-0'
    },
    status: m.isComplete ? 'completed' : 'upcoming',
    isPlayoff: false,
    isChampionship: false
  })) : [];

  // Log error if query fails
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch matchups:', error);
    }
  }, [error]);

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    } else if (direction === 'next' && selectedWeek < 17) {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  const getMatchupStatus = (matchup: Matchup) => {
    if (matchup.status === 'COMPLETED') {
      const homeWon = matchup.homeTeam.score > matchup.awayTeam.score;
      return {
        homeStatus: homeWon ? 'winner' : 'loser',
        awayStatus: homeWon ? 'loser' : 'winner',
      };
    }
    if (matchup.status === 'IN_PROGRESS') {
      const homeLeading = matchup.homeTeam.score > matchup.awayTeam.score;
      return {
        homeStatus: homeLeading ? 'leading' : 'trailing',
        awayStatus: homeLeading ? 'trailing' : 'leading',
      };
    }
    return { homeStatus: 'scheduled', awayStatus: 'scheduled' };
  };

  const WeekSelector = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">
          {selectedWeek >= PLAYOFF_START_WEEK ? 'Playoffs' : 'Regular Season'}
        </h2>
        <span className="text-sm text-gray-500">
          Week {selectedWeek} {selectedWeek === currentWeek && '(Current)'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleWeekChange('prev')}
          disabled={selectedWeek === 1}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          className="px-3 py-1 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          {WEEKS.map(week => (
            <option key={week} value={week}>
              Week {week}
              {week >= PLAYOFF_START_WEEK && ' (Playoffs)'}
              {week === 17 && ' - Championship'}
            </option>
          ))}
        </select>
        
        <Button
          onClick={() => handleWeekChange('next')}
          disabled={selectedWeek === 17}
          variant="outline"
          size="sm"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const MatchupCard = ({ matchup }: { matchup: Matchup }) => {
    const status = getMatchupStatus(matchup);
    const isLive = matchup.status === 'IN_PROGRESS';
    
    return (
      <Card 
        className={cn(
          "p-4 cursor-pointer hover:shadow-lg transition-all",
          isLive && "border-2 border-green-500 animate-pulse",
          matchup.isChampionship && "border-2 border-yellow-500"
        )}
        onClick={() => router.push(`/matchup/${matchup.id}`)}
      >
        {matchup.isChampionship && (
          <div className="flex items-center justify-center gap-2 mb-3 text-yellow-600">
            <Trophy className="h-5 w-5" />
            <span className="text-sm font-semibold">Championship</span>
          </div>
        )}
        
        {/* Away Team */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg mb-2",
          status.awayStatus === 'winner' && "bg-green-50 dark:bg-green-900/20",
          status.awayStatus === 'loser' && "bg-red-50 dark:bg-red-900/20",
          status.awayStatus === 'leading' && "bg-blue-50 dark:bg-blue-900/20"
        )}>
          <div className="flex items-center gap-3">
            {matchup.awayTeam.owner.avatar ? (
              <img 
                src={matchup.awayTeam.owner.avatar}
                alt={matchup.awayTeam.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {matchup.awayTeam.abbreviation.slice(0, 2)}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {matchup.awayTeam.name}
              </p>
              <p className="text-xs text-gray-500">
                {matchup.awayTeam.record} • @{matchup.awayTeam.owner.username}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {matchup.awayTeam.score.toFixed(1)}
            </p>
            {matchup.status === 'SCHEDULED' && (
              <p className="text-xs text-gray-500">
                Proj: {matchup.awayTeam.projected.toFixed(1)}
              </p>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center my-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="px-3 text-xs text-gray-500 font-medium">VS</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Home Team */}
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg",
          status.homeStatus === 'winner' && "bg-green-50 dark:bg-green-900/20",
          status.homeStatus === 'loser' && "bg-red-50 dark:bg-red-900/20",
          status.homeStatus === 'leading' && "bg-blue-50 dark:bg-blue-900/20"
        )}>
          <div className="flex items-center gap-3">
            {matchup.homeTeam.owner.avatar ? (
              <img 
                src={matchup.homeTeam.owner.avatar}
                alt={matchup.homeTeam.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-medium">
                {matchup.homeTeam.abbreviation.slice(0, 2)}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {matchup.homeTeam.name}
              </p>
              <p className="text-xs text-gray-500">
                {matchup.homeTeam.record} • @{matchup.homeTeam.owner.username}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {matchup.homeTeam.score.toFixed(1)}
            </p>
            {matchup.status === 'SCHEDULED' && (
              <p className="text-xs text-gray-500">
                Proj: {matchup.homeTeam.projected.toFixed(1)}
              </p>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        {isLive && (
          <div className="mt-3 flex items-center justify-center gap-2 text-green-600">
            <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
            <span className="text-xs font-medium">LIVE</span>
          </div>
        )}
      </Card>
    );
  };

  // Season Overview Mode
  const SeasonOverview = () => {
    const [seasonSchedule, setSeasonSchedule] = useState<Record<number, Matchup[]>>({});
    
    useEffect(() => {
      // Fetch all weeks (simplified for demo)
      const fetchAllWeeks = async () => {
        // In production, this would be a batch API call
        const schedule: Record<number, Matchup[]> = {};
        // Mock data for demonstration
        WEEKS.forEach(week => {
          schedule[week] = []; // Would contain actual matchups
        });
        setSeasonSchedule(schedule);
      };
      fetchAllWeeks();
    }, []);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Season Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WEEKS.map(week => (
            <Card
              key={week}
              className={cn(
                "p-4 cursor-pointer hover:shadow-md transition-all",
                week === currentWeek && "border-2 border-blue-500",
                week >= PLAYOFF_START_WEEK && "bg-purple-50 dark:bg-purple-900/10"
              )}
              onClick={() => {
                setSelectedWeek(week);
                setViewMode('week');
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Week {week}</span>
                {week === currentWeek && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
                {week >= PLAYOFF_START_WEEK && (
                  <Trophy className="h-4 w-4 text-purple-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {seasonSchedule[week]?.length || teams.length / 2} matchups
              </p>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              viewMode === 'week'
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('season')}
            className={cn(
              "px-3 py-1 rounded-lg text-sm transition-colors",
              viewMode === 'season'
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            Season View
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        <>
          <WeekSelector />
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchups.length > 0 ? (
                matchups.map(matchup => (
                  <MatchupCard key={matchup.id} matchup={matchup} />
                ))
              ) : (
                <Card className="col-span-full p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No matchups scheduled for this week
                  </p>
                </Card>
              )}
            </div>
          )}
        </>
      ) : (
        <SeasonOverview />
      )}
    </div>
  );
}