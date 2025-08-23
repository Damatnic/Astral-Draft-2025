'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { nflPlayers, nflTeams, type NFLPlayer } from '@/data/nfl-players';

type Position = 'ALL' | NFLPlayer['position'];
type SortField = 'rank' | 'adp' | 'projectedPoints' | 'fantasyPPG' | 'displayName';
type SortOrder = 'asc' | 'desc';

export default function PlayersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<Position>('ALL');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load watchlist from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('playerWatchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('playerWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = [...nflPlayers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player =>
        player.displayName.toLowerCase().includes(query) ||
        player.nflTeam.toLowerCase().includes(query) ||
        player.college?.toLowerCase().includes(query)
      );
    }

    // Position filter
    if (selectedPosition !== 'ALL') {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }

    // Team filter
    if (selectedTeam !== 'ALL') {
      filtered = filtered.filter(player => player.nflTeam === selectedTeam);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof NFLPlayer];
      let bVal: any = b[sortField as keyof NFLPlayer];

      // Special handling for stats
      if (sortField === 'fantasyPPG') {
        aVal = a.stats2023.fantasyPPG;
        bVal = b.stats2023.fantasyPPG;
      }

      // Handle string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [searchQuery, selectedPosition, selectedTeam, sortField, sortOrder]);

  const toggleWatchlist = (playerId: string) => {
    setWatchlist(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status: NFLPlayer['status']) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'INJURED': return 'text-red-600 bg-red-50';
      case 'IR': return 'text-red-700 bg-red-100';
      case 'OUT': return 'text-red-800 bg-red-100';
      case 'QUESTIONABLE': return 'text-yellow-600 bg-yellow-50';
      case 'DOUBTFUL': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPositionColor = (position: NFLPlayer['position']) => {
    switch (position) {
      case 'QB': return 'bg-red-500';
      case 'RB': return 'bg-green-500';
      case 'WR': return 'bg-blue-500';
      case 'TE': return 'bg-orange-500';
      case 'K': return 'bg-purple-500';
      case 'DEF': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">NFL Players Database</h1>
          <p className="text-gray-600 mt-2">Browse and research all NFL players with real-time stats and projections</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search players, teams, or colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Position Filter */}
            <div>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value as Position)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Positions</option>
                <option value="QB">Quarterbacks</option>
                <option value="RB">Running Backs</option>
                <option value="WR">Wide Receivers</option>
                <option value="TE">Tight Ends</option>
                <option value="K">Kickers</option>
                <option value="DEF">Defense</option>
              </select>
            </div>

            {/* Team Filter */}
            <div>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Teams</option>
                {nflTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort Options and View Toggle */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <div className="flex gap-1">
                {[
                  { field: 'rank' as SortField, label: 'Rank' },
                  { field: 'adp' as SortField, label: 'ADP' },
                  { field: 'projectedPoints' as SortField, label: 'Projected' },
                  { field: 'fantasyPPG' as SortField, label: 'PPG' },
                  { field: 'displayName' as SortField, label: 'Name' }
                ].map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      sortField === field
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                    {sortField === field && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                title="List View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredPlayers.length} of {nflPlayers.length} players
            {watchlist.length > 0 && ` • ${watchlist.length} in watchlist`}
          </div>
        </div>

        {/* Players Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map(player => (
              <div
                key={player.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => router.push(`/players/${player.id}`)}
              >
                {/* Player Card Header */}
                <div className="relative p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full ${getPositionColor(player.position)} flex items-center justify-center text-white font-bold`}>
                        {player.position}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{player.displayName}</h3>
                        <p className="text-sm text-gray-600">{player.nflTeam}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(player.id);
                      }}
                      className="p-1 hover:bg-white rounded-md transition-colors"
                    >
                      <svg className={`w-5 h-5 ${watchlist.includes(player.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}>
                      {player.status}
                      {player.injuryStatus && ` - ${player.injuryStatus}`}
                    </span>
                  </div>
                </div>

                {/* Player Stats */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Rank</p>
                      <p className="font-semibold">#{player.rank}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ADP</p>
                      <p className="font-semibold">{player.adp.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Proj Points</p>
                      <p className="font-semibold">{player.projectedPoints.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">2023 PPG</p>
                      <p className="font-semibold">{player.stats2023.fantasyPPG.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Position-specific stats */}
                  <div className="pt-2 border-t border-gray-100">
                    {player.position === 'QB' && (
                      <p className="text-xs text-gray-600">
                        {player.stats2023.passYards} Pass Yds • {player.stats2023.passTds} TDs
                      </p>
                    )}
                    {player.position === 'RB' && (
                      <p className="text-xs text-gray-600">
                        {player.stats2023.rushYards} Rush • {player.stats2023.receptions} Rec • {player.stats2023.rushTds! + (player.stats2023.recTds || 0)} TDs
                      </p>
                    )}
                    {(player.position === 'WR' || player.position === 'TE') && (
                      <p className="text-xs text-gray-600">
                        {player.stats2023.receptions} Rec • {player.stats2023.recYards} Yds • {player.stats2023.recTds} TDs
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ADP</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Proj</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PPG</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlayers.map(player => (
                  <tr
                    key={player.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/players/${player.id}`)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{player.displayName}</div>
                        <div className="text-xs text-gray-500">#{player.jerseyNumber} • {player.height} • {player.weight} lbs</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-white ${getPositionColor(player.position)}`}>
                        {player.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{player.nflTeam}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}>
                        {player.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-gray-900">#{player.rank}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{player.adp.toFixed(1)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{player.projectedPoints.toFixed(1)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">{player.stats2023.fantasyPPG.toFixed(1)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(player.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className={`w-5 h-5 ${watchlist.includes(player.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}