'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { WaiverWire } from '../../components/fantasy/WaiverWire';

export default function WaiversPageIntegrated() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch the user's leagues and teams
    // For now, we'll use query params or default values
    const params = new URLSearchParams(window.location.search);
    const leagueId = params.get('leagueId');
    const teamId = params.get('teamId');
    
    if (leagueId && teamId) {
      setSelectedLeague(leagueId);
      setSelectedTeam(teamId);
    }
    setLoading(false);
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (!selectedLeague || !selectedTeam) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">No League Selected</h2>
          <p className="text-gray-400 mb-6">Please select a league and team to view the waiver wire.</p>
          <button 
            onClick={() => router.push('/leagues')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all"
          >
            Go to Leagues
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <WaiverWire leagueId={selectedLeague} teamId={selectedTeam} />
    </div>
  );
}