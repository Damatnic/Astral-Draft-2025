'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell,
  Check,
  CheckCheck,
  Filter,
  Trash2,
  Settings,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Trophy,
  Mail,
  MessageSquare,
  DollarSign,
  Calendar,
  Shield,
  Zap,
  ChevronDown
} from 'lucide-react';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread' | 'trade' | 'waiver' | 'league' | 'system'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const { 
    data: notificationsData, 
    isLoading, 
    refetch 
  } = api.notification.getMyNotifications.useQuery(
    { filter, limit: 50, offset: 0 },
    { enabled: !!session?.user?.id }
  );

  const { data: unreadCount } = api.notification.getUnreadCount.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  );

  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteNotification = api.notification.deleteNotification.useMutation({
    onSuccess: () => refetch(),
  });

  if (!session) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    if (type.includes('trade')) return <TrendingUp className="w-5 h-5 text-blue-500" />;
    if (type.includes('waiver')) return <FileText className="w-5 h-5 text-purple-500" />;
    if (type.includes('league')) return <Users className="w-5 h-5 text-green-500" />;
    if (type.includes('message')) return <MessageSquare className="w-5 h-5 text-yellow-500" />;
    if (type.includes('score')) return <Trophy className="w-5 h-5 text-orange-500" />;
    if (type.includes('injury')) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (type.includes('draft')) return <Calendar className="w-5 h-5 text-indigo-500" />;
    if (type.includes('payment')) return <DollarSign className="w-5 h-5 text-green-500" />;
    if (type.includes('achievement')) return <Shield className="w-5 h-5 text-yellow-500" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('trade')) return 'border-l-blue-500';
    if (type.includes('waiver')) return 'border-l-purple-500';
    if (type.includes('league')) return 'border-l-green-500';
    if (type.includes('message')) return 'border-l-yellow-500';
    if (type.includes('score')) return 'border-l-orange-500';
    if (type.includes('injury')) return 'border-l-red-500';
    if (type.includes('draft')) return 'border-l-indigo-500';
    if (type.includes('payment')) return 'border-l-green-500';
    if (type.includes('achievement')) return 'border-l-yellow-500';
    return 'border-l-gray-500';
  };

  const filterOptions = [
    { value: 'all', label: 'All Notifications', count: notificationsData?.total },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'trade', label: 'Trades', icon: TrendingUp },
    { value: 'waiver', label: 'Waivers', icon: FileText },
    { value: 'league', label: 'League', icon: Users },
    { value: 'system', label: 'System', icon: Settings },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-gray-400">
            {unreadCount ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            disabled={!unreadCount || markAllAsRead.isPending}
            className="border-gray-600"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Link href="/settings">
            <Button variant="outline" className="border-gray-600">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-0">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as any)}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      filter === option.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="ml-2 px-2 py-0.5 bg-black/30 rounded-full text-xs">
                        {option.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {notificationsData?.notifications && notificationsData.notifications.length > 0 ? (
        <div className="space-y-3">
          {notificationsData.notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`bg-gray-800 border-gray-700 border-l-4 transition-all hover:bg-gray-750 ${
                getNotificationColor(notification.type)
              } ${!notification.isRead ? 'ring-1 ring-green-500/30' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          notification.isRead ? 'text-gray-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead.mutate({ notificationId: notification.id })}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification.mutate({ notificationId: notification.id })}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {notification.action && (
                      <Link href={notification.action.url}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 border-gray-600"
                        >
                          {notification.action.label}
                          <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {notificationsData.hasMore && (
            <div className="text-center py-4">
              <Button variant="outline" className="border-gray-600">
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "You're all caught up! Check back later for updates."
                : `No ${filter} notifications found.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">
                  {notificationsData?.total || 0}
                </p>
              </div>
              <Bell className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unread</p>
                <p className="text-2xl font-bold text-white">
                  {unreadCount || 0}
                </p>
              </div>
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">This Week</p>
                <p className="text-2xl font-bold text-white">
                  {notificationsData?.notifications?.filter(n => {
                    const date = new Date(n.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return date > weekAgo;
                  }).length || 0}
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}