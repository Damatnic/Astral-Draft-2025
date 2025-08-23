import React from 'react';
import { Text, Section, Hr } from '@react-email/components';
import { BaseEmailTemplate, CyberButton, CyberStatsCard, CyberPlayerCard } from './BaseEmailTemplate';

interface MatchupReminderEmailProps {
  userFirstName: string;
  teamName: string;
  opponentName: string;
  leagueName: string;
  weekNumber: number;
  matchupUrl: string;
  projectedScore: {
    user: number;
    opponent: number;
  };
  keyPlayers: Array<{
    name: string;
    position: string;
    projection: number;
  }>;
  unsubscribeUrl: string;
}

export function MatchupReminderEmail({
  userFirstName,
  teamName,
  opponentName,
  leagueName,
  weekNumber,
  matchupUrl,
  projectedScore,
  keyPlayers,
  unsubscribeUrl,
}: MatchupReminderEmailProps) {
  const projectedDiff = projectedScore.user - projectedScore.opponent;
  const isProjectedToWin = projectedDiff > 0;
  const confidence = Math.abs(projectedDiff);
  
  const previewText = `Week ${weekNumber} matchup: ${teamName} vs ${opponentName} in ${leagueName}`;

  return (
    <BaseEmailTemplate previewText={previewText} unsubscribeUrl={unsubscribeUrl}>
      {/* Header */}
      <Section className="text-center mb-8">
        <Text className="text-4xl mb-4">🏈</Text>
        <Text className="text-3xl font-bold text-cyber-accent mb-2">
          Week {weekNumber} Matchup
        </Text>
        <Text className="text-xl text-white mb-2">
          {teamName} vs {opponentName}
        </Text>
        <Text className="text-lg text-gray-300 mb-0">
          {leagueName}
        </Text>
      </Section>

      {/* Projected Score */}
      <Section className="mb-8">
        <div className="bg-gradient-to-r from-cyber-primary/20 to-cyber-accent/20 border border-cyber-primary rounded-lg p-6">
          <Text className="text-center text-lg font-semibold text-white mb-4">
            🎯 Oracle Projection
          </Text>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Your Team */}
            <div className="text-center">
              <Text className="text-2xl font-bold text-cyber-accent mb-1 font-mono">
                {projectedScore.user.toFixed(1)}
              </Text>
              <Text className="text-sm text-white font-semibold mb-0">
                {teamName}
              </Text>
            </div>
            
            {/* VS */}
            <div className="text-center">
              <Text className="text-lg font-bold text-gray-400 mb-0">
                VS
              </Text>
            </div>
            
            {/* Opponent */}
            <div className="text-center">
              <Text className="text-2xl font-bold text-gray-300 mb-1 font-mono">
                {projectedScore.opponent.toFixed(1)}
              </Text>
              <Text className="text-sm text-white font-semibold mb-0">
                {opponentName}
              </Text>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <Text className={`text-sm font-semibold ${isProjectedToWin ? 'text-green-400' : 'text-yellow-400'}`}>
              {isProjectedToWin ? 
                `Projected to win by ${confidence.toFixed(1)} points` : 
                `Projected to lose by ${confidence.toFixed(1)} points`
              }
            </Text>
          </div>
        </div>
      </Section>

      {/* Main Message */}
      <Section className="mb-8">
        <Text className="text-gray-300 leading-relaxed mb-4">
          Hey <strong className="text-cyber-accent">{userFirstName}</strong>,
        </Text>
        
        <Text className="text-gray-300 leading-relaxed mb-6">
          Your Week {weekNumber} matchup in <strong className="text-cyber-primary">{leagueName}</strong> is 
          set! You're facing <strong className="text-cyber-accent">{opponentName}</strong> in what 
          {confidence < 5 ? " looks to be a close contest" : isProjectedToWin ? " you're favored to win" : " will be a challenging matchup"}.
        </Text>
      </Section>

      {/* Matchup Stats */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4 text-center">
          Matchup Overview
        </Text>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <CyberStatsCard
            icon="🎯"
            title="Win Probability"
            value={`${Math.round((isProjectedToWin ? 55 + confidence * 2 : 45 - confidence * 2))}%`}
            subtitle="Oracle prediction"
          />
          <CyberStatsCard
            icon="📊"
            title="Projection"
            value={projectedScore.user.toFixed(1)}
            subtitle="Your team"
          />
          <CyberStatsCard
            icon="⚖️"
            title="Difference"
            value={`${isProjectedToWin ? '+' : ''}${projectedDiff.toFixed(1)}`}
            subtitle="Point spread"
          />
          <CyberStatsCard
            icon="🏆"
            title="Week"
            value={weekNumber}
            subtitle="Season week"
          />
        </div>
      </Section>

      {/* Key Players */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          🌟 Your Key Players This Week
        </Text>
        
        <div className="bg-gray-900 border border-cyber-primary/30 rounded-lg p-6">
          <div className="space-y-3">
            {keyPlayers.map((player, index) => (
              <CyberPlayerCard
                key={index}
                name={player.name}
                position={player.position}
                team=""
                projection={player.projection}
                status="active"
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Strategy Section */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-cyber-accent mb-4">
          🧠 Oracle Strategy Insights
        </Text>
        
        <div className="bg-gray-900 border border-cyber-accent/30 rounded-lg p-6">
          <div className="space-y-4">
            {isProjectedToWin ? (
              <>
                <div>
                  <Text className="font-semibold text-green-400 mb-2">
                    ✅ Your Advantages
                  </Text>
                  <Text className="text-sm text-gray-300">
                    • Higher projected scoring from your core players<br />
                    • Favorable matchups for your key positions<br />
                    • Strong depth to weather any surprises
                  </Text>
                </div>
                
                <div>
                  <Text className="font-semibold text-yellow-400 mb-2">
                    ⚠️ Don't Get Complacent
                  </Text>
                  <Text className="text-sm text-gray-300">
                    Stay active with lineup decisions and monitor injury reports. 
                    Fantasy football is unpredictable, and your opponent could have breakout performances.
                  </Text>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Text className="font-semibold text-cyber-primary mb-2">
                    💪 Path to Victory
                  </Text>
                  <Text className="text-sm text-gray-300">
                    • Look for high-upside plays in your flex spots<br />
                    • Consider streaming defenses with good matchups<br />
                    • Monitor the waiver wire for last-minute adds
                  </Text>
                </div>
                
                <div>
                  <Text className="font-semibold text-green-400 mb-2">
                    🎯 Key Opportunities
                  </Text>
                  <Text className="text-sm text-gray-300">
                    Your opponent may be favored, but fantasy football is won on Sunday. 
                    Focus on maximizing your ceiling and look for boom-or-bust plays.
                  </Text>
                </div>
              </>
            )}
            
            <div>
              <Text className="font-semibold text-cyber-accent mb-2">
                📈 This Week's Focus
              </Text>
              <Text className="text-sm text-gray-300">
                {confidence < 5 ? 
                  "This is a coin-flip matchup. Every lineup decision matters. Check for late-breaking news and optimize for both floor and ceiling." :
                  isProjectedToWin ?
                  "You're favored, but stay sharp. Monitor injury reports and be ready to pivot if needed." :
                  "You're the underdog, which means you need some players to exceed projections. Look for high-upside plays."
                }
              </Text>
            </div>
          </div>
        </div>
      </Section>

      {/* Pre-Game Checklist */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          ✅ Pre-Game Checklist
        </Text>
        
        <div className="bg-gray-800 border border-cyber-primary/30 rounded-lg p-6">
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">□</span>
              <div>
                <Text className="font-semibold text-white mb-1">Review Weather Reports</Text>
                <Text className="text-sm mb-0">
                  Check for rain, wind, or extreme temperatures that could impact scoring.
                </Text>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">□</span>
              <div>
                <Text className="font-semibold text-white mb-1">Monitor Injury Reports</Text>
                <Text className="text-sm mb-0">
                  Check Friday and Saturday injury reports for any lineup changes.
                </Text>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">□</span>
              <div>
                <Text className="font-semibold text-white mb-1">Set Your Lineup</Text>
                <Text className="text-sm mb-0">
                  Finalize your starting lineup before Sunday's early games.
                </Text>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-cyber-accent font-bold">□</span>
              <div>
                <Text className="font-semibold text-white mb-1">Check Waivers</Text>
                <Text className="text-sm mb-0">
                  Look for any late adds that could provide an edge this week.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Action Buttons */}
      <Section className="mb-8">
        <div className="text-center">
          <Text className="text-lg font-semibold text-white mb-4">
            Ready for Battle? ⚔️
          </Text>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <CyberButton href={matchupUrl} variant="default">
              📊 View Matchup
            </CyberButton>
            <CyberButton 
              href={`${process.env.NEXTAUTH_URL}/team/lineup`}
              variant="secondary"
            >
              🎯 Set Lineup
            </CyberButton>
            <CyberButton 
              href={`${process.env.NEXTAUTH_URL}/oracle/start-sit`}
              variant="accent"
            >
              🤖 Start/Sit Help
            </CyberButton>
          </div>
        </div>
      </Section>

      <Hr className="border-gray-700 my-6" />

      {/* Game Day Tips */}
      <Section className="mb-8">
        <Text className="text-xl font-bold text-white mb-4">
          🎮 Game Day Success Tips
        </Text>
        
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">🕐 Timing</Text>
              <Text className="mb-0">Set lineups early, but stay flexible for late news</Text>
            </div>
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">📱 Stay Connected</Text>
              <Text className="mb-0">Follow our live updates and notifications during games</Text>
            </div>
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">🎯 Focus</Text>
              <Text className="mb-0">Trust your research and don't overthink last-minute changes</Text>
            </div>
            <div>
              <Text className="font-semibold text-cyber-primary mb-2">🧘 Stay Calm</Text>
              <Text className="mb-0">Fantasy is a long-term game - one week doesn't define your season</Text>
            </div>
          </div>
        </div>
      </Section>

      {/* Head-to-Head Record */}
      <Section className="mb-6">
        <Text className="text-lg font-semibold text-cyber-accent mb-4">
          📈 Season Context
        </Text>
        
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
          <Text className="text-sm text-gray-300">
            This matchup could be crucial for playoff positioning. Every point matters 
            as you battle for supremacy in {leagueName}!
          </Text>
        </div>
      </Section>

      {/* Final Message */}
      <Section className="text-center">
        <Text className="text-gray-300 mb-4">
          {isProjectedToWin ? 
            "You've got the edge this week, but stay focused and execute your game plan!" :
            "You're the underdog, but that's where legends are made. Give it everything you've got!"
          }
        </Text>
        
        <Text className="text-lg font-semibold text-cyber-accent mb-2">
          May the fantasy gods be with you! 🏆
        </Text>
        
        <Text className="text-sm text-gray-400 italic">
          The Astral Draft Team
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
}