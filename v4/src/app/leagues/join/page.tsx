'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Trophy, Lock, Unlock, Star, TrendingUp, Calendar, DollarSign, Hash, Filter, Globe } from 'lucide-react'

interface PublicLeague {
  id: string
  name: string
  commissioner: string
  format: string
  scoring: string
  teams: number
  spotsAvailable: number
  entryFee: number
  prizePool: number
  draftDate: string
  draftType: string
  skillLevel: 'beginner' | 'intermediate' | 'expert'
  isVerified: boolean
}

const mockPublicLeagues: PublicLeague[] = [
  {
    id: '1',
    name: 'Champions League 2024',
    commissioner: 'John Smith',
    format: 'PPR',
    scoring: 'Full PPR',
    teams: 12,
    spotsAvailable: 3,
    entryFee: 50,
    prizePool: 600,
    draftDate: '2024-09-01',
    draftType: 'Snake',
    skillLevel: 'expert',
    isVerified: true
  },
  {
    id: '2',
    name: 'Rookie League - Beginners Welcome',
    commissioner: 'Sarah Johnson',
    format: 'Standard',
    scoring: 'Standard',
    teams: 10,
    spotsAvailable: 5,
    entryFee: 0,
    prizePool: 0,
    draftDate: '2024-08-28',
    draftType: 'Snake',
    skillLevel: 'beginner',
    isVerified: false
  },
  {
    id: '3',
    name: 'Dynasty Builders',
    commissioner: 'Mike Wilson',
    format: 'Dynasty',
    scoring: 'Half PPR',
    teams: 14,
    spotsAvailable: 1,
    entryFee: 100,
    prizePool: 1400,
    draftDate: '2024-08-25',
    draftType: 'Auction',
    skillLevel: 'expert',
    isVerified: true
  },
  {
    id: '4',
    name: 'Casual Friday League',
    commissioner: 'Emily Davis',
    format: 'PPR',
    scoring: 'Full PPR',
    teams: 8,
    spotsAvailable: 2,
    entryFee: 25,
    prizePool: 200,
    draftDate: '2024-09-05',
    draftType: 'Snake',
    skillLevel: 'intermediate',
    isVerified: false
  },
  {
    id: '5',
    name: 'High Stakes Championship',
    commissioner: 'Robert Chen',
    format: 'Standard',
    scoring: 'Standard',
    teams: 12,
    spotsAvailable: 4,
    entryFee: 250,
    prizePool: 3000,
    draftDate: '2024-08-30',
    draftType: 'Auction',
    skillLevel: 'expert',
    isVerified: true
  }
]

export default function JoinLeaguePage() {
  const router = useRouter()
  const [leagueCode, setLeagueCode] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFormat, setFilterFormat] = useState('all')
  const [filterSkill, setFilterSkill] = useState('all')
  const [filterFee, setFilterFee] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const handleJoinWithCode = () => {
    if (leagueCode) {
      router.push(`/leagues/${leagueCode}`)
    }
  }

  const handleJoinPublicLeague = (leagueId: string) => {
    router.push(`/leagues/${leagueId}`)
  }

  const filteredLeagues = mockPublicLeagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         league.commissioner.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFormat = filterFormat === 'all' || league.format.toLowerCase() === filterFormat
    const matchesSkill = filterSkill === 'all' || league.skillLevel === filterSkill
    const matchesFee = filterFee === 'all' ||
                      (filterFee === 'free' && league.entryFee === 0) ||
                      (filterFee === 'paid' && league.entryFee > 0) ||
                      (filterFee === 'high' && league.entryFee >= 100)
    
    return matchesSearch && matchesFormat && matchesSkill && matchesFee
  })

  const getSkillBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Join a League</h1>
          <p className="text-gray-600">Enter a league code or browse public leagues</p>
        </div>

        {/* Join with Code Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 md:p-8 mb-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">Have a League Code?</h2>
            <p className="mb-4 opacity-90">Enter the code provided by your league commissioner</p>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter league code..."
                  value={leagueCode}
                  onChange={(e) => setLeagueCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <button
                onClick={handleJoinWithCode}
                disabled={!leagueCode}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  leagueCode
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-white/30 text-white/70 cursor-not-allowed'
                }`}
              >
                Join League
              </button>
            </div>
          </div>
        </div>

        {/* Public Leagues Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-600" />
                Browse Public Leagues
              </h2>
              <p className="text-gray-600 mt-1">Find and join leagues that match your skill level</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Active</span>}
            </button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search leagues by name or commissioner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <select
                    value={filterFormat}
                    onChange={(e) => setFilterFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Formats</option>
                    <option value="standard">Standard</option>
                    <option value="ppr">PPR</option>
                    <option value="dynasty">Dynasty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                  <select
                    value={filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entry Fee</label>
                  <select
                    value={filterFee}
                    onChange={(e) => setFilterFee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Any</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="high">$100+</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* League Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeagues.map((league) => (
              <div key={league.id} className="border border-gray-200 rounded-lg hover:shadow-lg transition-all">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        {league.name}
                        {league.isVerified && (
                          <span className="text-blue-600" title="Verified League">
                            <Star className="w-4 h-4 fill-current" />
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">by {league.commissioner}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Format:</span>
                      <span className="font-medium">{league.format}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Teams:</span>
                      <span className="font-medium">
                        {league.teams - league.spotsAvailable}/{league.teams}
                        <span className="text-green-600 ml-1">({league.spotsAvailable} spots)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Draft:</span>
                      <span className="font-medium">
                        {new Date(league.draftDate).toLocaleDateString()} - {league.draftType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Entry:</span>
                      <span className="font-medium">
                        {league.entryFee === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          <span>${league.entryFee}</span>
                        )}
                      </span>
                    </div>
                    {league.prizePool > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Prize Pool:</span>
                        <span className="font-bold text-green-600">${league.prizePool}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSkillBadgeColor(league.skillLevel)}`}>
                      {league.skillLevel.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {league.scoring}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleJoinPublicLeague(league.id)}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Join League
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredLeagues.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leagues found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}