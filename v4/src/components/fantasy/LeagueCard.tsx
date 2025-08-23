import { useRouter } from 'next/navigation';
import { Trophy, Users, Calendar, Crown, TrendingUp, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import type { League, Team } from '@/types';

interface LeagueCardProps {
  league: League & {
    // Additional computed fields for display
    currentWeek?: number;
    playoffWeek?: number;
    draftDate?: string;
    isCommissioner?: boolean;
    userTeam?: {
      name: string;
      record: { wins: number; losses: number; ties: number };
      standing: number;
    };
  };
  archived?: boolean;
}

export function LeagueCard({ league, archived = false }: LeagueCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PLAYOFFS':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'COMPLETE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeagueTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'REDRAFT':
        return <Calendar className="h-4 w-4" />;
      case 'KEEPER':
        return <TrendingUp className="h-4 w-4" />;
      case 'DYNASTY':
        return <Crown className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  return (
    <Card 
      className={`p-6 hover:shadow-lg transition-all cursor-pointer ${archived ? 'opacity-60' : ''}`}
      onClick={() => router.push(`/leagues/${league.id}`)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {league.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(league.status)}`}>
              {league.status}
            </span>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              {getLeagueTypeIcon(league.draftType)}
              <span className="ml-1">{league.draftType}</span>
            </div>
          </div>
        </div>
        {league.isCommissioner && (
          <Settings className="h-5 w-5 text-gray-400" />
        )}
      </div>

      {/* League Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4 mr-2" />
          <span>{league._count?.teams || league.teams?.length || 0} teams</span>
        </div>
        {league.currentWeek && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Week {league.currentWeek}</span>
          </div>
        )}
        {league.draftDate && league.status === 'DRAFT' && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Draft {formatDistanceToNow(new Date(league.draftDate), { addSuffix: true })}</span>
          </div>
        )}
      </div>

      {/* User Team Info */}
      {league.userTeam && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {league.userTeam.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {league.userTeam.record.wins}-{league.userTeam.record.losses}
                {league.userTeam.record.ties > 0 && `-${league.userTeam.record.ties}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {league.userTeam.standing}
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                  /{league._count?.teams || league.teams?.length || 0}
                </span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Standing</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/leagues/${league.id}/team`);
          }}
        >
          My Team
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/leagues/${league.id}/matchup`);
          }}
        >
          Matchup
        </Button>
      </div>
    </Card>
  );
}