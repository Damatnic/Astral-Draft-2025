/**
 * Secure Gemini Service
 * All API calls routed through backend proxy - no API keys in frontend
 */

import type { 
  Player, Team, League, DraftRecapData, TradeAnalysis, WaiverWireAdvice, 
  PowerRanking, StartSitAdvice, WeeklyReportData, AiLineupSuggestion, 
  SeasonReviewData, DailyBriefingItem, User, DraftGrade, Persona, 
  AiProfileData, DraftEvent, PlayerPosition, WatchlistInsight, 
  WaiverIntelligence, MatchupAnalysis, PlayerStory, TradeOffer, 
  TradeStory, SeasonStory, TeamComparison, ProjectedStanding, 
  DraftPickAsset, RecapVideoScene, NewsItem, SideBet, SmartFaabAdvice, 
  TradeSuggestion, NewspaperContent, TopRivalry 
} from '../types';
import { players } from "../data/players";
import { geminiService, checkApiHealth } from './secureApiClient';

/**
 * Check if Gemini API is properly configured on backend
 */
export const checkGeminiApiStatus = async (): Promise<{ 
    configured: boolean; 
    available: boolean; 
    message: string;
    apiKeyPresent: boolean;
}> => {
    try {
        const health = await checkApiHealth();
        const geminiAvailable = health.apis?.gemini || false;
        
        return {
            configured: geminiAvailable,
            available: geminiAvailable,
            message: geminiAvailable 
                ? 'Gemini API is properly configured and ready.'
                : 'Gemini API is not configured on the backend. Contact administrator.',
            apiKeyPresent: geminiAvailable
        };
    } catch (error) {
        return {
            configured: false,
            available: false,
            message: 'Unable to connect to backend services.',
            apiKeyPresent: false
        };
    }
};

const systemInstruction = `You are The Oracle, a hyper-intelligent and slightly mysterious fantasy football expert. You provide concise, insightful, and strategic advice to help users win their fantasy draft. You have access to the current state of the draft, including the user's current roster and the best players still available. When asked for advice, analyze the user's team composition and positional needs against the available talent pool. Your responses should be direct, actionable, and in a conversational, expert tone. You can use markdown for formatting like lists or bolding.`;

type OracleHistoryItem = {
    sender: 'user' | 'ai';
    text: string;
};

// Mock implementation helpers (same as before)
const mockApiCall = <T,>(data: T, delay: number = 800): Promise<T | null> => {
    return new Promise(resolve => setTimeout(() => resolve(data), delay + Math.random() * 500));
};

const getRandomElement = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Stream Oracle response using secure backend
 */
export const streamOracleResponse = async (
    history: OracleHistoryItem[],
    newPrompt: string,
    myTeam: Team | undefined,
    availablePlayers: Player[]
): Promise<AsyncGenerator<any>> => {
    
    const apiStatus = await checkGeminiApiStatus();
    
    if (!apiStatus.available) {
        // Return mock streaming response when API is not configured
        return (async function* () {
            const mockResponse = "The Oracle requires backend configuration. Please ensure the Gemini API is properly configured on the server.";
            yield { text: mockResponse };
        })();
    }
    
    const rosterList = myTeam?.roster.map(p => `${p.name} (${p.position})`).join(', ') || 'no players yet';
    const teamContext = myTeam ? `My current roster consists of: ${rosterList}.` : "I haven't drafted any players yet.";
    
    const availablePlayersList = availablePlayers.slice(0, 20).map(p => `${p.name} (${p.position}, Rank: ${p.rank})`).join(', ');
    const playerContext = `The top available players are: ${availablePlayersList}.`;
    
    const fullPrompt = `
        ${systemInstruction}
        
        Current Context:
        - ${teamContext}
        - ${playerContext}
        
        Conversation History:
        ${history.map(h => `${h.sender}: ${h.text}`).join('\n')}
        
        User Question: ${newPrompt}
    `;
    
    // Create async generator for streaming
    return (async function* () {
        let fullText = '';
        
        await geminiService.streamContent(
            fullPrompt,
            [],
            (chunk: string) => {
                fullText += chunk;
            }
        );
        
        yield { text: fullText };
    })();
};

/**
 * Get AI draft pick recommendation using secure backend
 */
export const getAiDraftPick = async (
    aiTeam: Team,
    availablePlayers: Player[]
): Promise<string | null> => {
    const apiStatus = await checkGeminiApiStatus();
    
    if (!apiStatus.available) {
        // Fallback to simple logic when API is not available
        const positionNeeds: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE'];
        const currentPositions = aiTeam.roster.map(p => p.position);
        const neededPosition = positionNeeds.find(pos => !currentPositions.includes(pos)) || 'RB' as PlayerPosition;
        const bestAvailable = availablePlayers
            .filter(p => p.position === neededPosition)
            .sort((a, b) => a.rank - b.rank)[0];
        return bestAvailable?.name || availablePlayers[0]?.name || null;
    }
    
    const rosterList = aiTeam.roster.map(p => `${p.name} (${p.position})`).join(', ') || 'empty';
    const playersList = availablePlayers.slice(0, 30).map(p => p.name).join(', ');
    
    const prompt = `
        You are drafting for a fantasy football team.
        Current roster: ${rosterList}
        Available players: ${playersList}
        
        Which ONE player should be drafted next? Return only the player's full name, nothing else.
    `;
    
    try {
        const response = await geminiService.generateContent(prompt);
        const playerName = response?.data?.text?.trim();
        
        // Validate that the player exists in available list
        if (playerName && availablePlayers.some(p => p.name === playerName)) {
            return playerName;
        }
        
        // Fallback if AI returns invalid player
        return availablePlayers[0]?.name || null;
    } catch (error) {
        console.error("Error getting AI draft pick:", error);
        return availablePlayers[0]?.name || null;
    }
};

