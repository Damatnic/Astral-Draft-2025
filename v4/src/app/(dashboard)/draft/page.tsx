'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

export default function DraftLobbyPage() {
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  // Get user's leagues with draft status
  const { data: leagues, isLoading } = trpc.league.getUserLeagues.useQuery();
  
  // Get mock drafts
  const { data: mockDrafts } = trpc.draft.getMockDrafts.useQuery();
  
  // Create mock draft mutation
  const createMockDraft = trpc.draft.createMockDraft.useMutation({
    onSuccess: (data) => {
      router.push(`/draft/${data.id}/mock`);
    },
  });

  const handleJoinDraft = (leagueId: string, draftId: string) => {
    router.push(`/draft/${draftId}/room`);
  };

  const handleCreateMockDraft = async () => {
    await createMockDraft.mutateAsync({
      rounds: 16,
      teamCount: 10,
      timePerPick: 60,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Draft Center</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Join your league draft or practice with a mock draft
        </p>
      </div>

      {/* Active League Drafts */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Your League Drafts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues?.filter(l => l.status === 'DRAFT').map((l) => {
            const league = l as any;
            return (
            <Card key={league.id} className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{league.name}</h3>
                <p className="text-sm text-gray-500">
                  {league.teamCount} teams • {league.scoringType} scoring
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Draft Type:</span>
                  <span className="font-medium capitalize">
                    {league.draftType.toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Draft Status:</span>
                  <span className={`font-medium ${
                    league.draft?.status === 'IN_PROGRESS' 
                      ? 'text-blue-500' 
                      : league.draft?.status === 'SCHEDULED'
                      ? 'text-yellow-500'
                      : league.draft?.status === 'COMPLETED'
                      ? 'text-green-500'
                      : 'text-gray-500'
                  }`}>
                    {league.draft?.status ? league.draft.status.replace('_', ' ') : 'Not Scheduled'}
                  </span>
                </div>
                {/* TODO: Add draft scheduled date */}
              </div>

              <div className="flex gap-2">
                {league.draft?.status === 'IN_PROGRESS' && (
                  <Button 
                    onClick={() => router.push(`/draft/${league.draft?.id}`)}
                    className="flex-1"
                  >
                    Enter Draft Room
                  </Button>
                )}
                {league.draft?.status === 'SCHEDULED' && (
                  <Button 
                    onClick={() => router.push(`/leagues/${league.id}`)}
                    variant="outline"
                    className="flex-1"
                  >
                    View Draft Settings
                  </Button>
                )}
                {league.draft?.status === 'COMPLETED' && (
                  <Button 
                    onClick={() => router.push(`/draft/${league.draft?.id}/recap`)}
                    variant="outline"
                    className="flex-1"
                  >
                    View Draft Results
                  </Button>
                )}
                {!league.draft && (
                  <Button 
                    onClick={() => router.push(`/leagues/${league.id}`)}
                    variant="outline"
                    className="flex-1"
                  >
                    View League
                  </Button>
                )}
              </div>
            </Card>
          );
          })}

          {(!leagues || leagues.length === 0) && (
            <Card className="p-6 col-span-full">
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  You&apos;re not part of any leagues with upcoming drafts
                </p>
                <Button
                  onClick={() => router.push('/leagues')}
                  variant="outline"
                >
                  Join a League
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Mock Drafts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Mock Drafts</h2>
          <Button onClick={handleCreateMockDraft} variant="default">
            Start Mock Draft
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDrafts?.map((mock) => (
            <Card key={mock.id} className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Mock Draft</h3>
                <p className="text-sm text-gray-500">
                  {mock.teamCount} teams • {mock.rounds} rounds
                </p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Players:</span>
                  <span className="font-medium">
                    {mock.currentPlayers}/{mock.teamCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time per pick:</span>
                  <span className="font-medium">{mock.timePerPick}s</span>
                </div>
              </div>

              <Button 
                onClick={() => router.push(`/draft/${mock.id}/mock`)}
                className="w-full"
                variant={mock.currentPlayers < mock.teamCount ? 'default' : 'outline'}
              >
                {mock.currentPlayers < mock.teamCount ? 'Join Mock' : 'Spectate'}
              </Button>
            </Card>
          ))}

          {(!mockDrafts || mockDrafts.length === 0) && (
            <Card className="p-6 col-span-full">
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  No active mock drafts available
                </p>
                <Button onClick={handleCreateMockDraft} variant="default">
                  Create Mock Draft
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}