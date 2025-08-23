'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  User,
  Bell,
  Palette,
  Shield,
  Link2,
  CreditCard,
  Settings,
  Lock,
  Mail,
  Smartphone,
  Globe,
  Calendar,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronRight,
  Monitor,
  Moon,
  Sun,
  Zap,
  Trophy,
  Users,
  BarChart
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: settings, isLoading, refetch } = api.user.getSettings.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  );

  const updateSettings = api.user.updateSettings.useMutation({
    onSuccess: () => {
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      refetch();
    },
  });

  const [formData, setFormData] = useState<any>({});

  if (!session) {
    router.push('/login');
    return null;
  }

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const handleSave = async (category: string) => {
    setIsSaving(true);
    try {
      await updateSettings.mutateAsync({
        category: category as any,
        settings: formData[category] || {},
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (category: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const settingsTabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'fantasy', label: 'Fantasy', icon: Trophy },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'connected', label: 'Connected Accounts', icon: Link2 },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your account preferences and privacy settings</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center">
          <Check className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-500">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-green-600 text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{tab.label}</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === 'account' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account information and security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <Input
                    type="email"
                    value={settings.account.email || ''}
                    disabled
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <Input
                    value={settings.account.username || ''}
                    disabled
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <Input
                    value={formData.account?.name || settings.account.name || ''}
                    onChange={(e) => updateFormData('account', 'name', e.target.value)}
                    placeholder="Enter your display name"
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea
                    value={formData.account?.bio || settings.account.bio || ''}
                    onChange={(e) => updateFormData('account', 'bio', e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-4">Security</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">Password</p>
                          <p className="text-gray-400 text-sm">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Change</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">Two-Factor Authentication</p>
                          <p className="text-gray-400 text-sm">
                            {settings.account.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant={settings.account.twoFactorEnabled ? "outline" : "default"}
                        size="sm"
                      >
                        {settings.account.twoFactorEnabled ? 'Manage' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSave('account')}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Notifications
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(settings.notifications.email).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-850">
                        <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <input
                          type="checkbox"
                          checked={formData.notifications?.email?.[key] ?? value}
                          onChange={(e) => updateFormData('notifications', `email.${key}`, e.target.checked)}
                          className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Push Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Push Notifications
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(settings.notifications.push).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-850">
                        <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <input
                          type="checkbox"
                          checked={formData.notifications?.push?.[key] ?? value}
                          onChange={(e) => updateFormData('notifications', `push.${key}`, e.target.checked)}
                          className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* In-App Notifications */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    In-App Notifications
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(settings.notifications.inApp).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-850">
                        <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <input
                          type="checkbox"
                          checked={formData.notifications?.inApp?.[key] ?? value}
                          onChange={(e) => updateFormData('notifications', `inApp.${key}`, e.target.checked)}
                          className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Email Digest */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Email Digest</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                      <span className="text-gray-300">Enable Email Digest</span>
                      <input
                        type="checkbox"
                        checked={formData.notifications?.digest?.enabled ?? settings.notifications.digest.enabled}
                        onChange={(e) => updateFormData('notifications', 'digest.enabled', e.target.checked)}
                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                      />
                    </label>
                    
                    {(formData.notifications?.digest?.enabled ?? settings.notifications.digest.enabled) && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                          <select
                            value={formData.notifications?.digest?.frequency ?? settings.notifications.digest.frequency}
                            onChange={(e) => updateFormData('notifications', 'digest.frequency', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Send Time</label>
                          <Input
                            type="time"
                            value={formData.notifications?.digest?.time ?? settings.notifications.digest.time}
                            onChange={(e) => updateFormData('notifications', 'digest.time', e.target.value)}
                            className="bg-gray-900 border-gray-700"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={() => handleSave('notifications')}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'display' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>Customize your viewing experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => updateFormData('display', 'theme', theme.value)}
                          className={`p-4 bg-gray-900 rounded-lg border-2 transition-colors ${
                            (formData.display?.theme || settings.display.theme) === theme.value
                              ? 'border-green-500'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <Icon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-300">{theme.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                  <select
                    value={formData.display?.timezone || settings.display.timezone}
                    onChange={(e) => updateFormData('display', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                  <select
                    value={formData.display?.language || settings.display.language}
                    onChange={(e) => updateFormData('display', 'language', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
                  <select
                    value={formData.display?.dateFormat || settings.display.dateFormat}
                    onChange={(e) => updateFormData('display', 'dateFormat', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <span className="text-gray-300">Compact View</span>
                    <input
                      type="checkbox"
                      checked={formData.display?.compactView ?? settings.display.compactView}
                      onChange={(e) => updateFormData('display', 'compactView', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <span className="text-gray-300">Show Player Photos</span>
                    <input
                      type="checkbox"
                      checked={formData.display?.showPlayerPhotos ?? settings.display.showPlayerPhotos}
                      onChange={(e) => updateFormData('display', 'showPlayerPhotos', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <span className="text-gray-300">Color Blind Mode</span>
                    <input
                      type="checkbox"
                      checked={formData.display?.colorBlindMode ?? settings.display.colorBlindMode}
                      onChange={(e) => updateFormData('display', 'colorBlindMode', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <span className="text-gray-300">Enable Animations</span>
                    <input
                      type="checkbox"
                      checked={formData.display?.animations ?? settings.display.animations}
                      onChange={(e) => updateFormData('display', 'animations', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>
                </div>

                <Button 
                  onClick={() => handleSave('display')}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'fantasy' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Fantasy Settings</CardTitle>
                <CardDescription>Configure your default fantasy football preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Scoring Type</label>
                  <select
                    value={formData.fantasy?.defaultScoringType || settings.fantasy.defaultScoringType}
                    onChange={(e) => updateFormData('fantasy', 'defaultScoringType', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="ppr">PPR (Point Per Reception)</option>
                    <option value="half_ppr">Half PPR</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default Roster Size</label>
                  <Input
                    type="number"
                    min="8"
                    max="20"
                    value={formData.fantasy?.defaultRosterSize || settings.fantasy.defaultRosterSize}
                    onChange={(e) => updateFormData('fantasy', 'defaultRosterSize', parseInt(e.target.value))}
                    className="bg-gray-900 border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Default League Size</label>
                  <select
                    value={formData.fantasy?.defaultLeagueSize || settings.fantasy.defaultLeagueSize}
                    onChange={(e) => updateFormData('fantasy', 'defaultLeagueSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="8">8 Teams</option>
                    <option value="10">10 Teams</option>
                    <option value="12">12 Teams</option>
                    <option value="14">14 Teams</option>
                    <option value="16">16 Teams</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Auto-Set Optimal Lineup</p>
                      <p className="text-gray-500 text-sm">Automatically optimize your lineup before games</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.fantasy?.autoSetLineup ?? settings.fantasy.autoSetLineup}
                      onChange={(e) => updateFormData('fantasy', 'autoSetLineup', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Injury Alerts</p>
                      <p className="text-gray-500 text-sm">Get notified when your players are injured</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.fantasy?.injuryAlerts ?? settings.fantasy.injuryAlerts}
                      onChange={(e) => updateFormData('fantasy', 'injuryAlerts', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Trade Block Visible</p>
                      <p className="text-gray-500 text-sm">Show your players on the trade block to league members</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.fantasy?.tradeBlockVisible ?? settings.fantasy.tradeBlockVisible}
                      onChange={(e) => updateFormData('fantasy', 'tradeBlockVisible', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>
                </div>

                <Button 
                  onClick={() => handleSave('fantasy')}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy and data sharing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Profile Visibility</label>
                  <select
                    value={formData.privacy?.profileVisibility || settings.privacy.profileVisibility}
                    onChange={(e) => updateFormData('privacy', 'profileVisibility', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="public">Public - Anyone can view</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private - Only you</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Show Email Address</p>
                      <p className="text-gray-500 text-sm">Display your email on your profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.privacy?.showEmail ?? settings.privacy.showEmail}
                      onChange={(e) => updateFormData('privacy', 'showEmail', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Show Statistics</p>
                      <p className="text-gray-500 text-sm">Display your fantasy stats publicly</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.privacy?.showStats ?? settings.privacy.showStats}
                      onChange={(e) => updateFormData('privacy', 'showStats', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Show Teams</p>
                      <p className="text-gray-500 text-sm">Display your teams on your profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.privacy?.showTeams ?? settings.privacy.showTeams}
                      onChange={(e) => updateFormData('privacy', 'showTeams', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Allow Friend Requests</p>
                      <p className="text-gray-500 text-sm">Let other users send you friend requests</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.privacy?.allowFriendRequests ?? settings.privacy.allowFriendRequests}
                      onChange={(e) => updateFormData('privacy', 'allowFriendRequests', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Data Sharing</p>
                      <p className="text-gray-500 text-sm">Share anonymous data to improve the platform</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.privacy?.dataSharing ?? settings.privacy.dataSharing}
                      onChange={(e) => updateFormData('privacy', 'dataSharing', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-gray-300">Analytics</p>
                      <p className="text-gray-500 text-sm">Help us improve by sharing usage analytics</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.privacy?.analytics ?? settings.privacy.analytics}
                      onChange={(e) => updateFormData('privacy', 'analytics', e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                    />
                  </label>
                </div>

                <Button 
                  onClick={() => handleSave('privacy')}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'connected' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>Manage your connected social and fantasy accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.connected).map(([platform, data]) => (
                  <div key={platform} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        data.connected ? 'bg-green-500/20' : 'bg-gray-700'
                      }`}>
                        {platform === 'google' && <Globe className="w-5 h-5 text-gray-400" />}
                        {platform === 'facebook' && <Users className="w-5 h-5 text-gray-400" />}
                        {platform === 'twitter' && <Zap className="w-5 h-5 text-gray-400" />}
                        {platform === 'espn' && <Trophy className="w-5 h-5 text-gray-400" />}
                        {platform === 'yahoo' && <BarChart className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">{platform}</p>
                        <p className="text-gray-400 text-sm">
                          {data.connected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={data.connected ? "outline" : "default"}
                      size="sm"
                    >
                      {data.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'subscription' && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>Manage your subscription plan and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-green-900 to-blue-900 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white capitalize">
                        {settings.subscription.plan} Plan
                      </h3>
                      <p className="text-gray-300">
                        Status: <span className="capitalize">{settings.subscription.status}</span>
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${
                      settings.subscription.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {settings.subscription.status}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Included Features:</h4>
                    <ul className="space-y-1">
                      {settings.subscription.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-400 text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {settings.subscription.plan === 'free' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Upgrade Your Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
                        <h4 className="font-semibold text-white mb-2">Pro Plan</h4>
                        <p className="text-2xl font-bold text-white mb-3">$9.99<span className="text-sm text-gray-400">/month</span></p>
                        <ul className="space-y-1 text-sm text-gray-400 mb-4">
                          <li>• Unlimited leagues</li>
                          <li>• Advanced analytics</li>
                          <li>• Priority support</li>
                        </ul>
                        <Button className="w-full" size="sm">Upgrade to Pro</Button>
                      </div>
                      
                      <div className="p-4 bg-gray-900 rounded-lg border border-green-500">
                        <h4 className="font-semibold text-white mb-2">Premium Plan</h4>
                        <p className="text-2xl font-bold text-white mb-3">$19.99<span className="text-sm text-gray-400">/month</span></p>
                        <ul className="space-y-1 text-sm text-gray-400 mb-4">
                          <li>• Everything in Pro</li>
                          <li>• AI-powered insights</li>
                          <li>• Custom scoring</li>
                        </ul>
                        <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">Upgrade to Premium</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}