/**
 * Generate player insight using secure backend
 */
export const generatePlayerInsight = async (player: Player): Promise<string | null> => {
    const apiStatus = await checkGeminiApiStatus();
    
    if (!apiStatus.available) {
        // Return generic insight when API is not available
        const insights = [
            `${player.name} is a solid ${player.position} option with reliable production potential.`,
            `Consider ${player.name}'s matchup schedule and injury history when evaluating for your roster.`,
            `${player.name} has shown consistent performance and could be a valuable addition to your lineup.`,
            `Monitor ${player.name}'s target share and usage trends for optimal deployment in your fantasy lineup.`
        ];
        return insights[Math.floor(Math.random() * insights.length)];
    }
    
    const prompt = `
        Provide a concise fantasy football analysis for:
        - Name: ${player.name}
        - Position: ${player.position}
        - Team: ${player.team}
        - Rank: ${player.rank}
        
        Focus on fantasy outlook, risks, and upside. Keep it to 2-3 short paragraphs.
    `;
    
    try {
        const response = await geminiService.generateContent(prompt);
        return response?.data?.text?.trim() || "Unable to generate insight at this time.";
    } catch (error) {
        console.error("Error generating player insight:", error);
        return "The Oracle is temporarily unavailable. Please try again later.";
    }
};

/**
 * Generate player nickname using secure backend
 */
export const generatePlayerNickname = async (player: Player): Promise<string | null> => {
    const apiStatus = await checkGeminiApiStatus();
    
    if (!apiStatus.available) {
        return null;
    }
    
    const prompt = `Generate a single, creative, cool nickname for fantasy football player ${player.name} (${player.position}, ${player.team}). Return only the nickname, nothing else.`;
    
    try {
        const response = await geminiService.generateContent(prompt);
        return response?.data?.text?.trim().replace(/"/g, "") || null;
    } catch (error) {
        console.error("Error generating nickname:", error);
        return null;
    }
};

/**
 * Stream assistant response using secure backend
 */
export const streamAssistantResponse = async (
    prompt: string, 
    leagues: League[], 
    user: User
): Promise<AsyncGenerator<any>> => {
    const apiStatus = await checkGeminiApiStatus();
    
    if (!apiStatus.available) {
        return (async function* () {
            const mockResponse = "Astral assistant requires backend configuration. Please contact your administrator.";
            yield { text: mockResponse };
        })();
    }
    
    const context = `
        You are Astral, a helpful fantasy football assistant.
        User: ${user.name}
        Leagues: ${leagues.map(l => l.name).join(', ')}
        
        User's question: ${prompt}
    `;
    
    return (async function* () {
        let fullText = '';
        
        await geminiService.streamContent(
            context,
            [],
            (chunk: string) => {
                fullText += chunk;
            }
        );
        
        yield { text: fullText };
    })();
};

// Export all the mock functions as-is (they don't need API keys)
export { 
    generateNewsHeadlines,
    generateTrashTalk,
    analyzeTrade,
    getStartSitAdvice,
    generateTeamSlogan,
    generateDraftRecap,
    findSimilarPlayers,
    generatePowerRankings,
    generateWeeklyReport,
    generatePlayerAvatar,
    generateTeamMascot,
    generateLeagueNewspaperContent,
    getWaiverIntelligence,
    getMatchupAnalysis,
    generateWatchlistInsights,
    simulateTradeImpactOnOdds,
    proactivelySuggestTrade,
    getAiOptimalLineup,
    generateDraftGrade,
    generateDailyBriefing,
    generateTeamChemistryReport,
    generateSeasonOutlook,
    detectTopRivalry,
    generateDraftPickCommentary,
    generateProjectedStandings,
    generateChampionshipProbabilities,
    generateWeeklyRecapVideoScript,
    generateSeasonReview,
    generateAiChatMessage,
    generateEventHotTake,
    generateDraftStoryHighlights,
    generateTeamNeedsAnalysis,
    summarizeFantasyImpact,
    generateLeagueSlogan,
    getWaiverWireAdvice,
    getLineupSolution,
    generateWeeklyPowerPlay,
    generateRivalryReport,
    generatePlayerStory,
    generateTradeStory,
    generateNarrativeSeasonStory,
    generateTeamComparison,
    generateLeagueConstitution,
    setSmartFaabAdvice,
    generateSmartFaabAdvice,
    generateGamedayHighlight,
    getSideBetResolution,
    createSideBet,
    generateOraclePrediction,
    getAiNomination,
    getAiBid,
    generateTeamBranding,
    generateAiTeamProfile
} from './geminiService';

export default {
    checkGeminiApiStatus,
    streamOracleResponse,
    getAiDraftPick,
    generatePlayerInsight,
    generatePlayerNickname,
    streamAssistantResponse
};