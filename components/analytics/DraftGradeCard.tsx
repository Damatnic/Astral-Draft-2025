


import React from 'react';
import type { Team, DraftGrade, League } from '../../types';
import { generateDraftGrade } from '../../services/geminiService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DraftGradeCardProps {
    team: Team;
    league: League;
}

const gradeColor = (grade: string) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'text-green-400 border-green-400/50';
    if (['B+', 'B', 'B-'].includes(grade)) return 'text-yellow-400 border-yellow-400/50';
    return 'text-red-400 border-red-400/50';
}

const DraftGradeCard: React.FC<DraftGradeCardProps> = ({ team, league }) => {
    const [grade, setGrade] = React.useState<DraftGrade | null>(team.draftGrade || null);
    const [isLoading, setIsLoading] = React.useState(!team.draftGrade);

    React.useEffect(() => {
        // Only fetch if no grade exists. A real app might save this to state.
        if (!team.draftGrade) {
            setIsLoading(true);
            generateDraftGrade(team, league)
                .then(fetchedGrade => {
                    if (fetchedGrade) {
                        setGrade(fetchedGrade);
                    }
                })
                .finally(() => setIsLoading(false));
        }
    }, [team, league]);

    if (isLoading) {
        return (
            <div className="glass-pane p-4 rounded-xl flex items-center justify-center h-full">
                <LoadingSpinner size="sm" text="Grading..." />
            </div>
        );
    }

    if (!grade) {
        return (
            <div className="glass-pane p-4 rounded-xl flex flex-col gap-3 text-center text-red-400">
                <p>Could not load draft grade.</p>
            </div>
        );
    }
    

    return (
        <div className="glass-pane p-4 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold text-white">{team.name}</p>
                    <p className="text-xs text-gray-400">{team.owner.name}</p>
                </div>
                <div className={`w-16 h-16 flex items-center justify-center rounded-full border-2 ${gradeColor(grade.overall)}`}>
                    <span className="text-3xl font-bold font-display">{grade.overall}</span>
                </div>
            </div>
            <p className="text-xs italic text-gray-300">"{grade.narrative}"</p>
            <div className="text-xs space-y-1">
                <p><strong>Best Value:</strong> {grade.bestPick.name} ({grade.bestPick.position})</p>
                <p><strong>Biggest Reach:</strong> {grade.biggestReach.name} ({grade.biggestReach.position})</p>
            </div>
        </div>
    );
};

export default DraftGradeCard;