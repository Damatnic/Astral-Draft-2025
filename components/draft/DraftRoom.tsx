import React, { useState, useEffect, useRef } from 'react';
import { useDraftRoom } from '../../hooks/useDraftRoom';
import { motion, AnimatePresence } from 'framer-motion';

interface DraftRoomProps {
  leagueId: string;
  userId: string;
  teamId: number;
  onExitDraft?: () => void;
}

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  adp: number;
  projectedPoints: number;
  tier: number;
}

const DraftRoom: React.FC<DraftRoomProps> = ({
  leagueId,
  userId,
  teamId,
  onExitDraft
}) => {
  const {
    isConnected,
    connectionStatus,
    participants,
    currentPick,
    currentRound,
    timeRemaining,
    isPaused,
    isMyTurn,
    picks,
    chatMessages,
    connect,
    disconnect,
    makePick,
    sendChatMessage,
    toggleTimer,
    error,
    clearError
  } = useDraftRoom({ leagueId, userId, teamId });

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [availablePlayers] = useState<Player[]>([
    // Mock available players - replace with real data
    { id: 1, name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1.2, projectedPoints: 320, tier: 1 },
    { id: 2, name: 'Austin Ekeler', position: 'RB', team: 'LAC', adp: 2.1, projectedPoints: 305, tier: 1 },
    { id: 3, name: 'Cooper Kupp', position: 'WR', team: 'LAR', adp: 3.5, projectedPoints: 295, tier: 1 },
    { id: 4, name: 'Derrick Henry', position: 'RB', team: 'TEN', adp: 4.2, projectedPoints: 285, tier: 2 },
    { id: 5, name: 'Davante Adams', position: 'WR', team: 'LV', adp: 5.1, projectedPoints: 280, tier: 2 }
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Timer animation effect
  useEffect(() => {
    if (timerRef.current && timeRemaining <= 30 && isMyTurn) {
      timerRef.current.classList.add('timer-warning');
    } else if (timerRef.current) {
      timerRef.current.classList.remove('timer-warning');
    }
  }, [timeRemaining, isMyTurn]);

  const handleMakePick = () => {
    if (selectedPlayer && isMyTurn) {
      makePick(selectedPlayer.id);
      setSelectedPlayer(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'QB': return 'text-red-600';
      case 'RB': return 'text-green-600';
      case 'WR': return 'text-blue-600';
      case 'TE': return 'text-orange-600';
      case 'DEF': return 'text-purple-600';
      case 'K': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getTierColor = (tier: number): string => {
    switch (tier) {
      case 1: return 'bg-yellow-100 border-yellow-400';
      case 2: return 'bg-blue-100 border-blue-400';
      case 3: return 'bg-green-100 border-green-400';
      default: return 'bg-gray-100 border-gray-400';
    }
  };

  const filteredPlayers = availablePlayers.filter((player: any) => {
    if (filterPosition === 'ALL') return true;
    return player.position === filterPosition;
  });

  if (!isConnected && connectionStatus !== 'CONNECTING') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connection Issue</h2>
          <p className="text-gray-600 mb-6">
            Unable to connect to the draft room. Please check your connection and try again.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={connect}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            {onExitDraft && (
              <button
                onClick={onExitDraft}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Exit Draft
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold">Draft Room</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Round {currentRound}</span>
              <span className="text-sm text-gray-400">Pick {currentPick}</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'CONNECTED' ? 'bg-green-400' :
                  connectionStatus === 'CONNECTING' ? 'bg-yellow-400' : 
                  'bg-red-400'
                }`} />
                <span className="text-sm text-gray-400 capitalize">{connectionStatus.toLowerCase()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div
              ref={timerRef}
              className={`text-2xl font-mono px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                isPaused ? 'bg-yellow-600 border-yellow-400' :
                timeRemaining <= 30 ? 'bg-red-600 border-red-400 animate-pulse' :
                'bg-gray-700 border-gray-600'
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
            
            {/* Timer controls */}
            <button
              onClick={toggleTimer}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            
            {onExitDraft && (
              <button
                onClick={onExitDraft}
                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg transition-colors"
              >
                Exit Draft
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-red-600 text-white p-4 text-center"
          >
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-4 underline hover:no-underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Available Players */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Available Players</h2>
              <select
                value={filterPosition}
                onChange={(e: any) => setFilterPosition(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm"
              >
                <option value="ALL">All Positions</option>
                <option value="QB">Quarterback</option>
                <option value="RB">Running Back</option>
                <option value="WR">Wide Receiver</option>
                <option value="TE">Tight End</option>
                <option value="DEF">Defense</option>
                <option value="K">Kicker</option>
              </select>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPlayers.map((player: any) => (
                <motion.div
                  key={player.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPlayer?.id === player.id
                      ? 'border-blue-400 bg-blue-900/30'
                      : `${getTierColor(player?.tier)} bg-gray-700 border-gray-600 hover:border-gray-500`
                  }`}
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{player.name}</span>
                        <span className={`text-sm font-medium ${getPositionColor(player.position)}`}>
                          {player.position}
                        </span>
                        <span className="text-sm text-gray-400">{player.team}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                        <span>ADP: {player?.adp}</span>
                        <span>Proj: {player.projectedPoints}</span>
                        <span>Tier {player?.tier}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Draft Button */}
            <div className="mt-4">
              <button
                onClick={handleMakePick}
                disabled={!selectedPlayer || !isMyTurn}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  selectedPlayer && isMyTurn
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {!isMyTurn ? "Not Your Turn" : 
                 !selectedPlayer ? "Select a Player" : 
                 `Draft ${selectedPlayer.name}`}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Draft Board */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Picks</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {picks.slice(-10).reverse().map((pick, index) => (
                <motion.div
                  key={`${pick.pickNumber}-${pick.timestamp}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                >
                  <div>
                    <span className="text-sm text-gray-400">Pick #{pick.pickNumber}</span>
                    <span className="ml-2 font-medium">Team {pick.teamId}</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    Player ID: {pick.playerId}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Participants</h2>
            <div className="space-y-2">
              {participants.map((participant: any) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      participant.isOnline ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <span>Team {participant.teamId}</span>
                    {participant.userId === userId && (
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded">You</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {participant.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Chat</h2>
            <div
              ref={chatContainerRef}
              className="space-y-2 max-h-48 overflow-y-auto mb-4"
            >
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={`p-2 rounded-lg ${
                    message.isTradeProposal ? 'bg-orange-900/30 border border-orange-600' : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-400">
                      User {message.userId}
                    </span>
                    {message.isTradeProposal && (
                      <span className="text-xs bg-orange-600 px-2 py-1 rounded">Trade</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{message.message}</p>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e: any) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftRoom;
