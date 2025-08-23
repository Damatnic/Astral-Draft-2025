
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import type { League, User } from '../../types';
import { Widget } from '../ui/Widget';
import { UserIcon } from '../icons/UserIcon';
import { Avatar } from '../ui/Avatar';

interface MemberManagementWidgetProps {
    league: League;
    dispatch: React.Dispatch<any>;
}

const MemberManagementWidget: React.FC<MemberManagementWidgetProps> = ({ league, dispatch }) => {
    
    const handleKick = (user: User) => {
        if (window.confirm(`Are you sure you want to remove ${user.name} from the league? This action is permanent.`)) {
            dispatch({ type: 'KICK_MEMBER', payload: { leagueId: league.id, userId: user.id } });
        }
    };
    
    const handleTransfer = (user: User) => {
        if (window.confirm(`Are you sure you want to transfer commissionership to ${user.name}? You will lose commissioner powers.`)) {
            dispatch({ type: 'TRANSFER_COMMISSIONER', payload: { leagueId: league.id, newCommissionerId: user.id } });
        }
    };

    return (
        <Widget title="Member Management">
            <div className="p-4 space-y-2">
                {league.members.map((member: any) => (
                    <div key={member.id} className="p-2 bg-white/5 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Avatar avatar={member.avatar} className="w-8 h-8 rounded-md" />
                            <div>
                                <p className="font-semibold text-sm">{member.name}</p>
                                <p className="text-xs text-gray-400">{member.isCommissioner ? 'Commissioner' : 'Member'}</p>
                            </div>
                        </div>
                        {!member.isCommissioner && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleTransfer(member)}
                                    className="px-2 py-1 text-xs font-bold bg-yellow-500/10 text-yellow-300 rounded-md hover:bg-yellow-500/20"
                                >
                                    Make Commish
                                </button>
                                <button
                                    onClick={() => handleKick(member)}
                                    className="px-2 py-1 text-xs font-bold bg-red-500/10 text-red-300 rounded-md hover:bg-red-500/20"
                                >
                                    Kick
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Widget>
    );
};

export default MemberManagementWidget;
