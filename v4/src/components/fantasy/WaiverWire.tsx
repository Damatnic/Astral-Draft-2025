/**
 * Waiver Wire Component
 * Complete UI for managing waiver claims with FAAB support
 */

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '../ui/Modal';
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Clock,
  User,
  Users,
  Trophy,
  Filter,
  ChevronDown,
  X,
  Plus,
  Minus,
  Info
} from 'lucide-react';

interface WaiverWireProps {
  leagueId: string;
  teamId: string;
}

interface Player {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  position: string;
  nflTeam: string | null;
  jerseyNumber?: number | null;
  status: string;
  injuryStatus?: string | null;
  injuryNotes?: string | null;
  headshotUrl?: string | null;
  rank?: number | null;
  adp?: number | null;
  projectedPoints: number;
  recentPoints: number;
  onWaivers: boolean;
  waiverClearDate?: Date | null;
  claimCount: number;
}

interface WaiverClaim {
  id: string;
  playerId: string;
  dropPlayerId?: string;
  faabAmount: number;
  priority: number;
  status: string;
  processDate: Date;
  player: {
    displayName: string;
    position: string;
    nflTeam: string;
  };
  dropPlayer?: {
    displayName: string;
    position: string;
    nflTeam: string;
  };
}

interface TeamWaiverInfo {
  waiverType: 'FAAB' | 'ROLLING' | 'REVERSE_STANDINGS' | 'CONTINUAL';
  remainingBudget?: number | null;
  totalBudget?: number | null;
  totalSpent?: number | null;
  waiverPriority: number;
  activeClaims: number;
  successfulClaims: number;
  nextProcessingDate: Date;
}

