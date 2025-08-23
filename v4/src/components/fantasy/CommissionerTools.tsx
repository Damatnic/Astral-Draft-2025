import { useState } from 'react';
import { 
  Shield, UserPlus, UserMinus, Gavel, Award, 
  AlertTriangle, CheckCircle, XCircle, Edit,
  RefreshCw, Lock, Unlock, Settings
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CommissionerToolsProps {
  leagueId: string;
}

interface PendingAction {
  id: string;
  type: 'TRADE' | 'WAIVER' | 'ROSTER_EDIT';
  description: string;
  requestedBy: string;
  timestamp: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function CommissionerTools({ leagueId }: CommissionerToolsProps) {
  const [activeTab, setActiveTab] = useState('members');
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PendingAction | null>(null);

  const tabs = [
    { id: 'members', label: 'Member Management', icon: UserPlus },
    { id: 'approvals', label: 'Pending Approvals', icon: CheckCircle },
    { id: 'powers', label: 'Commissioner Powers', icon: Gavel },
    { id: 'history', label: 'Action History', icon: RefreshCw },
  ];

  // Mock pending actions
  const mockPendingActions: PendingAction[] = [
    {
      id: '1',
      type: 'TRADE',
      description: 'Josh Allen + 2024 3rd for Justin Jefferson',
      requestedBy: 'Team Alpha',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'PENDING'
    },
    {
      id: '2',
      type: 'WAIVER',
      description: 'Claim Rachaad White, Drop James Conner',
      requestedBy: 'Team Beta',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'PENDING'
    }
  ];

  // Mutations
  const approveActionMutation = api.league.approveAction.useMutation({
    onSuccess: (data, variables) => {
      setPendingActions(prev => 
        prev.map(a => a.id === variables.actionId ? { ...a, status: 'APPROVED' } : a)
      );
    },
    onError: (error) => {
      console.error('Failed to approve action:', error);
    },
  });

  const rejectActionMutation = api.league.rejectAction.useMutation({
    onSuccess: (data, variables) => {
      setPendingActions(prev => 
        prev.map(a => a.id === variables.actionId ? { ...a, status: 'REJECTED' } : a)
      );
    },
    onError: (error) => {
      console.error('Failed to reject action:', error);
    },
  });

  const handleApproveAction = async (actionId: string) => {
    approveActionMutation.mutate({ leagueId, actionId });
  };

  const handleRejectAction = async (actionId: string) => {
    rejectActionMutation.mutate({ leagueId, actionId });
  };

  const MemberManagement = () => {
    const [members, setMembers] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');

    // Member management mutations
    const inviteMemberMutation = api.league.inviteMember.useMutation({
      onSuccess: () => {
        setInviteEmail('');
        setShowInviteModal(false);
      },
      onError: (error) => {
        console.error('Failed to invite member:', error);
      },
    });

    const removeMemberMutation = api.league.removeMember.useMutation({
      onSuccess: (data, variables) => {
        setMembers(prev => prev.filter(m => m.id !== variables.memberId));
      },
      onError: (error) => {
        console.error('Failed to remove member:', error);
      },
    });

    const updateMemberRoleMutation = api.league.updateMemberRole.useMutation({
      onError: (error) => {
        console.error('Failed to promote member:', error);
      },
    });

    const handleInvite = async () => {
      inviteMemberMutation.mutate({ 
        leagueId, 
        email: inviteEmail 
      });
    };

    const handleRemoveMember = async (memberId: string) => {
      if (!confirm('Are you sure you want to remove this member?')) return;
      
      removeMemberMutation.mutate({ leagueId, memberId });
    };

    const handlePromoteToCommissioner = async (memberId: string) => {
      updateMemberRoleMutation.mutate({ 
        leagueId, 
        memberId,
        role: 'COMMISSIONER'
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">League Members</h3>
          <Button
            onClick={() => setShowInviteModal(true)}
            variant="default"
            size="sm"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <div className="space-y-2">
          {/* Mock members for demonstration */}
          {[
            { id: '1', username: 'john_doe', email: 'john@example.com', role: 'COMMISSIONER', teamName: 'Team Alpha' },
            { id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'MEMBER', teamName: 'Team Beta' },
            { id: '3', username: 'mike_jones', email: 'mike@example.com', role: 'MEMBER', teamName: 'Team Gamma' },
          ].map(member => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {member.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.username}</p>
                      {member.role === 'COMMISSIONER' && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Commissioner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <p className="text-xs text-gray-400">{member.teamName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {member.role !== 'COMMISSIONER' && (
                    <>
                      <button
                        onClick={() => handlePromoteToCommissioner(member.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        title="Promote to Commissioner"
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
                        title="Remove Member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <Modal open={showInviteModal} onOpenChange={setShowInviteModal}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Invite New Member</ModalTitle>
              </ModalHeader>
              <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowInviteModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  variant="default"
                  disabled={!inviteEmail || inviteMemberMutation.isPending}
                >
                  {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </div>
            </ModalContent>
          </Modal>
        )}
      </div>
    );
  };

  const PendingApprovals = () => {
    const displayActions = pendingActions.length > 0 ? pendingActions : mockPendingActions;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
        
        {displayActions.filter(a => a.status === 'PENDING').length > 0 ? (
          <div className="space-y-3">
            {displayActions.filter(a => a.status === 'PENDING').map(action => (
              <Card key={action.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {action.type === 'TRADE' && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Trade
                        </span>
                      )}
                      {action.type === 'WAIVER' && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Waiver
                        </span>
                      )}
                      {action.type === 'ROSTER_EDIT' && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          Roster Edit
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {action.description}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Requested by {action.requestedBy}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleApproveAction(action.id)}
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      disabled={approveActionMutation.isPending || rejectActionMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleRejectAction(action.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={approveActionMutation.isPending || rejectActionMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No pending approvals at this time
            </p>
          </Card>
        )}
      </div>
    );
  };

  const CommissionerPowers = () => {
    const powers = [
      { id: 'edit_rosters', label: 'Edit Team Rosters', icon: Edit, dangerous: false },
      { id: 'force_trade', label: 'Force Trade', icon: RefreshCw, dangerous: true },
      { id: 'lock_team', label: 'Lock/Unlock Team', icon: Lock, dangerous: false },
      { id: 'adjust_scoring', label: 'Adjust Scoring', icon: Award, dangerous: true },
      { id: 'reset_waiver', label: 'Reset Waiver Order', icon: RefreshCw, dangerous: true },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Use these powers responsibly. All actions are logged and visible to league members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {powers.map(power => {
            const Icon = power.icon;
            return (
              <Card
                key={power.id}
                className={cn(
                  "p-4 cursor-pointer hover:shadow-md transition-all",
                  power.dangerous && "border-orange-200 dark:border-orange-900"
                )}
                onClick={() => setShowPowerModal(true)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    power.dangerous 
                      ? "bg-orange-100 dark:bg-orange-900/20 text-orange-600"
                      : "bg-blue-100 dark:bg-blue-900/20 text-blue-600"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{power.label}</p>
                    {power.dangerous && (
                      <p className="text-xs text-orange-600">Requires confirmation</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const ActionHistory = () => {
    const history = [
      { id: '1', action: 'Approved trade', user: 'john_doe', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      { id: '2', action: 'Removed member', user: 'john_doe', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) },
      { id: '3', action: 'Updated settings', user: 'john_doe', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72) },
    ];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Recent Commissioner Actions</h3>
        
        <div className="space-y-2">
          {history.map(item => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-gray-500">by @{item.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Commissioner Tools</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'members' && <MemberManagement />}
        {activeTab === 'approvals' && <PendingApprovals />}
        {activeTab === 'powers' && <CommissionerPowers />}
        {activeTab === 'history' && <ActionHistory />}
      </div>
    </Card>
  );
}