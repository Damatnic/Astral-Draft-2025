
import type { League, User } from '../types';

export const calculateManagerStats = (manager: User, leagues: League[]) => {
    const managerId = manager.id;
    const championships = manager.badges?.filter(b => b.type === 'CHAMPION').length || 0;
    
    return {
        championships,
        leaguesJoined: leagues.filter(l => !l.isMock && l.teams.some(t => t.owner.id === managerId)).length,
        trophies: manager.badges?.map(b => ({id: b.id, text: `🏅 ${b.text}`})) || [],
    };
};

export const calculateCareerHistory = (managerId: string, leagues: League[]) => {
    const historyEntries: any[] = [];

    leagues.forEach(league => {
        const myTeam = league.teams.find(t => t.owner.id === managerId);
        if (!myTeam) return;

        if (league.history) {
            league.history.forEach(seasonHistory => {
                const myStanding = seasonHistory.finalStandings.find(s => s.teamId === myTeam.id);
                if (myStanding) {
                    historyEntries.push({
                        key: `${league.id}-${seasonHistory.season}`,
                        season: seasonHistory.season,
                        leagueName: league.name,
                        leagueId: league.id,
                        isComplete: true,
                        rank: myStanding.rank,
                        record: myStanding.record,
                        isChampion: seasonHistory.championTeamId === myTeam.id
                    });
                }
            });
        }

        if (league.status !== 'PRE_DRAFT' && league.status !== 'DRAFTING') {
            const currentRank = [...league.teams].sort((a,b) => b.record.wins - a.record.wins).findIndex(t => t.id === myTeam.id) + 1;
            historyEntries.push({
                key: `${league.id}-current`,
                season: new Date().getFullYear(),
                leagueName: league.name,
                leagueId: league.id,
                isComplete: false,
                rank: currentRank,
                record: myTeam.record,
                isChampion: false
            });
        }
    });

    return historyEntries.sort((a, b) => b.season - a.season || a.leagueName.localeCompare(b.leagueName));
};


export const calculateHeadToHeadRecord = (myUserId: string, opponentUserId: string, leagues: League[]) => {
    const record = {
        regularSeason: { wins: 0, losses: 0, ties: 0 },
        playoffs: { wins: 0, losses: 0, ties: 0 },
    };

    leagues.forEach(league => {
        const myTeam = league.teams.find(t => t.owner.id === myUserId);
        const opponentTeam = league.teams.find(t => t.owner.id === opponentUserId);

        if (!myTeam || !opponentTeam) return;

        // Regular season
        league.schedule.forEach(matchup => {
            const isH2H = (matchup.teamA.teamId === myTeam.id && matchup.teamB.teamId === opponentTeam.id) ||
                          (matchup.teamA.teamId === opponentTeam.id && matchup.teamB.teamId === myTeam.id);

            if (isH2H && matchup.teamA.score > 0 && matchup.teamB.score > 0) { // Check if played
                const myScore = matchup.teamA.teamId === myTeam.id ? matchup.teamA.score : matchup.teamB.score;
                const opponentScore = matchup.teamA.teamId === opponentTeam.id ? matchup.teamA.score : matchup.teamB.score;

                if (myScore > opponentScore) record.regularSeason.wins++;
                else if (opponentScore > myScore) record.regularSeason.losses++;
                else record.regularSeason.ties++;
            }
        });

        // Playoffs
        if (league.playoffBracket) {
            Object.values(league.playoffBracket).flat().forEach(matchup => {
                 const isH2H = (matchup.teamA.teamId === myTeam.id && matchup.teamB.teamId === opponentTeam.id) ||
                               (matchup.teamA.teamId === opponentTeam.id && matchup.teamB.teamId === myTeam.id);
                
                if (isH2H && matchup.teamA.score > 0 && matchup.teamB.score > 0) {
                    const myScore = matchup.teamA.teamId === myTeam.id ? matchup.teamA.score : matchup.teamB.score;
                    const opponentScore = matchup.teamA.teamId === opponentTeam.id ? matchup.teamA.score : matchup.teamB.score;

                    if (myScore > opponentScore) record.playoffs.wins++;
                    else if (opponentScore > myScore) record.playoffs.losses++;
                    else record.playoffs.ties++;
                }
            });
        }
    });

    return record;
}
