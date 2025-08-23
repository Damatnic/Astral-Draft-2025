import React, { useState } from 'react';
import DraftRoom from '../components/draft/DraftRoom';
import { motion } from 'framer-motion';

interface League {
  id: string;
  name: string;
  teams: number;
  draftStatus: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
  draftTime: Date;
  userTeamId: number;
}

const LiveDraftRoomView: React.FC = () => {
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leagues] = useState<League[]>([
    {
      id: 'league-1',
      name: 'Championship League',
      teams: 12,
      draftStatus: 'ACTIVE',
      draftTime: new Date(),
      userTeamId: 1
    },
    {
      id: 'league-2', 
      name: 'Friends & Family',
      teams: 10,
      draftStatus: 'SCHEDULED',
      draftTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userTeamId: 3
    },
    {
      id: 'league-3',
      name: 'Office League',
      teams: 8,
      draftStatus: 'COMPLETED',
      draftTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      userTeamId: 5
    }
  ]);
  
  const [userId] = useState('user-123'); // Mock user ID

  const handleJoinDraft = (league: League) => {
    setSelectedLeague(league);
  };

  const handleExitDraft = () => {
    setSelectedLeague(null);
  };

  const getStatusColor = (status: League['draftStatus']): string => {
    switch (status) {
      case 'ACTIVE': return 'text-green-500 bg-green-100';
      case 'SCHEDULED': return 'text-blue-500 bg-blue-100';
      case 'COMPLETED': return 'text-gray-500 bg-gray-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const canJoinDraft = (league: League): boolean => {
    return league.draftStatus === 'ACTIVE' || 
           (league.draftStatus === 'SCHEDULED' && 
            Math.abs(league.draftTime.getTime() - Date.now()) < 15 * 60 * 1000); // 15 minutes before
  };

  // If in a draft room, render the DraftRoom component
  if (selectedLeague) {
    return (
      <DraftRoom
        leagueId={selectedLeague.id}
        userId={userId}
        teamId={selectedLeague.userTeamId}
        onExitDraft={handleExitDraft}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Live Draft Rooms</h1>
          
          <div className="grid gap-6">
            {leagues.map(league => (
              <motion.div
                key={league.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">{league.name}</h2>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(league.draftStatus)}`}>
                        {league.draftStatus}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <span>{league.teams} Teams</span>
                      <span>Your Team: #{league.userTeamId}</span>
                      <span>
                        Draft: {league.draftTime.toLocaleDateString()} at {league.draftTime.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {league.draftStatus === 'SCHEDULED' && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">
                          Starts in: {Math.ceil((league.draftTime.getTime() - Date.now()) / (1000 * 60 * 60))} hours
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    {league.draftStatus === 'ACTIVE' && (
                      <button
                        onClick={() => handleJoinDraft(league)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Join Draft
                      </button>
                    )}
                    
                    {league.draftStatus === 'SCHEDULED' && canJoinDraft(league) && (
                      <button
                        onClick={() => handleJoinDraft(league)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Enter Draft Room
                      </button>
                    )}
                    
                    {league.draftStatus === 'SCHEDULED' && !canJoinDraft(league) && (
                      <button
                        disabled
                        className="bg-gray-400 text-white px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                      >
                        Too Early
                      </button>
                    )}
                    
                    {league.draftStatus === 'COMPLETED' && (
                      <button
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        onClick={() => {
                          // Navigate to draft results or league dashboard
                          console.log('View draft results for', league.id);
                        }}
                      >
                        View Results
                      </button>
                    )}
                  </div>
                </div>
                
                {league.draftStatus === 'ACTIVE' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">Draft is live!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Join now to participate in real-time drafting with WebSocket synchronization.
                    </p>
                  </div>
                )}
                
                {league.draftStatus === 'SCHEDULED' && canJoinDraft(league) && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">Draft room open</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      You can enter the draft room early to prepare and chat with other managers.
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          {leagues.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🏈</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Live Draft Rooms Available</h3>
                <p className="text-gray-600">
                  You're not currently in any leagues with upcoming or active live drafts. 
                  Join a league to start real-time drafting!
                </p>
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Find Leagues
                </button>
              </div>
            </div>
          )}
          
          {/* Help Section */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Live Draft Room Features</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Real-Time Features</h4>
                <ul className="space-y-1">
                  <li>• WebSocket-based live updates</li>
                  <li>• Synchronized timer across all clients</li>
                  <li>• Instant pick notifications</li>
                  <li>• Live participant status</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Interactive Elements</h4>
                <ul className="space-y-1">
                  <li>• Real-time chat with trade proposals</li>
                  <li>• Player search and tier filtering</li>
                  <li>• Pick countdown with warnings</li>
                  <li>• Mobile-responsive design</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveDraftRoomView;
