
import type { League } from '../types';

export interface TeamStats {
    teamId: number;
    teamName: string;
    avatar: string;
    totalPointsFor: number;
    totalPointsAgainst: number;
    highestWeek: { week: number, score: number };
    lowestWeek: { week: number, score: number };
}

export const calculateLeagueStats = (league: League) => {
    const stats: TeamStats[] = league.teams.map(team => {
        let totalPointsFor = 0;
        let totalPointsAgainst = 0;
        let highestWeek = { week: 0, score: 0 };
        let lowestWeek = { week: 0, score: Infinity };

        league.schedule.forEach(matchup => {
            if (matchup.week >= league.currentWeek) return;

            if (matchup.teamA.teamId === team.id) {
                totalPointsFor += matchup.teamA.score;
                totalPointsAgainst += matchup.teamB.score;
                if (matchup.teamA.score > highestWeek.score) {
                    highestWeek = { week: matchup.week, score: matchup.teamA.score };
                }
                if (matchup.teamA.score < lowestWeek.score) {
                    lowestWeek = { week: matchup.week, score: matchup.teamA.score };
                }
            } else if (matchup.teamB.teamId === team.id) {
                totalPointsFor += matchup.teamB.score;
                totalPointsAgainst += matchup.teamA.score;
                if (matchup.teamB.score > highestWeek.score) {
                    highestWeek = { week: matchup.week, score: matchup.teamB.score };
                }
                if (matchup.teamB.score < lowestWeek.score) {
                    lowestWeek = { week: matchup.week, score: matchup.teamB.score };
                }
            }
        });

        return {
            teamId: team.id,
            teamName: team.name,
            avatar: team.avatar,
            totalPointsFor,
            totalPointsAgainst,
            highestWeek,
            lowestWeek: lowestWeek.score === Infinity ? { week: 0, score: 0 } : lowestWeek,
        };
    });

    const leaderboards = {
        pointsFor: [...stats].sort((a, b) => b.totalPointsFor - a.totalPointsFor),
        pointsAgainst: [...stats].sort((a, b) => b.totalPointsAgainst - a.totalPointsAgainst),
        highestSingleGame: [...stats].sort((a, b) => b.highestWeek.score - a.highestWeek.score),
    };

    return leaderboards;
};
