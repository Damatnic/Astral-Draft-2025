'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { TrophyIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ClockIcon, UsersIcon, GiftIcon } from '@heroicons/react/24/outline';

export default function DraftRecapPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const { data: recap, isLoading } = trpc.draft.getDraftRecap.useQuery(
    { draftId },
    { enabled: !!draftId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Draft Not Found</h1>
          <p className="text-gray-600 mb-4">This draft doesn&apos;t exist or hasn&apos;t been completed yet.</p>
          <Button onClick={() => router.push('/draft')}>Back to Draft Center</Button>
        </div>
      </div>
    );
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
    if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'bg-red-100 text-red-800',
      RB: 'bg-green-100 text-green-800',
      WR: 'bg-blue-100 text-blue-800',
      TE: 'bg-orange-100 text-orange-800',
      DST: 'bg-purple-100 text-purple-800',
      K: 'bg-yellow-100 text-yellow-800',
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Draft Recap</h1>
          <Button variant="outline" onClick={() => router.push(`/leagues/${recap.draft.leagueId}`)}>
            Go to League
          </Button>
        </div>
        
        {/* Draft summary stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Teams</p>
                <p className="text-2xl font-bold">10</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrophyIcon className="w-8 h-8 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Total Picks</p>
                <p className="text-2xl font-bold">{recap.totalPicks}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <ClockIcon className="w-8 h-8 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-2xl font-bold">{recap.duration} min</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <GiftIcon className="w-8 h-8 text-primary-500" />
              <div>
                <p className="text-sm text-gray-500">Draft Type</p>
                <p className="text-2xl font-bold capitalize">
                  {recap.draft.type.toLowerCase()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Team Grades */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Team Grades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recap.teamGrades
            .sort((a: any, b: any) => {
              // Sort by grade (A+ > A > B+ > B > C)
              const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
              return gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
            })
            .map((team: any) => (
              <Card key={team.teamId} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{team.teamName}</h3>
                    <p className="text-sm text-gray-500">
                      {team.picks.length} players drafted
                    </p>
                  </div>
                  <div className={cn('text-3xl font-bold', getGradeColor(team.grade))}>
                    {team.grade}
                  </div>
                </div>

                {/* Best pick */}
                {team.bestPick && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                      <span>Best Value</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {team.bestPick.player?.name}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-xs', 
                        getPositionColor(team.bestPick.player?.position || '')
                      )}>
                        {team.bestPick.player?.position}
                      </span>
                      <span className="text-xs text-gray-500">
                        Pick {team.bestPick.overallPick} (ADP: {team.bestPick.player?.adp})
                      </span>
                    </div>
                  </div>
                )}

                {/* Reach pick */}
                {team.reachPick && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                      <span>Biggest Reach</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {team.reachPick.player?.name}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-xs', 
                        getPositionColor(team.reachPick.player?.position || '')
                      )}>
                        {team.reachPick.player?.position}
                      </span>
                      <span className="text-xs text-gray-500">
                        Pick {team.reachPick.overallPick} (ADP: {team.reachPick.player?.adp})
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/team/${team.teamId}`)}
                  >
                    View Full Roster
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* Full Draft Results */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Complete Draft Results</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pick
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Team
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Player
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Team
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ADP
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {recap.draft.draftPicks.map((pick, index) => {
                  const value = pick.overallPick - (pick.player?.adp || pick.overallPick);
                  return (
                    <tr key={pick.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <span className="font-medium">{pick.overallPick}</span>
                          <span className="text-xs text-gray-500 ml-1">
                            (R{pick.round})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {pick.team.name}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {pick.player?.name || 'Unknown Player'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn('px-2 py-0.5 rounded text-xs', 
                          getPositionColor(pick.player?.position || '')
                        )}>
                          {pick.player?.position || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {pick.player?.nflTeam || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {pick.player?.adp || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn(
                          'font-medium',
                          value > 5 ? 'text-green-600' : 
                          value < -5 ? 'text-red-600' : 
                          'text-gray-600'
                        )}>
                          {value > 0 ? '+' : ''}{value}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}