export function WaiverWire({ leagueId, teamId }: WaiverWireProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [myClaims, setMyClaims] = useState<WaiverClaim[]>([]);
  const [teamInfo, setTeamInfo] = useState<TeamWaiverInfo | null>(null);
  const [waiverOrder, setWaiverOrder] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [dropPlayer, setDropPlayer] = useState<any | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showMyClaimsModal, setShowMyClaimsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'rank' | 'projectedPoints' | 'recentPoints' | 'owned'>('rank');
  // Loading state handled by React Query hooks
  const [roster, setRoster] = useState<any[]>([]);

  // Fetch data using tRPC hooks
  const { data: playersData, isLoading: playersLoading } = api.waiver.getAvailablePlayers.useQuery({
    leagueId,
    position: positionFilter === 'ALL' ? undefined : positionFilter,
    search: searchQuery || undefined,
    sortBy,
    limit: 50,
  });

  const { data: claimsData, isLoading: claimsLoading } = api.waiver.getMyWaiverClaims.useQuery({
    leagueId,
    teamId,
    status: 'PENDING',
  });

  const { data: infoData, isLoading: infoLoading } = api.waiver.getTeamWaiverInfo.useQuery({
    teamId,
    leagueId,
  });

  const { data: orderData, isLoading: orderLoading } = api.waiver.getLeagueWaiverOrder.useQuery({
    leagueId,
  });

  // getRoster endpoint not available yet
  const rosterData = null;
  const rosterLoading = false;

  const loading = playersLoading || claimsLoading || infoLoading || orderLoading || rosterLoading;

  // Update state when data changes
  useEffect(() => {
    if (playersData) {
      setPlayers(playersData.players || playersData || []);
    }
  }, [playersData]);

  useEffect(() => {
    if (claimsData) {
      setMyClaims(claimsData);
    }
  }, [claimsData]);

  useEffect(() => {
    if (infoData) {
      setTeamInfo(infoData);
    }
  }, [infoData]);

  useEffect(() => {
    if (orderData) {
      setWaiverOrder(orderData.teams || []);
    }
  }, [orderData]);

  // Roster data not available yet
  useEffect(() => {
    setRoster([]);
  }, []);

  // Mutations
  const submitClaimMutation = api.waiver.submitClaim.useMutation({
    onSuccess: () => {
      // Reset modal
      setShowClaimModal(false);
      setSelectedPlayer(null);
      setDropPlayer(null);
      setBidAmount(0);
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to submit waiver claim');
    },
  });

  const cancelClaimMutation = api.waiver.cancelClaim.useMutation({
    onError: (error: any) => {
      alert(error.message || 'Failed to cancel claim');
    },
  });

  const handleSubmitClaim = async () => {
    if (!selectedPlayer || !teamInfo) return;

    submitClaimMutation.mutate({
      leagueId,
      teamId,
      playerId: selectedPlayer.id,
      dropPlayerId: dropPlayer?.id,
      faabAmount: teamInfo.waiverType === 'FAAB' ? bidAmount : 0,
    });
  };

  const handleCancelClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to cancel this waiver claim?')) return;

    cancelClaimMutation.mutate({ claimId });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'bg-red-100 text-red-800',
      RB: 'bg-green-100 text-green-800',
      WR: 'bg-blue-100 text-blue-800',
      TE: 'bg-orange-100 text-orange-800',
      K: 'bg-purple-100 text-purple-800',
      DEF: 'bg-gray-100 text-gray-800',
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      if (searchQuery && !player.displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (positionFilter !== 'ALL' && player.position !== positionFilter) {
        return false;
      }
      return true;
    });
  }, [players, searchQuery, positionFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Budget Info */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Waiver Wire</h2>
            <p className="text-cyan-100">
              Next Processing: {teamInfo && formatDate(teamInfo.nextProcessingDate)}
            </p>
          </div>
          
          <div className="text-right">
            {teamInfo?.waiverType === 'FAAB' ? (
              <>
                <div className="text-3xl font-bold">
                  ${teamInfo.remainingBudget}
                </div>
                <div className="text-cyan-100">
                  Remaining FAAB Budget
                </div>
                <div className="text-sm mt-1 text-cyan-200">
                  ${teamInfo.totalSpent} spent of ${teamInfo.totalBudget}
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  #{teamInfo?.waiverPriority}
                </div>
                <div className="text-cyan-100">
                  Waiver Priority
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setShowMyClaimsModal(true)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            My Claims ({myClaims.length})
          </button>
          
          <button
            onClick={() => setShowClaimModal(true)}
            className="bg-white text-cyan-600 hover:bg-cyan-50 px-4 py-2 rounded-lg font-semibold"
          >
            View Waiver Order
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">All Positions</option>
            <option value="QB">QB</option>
            <option value="RB">RB</option>
            <option value="WR">WR</option>
            <option value="TE">TE</option>
            <option value="K">K</option>
            <option value="DEF">DEF</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rank' | 'projectedPoints' | 'recentPoints' | 'owned')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="rank">Rank</option>
            <option value="projectedPoints">Projected Points</option>
            <option value="recentPoints">Recent Points</option>
            <option value="owned">Most Added</option>
          </select>
        </div>
      </Card>

      {/* Players List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proj Pts
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Avg
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claims
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      {player.headshotUrl ? (
                        <img
                          src={player.headshotUrl}
                          alt={player.displayName}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {player.displayName}
                        </div>
                        {player.injuryStatus && (
                          <div className="text-xs text-red-600">
                            {player.injuryStatus}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {player.nflTeam}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    {player.rank || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                    {player.projectedPoints.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                    {player.recentPoints.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {player.onWaivers ? (
                      <div className="text-xs">
                        <span className="text-orange-600 font-semibold">On Waivers</span>
                        {player.waiverClearDate && (
                          <div className="text-gray-500">
                            Clears {new Date(player.waiverClearDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-green-600 text-xs font-semibold">Free Agent</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {player.claimCount > 0 && (
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{player.claimCount}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <Button
                      onClick={() => {
                        setSelectedPlayer(player);
                        setShowClaimModal(true);
                      }}
                      size="sm"
                      variant="outline"
                      disabled={myClaims.some(c => c.playerId === player.id)}
                    >
                      {myClaims.some(c => c.playerId === player.id) ? 'Claimed' : 'Add'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Submit Claim Modal */}
      <Modal
        open={showClaimModal && selectedPlayer !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowClaimModal(false);
            setSelectedPlayer(null);
            setDropPlayer(null);
            setBidAmount(0);
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add {selectedPlayer?.displayName}</ModalTitle>
          </ModalHeader>
          <div className="p-6 space-y-4">
          {/* Player Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedPlayer?.displayName}</h3>
                <div className="text-sm text-gray-600">
                  {selectedPlayer?.position} - {selectedPlayer?.nflTeam}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-600">
                  {selectedPlayer?.projectedPoints.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Projected</div>
              </div>
            </div>
          </div>

          {/* FAAB Bid Amount */}
          {teamInfo?.waiverType === 'FAAB' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FAAB Bid Amount
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBidAmount(Math.max(0, bidAmount - 1))}
                  className="p-2 border rounded hover:bg-gray-50"
                  disabled={bidAmount <= 0}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Math.max(0, Math.min(teamInfo.remainingBudget || 0, parseInt(e.target.value) || 0)))}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    min="0"
                    max={teamInfo.remainingBudget || 0}
                  />
                </div>
                <button
                  onClick={() => setBidAmount(Math.min(teamInfo.remainingBudget || 0, bidAmount + 1))}
                  className="p-2 border rounded hover:bg-gray-50"
                  disabled={bidAmount >= (teamInfo.remainingBudget || 0)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Min: $0</span>
                <span>Remaining: ${teamInfo.remainingBudget}</span>
              </div>
            </div>
          )}

          {/* Drop Player Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Drop Player (Optional)
            </label>
            <select
              value={dropPlayer?.id || ''}
              onChange={(e) => {
                const player = roster.find(p => p.id === e.target.value);
                setDropPlayer(player || null);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">No drop needed</option>
              {roster.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.displayName} ({player.position})
                </option>
              ))}
            </select>
          </div>

          {/* Processing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Processing Information</p>
                <ul className="space-y-1 text-xs">
                  <li>• Claims process: {teamInfo && formatDate(teamInfo.nextProcessingDate)}</li>
                  {teamInfo?.waiverType === 'FAAB' && (
                    <li>• Highest bid wins (ties broken by priority)</li>
                  )}
                  <li>• You can cancel claims before processing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmitClaim}
              className="flex-1"
              variant="default"
              disabled={submitClaimMutation.isPending}
            >
              {submitClaimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
              {teamInfo?.waiverType === 'FAAB' && bidAmount > 0 && !submitClaimMutation.isPending && ` ($${bidAmount})`}
            </Button>
            <Button
              onClick={() => {
                setShowClaimModal(false);
                setSelectedPlayer(null);
                setDropPlayer(null);
                setBidAmount(0);
              }}
              className="flex-1"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
        </ModalContent>
      </Modal>

      {/* My Claims Modal */}
      <Modal
        open={showMyClaimsModal}
        onOpenChange={setShowMyClaimsModal}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>My Waiver Claims</ModalTitle>
          </ModalHeader>
          <div className="p-6 space-y-3">
          {myClaims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending waiver claims
            </div>
          ) : (
            myClaims.map((claim) => (
              <div key={claim.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">
                      {claim.player.displayName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {claim.player.position} - {claim.player.nflTeam}
                    </div>
                    {claim.dropPlayer && (
                      <div className="text-sm text-red-600 mt-1">
                        Drop: {claim.dropPlayer.displayName}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {teamInfo?.waiverType === 'FAAB' && (
                      <div className="text-lg font-bold text-cyan-600">
                        ${claim.faabAmount}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Priority: #{claim.priority}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-gray-500">
                    Processes: {formatDate(claim.processDate)}
                  </div>
                  <Button
                    onClick={() => handleCancelClaim(claim.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    disabled={cancelClaimMutation.isPending}
                  >
                    {cancelClaimMutation.isPending ? 'Cancelling...' : 'Cancel'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        </ModalContent>
      </Modal>
    </div>
  );
}