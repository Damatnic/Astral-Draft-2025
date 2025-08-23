
import type { Player, Team, League, Matchup, DraftPick } from '../types';
import { players } from '../data/players';

export interface SeasonStoryData {
    teamMvp: Player | null;
    draftGem: { player: Player, value: number, pick: number } | null;
    biggestWin: { matchup: Matchup, margin: number, opponent?: Team } | null;
    bestWeek: { week: number, score: number } | null;
}

export function generateSeasonStory(team: Team, league: League): SeasonStoryData {
    if (!team) return { teamMvp: null, draftGem: null, biggestWin: null, bestWeek: null };

    // Calculate total points for each player on the team based on weekly scores
    const playerScores: { [playerId: number]: number } = {};
    league.schedule.forEach(matchup => {
        const teamInMatchup = matchup.teamA.teamId === team.id ? matchup.teamA : (matchup.teamB.teamId === team.id ? matchup.teamB : null);
        if (teamInMatchup) {
            teamInMatchup.roster.forEach(playerScore => {
                playerScores[playerScore.player.id] = (playerScores[playerScore.player.id] || 0) + playerScore.actualScore;
            });
        }
    });

    const teamMvp = team.roster.map(p => ({ player: p, totalScore: playerScores[p.id] || 0 }))
        .sort((a, b) => b.totalScore - a.totalScore)[0]?.player || null;

    const myDraftPicks = league.draftPicks.filter(p => p.teamId === team.id && p.playerId);
    const draftGem = myDraftPicks.map(pick => {
        const player = players.find(p => p.id === pick.playerId);
        if (!player) return null;
        const value = player.rank - pick.overall;
        return { player, value, pick: pick.overall };
    }).filter(p => p !== null && p.value > 0).sort((a, b) => b!.value - a!.value)[0] || null;

    let biggestWin: SeasonStoryData['biggestWin'] = null;
    let maxMargin = -Infinity;
    league.schedule.forEach(matchup => {
        if (matchup.teamA.teamId === team.id || matchup.teamB.teamId === team.id) {
            const myScore = matchup.teamA.teamId === team.id ? matchup.teamA.score : matchup.teamB.score;
            const oppScore = matchup.teamA.teamId === team.id ? matchup.teamB.score : matchup.teamA.score;
            const margin = myScore - oppScore;
            if (margin > maxMargin) {
                maxMargin = margin;
                const opponentId = matchup.teamA.teamId === team.id ? matchup.teamB.teamId : matchup.teamA.teamId;
                biggestWin = { matchup, margin, opponent: league.teams.find(t => t.id === opponentId) };
            }
        }
    });

    let bestWeek: SeasonStoryData['bestWeek'] = null;
    let maxScore = -Infinity;
    league.schedule.forEach(matchup => {
        if (matchup.teamA.teamId === team.id || matchup.teamB.teamId === team.id) {
            const myScore = matchup.teamA.teamId === team.id ? matchup.teamA.score : matchup.teamB.score;
            if (myScore > maxScore) {
                maxScore = myScore;
                bestWeek = { week: matchup.week, score: myScore };
            }
        }
    });

    return {
        teamMvp,
        draftGem: draftGem as SeasonStoryData['draftGem'],
        biggestWin,
        bestWeek,
    };
}
