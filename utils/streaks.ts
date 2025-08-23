
import type { Matchup } from '../types';

export const calculateStreak = (teamId: number, schedule: Matchup[], currentWeek: number) => {
    const pastGames = schedule
        .filter(m => m.week < currentWeek && (m.teamA.teamId === teamId || m.teamB.teamId === teamId))
        .sort((a, b) => b.week - a.week);

    if (pastGames.length === 0) {
        return null;
    }

    let streakType: 'W' | 'L' | 'T' | null = null;
    let streakCount = 0;

    for (const game of pastGames) {
        const myTeamResult = game.teamA.teamId === teamId ? game.teamA : game.teamB;
        const opponentResult = game.teamA.teamId === teamId ? game.teamB : game.teamA;
        
        let result: 'W' | 'L' | 'T';
        if (myTeamResult.score > opponentResult.score) result = 'W';
        else if (myTeamResult.score < opponentResult.score) result = 'L';
        else result = 'T';

        if (streakType === null) {
            streakType = result;
            streakCount = 1;
        } else if (result === streakType) {
            streakCount++;
        } else {
            break; // Streak is broken
        }
    }

    if (streakType === 'T' || streakCount === 0) {
        return null;
    }

    return { type: streakType, count: streakCount };
};
