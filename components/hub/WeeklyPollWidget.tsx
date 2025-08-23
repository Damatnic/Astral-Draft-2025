
import React from 'react';
import { useAppState } from '../../contexts/AppContext';
import { useLeague } from '../../hooks/useLeague';
import { Widget } from '../ui/Widget';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';

const WeeklyPollWidget: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    
    if (!league) return null;

    const poll = (state.leaguePolls[league.id] || [])[0];
    const myVote = poll?.options.find((opt: any) => opt.votes.includes(state.user.id))?.id;
    const totalVotes = poll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0;

    const handleVote = (optionId: string) => {
        if (!poll) return;
        dispatch({
            type: 'SUBMIT_POLL_VOTE',
            payload: { leagueId: league.id, pollId: poll.id, optionId },
        });
    };

    if (!poll) {
        return (
            <Widget title="Weekly Poll" icon={<ClipboardListIcon />}>
                <div className="p-4 text-center text-sm text-gray-400">
                    No active poll. The commissioner can create one.
                </div>
            </Widget>
        );
    }

    return (
        <Widget title="Weekly Poll" icon={<ClipboardListIcon />}>
            <div className="p-3">
                <p className="font-semibold text-sm mb-2">{poll.question}</p>
                <div className="space-y-2">
                    {poll.options.map((option: any) => {
                        const isMyVote = myVote === option.id;
                        const voteCount = option.votes.length;
                        const votePercentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                        return myVote ? (
                            <div key={option.id} className={`p-2 rounded-md ${isMyVote ? 'bg-cyan-500/20' : 'bg-black/10'}`}>
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span>{option.text}</span>
                                    <span>{votePercentage.toFixed(0)}% ({voteCount})</span>
                                </div>
                                <div className="w-full bg-black/20 h-1.5 rounded-full mt-1">
                                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${votePercentage}%` }} />
                                </div>
                            </div>
                        ) : (
                            <button
                                key={option.id}
                                onClick={() => handleVote(option.id)}
                                className="w-full text-left p-2 rounded-md bg-black/10 hover:bg-black/20 text-sm font-semibold"
                            >
                                {option.text}
                            </button>
                        );
                    })}
                </div>
            </div>
        </Widget>
    );
};

export default WeeklyPollWidget;
