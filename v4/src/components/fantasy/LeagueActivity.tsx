import { useState, useEffect } from 'react';
import { 
  Activity, TrendingUp, ArrowRightLeft, UserPlus, 
  Trophy, Shield, MessageCircle, Settings, Award,
  Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'TRADE' | 'WAIVER' | 'ROSTER_MOVE' | 'ADMIN' | 'ACHIEVEMENT' | 'MESSAGE';
  title: string;
  description: string;
  timestamp: Date;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  metadata?: {
    tradeId?: string;
    playerId?: string;
    teamId?: string;
    oldValue?: any;
    newValue?: any;
  };
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  isRead?: boolean;
}

interface LeagueActivityProps {
  leagueId: string;
}

export function LeagueActivity({ leagueId }: LeagueActivityProps) {
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);

  // Use the proper useQuery hook for fetching activities
  const { data, isLoading, error } = api.league.getActivity.useQuery({
    leagueId,
    filter: filter !== 'ALL' ? filter : undefined,
    page,
    limit: 20
  });
  
  // Update activities when data changes
  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllActivities(data.items || []);
      } else {
        setAllActivities(prev => [...prev, ...(data.items || [])]);
      }
    }
  }, [data, page]);

  // Reset page when filter changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1);
    setAllActivities([]); // Clear activities when filter changes
  };

  // Handle loading more activities
  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const activities = allActivities;
  const loading = isLoading;
  const hasMore = data?.hasMore ?? false;

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'TRADE':
        return ArrowRightLeft;
      case 'WAIVER':
        return TrendingUp;
      case 'ROSTER_MOVE':
        return UserPlus;
      case 'ADMIN':
        return Settings;
      case 'ACHIEVEMENT':
        return Award;
      case 'MESSAGE':
        return MessageCircle;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'TRADE':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'WAIVER':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'ROSTER_MOVE':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'ADMIN':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'ACHIEVEMENT':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'MESSAGE':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const filters = [
    { id: 'ALL', label: 'All Activity' },
    { id: 'TRADE', label: 'Trades' },
    { id: 'WAIVER', label: 'Waivers' },
    { id: 'ROSTER_MOVE', label: 'Roster Moves' },
    { id: 'ADMIN', label: 'Admin Actions' },
    { id: 'ACHIEVEMENT', label: 'Achievements' },
  ];

  // Mock data for demonstration
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'TRADE',
      title: 'Trade Completed',
      description: 'Josh Allen traded from Team Alpha to Team Beta for Justin Jefferson',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      user: { id: '1', username: 'john_doe', avatar: undefined },
      priority: 'HIGH',
      isRead: false
    },
    {
      id: '2',
      type: 'WAIVER',
      title: 'Waiver Claim Processed',
      description: 'Team Gamma claimed Rachaad White, dropped James Conner',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      user: { id: '2', username: 'jane_smith' },
      priority: 'MEDIUM'
    },
    {
      id: '3',
      type: 'ACHIEVEMENT',
      title: 'Achievement Unlocked',
      description: 'Team Delta earned "High Scorer" badge with 185.3 points',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      user: { id: '3', username: 'mike_jones' },
      priority: 'LOW'
    },
    {
      id: '4',
      type: 'ADMIN',
      title: 'League Settings Updated',
      description: 'Trade deadline extended to Week 12',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      user: { id: '4', username: 'commissioner' },
      priority: 'HIGH'
    },
    {
      id: '5',
      type: 'ROSTER_MOVE',
      title: 'Lineup Change',
      description: 'Team Echo moved CeeDee Lamb from bench to starting WR',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      user: { id: '5', username: 'sarah_wilson' },
      priority: 'LOW'
    }
  ];

  // Show mock data only if there are no real activities and not loading
  const displayActivities = activities.length > 0 ? activities : (!loading && !error ? mockActivities : []);

  // Handle error state
  if (error) {
    console.error('Failed to fetch activities:', error);
  }

  const ActivityCard = ({ activity }: { activity: ActivityItem }) => {
    const Icon = getActivityIcon(activity.type);
    const colorClass = getActivityColor(activity.type);
    
    return (
      <Card className={cn(
        "p-4 transition-all hover:shadow-md",
        !activity.isRead && "border-l-4 border-blue-500"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-2 rounded-lg",
            colorClass
          )}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </h4>
                {activity.priority === 'HIGH' && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    High Priority
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {activity.description}
            </p>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {activity.user.avatar ? (
                  <img 
                    src={activity.user.avatar}
                    alt={activity.user.username}
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                )}
                <span className="text-xs text-gray-500">
                  @{activity.user.username}
                </span>
              </div>
              
              {activity.metadata?.tradeId && (
                <button className="text-xs text-blue-600 hover:underline">
                  View Trade Details
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {filters.map(filterOption => (
          <button
            key={filterOption.id}
            onClick={() => handleFilterChange(filterOption.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors",
              filter === filterOption.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            )}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      {error ? (
        <Card className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Failed to load activities
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please try refreshing the page or check your connection.
          </p>
        </Card>
      ) : loading && page === 1 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : displayActivities.length > 0 ? (
        <div className="space-y-4">
          {displayActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
          
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No activity yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            League activity will appear here as it happens
          </p>
        </Card>
      )}

      {/* Activity Summary Stats */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Activity Summary (Last 7 Days)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Trades</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">28</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Waiver Claims</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">45</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Roster Moves</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">156</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Messages</p>
          </div>
        </div>
      </Card>
    </div>
  );
}